import { useLocation } from "wouter";
import { useSimulationStore } from "@/lib/simulation-store";
import { useSaveBettingHistory } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowLeft, Save, AlertTriangle, Target, Activity } from "lucide-react";

export default function Results() {
  const [, setLocation] = useLocation();
  const { lastResult: result, lastInput: input } = useSimulationStore();
  const saveHistory = useSaveBettingHistory();
  const { toast } = useToast();

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
      toast({ title: "Saved to history", description: "Simulation result archived." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save result.", variant: "destructive" });
    }
  };

  const winProbData = [
    { name: "Home", value: result.homeTeam.winProbability, color: "hsl(109, 100%, 54%)" }, // Primary green
    { name: "Draw", value: result.drawProbability, color: "hsl(120, 10%, 65%)" }, // Muted
    { name: "Away", value: result.awayTeam.winProbability, color: "hsl(0, 100%, 50%)" }, // Destructive/Red
  ];

  const scorelinesData = result.topScorelines.slice(0, 5).map(s => ({
    name: `${s.home} - ${s.away}`,
    prob: s.probability
  }));

  const riskColors = {
    low: "text-green-500 border-green-500 bg-green-500/10",
    medium: "text-yellow-500 border-yellow-500 bg-yellow-500/10",
    high: "text-red-500 border-red-500 bg-red-500/10"
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/50 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-foreground">SIMULATION RESULTS</h1>
          <p className="text-muted-foreground font-mono mt-1">Iterations: {result.simulationIterations.toLocaleString()}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setLocation("/")} className="border-primary/50 text-primary hover:bg-primary/10">
            <ArrowLeft className="w-4 h-4 mr-2" /> NEW SIM
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            <Save className="w-4 h-4 mr-2" /> SAVE
          </Button>
        </div>
      </div>

      {/* Match Header */}
      <div className="flex justify-between items-center bg-card/50 border border-border/50 p-8 rounded-lg glow-border">
        <div className="text-center w-1/3">
          <h2 className="text-2xl font-bold tracking-wider">{input.homeTeam.name}</h2>
          <p className="text-muted-foreground font-mono mt-2">{input.homeTeam.formation}</p>
        </div>
        <div className="text-center w-1/3">
          <div className="text-xl font-bold text-primary font-mono glow-text">VS</div>
          <div className="text-sm text-muted-foreground mt-2 uppercase">{input.weather.replace('_', ' ')}</div>
        </div>
        <div className="text-center w-1/3">
          <h2 className="text-2xl font-bold tracking-wider">{input.awayTeam.name}</h2>
          <p className="text-muted-foreground font-mono mt-2">{input.awayTeam.formation}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Win Probabilities */}
        <Card className="bg-card/50 border-border/50 glow-border col-span-1 md:col-span-2">
          <CardHeader><CardTitle className="tracking-widest">OUTCOME PROBABILITIES</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="w-1/2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={winProbData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {winProbData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`${val.toFixed(1)}%`, 'Probability']} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-4">
              {winProbData.map(d => (
                <div key={d.name} className="flex justify-between items-center border-b border-border/30 pb-2">
                  <span className="font-mono text-muted-foreground">{d.name}</span>
                  <span className="font-bold text-xl" style={{ color: d.color }}>{d.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expected Goals */}
        <Card className="bg-card/50 border-border/50 glow-border">
          <CardHeader><CardTitle className="tracking-widest">EXPECTED GOALS</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary glow-text">{result.expectedTotalGoals.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">TOTAL xG</div>
            </div>
            <div className="flex justify-between">
              <div className="text-center">
                <div className="text-xl font-bold">{result.homeTeam.avgGoals.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground font-mono">HOME</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{result.awayTeam.avgGoals.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground font-mono">AWAY</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Bet Recommendations */}
        <Card className="bg-card/50 border-border/50 glow-border">
          <CardHeader><CardTitle className="tracking-widest flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> ALGORITHMIC RECOMMENDATIONS</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {result.betRecommendations.map((bet, i) => (
              <div key={i} className={`p-4 border rounded-lg ${riskColors[bet.risk]}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold tracking-wider">{bet.recommendation}</div>
                    <div className="text-xs font-mono opacity-80 mt-1">MARKET: {bet.market}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono">{bet.confidence.toFixed(1)}%</div>
                    <div className="text-[10px] uppercase tracking-widest mt-1 opacity-80">{bet.risk} RISK</div>
                  </div>
                </div>
                <p className="text-sm opacity-90 mt-2 border-t border-current/20 pt-2">{bet.reasoning}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Goals Market */}
        <Card className="bg-card/50 border-border/50 glow-border">
          <CardHeader><CardTitle className="tracking-widest flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> MARKETS & SCORELINE</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-mono"><span className="text-muted-foreground">OVER 2.5</span> <span>{result.goalsMarket.over25.toFixed(1)}%</span></div>
                <div className="flex justify-between text-sm font-mono"><span className="text-muted-foreground">UNDER 2.5</span> <span>{result.goalsMarket.under25.toFixed(1)}%</span></div>
                <div className="flex justify-between text-sm font-mono"><span className="text-muted-foreground">BTTS</span> <span>{result.goalsMarket.btts.toFixed(1)}%</span></div>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scorelinesData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'monospace' }} />
                    <Tooltip formatter={(val: number) => [`${val.toFixed(1)}%`, 'Prob']} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Bar dataKey="prob" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="text-sm text-primary font-mono mb-2">FORMATION ADVANTAGE</div>
              <p className="text-sm text-muted-foreground">{result.formationAdvantage.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
