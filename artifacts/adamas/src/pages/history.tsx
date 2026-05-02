import { useState } from "react";
import { useGetBettingHistory, useDeleteBettingHistory, getGetBettingHistoryQueryKey } from "@workspace/api-client-react";
import type { SimulationResult } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, Activity, Calendar, Eye, Goal, CircleDot, Triangle, Crosshair } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/lang";

const RISK_STYLES: Record<string, { badge: string; border: string; bg: string; text: string }> = {
  low:    { badge: "bg-green-500/20 text-green-300 border-green-500/40",  border: "border-green-500/30",  bg: "bg-green-500/5",  text: "text-green-300"  },
  medium: { badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", border: "border-yellow-500/30", bg: "bg-yellow-500/5", text: "text-yellow-300" },
  high:   { badge: "bg-red-500/20 text-red-300 border-red-500/40",        border: "border-red-500/30",    bg: "bg-red-500/5",    text: "text-red-300"    },
};

const BET_SECTIONS = [
  { key: "GOALS",          icon: Goal,     color: "hsl(109,100%,54%)" },
  { key: "YELLOW CARDS",   icon: CircleDot, color: "hsl(45,90%,55%)"  },
  { key: "CORNERS",        icon: Triangle,  color: "hsl(200,90%,60%)" },
  { key: "SHOTS ON TARGET",icon: Crosshair, color: "hsl(280,80%,65%)" },
];

function FullResultModal({
  open,
  onClose,
  fullResult,
  homeTeamName,
  awayTeamName,
}: {
  open: boolean;
  onClose: () => void;
  fullResult: string | null | undefined;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const { t } = useLang();

  let result: SimulationResult | null = null;
  if (fullResult) {
    try { result = JSON.parse(fullResult) as SimulationResult; } catch { result = null; }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border/80">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-bold tracking-widest text-primary glow-text">{t.history.fullResultTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground font-mono text-sm">
            {homeTeamName} vs {awayTeamName}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="py-12 text-center text-muted-foreground font-mono">{t.history.noFullResult}</div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Win probabilities */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t.history.homeWin, value: result.homeTeam.winProbability, color: "text-green-400" },
                { label: t.history.draw,    value: result.drawProbability,         color: "text-yellow-400" },
                { label: t.history.awayWin, value: result.awayTeam.winProbability, color: "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-black/20 border border-border/30 rounded-md p-3 text-center">
                  <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">{label}</div>
                  <div className={`text-2xl font-bold font-mono ${color}`}>{(value * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>

            {/* xG Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {[
                { label: "xG", home: result.homeTeam.avgGoals.toFixed(2), away: result.awayTeam.avgGoals.toFixed(2) },
                { label: t.history.market === "Mercado" ? "Tiros" : "Shots", home: result.homeTeam.avgShotsOnTarget.toFixed(1), away: result.awayTeam.avgShotsOnTarget.toFixed(1) },
                { label: "Corners", home: result.homeTeam.avgCorners.toFixed(1), away: result.awayTeam.avgCorners.toFixed(1) },
                { label: "Amarillas", home: result.homeTeam.avgYellowCards.toFixed(1), away: result.awayTeam.avgYellowCards.toFixed(1) },
              ].map(({ label, home, away }) => (
                <div key={label} className="bg-black/10 border border-border/20 rounded px-3 py-2 flex justify-between items-center">
                  <span className="text-muted-foreground tracking-widest">{label}</span>
                  <span className="text-primary font-bold">{home}</span>
                  <span className="text-muted-foreground/50">—</span>
                  <span className="text-red-400 font-bold">{away}</span>
                </div>
              ))}
            </div>

            {/* Top Scorelines */}
            {result.topScorelines && result.topScorelines.length > 0 && (
              <div className="border-t border-border/30 pt-4">
                <div className="text-xs font-mono text-muted-foreground tracking-widest mb-3">{t.history.scorelines}</div>
                <div className="grid grid-cols-5 gap-2">
                  {result.topScorelines.slice(0, 10).map((s) => (
                    <div key={`${s.home}-${s.away}`} className="bg-black/20 border border-border/30 rounded p-2 text-center">
                      <div className="font-bold font-mono text-primary">{s.home}-{s.away}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{(s.probability * 100).toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bet Recommendations by market */}
            {result.betRecommendations && result.betRecommendations.length > 0 && (
              <div className="border-t border-border/30 pt-4 space-y-4">
                <div className="text-xs font-mono text-muted-foreground tracking-widest">{t.history.bets}</div>
                {BET_SECTIONS.map(({ key, icon: Icon, color }) => {
                  const bets = (result!.betRecommendations as Array<{ market: string; risk: string; recommendation: string; confidence: number; reasoning: string }>).filter(b => b.market === key);
                  if (!bets.length) return null;
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                        <span className="text-xs font-mono font-bold tracking-widest" style={{ color }}>{key}</span>
                      </div>
                      <div className="space-y-2">
                        {bets.map((bet) => {
                          const rs = RISK_STYLES[bet.risk] ?? RISK_STYLES.high;
                          return (
                            <div key={bet.risk} className={`rounded border p-2.5 space-y-1 ${rs.border} ${rs.bg}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${rs.badge} uppercase tracking-widest`}>{bet.risk}</span>
                                <span className={`text-base font-bold font-mono ${rs.text}`}>{bet.confidence.toFixed(0)}%</span>
                              </div>
                              <div className="text-xs font-semibold text-foreground/90">{bet.recommendation}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function History() {
  const { data, isLoading } = useGetBettingHistory({ query: { queryKey: getGetBettingHistoryQueryKey() } });
  const deleteHistory = useDeleteBettingHistory();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLang();
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

  const entries = data?.entries || [];

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
              <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-2">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm")}
                    {entry.weather && <span className="ml-2 opacity-60">· {entry.weather.replace('_', ' ')}</span>}
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

                <div className="w-full md:w-56 space-y-2 bg-black/20 p-4 rounded-md border border-border/30">
                  <div className="text-xs text-primary font-mono mb-1 tracking-widest">REC.</div>
                  <div className="font-bold text-sm tracking-wide leading-tight">{entry.betRecommendation || "N/A"}</div>
                  {entry.betConfidence != null && (
                    <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-border/20">
                      <span className="text-muted-foreground">{t.history.confidence}</span>
                      <span className="text-primary font-bold">{entry.betConfidence.toFixed(0)}%</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-primary/70 hover:text-primary hover:bg-primary/10 text-xs font-mono"
                    onClick={() => setViewEntry({ fullResult: entry.fullResult, homeTeamName: entry.homeTeamName, awayTeamName: entry.awayTeamName })}
                  >
                    <Eye className="w-3 h-3 mr-1.5" /> {t.history.viewFull}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
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
