import { useLocation } from "wouter";
import { useSimulationStore } from "@/lib/simulation-store";
import { useSaveBettingHistory } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
} from "recharts";
import { ArrowLeft, Save, Target, Crosshair, Triangle, CircleDot, Goal } from "lucide-react";

type DistBucket = { value: number; count: number; pct: number };
type BetRec = { recommendation: string; market: string; confidence: number; risk: string; reasoning: string };

export default function Results() {
  const [, setLocation] = useLocation();
  const { lastResult: result, lastInput: input } = useSimulationStore();
  const saveHistory = useSaveBettingHistory();
  const { toast } = useToast();
  const { t } = useLang();

  if (!result || !input) {
    setTimeout(() => setLocation("/"), 0);
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
          fullResult: JSON.stringify(result),
          inputData: JSON.stringify(input),
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

  const scorelinesData = result.topScorelines.slice(0, 10).map(s => ({
    name: `${s.home}-${s.away}`,
    prob: parseFloat((s.probability * 100).toFixed(1)),
  }));

  const riskStyles: Record<string, { badge: string; border: string; bg: string; text: string; label: string }> = {
    low: { badge: "bg-green-500/20 text-green-300 border-green-500/40", border: "border-green-500/30", bg: "bg-green-500/5", text: "text-green-300", label: t.results.low },
    medium: { badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", border: "border-yellow-500/30", bg: "bg-yellow-500/5", text: "text-yellow-300", label: t.results.medium },
    high: { badge: "bg-red-500/20 text-red-300 border-red-500/40", border: "border-red-500/30", bg: "bg-red-500/5", text: "text-red-300", label: t.results.high },
  };

  // Group bets by market
  const betsByMarket = (market: string): BetRec[] =>
    (result.betRecommendations as BetRec[]).filter(b => b.market === market);

  const betSections = [
    { key: "GOALS", label: t.results.goalsBet, Icon: Goal, color: "hsl(109,100%,54%)" },
    { key: "YELLOW CARDS", label: t.results.cardsBet, Icon: CircleDot, color: "hsl(45,90%,55%)" },
    { key: "CORNERS", label: t.results.cornersBet, Icon: Triangle, color: "hsl(200,90%,60%)" },
    { key: "SHOTS ON TARGET", label: t.results.shotsBet, Icon: Crosshair, color: "hsl(280,80%,65%)" },
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

  // Gaussian distribution bar chart component (taller, 2×2 grid)
  const DistributionChart = ({
    data,
    avgValue,
    color,
    unitLabel,
    statLabel,
    icon: Icon,
  }: {
    data: DistBucket[];
    avgValue: number;
    color: string;
    unitLabel: string;
    statLabel: string;
    icon: React.ElementType;
  }) => {
    const maxPct = Math.max(...data.map(d => d.pct), 1);
    const avgRounded = Math.round(avgValue);
    const modeVal = data.reduce((best, d) => (d.pct > best.pct ? d : best), data[0] ?? { value: 0, pct: 0, count: 0 });

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: DistBucket }> }) => {
      if (!active || !payload?.length) return null;
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border/80 rounded px-3 py-2 text-xs font-mono shadow-lg">
          <div style={{ color }} className="font-bold mb-1 text-sm">
            {d.value} {unitLabel}
          </div>
          <div className="text-foreground">{d.pct.toFixed(2)}% de las simulaciones</div>
          <div className="text-muted-foreground">{d.count.toLocaleString()} / 10,000 iteraciones</div>
        </div>
      );
    };

    return (
      <Card className="bg-card/60 border-border/50 glow-border flex flex-col">
        <CardHeader className="pb-2 pt-5 px-5">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4" style={{ color }} />
            <CardTitle className="text-xs tracking-widest font-mono" style={{ color }}>{statLabel}</CardTitle>
          </div>
          <div className="flex items-end gap-3 mt-2">
            <div>
              <div className="text-[10px] text-muted-foreground font-mono tracking-wider">MEDIA</div>
              <div className="text-3xl font-bold font-mono glow-text" style={{ color }}>{avgValue.toFixed(1)}</div>
            </div>
            <div className="text-right ml-auto">
              <div className="text-[10px] text-muted-foreground font-mono tracking-wider">MODA</div>
              <div className="text-xl font-bold font-mono text-foreground/70">{modeVal.value}</div>
            </div>
          </div>
          <div className="mt-2 flex gap-3 text-[11px] font-mono text-muted-foreground">
            <span>Más probable: <span className="font-bold text-foreground/80">{modeVal.value} {unitLabel} ({modeVal.pct.toFixed(1)}%)</span></span>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-4 flex-1">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 4 }} barCategoryGap="8%">
                <XAxis
                  dataKey="value"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "monospace", fontWeight: "bold" }}
                  label={{ value: unitLabel, position: "insideBottom", offset: -2, fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  domain={[0, maxPct * 1.15]}
                  width={36}
                />
                <ReferenceLine x={avgRounded} stroke={color} strokeDasharray="4 3" strokeOpacity={0.7} strokeWidth={1.5} label={{ value: "μ", fill: color, fontSize: 11, fontFamily: "monospace" }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                  {data.map((entry) => (
                    <Cell
                      key={`cell-${entry.value}`}
                      fill={entry.value === modeVal.value ? color : `${color}99`}
                      opacity={entry.value === avgRounded || entry.value === modeVal.value ? 1 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const dist = result.distributions;

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
        </div>
        <div className="text-center w-2/12">
          <div className="text-lg font-bold text-primary font-mono glow-text">{t.results.vs}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase font-mono">{input.weather.replace('_', ' ')}</div>
        </div>
        <div className="text-center w-5/12">
          <h2 className="text-xl md:text-2xl font-bold tracking-wider">{input.awayTeam.name}</h2>
          <p className="text-muted-foreground font-mono mt-1 text-sm">{input.awayTeam.formation}</p>
        </div>
      </div>

      {/* Win Probability + Stats Summary */}
      <div className="grid md:grid-cols-2 gap-8">
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

        <Card className="bg-card/50 border-border/50 glow-border">
          <CardHeader><CardTitle className="tracking-widest text-sm">{t.results.statsTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-5 pt-2">
            <StatRow label={t.results.expectedGoals} home={result.homeTeam.avgGoals.toFixed(2)} combined={result.expectedTotalGoals.toFixed(2)} away={result.awayTeam.avgGoals.toFixed(2)} />
            <StatRow label={t.results.shotsOnTarget} home={result.homeTeam.avgShotsOnTarget.toFixed(1)} combined={result.combinedShotsOnTarget.toFixed(1)} away={result.awayTeam.avgShotsOnTarget.toFixed(1)} />
            <StatRow label={t.results.corners} home={result.homeTeam.avgCorners.toFixed(1)} combined={result.totalAvgCorners.toFixed(1)} away={result.awayTeam.avgCorners.toFixed(1)} />
            <StatRow label={t.results.yellowCards} home={result.homeTeam.avgYellowCards.toFixed(1)} combined={result.totalAvgYellowCards.toFixed(1)} away={result.awayTeam.avgYellowCards.toFixed(1)} />
          </CardContent>
        </Card>
      </div>

      {/* GAUSSIAN DISTRIBUTIONS — 2×2 grid, large & readable */}
      {dist && (
        <div>
          <div className="border-b border-border/50 pb-3 mb-5">
            <h2 className="text-xl font-bold tracking-widest">{t.results.gaussTitle}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">{t.results.gaussSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DistributionChart
              data={dist.goals}
              avgValue={result.expectedTotalGoals}
              color="hsl(109, 100%, 54%)"
              unitLabel={t.results.gaussGoalsUnit}
              statLabel={t.results.gaussGoalsLabel}
              icon={Goal}
            />
            <DistributionChart
              data={dist.yellowCards}
              avgValue={result.totalAvgYellowCards}
              color="hsl(45, 90%, 55%)"
              unitLabel={t.results.gaussYellowUnit}
              statLabel={t.results.gaussYellowLabel}
              icon={CircleDot}
            />
            <DistributionChart
              data={dist.corners}
              avgValue={result.totalAvgCorners}
              color="hsl(200, 90%, 60%)"
              unitLabel={t.results.gaussCornersUnit}
              statLabel={t.results.gaussCornersLabel}
              icon={Triangle}
            />
            <DistributionChart
              data={dist.shotsOnTarget}
              avgValue={result.combinedShotsOnTarget}
              color="hsl(280, 80%, 65%)"
              unitLabel={t.results.gaussShotsUnit}
              statLabel={t.results.gaussShotsLabel}
              icon={Crosshair}
            />
          </div>
        </div>
      )}

      {/* Scorelines + Goals Market */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-border/50 glow-border">
          <CardHeader><CardTitle className="tracking-widest text-sm">{t.results.probableScorelines}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scorelinesData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' }} width={40} />
                  <Tooltip formatter={(val: number) => [`${val.toFixed(1)}%`, t.results.probability]} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'monospace' }} />
                  <Bar dataKey="prob" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, val * 100)}%` }} />
                  </div>
                  <span className={`font-bold font-mono text-sm w-12 text-right ${color}`}>{(val * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
            <div className="pt-2 text-xs text-muted-foreground font-mono border-t border-border/30 leading-relaxed">
              {t.results.formationAdv}: {result.formationAdvantage.description}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4 × 3 Bet Recommendations (3 risk levels per market) */}
      <div>
        <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-6">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold tracking-widest">{t.results.betRecs}</h2>
          <span className="ml-2 text-xs font-mono text-muted-foreground">{t.results.betRecsSubtitle}</span>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {betSections.map(({ key, label, Icon, color }) => {
            const bets = betsByMarket(key);
            return (
              <Card key={key} className="bg-card/40 border-border/50">
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color }} />
                    <CardTitle className="text-xs font-mono tracking-widest" style={{ color }}>{label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {bets.map((bet) => {
                    const rs = riskStyles[bet.risk] ?? riskStyles.high;
                    return (
                      <div key={bet.risk} className={`rounded-md border p-3 space-y-2 ${rs.border} ${rs.bg}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${rs.badge} tracking-widest uppercase`}>
                            {rs.label} {t.results.risk}
                          </span>
                          <span className={`text-xl font-bold font-mono ${rs.text}`}>{bet.confidence.toFixed(0)}%</span>
                        </div>
                        <div className="font-semibold text-sm text-foreground/90 leading-tight">{bet.recommendation}</div>
                        <div className="text-[11px] font-mono text-muted-foreground leading-relaxed border-t border-current/10 pt-2">{bet.reasoning}</div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
