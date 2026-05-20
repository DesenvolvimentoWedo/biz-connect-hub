import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type Lead } from "@/lib/supabase";
import { useAllAux } from "@/hooks/useAux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const aux = useAllAux();

  useEffect(() => {
    const load = () =>
      supabase.from("leads").select("*").then(({ data }) => setLeads((data as Lead[]) || []));
    load();
    const ch = supabase
      .channel("dash-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      clients: leads.filter((l) => l.is_client).length,
      interest: leads.filter((l) => l.has_interest).length,
      withSystem: leads.filter((l) => l.has_system).length,
      avgScore: leads.length
        ? (leads.reduce((s, l) => s + (l.total_score || 0), 0) / leads.length).toFixed(1)
        : "0",
    };
  }, [leads]);

  const group = (field: keyof Lead, opts: { id: string; name: string; color: string | null }[]) =>
    opts
      .map((o) => ({ opt: o, count: leads.filter((l) => l[field] === o.id).length }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);

  const byStatus = group("lead_status_id", aux.statuses.options);
  const bySource = group("lead_source_id", aux.sources.options);
  const byClass = group("classification_id", aux.classifications.options);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do seu pipeline</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total de leads" value={stats.total} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Clientes" value={stats.clients} accent="emerald" />
        <StatCard icon={<Sparkles className="h-5 w-5" />} label="Com interesse" value={stats.interest} accent="blue" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Com sistema" value={stats.withSystem} accent="violet" />
        <StatCard icon={<Star className="h-5 w-5" />} label="Score médio" value={stats.avgScore} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GroupCard title="Por status" items={byStatus} />
        <GroupCard title="Por origem" items={bySource} />
        <GroupCard title="Por classificação" items={byClass} />
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: string | number; accent?: string }) {
  const accentMap: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-500/10",
    blue: "text-blue-600 bg-blue-500/10",
    violet: "text-violet-600 bg-violet-500/10",
    amber: "text-amber-600 bg-amber-500/10",
  };
  const cls = accent ? accentMap[accent] : "text-primary bg-primary/10";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cls}`}>{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupCard({
  title, items,
}: { title: string; items: { opt: { id: string; name: string; color: string | null }; count: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Sem dados</p>}
        {items.map((i) => (
          <div key={i.opt.id} className="flex items-center justify-between">
            <StatusBadge option={{ ...i.opt, tenant_id: null, is_system: null, is_active: true }} />
            <span className="text-sm font-semibold tabular-nums">{i.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
