import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminSiteSettingsRepository, SiteSettingsRepository } from "@/lib/data/contracts";
import type { SiteSettings, SiteSettingsInput } from "@/lib/domain/types";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

function mapSiteSettings(row: SiteSettingsRow): SiteSettings {
  return {
    clubIntroduction: row.club_introduction,
    nameStory: row.name_story,
    objectives: row.objectives,
    contactPhone: row.contact_phone,
    defaultVenueName: row.default_venue_name,
    defaultVenueAddress: row.default_venue_address,
    defaultVenueMapUrl: row.default_venue_map_url,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    literaryPartnerTitle: row.literary_partner_title,
    literaryPartnerBody: row.literary_partner_body,
    updatedAt: row.updated_at,
  };
}

const defaultSiteSettings: SiteSettings = {
  clubIntroduction: "نادي بَيْن الثقافي هو مساحة ثقافية ملهمة في مكة المكرمة تجمع بين الفعاليات الأدبية، والورش الإبداعية، واللقاءات الحوارية في بيئة دافئة ومميزة.",
  nameStory: "استوحي اسم «بَيْن» من المعاني المتصلة باللقاء والوصل والتأمل بين الفكرة وأختها.",
  objectives: "تعزيز الحراك الثقافي في مكة المكرمة، وتوفير مساحات لقاء وإبداع، وتقديم فعاليات نوعية وورش عمل تفاعلية.",
  contactPhone: "0537918640",
  defaultVenueName: "نادي بَيْن الثقافي",
  defaultVenueAddress: "مكة المكرمة",
  defaultVenueMapUrl: "https://maps.app.goo.gl/Seti5sBZvmhaHeNe8?g_st=ic",
  instagramUrl: null,
  tiktokUrl: null,
  literaryPartnerTitle: "الشريك الأدبي",
  literaryPartnerBody: "مبادرة تهدف إلى إثراء المحتوى الأدبي وتعزيز حضور الأدب في المشهد الثقافي اليومي.",
  updatedAt: "2026-08-17T12:00:00.000Z",
};

export class SupabaseSiteSettingsRepository implements SiteSettingsRepository, AdminSiteSettingsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async get(): Promise<SiteSettings> {
    try {
      const { data, error } = await this.client.from("site_settings").select("*").eq("id", true).maybeSingle();
      if (error || !data) {
        console.warn('[SiteSettings] get returned error or empty, using fallback defaults:', error);
        return defaultSiteSettings;
      }
      return mapSiteSettings(data);
    } catch (err) {
      console.warn('[SiteSettings] get failed gracefully:', err);
      return defaultSiteSettings;
    }
  }

  async update(input: SiteSettingsInput): Promise<void> {
    const { error } = await this.client.from("site_settings").update({
      club_introduction: input.clubIntroduction,
      name_story: input.nameStory,
      objectives: input.objectives,
      contact_phone: input.contactPhone,
      default_venue_name: input.defaultVenueName,
      default_venue_address: input.defaultVenueAddress,
      default_venue_map_url: input.defaultVenueMapUrl,
      instagram_url: input.instagramUrl,
      tiktok_url: input.tiktokUrl,
      literary_partner_title: input.literaryPartnerTitle,
      literary_partner_body: input.literaryPartnerBody,
    }).eq("id", true);
    if (error) {
      console.error('[SiteSettings] update failed:', error);
      throw new Error("تعذر حفظ محتوى الموقع حاليًا.");
    }
  }
}

export async function createSiteSettingsRepository(): Promise<SiteSettingsRepository> {
  return new SupabaseSiteSettingsRepository(await createSupabaseServerClient());
}

export async function createAdminSiteSettingsRepository(): Promise<AdminSiteSettingsRepository> {
  return new SupabaseSiteSettingsRepository(createSupabaseServiceClient());
}

export const getPublicSiteSettings = cache(async (): Promise<SiteSettings> => {
  const repository = await createSiteSettingsRepository();
  return repository.get();
});
