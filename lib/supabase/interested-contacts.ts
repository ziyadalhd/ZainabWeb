import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminInterestedContactRepository,
  InterestedContactService,
} from "@/lib/data/contracts";
import type {
  AdminInterestedContact,
  InterestedContactInput,
  InterestedContactReceipt,
} from "@/lib/domain/types";
import { generateSecureToken, hashSecureToken, isSecureToken } from "@/lib/security/secure-token";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InterestedContactRow = Database["public"]["Tables"]["interested_contacts"]["Row"];

export type InterestedContactFailureCode = "invalid" | "save" | "unavailable";

export class InterestedContactFailure extends Error {
  constructor(readonly code: InterestedContactFailureCode) {
    super(code);
  }
}

function mapFailure(message: string): InterestedContactFailure {
  if (message === "invalid_interested_contact") return new InterestedContactFailure("invalid");
  if (message === "interested_contact_unavailable") return new InterestedContactFailure("unavailable");
  return new InterestedContactFailure("save");
}

function mapRow(row: InterestedContactRow): AdminInterestedContact {
  return {
    id: row.id,
    contactName: row.contact_name,
    phoneE164: row.phone_e164,
    email: row.email,
    consentedAt: row.consented_at,
    unsubscribedAt: row.unsubscribed_at,
    createdAt: row.created_at,
  };
}

export class SupabaseInterestedContactRepository
implements InterestedContactService, AdminInterestedContactRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async submit(input: InterestedContactInput): Promise<InterestedContactReceipt> {
    const unsubscribeToken = generateSecureToken();
    const { error } = await this.client.rpc("submit_interested_contact", {
      p_contact_name: input.contactName,
      p_phone_e164: input.phoneE164,
      p_email: input.email,
      p_unsubscribe_token_hash: hashSecureToken(unsubscribeToken),
    });
    if (error) throw mapFailure(error.message);
    return { unsubscribeToken };
  }

  async unsubscribe(token: string): Promise<void> {
    if (!isSecureToken(token)) throw new InterestedContactFailure("unavailable");
    const { error } = await this.client.rpc("unsubscribe_interested_contact", {
      p_unsubscribe_token_hash: hashSecureToken(token),
    });
    if (error) throw mapFailure(error.message);
  }

  async list(): Promise<readonly AdminInterestedContact[]> {
    try {
      const { data, error } = await this.client
        .from("interested_contacts")
        .select("*")
        .order("consented_at", { ascending: false });
      if (error || !data) {
        console.warn('[InterestedContacts] list returned error or empty data:', error);
        return [];
      }
      return data.map(mapRow);
    } catch (err) {
      console.warn('[InterestedContacts] list failed gracefully:', err);
      return [];
    }
  }
}

export async function createInterestedContactService(): Promise<InterestedContactService> {
  return new SupabaseInterestedContactRepository(await createSupabaseServerClient());
}

export async function createAdminInterestedContactRepository(): Promise<AdminInterestedContactRepository> {
  return new SupabaseInterestedContactRepository(await createSupabaseServerClient());
}
