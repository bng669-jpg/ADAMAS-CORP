import { useGetFormations, getGetFormationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function Formations() {
  const { data: formationsData, isLoading, error } = useGetFormations({ query: { queryKey: getGetFormationsQueryKey() } });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Activity className="w-12 h-12 text-primary animate-spin-slow glow-text" />
      </div>
    );
  }

  if (error || !formationsData) {
    return <div className="text-red-500">Failed to load formations data.</div>;
  }

  const { formations } = formationsData;

  const getMatchupColor = (winRate: number) => {
    if (winRate > 0.55) return "text-green-500 bg-green-500/10";
    if (winRate < 0.45) return "text-red-500 bg-red-500/10";
    return "text-muted-foreground bg-white/5";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-12">
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-3xl font-bold tracking-widest text-foreground">FORMATION MATCHMAKING</h1>
        <p className="text-muted-foreground font-mono mt-1">Tactical advantages and historical win rates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {formations.map((f) => (
          <Card key={f.id} className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors glow-border flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl tracking-wider text-primary">{f.name}</CardTitle>
                <div className="text-xs font-mono text-muted-foreground">WR: {(f.winRateAvg * 100).toFixed(1)}%</div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{f.description}</p>
              
              <div className="space-y-4 mt-auto text-sm font-mono">
                <div>
                  <div className="text-green-500 mb-1">STRENGTHS</div>
                  <ul className="text-muted-foreground list-disc pl-4 space-y-1">
                    {f.strengths.slice(0, 2).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-red-500 mb-1">WEAKNESSES</div>
                  <ul className="text-muted-foreground list-disc pl-4 space-y-1">
                    {f.weaknesses.slice(0, 2).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="pt-2 border-t border-border/30 flex justify-between">
                  <div>
                    <span className="text-green-500">↑</span> {f.bestAgainst.slice(0,2).join(", ")}
                  </div>
                  <div>
                    <span className="text-red-500">↓</span> {f.worstAgainst.slice(0,2).join(", ")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-widest border-b border-border/50 pb-2">MATCHUP MATRIX</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-border/50 bg-black/20 text-left sticky left-0 z-10 text-muted-foreground">vs</th>
                {formations.map(f => (
                  <th key={f.id} className="p-2 border border-border/50 bg-black/20 font-bold tracking-wider">{f.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formations.map(row => (
                <tr key={row.id}>
                  <td className="p-2 border border-border/50 font-bold bg-black/20 sticky left-0 z-10">{row.name}</td>
                  {formations.map(col => {
                    const winRate = row.matchups?.[col.id] || 0.5;
                    if (row.id === col.id) {
                      return <td key={col.id} className="p-2 border border-border/50 text-center bg-white/5 text-muted-foreground/30">-</td>;
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
