import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
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
  { title: "AI Topic Finder", description: "Get AI-powered topic suggestions", icon: Sparkles, color: "bg-ai text-white", action: "navigate", path: "/topics" },
  { title: "Find Experts", description: "Connect with industry experts", icon: Users, color: "bg-secondary text-secondary-foreground", action: "navigate", path: "/people/experts" },
  { title: "Discover Topics", description: "Browse available thesis topics", icon: BookOpen, color: "bg-secondary text-secondary-foreground", action: "navigate", path: "/topics" },
  { title: "Propose Topic", description: "Submit your own research idea", icon: FileText, color: "bg-secondary text-secondary-foreground", action: "navigate", path: "/topics" },
  { title: "Videos", description: "Watch expert talks and tutorials", icon: Video, color: "bg-secondary text-secondary-foreground", action: "external", path: "https://www.youtube.com/playlist?list=PLb9ITwylb5mYB6oni61mV0FrYU4AS8ntt" },
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
    <div className="scroll-area">
      <div className="scroll-area-content space-y-8">
        <div>
          <h1 className="ds-title-lg">{greeting}, {currentUser?.firstName ?? "there"}! ☕</h1>
          <p className="ds-body text-muted-foreground mt-1">What would you like to do today?</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {actionCards.map((card) => (
            <Card
              key={card.title}
              className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardClick(card)}
            >
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${card.color} transition-transform duration-300 group-hover:scale-105`}>
                  <card.icon className="size-6" />
                </div>
                <div>
                  <h3 className="ds-label">{card.title}</h3>
                  <p className="ds-caption text-muted-foreground mt-1">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="ds-title-sm mb-4">My favorite topics</h2>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bookmark className="size-10 text-muted-foreground mb-3" />
              <h3 className="ds-label mb-1">No items</h3>
              <p className="ds-small text-muted-foreground mb-4">Bookmark topics to see them here</p>
              <Button onClick={() => navigate("/topics")}>Explore all topics</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
