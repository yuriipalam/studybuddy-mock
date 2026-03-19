import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockUser } from "@/data/mockUser";
import { Sparkles, Users, BookOpen, FileText, Video, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ActionCard = {
  title: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  action: "navigate" | "external";
  path: string;
};

const actionCards: ActionCard[] = [
  { title: "AI Topic Finder", description: "Get AI-powered topic suggestions", icon: Sparkles, color: "bg-primary/10 text-primary", action: "navigate", path: "/topics" },
  { title: "Find Experts", description: "Connect with industry experts", icon: Users, color: "bg-emerald-100 text-emerald-700", action: "navigate", path: "/people/experts" },
  { title: "Discover Topics", description: "Browse available thesis topics", icon: BookOpen, color: "bg-amber-100 text-amber-700", action: "navigate", path: "/topics" },
  { title: "Propose Topic", description: "Submit your own research idea", icon: FileText, color: "bg-rose-100 text-rose-700", action: "navigate", path: "/topics" },
  { title: "Videos", description: "Watch expert talks and tutorials", icon: Video, color: "bg-sky-100 text-sky-700", action: "external", path: "https://www.youtube.com/playlist?list=PLb9ITwylb5mYB6oni61mV0FrYU4AS8ntt" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const handleCardClick = (card: ActionCard) => {
    if (card.action === "external") {
      window.open(card.path, "_blank", "noopener,noreferrer");
    } else {
      navigate(card.path);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{greeting}, {mockUser.name.split(" ")[0]}! ☕</h1>
        <p className="text-muted-foreground mt-1">What would you like to do today?</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {actionCards.map((card) => (
          <Card
            key={card.title}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => handleCardClick(card)}
          >
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div className={`p-3 rounded-xl ${card.color} transition-transform group-hover:scale-110`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{card.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">My favorite topics</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bookmark className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No items</h3>
            <p className="text-sm text-muted-foreground mb-4">Bookmark topics to see them here</p>
            <Button onClick={() => navigate("/topics")}>Explore all topics</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
