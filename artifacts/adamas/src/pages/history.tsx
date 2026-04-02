import { useGetBettingHistory, useDeleteBettingHistory, getGetBettingHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Activity, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const { data, isLoading } = useGetBettingHistory({ query: { queryKey: getGetBettingHistoryQueryKey() } });
  const deleteHistory = useDeleteBettingHistory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      await deleteHistory.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetBettingHistoryQueryKey() });
      toast({ title: "Deleted", description: "Entry removed from history." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete entry.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Activity className="w-12 h-12 text-primary animate-spin-slow glow-text" />
      </div>
    );
  }

  const entries = data?.entries || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-3xl font-bold tracking-widest text-foreground">SIMULATION ARCHIVE</h1>
        <p className="text-muted-foreground font-mono mt-1">Historical prediction logs</p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border/50 rounded-lg bg-card/20">
          <div className="w-16 h-16 rounded-full bg-black/50 border border-border/50 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold tracking-widest text-muted-foreground">NO RECORDS FOUND</h3>
          <p className="text-muted-foreground font-mono mt-2">Run a simulation and save it to populate the archive.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-2">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(entry.createdAt), "MMM dd, yyyy HH:mm")}
                  </div>
                  <div className="flex items-center gap-4 text-xl font-bold tracking-wider">
                    <span className="flex-1 text-right">{entry.homeTeamName}</span>
                    <span className="text-primary font-mono text-sm glow-text">VS</span>
                    <span className="flex-1 text-left">{entry.awayTeamName}</span>
                  </div>
                  
                  <div className="flex justify-center gap-8 text-sm font-mono mt-4 pt-4 border-t border-border/30">
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1">HOME</div>
                      <div className="text-green-500">{entry.homeWinProb.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1">DRAW</div>
                      <div className="text-yellow-500">{entry.drawProb.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1">AWAY</div>
                      <div className="text-red-500">{entry.awayWinProb.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-3 bg-black/20 p-4 rounded-md border border-border/30">
                  <div className="text-xs text-primary font-mono mb-1 tracking-widest">RECOMMENDATION</div>
                  <div className="font-bold text-sm tracking-wider">{entry.betRecommendation || "N/A"}</div>
                  {entry.betConfidence && (
                    <div className="flex justify-between items-center text-xs font-mono mt-2">
                      <span className="text-muted-foreground">CONFIDENCE</span>
                      <span className="text-primary">{entry.betConfidence.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute top-4 right-4 md:relative md:top-auto md:right-auto text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
