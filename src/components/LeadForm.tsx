import { useEffect, useState } from "react";
import { supabase, type Lead } from "@/lib/supabase";
import { useAllAux } from "@/hooks/useAux";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Props = {
  lead?: Lead | null;
  onSaved: () => void;
  onCancel: () => void;
};

const empty: Partial<Lead> = {
  company_name: "",
  search_name: "",
  phone: "",
  phone_secondary: "",
  email: "",
  city: "",
  website: "",
  instagram: "",
  facebook: "",
  google_maps_url: "",
  notes: "",
  responsible_name: "",
  total_score: null,
  reviews_count: null,
  is_client: false,
  has_chatwoot: false,
  message_blocked: false,
  contact_broken: false,
  data_updated: false,
  has_system: false,
  has_interest: false,
  deliver_posts: false,
};

export function LeadForm({ lead, onSaved, onCancel }: Props) {
  const { profile } = useAuth();
  const aux = useAllAux();
  const [form, setForm] = useState<Partial<Lead>>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(lead ? { ...lead } : empty);
  }, [lead]);

  const set = <K extends keyof Lead>(k: K, v: Lead[K] | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name?.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Lead> = { ...form };
      // normalize empty strings & numbers
      Object.keys(payload).forEach((k) => {
        const key = k as keyof Lead;
        if (payload[key] === "") (payload as Record<string, unknown>)[k] = null;
      });
      if (payload.total_score != null)
        payload.total_score = Number(payload.total_score);
      if (payload.reviews_count != null)
        payload.reviews_count = Number(payload.reviews_count);

      let error;
      if (lead?.id) {
        ({ error } = await supabase.from("leads").update(payload).eq("id", lead.id));
      } else {
        if (profile?.tenant_id) payload.tenant_id = profile.tenant_id;
        ({ error } = await supabase.from("leads").insert(payload));
      }
      if (error) throw error;
      toast.success(lead?.id ? "Lead atualizado" : "Lead criado");
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const dropdown = (
    label: string,
    field: keyof Lead,
    opts: { id: string; name: string }[],
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={(form[field] as string) || "__none__"}
        onValueChange={(v) => set(field, (v === "__none__" ? null : v) as never)}
      >
        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— Nenhum —</SelectItem>
          {opts.map((o) => (
            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const text = (label: string, field: keyof Lead, type = "text") => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={(form[field] as string | number | null) ?? ""}
        onChange={(e) => set(field, e.target.value as never)}
      />
    </div>
  );

  const bool = (label: string, field: keyof Lead) => (
    <div className="flex items-center justify-between rounded-md border p-3">
      <Label className="cursor-pointer">{label}</Label>
      <Switch
        checked={!!form[field]}
        onCheckedChange={(v) => set(field, v as never)}
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Empresa</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nome da empresa *</Label>
            <Input
              required
              value={form.company_name || ""}
              onChange={(e) => set("company_name", e.target.value)}
            />
          </div>
          {text("Nome de busca", "search_name")}
          {text("Responsável", "responsible_name")}
          {text("Cidade", "city")}
          {text("Website", "website")}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Contato</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {text("Telefone", "phone")}
          {text("Telefone secundário", "phone_secondary")}
          {text("Email", "email", "email")}
          {text("Google Maps", "google_maps_url")}
          {text("Instagram", "instagram")}
          {text("Facebook", "facebook")}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Classificação</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {dropdown("Status", "lead_status_id", aux.statuses.options)}
          {dropdown("Origem", "lead_source_id", aux.sources.options)}
          {dropdown("Grade prospecção", "prospect_grade_id", aux.grades.options)}
          {dropdown("Método de contato", "contact_method_id", aux.methods.options)}
          {dropdown("Classificação", "classification_id", aux.classifications.options)}
          {dropdown("Resumo da resposta", "response_summary_id", aux.summaries.options)}
          {dropdown("Canal de contato", "contact_channel_id", aux.channels.options)}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Pontuação</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {text("Score total", "total_score", "number")}
          {text("Nº de avaliações", "reviews_count", "number")}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Flags</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {bool("É cliente", "is_client")}
          {bool("Tem interesse", "has_interest")}
          {bool("Tem sistema", "has_system")}
          {bool("Tem Chatwoot", "has_chatwoot")}
          {bool("Entrega posts", "deliver_posts")}
          {bool("Dados atualizados", "data_updated")}
          {bool("Mensagem bloqueada", "message_blocked")}
          {bool("Contato quebrado", "contact_broken")}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Observações</h3>
        <Textarea
          rows={4}
          value={form.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </section>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
