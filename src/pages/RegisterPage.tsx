import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import studyondLogo from "@/assets/studyond.svg";
import studyondLogoLight from "@/assets/studyond-light.svg";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Invalid email address").max(255),
  role: z.enum(["student", "supervisor"]),
  university: z.string().trim().min(1, "University is required").max(200),
});

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("student");
  const [university, setUniversity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === "dark" ? studyondLogoLight : studyondLogo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse({ firstName, lastName, email, role, university });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const avatarSeed = result.data.firstName;
      const { data: inserted, error } = await supabase.from("user_accounts").insert({
        first_name: result.data.firstName,
        last_name: result.data.lastName,
        email: result.data.email,
        role: result.data.role,
        university: result.data.university,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
      } as any).select().single();

      if (error) {
        if (error.code === "23505") {
          setErrors({ email: "This email is already registered" });
        } else {
          throw error;
        }
        return;
      }

      // Store the newly created account for onboarding auto-login
      if (inserted) {
        localStorage.setItem("studyond-pending-user", JSON.stringify({
          id: inserted.id,
          firstName: inserted.first_name,
          lastName: inserted.last_name,
          email: inserted.email,
          role: inserted.role,
          avatar: inserted.avatar,
          university: (inserted as any).university,
        }));
      }

      toast.success("Account created!");
      navigate("/onboarding");
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img src={logo} alt="StudyOnd" className="h-8" />
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Fill in your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Luca"
                  maxLength={50}
                />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Meier"
                  maxLength={50}
                />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="luca.meier@student.ethz.ch"
                maxLength={255}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="ETH Zurich"
                maxLength={200}
              />
              {errors.university && <p className="text-xs text-destructive">{errors.university}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">I am a</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")} className="text-primary underline hover:text-primary/80">
                Sign in
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
