import type { AuxOption } from "@/lib/supabase";

export function StatusBadge({ option }: { option?: AuxOption | null }) {
  if (!option) return <span className="text-xs text-muted-foreground">—</span>;
  const color = option.color || "#64748b";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}1f`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {option.name}
    </span>
  );
}
