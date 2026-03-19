import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, PREDEFINED_ACCOUNTS } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import studyondLogo from "@/assets/studyond.svg";
import studyondLogoLight from "@/assets/studyond-light.svg";

export default function LoginPage() {
  const [selectedId, setSelectedId] = useState<string>("");
  const { login } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const logo = resolvedTheme === "dark" ? studyondLogoLight : studyondLogo;

  const selectedAccount = PREDEFINED_ACCOUNTS.find((a) => a.id === selectedId);

  const handleLogin = () => {
    if (selectedId) {
      login(selectedId);
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img src={logo} alt="StudyOnd" className="h-8" />
          </div>
          <CardTitle className="text-2xl">Welcome to StudyOnd</CardTitle>
          <CardDescription>Select an account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button variant="outline" className="w-full" onClick={() => navigate("/register")}>
            Register
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or sign in</span>
            </div>
          </div>

          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an account…" />
            </SelectTrigger>
            <SelectContent>
              {PREDEFINED_ACCOUNTS.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <span>{account.firstName} {account.lastName}</span>
                    <Badge variant="outline" className="text-xs capitalize">{account.role}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAccount && (
            <div className="flex items-center gap-4 rounded-lg border border-border p-4 bg-muted/30">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedAccount.avatar} />
                <AvatarFallback>{selectedAccount.firstName[0]}{selectedAccount.lastName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{selectedAccount.firstName} {selectedAccount.lastName}</p>
                <p className="text-sm text-muted-foreground truncate">{selectedAccount.email}</p>
                <Badge variant="secondary" className="mt-1 text-xs capitalize">{selectedAccount.role}</Badge>
              </div>
            </div>
          )}

          <Button onClick={handleLogin} disabled={!selectedId} className="w-full">
            Sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
