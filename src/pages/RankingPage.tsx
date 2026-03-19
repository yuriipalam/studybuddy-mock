import { Trophy } from "lucide-react";

const RankingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <Trophy className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">My Ranking</h1>
      <p className="text-muted-foreground">Your ranking details will appear here.</p>
    </div>
  );
};

export default RankingPage;
