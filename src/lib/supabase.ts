import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export type Lead = {
  id: string;
  tenant_id: string | null;
  company_name: string;
  search_name: string | null;
  phone: string | null;
  phone_secondary: string | null;
  email: string | null;
  city: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  google_maps_url: string | null;
  notes: string | null;
  responsible_name: string | null;
  total_score: number | null;
  reviews_count: number | null;
  is_client: boolean | null;
  has_chatwoot: boolean | null;
  message_blocked: boolean | null;
  contact_broken: boolean | null;
  data_updated: boolean | null;
  has_system: boolean | null;
  has_interest: boolean | null;
  deliver_posts: boolean | null;
  lead_source_id: string | null;
  prospect_grade_id: string | null;
  lead_status_id: string | null;
  contact_method_id: string | null;
  classification_id: string | null;
  response_summary_id: string | null;
  contact_channel_id: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AuxOption = {
  id: string;
  tenant_id: string | null;
  name: string;
  color: string | null;
  is_system: boolean | null;
  is_active: boolean | null;
};
