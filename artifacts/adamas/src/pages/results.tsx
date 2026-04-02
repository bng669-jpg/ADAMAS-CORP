import { useLocation } from "wouter";
import { useSimulationStore } from "@/lib/simulation-store";
import { useSaveBettingHistory } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowLeft, Save, Target, Crosshair, Triangle, CircleDot, Goal } from "lucide-react";

export default function Results() {
  const [, setLocation] = useLocation();
  const { lastResult: result, lastInput: input } = useSimulationStore();
  const saveHistory = useSaveBettingHistory();
  const { toast } = useToast();
  const { t } = useLang();

  if (!result || !input) {
    setLocation("/");
    return null;
  }

  const handleSave = async () => {
    try {
      await saveHistory.mutateAsync({
        data: {
          homeTeamName: input.homeTeam.name,
          awayTeamName: input.awayTeam.name,
          homeFormation: input.homeTeam.formation,
          awayFormation: input.awayTeam.formation,
          homeColor: input.homeTeam.color,
          awayColor: input.awayTeam.color,
          homeWinProb: result.homeTeam.winProbability,
          awayWinProb: result.awayTeam.winProbability,
          drawProb: result.drawProbability,
          expectedGoals: result.expectedTotalGoals,
          betRecommendation: result.betRecommendations[0]?.recommendation,
          betMarket: result.betRecommendations[0]?.market,
          betConfidence: result.betRecommendations[0]?.confidence,
          weather: input.weather,
          referee: input.referee.name,
        }
      });
      toast({ title: t.results.saved, description: t.results.savedDesc });
    } catch {
      toast({ title: t.results.errorSave, description: t.results.errorSaveDesc, variant: "destructive" });
    }
  };

  const winProbData = [
    { name: t.results.homeWin, value: parseFloat((result.homeTeam.winProbability * 100).toFixed(1)), color: "hsl(109, 100%, 54%)" },
    { name: t.results.draw, value: parseFloat((result.drawProbability * 100).toFixed(1)), color: "hsl(45, 90%, 55%)" },
    { name: t.results.awayWin, value: parseFloat((result.awayTeam.winProbability * 100).toFixed(1)), color: "hsl(0, 100%, 55%)" },
  ];

  const scorelinesData = result.topScorelines.slice(0, 6).map(s => ({
    name: `${s.home}-${s.away}`,
    prob: parseFloat((s.probability * 100).toFixed(1)),
  }));

  const riskColors: Record<string, string> = {
    low: "text-green-400 border-green-500 bg-green-500/10",
    medium: "text-yellow-400 border-yellow-500 bg-yellow-500/10",
    high: "text-red-400 border-red-500 bg-red-500/10",
  };

  const riskLabel: Record<string, string> = {
    low: t.results.low,
    medium: t.results.medium,
    high: t.results.high,
  };

  // The 4 categorized bets from the backend (GOALS, YELLOW CARDS, CORNERS, SHOTS ON TARGET)
  const bets = result.betRecommendations;
  const goalsBet = bets.find(b => b.market === "GOALS");
  const cardsBet = bets.find(b => b.market === "YELLOW CARDS");
  const cornersBet = bets.find(b => b.market === "CORNERS");
  const shotsBet = bets.find(b => b.market === "SHOTS ON TARGET");

  const betSections = [
    { key: "goals", label: t.results.goalsBet, bet: goalsBet, Icon: Goal },
    { key: "cards", label: t.results.cardsBet, bet: cardsBet, Icon: CircleDot },
    { key: "corners", label: t.results.cornersBet, bet: cornersBet, Icon: Triangle },
    { key: "shots", label: t.results.shotsBet, bet: shotsBet, Icon: Crosshair },
  ];

  const StatRow = ({ label, home, combined, away }: { label: string; home: string; combined: string; away: string }) => (
    <div className="space-y-1">
      <div className="text-xs font-mono text-muted-foreground tracking-widest">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-center">
          <span className="text-lg font-bold text-primary glow-text">{home}</span>
          <div className="text-[10px] text-muted-foreground font-mono">{t.results.homeGoals}</div>
        </div>
        <div className="flex-1 text-center border-x border-border/40 px-2">
          <span className="text-base font-bold text-foreground/80">{combined}</span>
          <div className="text-[10px] text-muted-foreground font-mono">{t.results.combined}</div>
        </div>
        <div className="flex-1 text-center">
          <span className="text-lg font-bold text-red-400">{away}</span>
          <div className="text-[10px] text-muted-foreground font-mono">{t.results.awayGoals}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/50 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-foreground">{t.results.title}</h1>
          <p className="text-muted-foreground font-mono mt-1">{t.results.iterations}: {result.simulationIterations.toLocaleString()}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setLocation("/")} className="border-primary/50 text-primary hover:bg-primary/10">
            <ArrowLeft className="w-4 h-4 mr-2" /> {t.results.newSim}
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            <Save className="w-4 h-4 mr-2" /> {t.results.save}
          </Button>
        </div>
      </div>

      {/* Match Header */}
      <div className="flex justify-between items-center bg-card/50 border border-border/50 p-6 rounded-lg glow-border">
        <div className="text-center w-5/12">
          <h2 className="text-xl md:text-2xl font-bold tracking-wider">{input.homeTeam.name}</h2>
          <p className="text-muted-foreground font-mono mt-1 text-sm">{input.homeTeam.formation}</p>
          <div className={`inline-block mt-2 w-3 h-3 rounded-full ${input.homeTeam.color === 'green' ? 'bg-green-500' : input.homeTeam.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
        </div>
        <div className="text-center w-2/12">
          <div className="text-lg font-bold text-primary font-mono glow-text">{t.results.vs}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase font-mono">{input.weather.replace('_', ' ')}</div>
        </div>
        <div className="text-center w-5/12">
          <h2 className="text-xl md:text-2xl font-bold tracking-wider">{input.awayTeam.name}</h2>
          <p className="text-muted-foreground font-mono mt-1 text-sm">{input.awayTeam.formation}</p>
          <div className={`inline-block mt-2 w-3 h-3 rounded-full ${input.awayTeam.color === 'green' ? 'bg-green-500' : input.awayTeam.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
        </div>
      </div>

      {/* Win Probability + Expected Goals */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Win Probability */}
        <Card className="bg-card/50 border-border/50 glow-border">
          <CardHeader><CardTitle className="tracking-widest text-sm">{t.results.winProb}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={winProbData} innerRadius={45} outerRadius={62} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                      {winProbData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {winProbData.map(d => (
                  <div key={d.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-mono text-xs text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-bold text-2xl font-mono" style={{ color: d.color }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Probable */}
        <Card className="bg-card/50 border-border/50 glow-border">
          <CardHeader><CardTitle className="tracking-widest text-sm">{t.results.expectedGoals}</CardTitle></CardHeader>
          <CardContent className="space-y-5 pt-2">
            <StatRow
              label={t.results.expectedGoals}
              home={result.homeTeam.avgGoals.toFixed(2)}
              combined={result.expectedTotalGoals.toFixed(2)}
              away={result.awayTeam.avgGoals.toFixed(2)}
            />
            <StatRow
              label={t.results.shotsOnTarget}
              home={result.homeTeam.avgShotsOnTarget.toFixed(1)}
              combined={result.combinedShotsOnTarget.toFixed(1)}
              away={result.awayTeam.avgShotsOnTarget.toFixed(1)}
            />
            <StatRow
              label={t.results.corners}
              home={result.homeTeam.avgCorners.toFixed(1)}
              combined={result.totalAvgCorners.toFixed(1)}
              away={result.awayTeam.avgCorners.toFixed(1)}
            />
            <StatRow
              label={t.results.yellowCards}
              home={result.homeTeam.avgYellowCards.toFixed(1)}
              combined={result.totalAvgYellowCards.toFixed(1)}
              away={result.awayTeam.avgYellowCards.toFixed(1)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Probable Scorelines + Goals Market */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Probable Scorelines */}
        <Card className="bg-card/50 border-border/50 glow-border">
          <CardHeader><CardTitle className="tracking-widest text-sm">{t.results.probableScorelines}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scorelinesData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontFamily: 'monospace', fontWeight: 'bold' }}
                    width={40}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${val.toFixed(1)}%`, t.results.probability]}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="prob" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Goals Market */}
        <Card className="bg-card/50 border-border/50 glow-border">
          <CardHeader><CardTitle className="tracking-widest text-sm">{t.results.goalsMarket}</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-2">
            {[
              { label: t.results.over25, val: result.goalsMarket.over25, color: "text-primary" },
              { label: t.results.under25, val: result.goalsMarket.under25, color: "text-muted-foreground" },
              { label: t.results.over35, val: result.goalsMarket.over35, color: "text-primary" },
              { label: t.results.under35, val: result.goalsMarket.under35, color: "text-muted-foreground" },
              { label: t.results.btts, val: result.goalsMarket.btts, color: "text-yellow-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between border-b border-border/20 pb-2">
                <span className="font-mono text-xs text-muted-foreground tracking-widest">{label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-border/30 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, val * 100)}%` }} />
                  </div>
                  <span className={`font-bold font-mono text-sm w-12 text-right ${color}`}>{(val * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
            <div className="pt-2 text-xs text-muted-foreground font-mono border-t border-border/30">
              {t.results.formationAdv}: {result.formationAdvantage.description}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4 Bet Recommendations — one per category */}
      <div>
        <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-6">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold tracking-widest">{t.results.betRecs}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {betSections.map(({ key, label, bet, Icon }) => {
            if (!bet) return null;
            return (
              <div key={key} className={`p-5 border rounded-lg ${riskColors[bet.risk]} space-y-3`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 opacity-80" />
                  <span className="text-[11px] font-mono tracking-widest opacity-70 uppercase">{label}</span>
                </div>
                <div className="flex justify-between items-start">
                  <div className="font-bold tracking-wide text-base leading-tight flex-1 pr-2">{bet.recommendation}</div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold font-mono text-xl">{bet.confidence.toFixed(0)}%</div>
                    <div className="text-[10px] uppercase tracking-widest opacity-70">{riskLabel[bet.risk]} {t.results.risk}</div>
                  </div>
                </div>
                <div className="text-xs font-mono opacity-80 border-t border-current/20 pt-3 leading-relaxed">{bet.reasoning}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
