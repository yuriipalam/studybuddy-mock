import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUser } from "@/data/mockUser";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="ds-title-lg">My Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="ds-title-sm">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={mockUser.avatar} />
              <AvatarFallback>LM</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">Change photo</Button>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input defaultValue="Luca" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input defaultValue="Meier" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={mockUser.email} type="email" />
          </div>
          <div className="space-y-2">
            <Label>University</Label>
            <Input defaultValue={mockUser.university} />
          </div>
          <div className="space-y-2">
            <Label>Field of Study</Label>
            <Input defaultValue={mockUser.field} />
          </div>
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
