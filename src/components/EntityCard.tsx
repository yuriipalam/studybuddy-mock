import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface EntityCardProps {
  name: string;
  avatar: string;
  subtitle: string;
  secondaryText?: string;
  tags: string[];
  onClick?: () => void;
}

export function EntityCard({ name, avatar, subtitle, secondaryText, tags, onClick }: EntityCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex flex-col items-center text-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatar} />
            <AvatarFallback>{name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{name}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            {secondaryText && (
              <p className="text-xs text-muted-foreground">{secondaryText}</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
