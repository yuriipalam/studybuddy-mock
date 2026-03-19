import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left panel */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Input placeholder="Search conversations..." />
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              You currently have no active chats.
            </p>
            <p className="text-sm text-primary cursor-pointer hover:underline mt-1" onClick={() => navigate("/people/experts")}>
              Click here to connect to experts.
            </p>
          </div>
        </ScrollArea>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="border-0 shadow-none">
          <CardContent className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No chat selected.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
