import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRunSimulation, SimulationInput } from "@workspace/api-client-react";
import { useSimulationStore } from "@/lib/simulation-store";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Sun, CloudRain, Wind, Snowflake, Flame, Activity } from "lucide-react";

const teamSchema = z.object({
  name: z.string().min(1, "Required"),
  xgFor: z.coerce.number().min(0),
  xgAgainst: z.coerce.number().min(0),
  shotsOnTargetFor: z.coerce.number().min(0),
  shotsOnTargetAgainst: z.coerce.number().min(0),
  avgCorners: z.coerce.number().min(0),
  avgYellowCards: z.coerce.number().min(0),
  avgRedCards: z.coerce.number().min(0),
  avgFouls: z.coerce.number().min(0),
  formation: z.string().min(1, "Required"),
  color: z.enum(["green", "yellow", "red"]),
  injuryFactor: z.coerce.number().min(0).max(1),
});

const formSchema = z.object({
  homeTeam: teamSchema,
  awayTeam: teamSchema,
  referee: z.object({
    name: z.string().min(1, "Required"),
    severity: z.enum(["low", "medium", "high"]),
    avgCardsPerMatch: z.coerce.number().min(0),
  }),
  weather: z.enum(["clear", "rain", "wind", "snow", "extreme_heat"]),
});

const FORMATIONS = [
  "4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3", 
  "5-3-2", "4-1-4-1", "4-5-1", "4-3-2-1", "3-4-2-1", 
  "4-4-1-1", "4-3-1-2", "5-4-1", "3-6-1", "4-6-0"
];

const WEATHER_ICONS = {
  clear: Sun,
  rain: CloudRain,
  wind: Wind,
  snow: Snowflake,
  extreme_heat: Flame,
};

const DEFAULT_TEAM = {
  name: "",
  xgFor: 1.5,
  xgAgainst: 1.2,
  shotsOnTargetFor: 4.5,
  shotsOnTargetAgainst: 4.0,
  avgCorners: 5.5,
  avgYellowCards: 2.0,
  avgRedCards: 0.1,
  avgFouls: 11.5,
  formation: "4-3-3",
  color: "yellow" as const,
  injuryFactor: 1.0,
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { setSimulationData } = useSimulationStore();
  const runSim = useRunSimulation();
  const [isSimulating, setIsSimulating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      homeTeam: { ...DEFAULT_TEAM, name: "Home Team" },
      awayTeam: { ...DEFAULT_TEAM, name: "Away Team" },
      referee: {
        name: "Ref Name",
        severity: "medium",
        avgCardsPerMatch: 4.5,
      },
      weather: "clear",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSimulating(true);
    try {
      const result = await runSim.mutateAsync({ data: values as SimulationInput });
      setSimulationData(values as SimulationInput, result);
      setLocation("/results");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSimulating(false);
    }
  };

  if (isSimulating) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-8 animate-pulse">
        <Activity className="w-24 h-24 text-primary animate-spin-slow glow-text" />
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-widest text-primary glow-text">RUNNING 10,000 SIMULATIONS</h2>
          <p className="text-muted-foreground font-mono">CALCULATING BAYESIAN INFERENCE... APPLYING POISSON REGRESSION...</p>
        </div>
      </div>
    );
  }

  const renderTeamSection = (prefix: "homeTeam" | "awayTeam", title: string) => (
    <Card className="bg-card/50 backdrop-blur border-border/50 glow-border transition-all">
      <CardHeader>
        <CardTitle className="text-xl tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name={`${prefix}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl><Input {...field} className="font-mono bg-background/50 border-border/50 focus:border-primary glow-border" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name={`${prefix}.xgFor`} render={({ field }) => (
            <FormItem><FormLabel>xG For</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="font-mono" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name={`${prefix}.xgAgainst`} render={({ field }) => (
            <FormItem><FormLabel>xG Against</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="font-mono" /></FormControl></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name={`${prefix}.shotsOnTargetFor`} render={({ field }) => (
            <FormItem><FormLabel>Shots on Target For</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="font-mono" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name={`${prefix}.shotsOnTargetAgainst`} render={({ field }) => (
            <FormItem><FormLabel>Shots on Target Against</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="font-mono" /></FormControl></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name={`${prefix}.avgCorners`} render={({ field }) => (
            <FormItem><FormLabel>Avg Corners</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="font-mono" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name={`${prefix}.avgFouls`} render={({ field }) => (
            <FormItem><FormLabel>Avg Fouls</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="font-mono" /></FormControl></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name={`${prefix}.avgYellowCards`} render={({ field }) => (
            <FormItem><FormLabel>Avg Yellows</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="font-mono" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name={`${prefix}.avgRedCards`} render={({ field }) => (
            <FormItem><FormLabel>Avg Reds</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="font-mono" /></FormControl></FormItem>
          )} />
        </div>

        <FormField control={form.control} name={`${prefix}.formation`} render={({ field }) => (
          <FormItem>
            <FormLabel>Formation</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger className="font-mono"><SelectValue placeholder="Select formation" /></SelectTrigger></FormControl>
              <SelectContent>
                {FORMATIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        <FormField control={form.control} name={`${prefix}.color`} render={({ field }) => (
          <FormItem>
            <FormLabel>Team Form</FormLabel>
            <div className="flex gap-4">
              {["green", "yellow", "red"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => field.onChange(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    field.value === c ? 'border-primary scale-110 shadow-[0_0_10px_rgba(57,255,20,0.5)]' : 'border-transparent opacity-50'
                  } ${c === 'green' ? 'bg-green-500' : c === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}
                />
              ))}
            </div>
          </FormItem>
        )} />

        <FormField control={form.control} name={`${prefix}.injuryFactor`} render={({ field }) => (
          <FormItem>
            <FormLabel className="flex justify-between">
              <span>Squad Fitness</span>
              <span className="font-mono text-primary">{(Number(field.value) * 100).toFixed(0)}%</span>
            </FormLabel>
            <FormControl>
              <Slider
                min={0} max={1} step={0.05}
                value={[Number(field.value)]}
                onValueChange={(v) => field.onChange(v[0])}
                className="py-4"
              />
            </FormControl>
          </FormItem>
        )} />
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-end border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-foreground">SIMULATION PARAMETERS</h1>
          <p className="text-muted-foreground font-mono mt-1">Configure match variables for Monte Carlo execution</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {renderTeamSection("homeTeam", "HOME TEAM")}
            {renderTeamSection("awayTeam", "AWAY TEAM")}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-card/50 backdrop-blur border-border/50 glow-border transition-all">
              <CardHeader><CardTitle className="text-xl tracking-wider">REFEREE</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="referee.name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} className="font-mono" /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="referee.severity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="font-mono"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="referee.avgCardsPerMatch" render={({ field }) => (
                    <FormItem><FormLabel>Avg Cards</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="font-mono" /></FormControl></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50 glow-border transition-all">
              <CardHeader><CardTitle className="text-xl tracking-wider">ENVIRONMENT</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="weather" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weather Conditions</FormLabel>
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {(Object.keys(WEATHER_ICONS) as Array<keyof typeof WEATHER_ICONS>).map((w) => {
                        const Icon = WEATHER_ICONS[w];
                        return (
                          <div
                            key={w}
                            onClick={() => field.onChange(w)}
                            className={`flex flex-col items-center justify-center p-3 rounded border cursor-pointer transition-all ${
                              field.value === w 
                                ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(57,255,20,0.2)]' 
                                : 'border-border/50 text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            <Icon className="w-6 h-6 mb-2" />
                            <span className="text-[10px] uppercase font-mono text-center">{w.replace('_', ' ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </div>

          <div className="pt-8">
            <Button type="submit" size="lg" className="w-full text-xl tracking-widest h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] transition-all">
              INITIALIZE SIMULATION
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
