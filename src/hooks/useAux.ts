import { useEffect, useState } from "react";
import { supabase, type AuxOption } from "@/lib/supabase";

export const AUX_TABLES = [
  "lead_sources",
  "prospect_grades",
  "lead_statuses",
  "contact_methods",
  "lead_classifications",
  "response_summaries",
  "contact_channels",
] as const;

export type AuxTable = (typeof AUX_TABLES)[number];

export function useAux(table: AuxTable) {
  const [options, setOptions] = useState<AuxOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from(table)
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (active) {
          setOptions((data as AuxOption[]) || []);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [table]);

  return { options, loading };
}

export function useAllAux() {
  const sources = useAux("lead_sources");
  const grades = useAux("prospect_grades");
  const statuses = useAux("lead_statuses");
  const methods = useAux("contact_methods");
  const classifications = useAux("lead_classifications");
  const summaries = useAux("response_summaries");
  const channels = useAux("contact_channels");
  return { sources, grades, statuses, methods, classifications, summaries, channels };
}
