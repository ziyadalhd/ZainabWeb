import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminSiteSettingsRepository, SiteSettingsRepository } from "@/lib/data/contracts";
import type { SiteSettings, SiteSettingsInput } from "@/lib/domain/types";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

function mapSiteSettings(row: SiteSettingsRow): SiteSettings {
  return {
    clubIntroduction: row.club_introduction,
    nameStory: row.name_story,
    objectives: row.objectives,
    contactPhone: row.contact_phone,
    defaultVenueName: row.default_venue_name,
    defaultVenueAddress: row.default_venue_address,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    literaryPartnerTitle: row.literary_partner_title,
    literaryPartnerBody: row.literary_partner_body,
    updatedAt: row.updated_at,
  };
}

function unavailable(): never {
  throw new Error("تعذر الوصول إلى محتوى الموقع حاليًا.");
}

export class SupabaseSiteSettingsRepository implements SiteSettingsRepository, AdminSiteSettingsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async get(): Promise<SiteSettings> {
    const { data, error } = await this.client.from("site_settings").select("*").eq("id", true).maybeSingle();
    if (error || !data) unavailable();
    return mapSiteSettings(data);
  }

  async update(input: SiteSettingsInput): Promise<void> {
    const { error } = await this.client.from("site_settings").update({
      club_introduction: input.clubIntroduction,
      name_story: input.nameStory,
      objectives: input.objectives,
      contact_phone: input.contactPhone,
      default_venue_name: input.defaultVenueName,
      default_venue_address: input.defaultVenueAddress,
      instagram_url: input.instagramUrl,
      tiktok_url: input.tiktokUrl,
      literary_partner_title: input.literaryPartnerTitle,
      literary_partner_body: input.literaryPartnerBody,
    }).eq("id", true);
    if (error) unavailable();
  }
}

export async function createSiteSettingsRepository(): Promise<SiteSettingsRepository> {
  return new SupabaseSiteSettingsRepository(await createSupabaseServerClient());
}

export async function createAdminSiteSettingsRepository(): Promise<AdminSiteSettingsRepository> {
  return new SupabaseSiteSettingsRepository(await createSupabaseServerClient());
}

export const getPublicSiteSettings = cache(async (): Promise<SiteSettings> => {
  const repository = await createSiteSettingsRepository();
  return repository.get();
});
