import { useState } from "react";
import { useGetBettingHistory, useDeleteBettingHistory, getGetBettingHistoryQueryKey } from "@workspace/api-client-react";
import type { SimulationResult } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
} from "recharts";
import { Trash2, Activity, Calendar, Eye, Goal, CircleDot, Triangle, Crosshair, Target } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/lang";

/* ─── Risk colour maps ──────────────────────────────────────────────────── */
const RISK_STYLES: Record<string, { badge: string; border: string; bg: string; text: string; label: string }> = {
  low:    { badge: "bg-green-500/20 text-green-300 border-green-500/40",   border: "border-green-500/30",   bg: "bg-green-500/5",  text: "text-green-300",  label: "LOW"    },
  medium: { badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", border: "border-yellow-500/30", bg: "bg-yellow-500/5", text: "text-yellow-300", label: "MEDIUM" },
  high:   { badge: "bg-red-500/20 text-red-300 border-red-500/40",          border: "border-red-500/30",    bg: "bg-red-500/5",    text: "text-red-300",    label: "HIGH"   },
};

const BET_SECTIONS = [
  { key: "GOALS",           icon: Goal,      color: "hsl(109,100%,54%)" },
  { key: "YELLOW CARDS",    icon: CircleDot, color: "hsl(45,90%,55%)"  },
  { key: "CORNERS",         icon: Triangle,  color: "hsl(200,90%,60%)" },
  { key: "SHOTS ON TARGET", icon: Crosshair, color: "hsl(280,80%,65%)" },
];

type DistBucket = { value: number; count: number; pct: number };
type BetRec     = { recommendation: string; market: string; confidence: number; risk: string; reasoning: string };

/* ─── Compact Gaussian chart ─────────────────────────────────────────────── */
function MiniDistChart({ data, avgValue, color, unitLabel, label }: {
  data: DistBucket[]; avgValue: number; color: string; unitLabel: string; label: string;
}) {
  const maxPct    = Math.max(...data.map(d => d.pct), 1);
  const avgRound  = Math.round(avgValue);
  const modeVal   = data.reduce((b, d) => (d.pct > b.pct ? d : b), data[0] ?? { value: 0, pct: 0, count: 0 });

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: DistBucket }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border/80 rounded px-2 py-1 text-xs font-mono shadow-lg">
        <div style={{ color }} className="font-bold">{d.value} {unitLabel}</div>
        <div className="text-foreground">{d.pct.toFixed(2)}%</div>
        <div className="text-muted-foreground">{d.count.toLocaleString()}</div>
      </div>
    );
  };

  return (
    <div className="bg-black/20 border border-border/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono tracking-widest" style={{ color }}>{label}</span>
        <span className="text-sm font-bold font-mono" style={{ color }}>{avgValue.toFixed(1)}</span>
      </div>
      <div className="text-[9px] font-mono text-muted-foreground mb-2">
        Moda: <span className="text-foreground/70 font-bold">{modeVal.value}</span> · μ: <span className="text-foreground/70 font-bold">{avgValue.toFixed(1)}</span>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 2, right: 4, left: -20, bottom: 2 }} barCategoryGap="6%">
            <XAxis dataKey="value" axisLine={false} tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9, fontFamily: "monospace" }} />
            <YAxis axisLine={false} tickLine={false} domain={[0, maxPct * 1.15]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9, fontFamily: "monospace" }}
              tickFormatter={(v) => `${v.toFixed(0)}%`} width={26} />
            <ReferenceLine x={avgRound} stroke={color} strokeDasharray="3 2" strokeOpacity={0.6} strokeWidth={1} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="pct" radius={[2, 2, 0, 0]}>
              {data.map((entry) => (
                <Cell key={`c-${entry.value}`}
                  fill={entry.value === modeVal.value ? color : `${color}88`}
                  opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── Full Result Modal ──────────────────────────────────────────────────── */
function FullResultModal({
  open, onClose, fullResult, homeTeamName, awayTeamName,
}: {
  open: boolean; onClose: () => void; fullResult?: string | null; homeTeamName: string; awayTeamName: string;
}) {
  const { t } = useLang();

  let result: SimulationResult | null = null;
  if (fullResult) { try { result = JSON.parse(fullResult) as SimulationResult; } catch { /* noop */ } }

  const riskLabel: Record<string, string> = { low: t.results.low, medium: t.results.medium, high: t.results.high };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border/80">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-bold tracking-widest text-primary glow-text">
            {t.history.fullResultTitle}
          </DialogTitle>
          <DialogDescription className="font-mono text-sm text-muted-foreground">
            {homeTeamName} <span className="text-primary font-bold">vs</span> {awayTeamName}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="py-16 text-center text-muted-foreground font-mono">{t.history.noFullResult}</div>
        ) : (
          <div className="space-y-7 pt-3">

            {/* ── 1. WIN PROBABILITY ──────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-mono tracking-widest text-muted-foreground mb-3">{t.results.winProb}</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t.results.homeWin, value: result.homeTeam.winProbability,  color: "hsl(109,100%,54%)" },
                  { label: t.results.draw,    value: result.drawProbability,           color: "hsl(45,90%,55%)"   },
                  { label: t.results.awayWin, value: result.awayTeam.winProbability,  color: "hsl(0,100%,55%)"   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-black/20 border border-border/30 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div>
                      <div className="text-[10px] font-mono text-muted-foreground tracking-widest">{label}</div>
                      <div className="text-2xl font-bold font-mono" style={{ color }}>{(value * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 2. MATCH STATISTICS ─────────────────────────────────── */}
            <section className="border-t border-border/30 pt-5">
              <h3 className="text-xs font-mono tracking-widest text-muted-foreground mb-3">{t.results.statsTitle}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { label: t.results.expectedGoals,  home: result.homeTeam.avgGoals.toFixed(2),          comb: result.expectedTotalGoals.toFixed(2),       away: result.awayTeam.avgGoals.toFixed(2)          },
                  { label: t.results.shotsOnTarget,  home: result.homeTeam.avgShotsOnTarget.toFixed(1),  comb: result.combinedShotsOnTarget.toFixed(1),    away: result.awayTeam.avgShotsOnTarget.toFixed(1)  },
                  { label: t.results.corners,        home: result.homeTeam.avgCorners.toFixed(1),        comb: result.totalAvgCorners.toFixed(1),          away: result.awayTeam.avgCorners.toFixed(1)        },
                  { label: t.results.yellowCards,    home: result.homeTeam.avgYellowCards.toFixed(1),    comb: result.totalAvgYellowCards.toFixed(1),      away: result.awayTeam.avgYellowCards.toFixed(1)    },
                ].map(({ label, home, comb, away }) => (
                  <div key={label} className="bg-black/10 border border-border/20 rounded px-3 py-2">
                    <div className="text-muted-foreground tracking-widest text-[9px] mb-1">{label}</div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-primary font-bold text-sm">{home}</span>
                      <span className="text-muted-foreground/50 text-[10px]">{comb} total</span>
                      <span className="text-red-400 font-bold text-sm">{away}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 3. GAUSSIAN DISTRIBUTIONS ───────────────────────────── */}
            {result.distributions && (
              <section className="border-t border-border/30 pt-5">
                <h3 className="text-xs font-mono tracking-widest text-muted-foreground mb-3">{t.results.gaussTitle}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <MiniDistChart data={result.distributions.goals}         avgValue={result.expectedTotalGoals}       color="hsl(109,100%,54%)" unitLabel={t.results.gaussGoalsUnit}  label={t.results.gaussGoalsLabel}  />
                  <MiniDistChart data={result.distributions.yellowCards}   avgValue={result.totalAvgYellowCards}      color="hsl(45,90%,55%)"   unitLabel={t.results.gaussYellowUnit} label={t.results.gaussYellowLabel} />
                  <MiniDistChart data={result.distributions.corners}       avgValue={result.totalAvgCorners}          color="hsl(200,90%,60%)"  unitLabel={t.results.gaussCornersUnit} label={t.results.gaussCornersLabel} />
                  <MiniDistChart data={result.distributions.shotsOnTarget} avgValue={result.combinedShotsOnTarget}   color="hsl(280,80%,65%)"  unitLabel={t.results.gaussShotsUnit}  label={t.results.gaussShotsLabel}  />
                </div>
              </section>
            )}

            {/* ── 4. TOP 6 SCORELINES ──────────────────────────────────── */}
            {result.topScorelines && result.topScorelines.length > 0 && (
              <section className="border-t border-border/30 pt-5">
                <h3 className="text-xs font-mono tracking-widest text-muted-foreground mb-3">{t.results.probableScorelines}</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={result.topScorelines.slice(0, 6).map(s => ({ name: `${s.home}-${s.away}`, prob: parseFloat((s.probability * 100).toFixed(1)) }))}
                      layout="vertical" margin={{ top: 0, right: 32, left: 36, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontFamily: "monospace", fontWeight: "bold" }} width={40} />
                      <Tooltip
                        formatter={(val: number) => [`${val.toFixed(1)}%`, t.results.probability]}
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontFamily: "monospace" }}
                      />
                      <Bar dataKey="prob" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* ── 5. GOALS MARKET ──────────────────────────────────────── */}
            <section className="border-t border-border/30 pt-5">
              <h3 className="text-xs font-mono tracking-widest text-muted-foreground mb-3">{t.results.goalsMarket}</h3>
              <div className="space-y-2">
                {[
                  { label: t.results.over25,  val: result.goalsMarket.over25,  color: "text-primary"          },
                  { label: t.results.under25, val: result.goalsMarket.under25, color: "text-muted-foreground" },
                  { label: t.results.over35,  val: result.goalsMarket.over35,  color: "text-primary"          },
                  { label: t.results.under35, val: result.goalsMarket.under35, color: "text-muted-foreground" },
                  { label: t.results.btts,    val: result.goalsMarket.btts,    color: "text-yellow-400"       },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-muted-foreground tracking-widest w-32 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, val * 100)}%` }} />
                    </div>
                    <span className={`font-bold font-mono text-sm w-12 text-right flex-shrink-0 ${color}`}>{(val * 100).toFixed(1)}%</span>
                  </div>
                ))}
                {result.formationAdvantage?.description && (
                  <p className="text-[10px] text-muted-foreground font-mono pt-2 border-t border-border/20 leading-relaxed">
                    {t.results.formationAdv}: {result.formationAdvantage.description}
                  </p>
                )}
              </div>
            </section>

            {/* ── 6. BET RECOMMENDATIONS ───────────────────────────────── */}
            <section className="border-t border-border/30 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-mono tracking-widest text-muted-foreground">{t.results.betRecs}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BET_SECTIONS.map(({ key, icon: Icon, color }) => {
                  const bets = (result!.betRecommendations as BetRec[]).filter(b => b.market === key);
                  if (!bets.length) return null;
                  return (
                    <div key={key} className="bg-black/10 border border-border/20 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                        <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color }}>{key}</span>
                      </div>
                      {bets.map((bet) => {
                        const rs = RISK_STYLES[bet.risk] ?? RISK_STYLES.high;
                        return (
                          <div key={bet.risk} className={`rounded border p-2.5 space-y-1.5 ${rs.border} ${rs.bg}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${rs.badge} uppercase tracking-widest`}>
                                {riskLabel[bet.risk] ?? bet.risk}
                              </span>
                              <span className={`text-lg font-bold font-mono ${rs.text}`}>{bet.confidence.toFixed(0)}%</span>
                            </div>
                            <div className="text-xs font-semibold text-foreground/90 leading-tight">{bet.recommendation}</div>
                            <div className="text-[10px] font-mono text-muted-foreground leading-relaxed border-t border-current/10 pt-1.5">{bet.reasoning}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main History Page ──────────────────────────────────────────────────── */
export default function History() {
  const { data, isLoading } = useGetBettingHistory({ query: { queryKey: getGetBettingHistoryQueryKey() } });
  const deleteHistory = useDeleteBettingHistory();
  const queryClient   = useQueryClient();
  const { toast }     = useToast();
  const { t }         = useLang();
  const [viewEntry, setViewEntry] = useState<{ fullResult?: string | null; homeTeamName: string; awayTeamName: string } | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await deleteHistory.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetBettingHistoryQueryKey() });
    } catch {
      toast({ title: "Error", description: "Failed to delete entry.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4">
        <Activity className="w-12 h-12 text-primary animate-spin-slow glow-text" />
        <p className="text-muted-foreground font-mono">{t.history.loading}</p>
      </div>
    );
  }

  const entries = data?.entries ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-3xl font-bold tracking-widest text-foreground">{t.history.title}</h1>
        <p className="text-muted-foreground font-mono mt-1">{t.history.subtitle}</p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border/50 rounded-lg bg-card/20">
          <div className="w-16 h-16 rounded-full bg-black/50 border border-border/50 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold tracking-widest text-muted-foreground">{t.history.empty}</h3>
          <p className="text-muted-foreground font-mono mt-2">{t.history.emptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Main info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-2">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm")}
                    {entry.weather && <span className="ml-2 opacity-60">· {entry.weather.replace("_", " ")}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xl font-bold tracking-wider">
                    <span className="flex-1 text-right">{entry.homeTeamName}</span>
                    <span className="text-primary font-mono text-sm glow-text">VS</span>
                    <span className="flex-1 text-left">{entry.awayTeamName}</span>
                  </div>
                  {(entry.homeFormation || entry.awayFormation) && (
                    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
                      <span>{entry.homeFormation}</span>
                      <span className="opacity-40">—</span>
                      <span>{entry.awayFormation}</span>
                    </div>
                  )}
                  <div className="flex justify-center gap-8 text-sm font-mono mt-4 pt-4 border-t border-border/30">
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1 text-xs">{t.history.homeWin}</div>
                      <div className="text-green-400 font-bold">{(entry.homeWinProb * 100).toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1 text-xs">{t.history.draw}</div>
                      <div className="text-yellow-400 font-bold">{(entry.drawProb * 100).toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1 text-xs">{t.history.awayWin}</div>
                      <div className="text-red-400 font-bold">{(entry.awayWinProb * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                {/* Best bet panel */}
                <div className="w-full md:w-56 space-y-2 bg-black/20 p-4 rounded-md border border-border/30 flex-shrink-0">
                  <div className="text-xs text-primary font-mono mb-1 tracking-widest">REC.</div>
                  <div className="font-bold text-sm tracking-wide leading-tight">{entry.betRecommendation ?? "N/A"}</div>
                  {entry.betConfidence != null && (
                    <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-border/20">
                      <span className="text-muted-foreground">{t.history.confidence}</span>
                      <span className="text-primary font-bold">{entry.betConfidence.toFixed(0)}%</span>
                    </div>
                  )}
                  <Button
                    variant="ghost" size="sm"
                    className="w-full mt-2 text-primary/70 hover:text-primary hover:bg-primary/10 text-xs font-mono"
                    onClick={() => setViewEntry({ fullResult: entry.fullResult, homeTeamName: entry.homeTeamName, awayTeamName: entry.awayTeamName })}
                  >
                    <Eye className="w-3 h-3 mr-1.5" /> {t.history.viewFull}
                  </Button>
                </div>

                {/* Delete */}
                <Button
                  variant="ghost" size="icon"
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex-shrink-0"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewEntry && (
        <FullResultModal
          open={!!viewEntry}
          onClose={() => setViewEntry(null)}
          fullResult={viewEntry.fullResult}
          homeTeamName={viewEntry.homeTeamName}
          awayTeamName={viewEntry.awayTeamName}
        />
      )}
    </div>
  );
}
