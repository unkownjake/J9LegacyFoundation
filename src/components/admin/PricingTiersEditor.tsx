import { Plus, Trash2, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PricingTier, TierKind } from "@/lib/types/registration";

const uid = () => `t-${Math.random().toString(36).slice(2, 10)}`;

interface Props {
  tiers: PricingTier[];
  editing: boolean;
  onChange: (next: PricingTier[]) => void;
}

function newTier(kind: TierKind): PricingTier {
  return kind === "team"
    ? { id: uid(), kind: "team", name: "Team", price: 0, rosterMin: 4, rosterMax: 8, capacity: null }
    : { id: uid(), kind: "individual", name: "Individual", price: 0, capacity: null };
}

export default function PricingTiersEditor({ tiers, editing, onChange }: Props) {
  function update(id: string, patch: Partial<PricingTier>) {
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function remove(id: string) {
    onChange(tiers.filter((t) => t.id !== id));
  }
  function add(kind: TierKind) {
    onChange([...tiers, newTier(kind)]);
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-primary-darker">Pricing tiers</h2>
          <p className="text-xs text-muted-foreground">
            Define the options registrants can pick. Team tiers collect a roster of player names.
          </p>
        </div>
        {editing && (
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => add("individual")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Individual
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => add("team")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Team
            </Button>
          </div>
        )}
      </div>

      {tiers.length === 0 ? (
        <p className="text-sm text-muted-foreground italic border border-dashed rounded-md p-6 text-center">
          No tiers yet. {editing && "Add an Individual or Team tier above."}
        </p>
      ) : (
        <div className="space-y-3">
          {tiers.map((t) => (
            <div key={t.id} className="border rounded-md p-3 bg-muted/20">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.kind === "team" ? (
                    <Users className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                  {t.kind === "team" ? "Team tier" : "Individual tier"}
                </div>
                {editing && (
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded"
                    title="Remove tier"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={t.name}
                    onChange={(e) => update(t.id, { name: e.target.value })}
                    disabled={!editing}
                    placeholder={t.kind === "team" ? "e.g. Adult Team" : "e.g. Adult Individual"}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={t.price}
                    onChange={(e) =>
                      update(t.id, { price: parseFloat(e.target.value) || 0 })
                    }
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Capacity (optional)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={t.capacity ?? ""}
                    onChange={(e) =>
                      update(t.id, {
                        capacity: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    disabled={!editing}
                    placeholder="No limit"
                  />
                </div>
                {t.kind === "team" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Roster min</Label>
                      <Input
                        type="number"
                        min={1}
                        value={t.rosterMin ?? ""}
                        onChange={(e) => {
                          const rosterMin = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          const patch: Partial<PricingTier> = { rosterMin };
                          if (rosterMin != null && t.rosterMax != null && t.rosterMax < rosterMin) {
                            patch.rosterMax = rosterMin;
                          }
                          update(t.id, patch);
                        }}
                        disabled={!editing}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Roster max</Label>
                      <Input
                        type="number"
                        min={1}
                        value={t.rosterMax ?? ""}
                        onChange={(e) => {
                          const rosterMax = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          const patch: Partial<PricingTier> = { rosterMax };
                          if (rosterMax != null && t.rosterMin != null && t.rosterMin > rosterMax) {
                            patch.rosterMin = rosterMax;
                          }
                          update(t.id, patch);
                        }}
                        disabled={!editing}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1 md:col-span-4">
                  <Label className="text-xs">Description (optional)</Label>
                  <Textarea
                    rows={2}
                    value={t.description ?? ""}
                    onChange={(e) => update(t.id, { description: e.target.value })}
                    disabled={!editing}
                    placeholder="Shown next to the tier on the registration page."
                  />
                </div>
                <div className="md:col-span-4">
                  <Label className="text-xs text-muted-foreground">Tier kind</Label>
                  <Select
                    value={t.kind}
                    onValueChange={(v) =>
                      update(t.id, {
                        kind: v as TierKind,
                        rosterMin: v === "team" ? t.rosterMin ?? 4 : undefined,
                        rosterMax: v === "team" ? t.rosterMax ?? 8 : undefined,
                      })
                    }
                    disabled={!editing}
                  >
                    <SelectTrigger className="max-w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="team">Team (with roster)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
