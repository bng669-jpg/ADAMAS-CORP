import { useState } from "react";
import { useGetFormations, getGetFormationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";
import { Activity, Trophy, Shield, Swords, ChevronRight } from "lucide-react";

type Formation = {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  bestAgainst: string[];
  worstAgainst: string[];
  popularityRank: number;
  winRateAvg: number;
  matchups?: Record<string, number>;
};

export default function Formations() {
  const { data: formationsData, isLoading, error } = useGetFormations({ query: { queryKey: getGetFormationsQueryKey() } });
  const { t } = useLang();
  const [selected, setSelected] = useState<Formation | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4">
        <Activity className="w-12 h-12 text-primary animate-spin-slow glow-text" />
        <p className="text-muted-foreground font-mono">{t.formations.loading}</p>
      </div>
    );
  }

  if (error || !formationsData) {
    return <div className="text-red-500 font-mono">{t.formations.error}</div>;
  }

  const { formations } = formationsData;

  const getMatchupColor = (winRate: number) => {
    if (winRate > 0.55) return "text-green-400 bg-green-500/10";
    if (winRate < 0.45) return "text-red-400 bg-red-500/10";
    return "text-muted-foreground bg-white/5";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-12">
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-3xl font-bold tracking-widest text-foreground">{t.formations.title}</h1>
        <p className="text-muted-foreground font-mono mt-1">{t.formations.subtitle}</p>
      </div>

      {/* Formation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {formations.map((f) => (
          <Card
            key={f.id}
            className="bg-card/50 border-border/50 hover:border-primary/60 transition-all glow-border flex flex-col cursor-pointer group hover:bg-card/80"
            onClick={() => setSelected(f as Formation)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl tracking-wider text-primary group-hover:glow-text transition-all">{f.name}</CardTitle>
                <div className="text-xs font-mono text-muted-foreground">{t.formations.winRate}: {(f.winRateAvg * 100).toFixed(1)}%</div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{f.description}</p>

              <div className="space-y-3 mt-auto text-sm font-mono">
                <div>
                  <div className="text-green-400 mb-1 text-xs tracking-widest">{t.formations.strengths}</div>
                  <ul className="text-muted-foreground list-disc pl-4 space-y-1 text-xs">
                    {f.strengths.slice(0, 2).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-red-400 mb-1 text-xs tracking-widest">{t.formations.weaknesses}</div>
                  <ul className="text-muted-foreground list-disc pl-4 space-y-1 text-xs">
                    {f.weaknesses.slice(0, 2).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="pt-2 border-t border-border/30 space-y-1">
                  <div className="text-xs">
                    <span className="text-green-400">↑ {t.formations.beats}: </span>
                    <span className="text-muted-foreground">{f.bestAgainst.slice(0, 2).join(", ")}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-red-400">↓ {t.formations.losesTo}: </span>
                    <span className="text-muted-foreground">{f.worstAgainst.slice(0, 2).join(", ")}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full text-primary/70 hover:text-primary hover:bg-primary/10 text-xs font-mono group-hover:opacity-100 opacity-60 transition-all"
              >
                {t.formations.viewDetails} <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formation Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl bg-card border-border/80 max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader className="pb-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-3xl font-bold tracking-widest text-primary glow-text">{selected.name}</DialogTitle>
                  <div className="text-right">
                    <div className="text-xs font-mono text-muted-foreground">{t.formations.winRate}</div>
                    <div className="text-2xl font-bold text-primary font-mono">{(selected.winRateAvg * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs font-mono text-muted-foreground">{t.formations.popularity} #{selected.popularityRank}</span>
                </div>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                {/* Description */}
                <div className="bg-black/20 rounded-lg p-4 border border-border/30">
                  <p className="text-sm text-foreground/80 leading-relaxed">{selected.description}</p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Swords className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-mono text-green-400 tracking-widest">{t.formations.allStrengths}</span>
                    </div>
                    <ul className="space-y-2">
                      {selected.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-green-400 mt-0.5 flex-shrink-0">+</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-mono text-red-400 tracking-widest">{t.formations.allWeaknesses}</span>
                    </div>
                    <ul className="space-y-2">
                      {selected.weaknesses.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-red-400 mt-0.5 flex-shrink-0">−</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Best/Worst matchups */}
                <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-4">
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-green-400 tracking-widest mb-2">↑ {t.formations.bestAgainst}</div>
                    <div className="flex flex-wrap gap-2">
                      {selected.bestAgainst.map((f, i) => (
                        <span key={i} className="text-xs font-mono font-bold px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-red-400 tracking-widest mb-2">↓ {t.formations.worstAgainst}</div>
                    <div className="flex flex-wrap gap-2">
                      {selected.worstAgainst.map((f, i) => (
                        <span key={i} className="text-xs font-mono font-bold px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Matchup rates vs all formations */}
                {selected.matchups && Object.keys(selected.matchups).length > 0 && (
                  <div className="border-t border-border/30 pt-4">
                    <div className="text-xs font-mono text-muted-foreground tracking-widest mb-3">{t.formations.matrixTitle}</div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(selected.matchups)
                        .sort(([, a], [, b]) => b - a)
                        .map(([oppId, wr]) => (
                          <div key={oppId} className={`flex justify-between items-center px-2 py-1.5 rounded text-xs font-mono border ${getMatchupColor(wr)}`}>
                            <span className="font-bold">{oppId}</span>
                            <span>{(wr * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Matchup Matrix */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-widest border-b border-border/50 pb-2">{t.formations.matrixTitle}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-border/50 bg-black/20 text-left sticky left-0 z-10 text-muted-foreground min-w-[70px]">{t.formations.vs}</th>
                {formations.map(f => (
                  <th key={f.id} className="p-2 border border-border/50 bg-black/20 font-bold tracking-wider text-center min-w-[60px]">{f.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formations.map(row => (
                <tr key={row.id}>
                  <td className="p-2 border border-border/50 font-bold bg-black/20 sticky left-0 z-10 text-primary">{row.name}</td>
                  {formations.map(col => {
                    const winRate = row.matchups?.[col.id] ?? 0.5;
                    if (row.id === col.id) {
                      return <td key={col.id} className="p-2 border border-border/50 text-center bg-white/5 text-muted-foreground/30">—</td>;
                    }
                    return (
                      <td key={col.id} className={`p-2 border border-border/50 text-center ${getMatchupColor(winRate)}`}>
                        {(winRate * 100).toFixed(0)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
