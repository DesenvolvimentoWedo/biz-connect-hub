import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type Lead, type AuxOption } from "@/lib/supabase";
import { useAllAux } from "@/hooks/useAux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { LeadForm } from "@/components/LeadForm";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/leads")({ component: LeadsPage });

const PAGE_SIZE = 20;

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "all", source: "all", classification: "all",
    method: "all", channel: "all", interest: "all", client: "all",
  });
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const aux = useAllAux();

  const load = () => {
    setLoading(true);
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setLeads((data as Lead[]) || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("leads-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const auxMap = useMemo(() => {
    const make = (opts: AuxOption[]) => Object.fromEntries(opts.map((o) => [o.id, o]));
    return {
      statuses: make(aux.statuses.options),
      sources: make(aux.sources.options),
      classifications: make(aux.classifications.options),
      methods: make(aux.methods.options),
      channels: make(aux.channels.options),
      grades: make(aux.grades.options),
    };
  }, [aux]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (q) {
        const hay = [l.company_name, l.search_name, l.city, l.phone, l.email, l.responsible_name]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status !== "all" && l.lead_status_id !== filters.status) return false;
      if (filters.source !== "all" && l.lead_source_id !== filters.source) return false;
      if (filters.classification !== "all" && l.classification_id !== filters.classification) return false;
      if (filters.method !== "all" && l.contact_method_id !== filters.method) return false;
      if (filters.channel !== "all" && l.contact_channel_id !== filters.channel) return false;
      if (filters.interest !== "all" && !!l.has_interest !== (filters.interest === "yes")) return false;
      if (filters.client !== "all" && !!l.is_client !== (filters.client === "yes")) return false;
      return true;
    });
  }, [leads, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filters]);

  const openNew = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (lead: Lead) => { setEditing(lead); setSheetOpen(true); };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("leads").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else toast.success("Lead excluído");
    setDeleteId(null);
  };

  const filterSelect = (
    key: keyof typeof filters, label: string, opts: AuxOption[],
  ) => (
    <Select value={filters[key]} onValueChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}>
      <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}: Todos</SelectItem>
        {opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} resultado(s)</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo Lead</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar empresa, cidade, telefone, email, responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {filterSelect("status", "Status", aux.statuses.options)}
        {filterSelect("source", "Origem", aux.sources.options)}
        {filterSelect("classification", "Classificação", aux.classifications.options)}
        {filterSelect("method", "Método", aux.methods.options)}
        {filterSelect("channel", "Canal", aux.channels.options)}
        <Select value={filters.interest} onValueChange={(v) => setFilters((f) => ({ ...f, interest: v }))}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Interesse: Todos</SelectItem>
            <SelectItem value="yes">Com interesse</SelectItem>
            <SelectItem value="no">Sem interesse</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.client} onValueChange={(v) => setFilters((f) => ({ ...f, client: v }))}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cliente: Todos</SelectItem>
            <SelectItem value="yes">Já é cliente</SelectItem>
            <SelectItem value="no">Ainda não</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead className="text-center">Cliente</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              )}
              {!loading && pageData.length === 0 && (
                <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Nenhum lead encontrado</TableCell></TableRow>
              )}
              {pageData.map((l) => (
                <TableRow key={l.id} className="cursor-pointer" onClick={() => openEdit(l)}>
                  <TableCell>
                    <div className="font-medium">{l.company_name}</div>
                    {l.responsible_name && (
                      <div className="text-xs text-muted-foreground">{l.responsible_name}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{l.phone || "—"}</div>
                    <div className="text-xs text-muted-foreground">{l.email || ""}</div>
                  </TableCell>
                  <TableCell className="text-sm">{l.city || "—"}</TableCell>
                  <TableCell><StatusBadge option={l.lead_status_id ? auxMap.statuses[l.lead_status_id] : null} /></TableCell>
                  <TableCell><StatusBadge option={l.lead_source_id ? auxMap.sources[l.lead_source_id] : null} /></TableCell>
                  <TableCell><StatusBadge option={l.classification_id ? auxMap.classifications[l.classification_id] : null} /></TableCell>
                  <TableCell className="text-center">
                    {l.is_client ? <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" /> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {l.total_score ?? "—"}
                    {l.reviews_count != null && (
                      <span className="ml-1 text-xs text-muted-foreground">({l.reviews_count})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(l)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(l.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar Lead" : "Novo Lead"}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 px-4 pb-6">
            <LeadForm
              lead={editing}
              onSaved={() => { setSheetOpen(false); load(); }}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
