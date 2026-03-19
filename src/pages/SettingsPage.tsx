import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, X } from "lucide-react";
import { mockUser } from "@/data/mockUser";
import { fields, universities, studyPrograms, getUniversity, getStudyProgram } from "@/data";
import { toast } from "sonner";

const DEGREE_OPTIONS = [
  { value: "bsc", label: "Bachelor" },
  { value: "msc", label: "Master" },
  { value: "phd", label: "PhD" },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const INTERNSHIP_OPTIONS = [
  { value: "yes", label: "I definitely want an internship" },
  { value: "open", label: "I'm open to an internship" },
  { value: "no", label: "I don't want an internship" },
];

export default function SettingsPage() {
  const [firstName, setFirstName] = useState("Luca");
  const [lastName, setLastName] = useState("Meier");
  const [selectedFields, setSelectedFields] = useState<string[]>(["field-02"]);
  const [about, setAbout] = useState("");
  const [degree, setDegree] = useState("msc");
  const [studyProgram, setStudyProgram] = useState("Computer Science");
  const [startMonth, setStartMonth] = useState("Sep");
  const [startYear, setStartYear] = useState("2023");
  const [skills, setSkills] = useState("Python, machine learning, distributed systems, Kubernetes");

  // Signals
  const [topicSignal, setTopicSignal] = useState(true);
  const [supervisionSignal, setSupervisionSignal] = useState(true);
  const [careerStartSignal, setCareerStartSignal] = useState(true);
  const [internship, setInternship] = useState("yes");
  const [profileVisible, setProfileVisible] = useState(true);

  // Preferences
  const [notifyNewTopic, setNotifyNewTopic] = useState(true);
  const [notifyNewJob, setNotifyNewJob] = useState(true);

  const addField = (fieldId: string) => {
    if (selectedFields.length >= 3 || selectedFields.includes(fieldId)) return;
    setSelectedFields([...selectedFields, fieldId]);
  };

  const removeField = (fieldId: string) => {
    setSelectedFields(selectedFields.filter((f) => f !== fieldId));
  };

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="ds-title-lg">Settings</h1>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-0">
          {["Account", "Profile", "Preferences"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase()}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1 text-sm font-medium"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Account Tab ── */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="ds-title-sm">Account</CardTitle>
              <CardDescription>
                If you have multiple profiles, these account settings are shared across all your profiles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={mockUser.avatar} />
                    <AvatarFallback>LM</AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-accent transition-colors">
                    <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fields</Label>
                <p className="text-xs text-muted-foreground">Choose up to 3 fields that match your academic or professional focus.</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedFields.map((fId) => {
                    const field = fields.find((f) => f.id === fId);
                    return (
                      <Badge key={fId} variant="secondary" className="gap-1 pr-1">
                        {field?.name}
                        <button onClick={() => removeField(fId)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
                {selectedFields.length < 3 && (
                  <Select onValueChange={addField}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Add a field..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fields
                        .filter((f) => !selectedFields.includes(f.id))
                        .map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>About me</Label>
                <Textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="What others should know to engage and collaborate with you"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="ds-title-sm">Student profile</CardTitle>
                <CardDescription>
                  Define or see what you are looking for. These appear as actions or batches on your public user profile.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">Preview</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Student profile address</Label>
                <div className="flex items-center gap-3">
                  <Input value={mockUser.email} disabled className="flex-1" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">ETH Zurich</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Select value={degree} onValueChange={setDegree}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREE_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Study program</Label>
                  <Input value={studyProgram} onChange={(e) => setStudyProgram(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={startMonth} onValueChange={setStartMonth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={startYear} onValueChange={setStartYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => String(2020 + i)).map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>End date (or expected)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => String(2024 + i)).map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
                <Textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Enter your skills"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="ds-title-sm">Education</CardTitle>
              <Button variant="outline" size="sm">Add</Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">ETH</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">ETH Zurich</span>
                    <Badge variant="secondary" className="text-xs">Student profile</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>Computer Science</span>
                    <Badge variant="outline" className="text-xs">Master</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">Sep 2023 - Ongoing</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signals */}
          <Card>
            <CardHeader>
              <CardTitle className="ds-title-sm">Signals</CardTitle>
              <CardDescription>
                Define or see what you are looking for. These appear as actions or batches on your public user profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">User profile visibility</p>
                  <p className="text-xs text-muted-foreground">Your profile is visible to all students, experts and supervisors as long as you have an active signal.</p>
                </div>
                <span className="text-sm font-medium">{profileVisible ? "Visible" : "Hidden"}</span>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Topic</p>
                    <p className="text-xs text-muted-foreground">Find a meaningful thesis topic aligned with my interests.</p>
                  </div>
                  <Switch checked={topicSignal} onCheckedChange={setTopicSignal} />
                </div>
                {topicSignal && (
                  <div className="ml-4 mt-3 space-y-4 border-l-2 border-border pl-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Ideal timeframe</p>
                        <p className="text-xs text-muted-foreground">Indicate your ideal timeframe for thesis writing.</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs">(Begin date, End date)</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Internship</p>
                        <p className="text-xs text-muted-foreground">How about pursuing an internship in the context of thesis writing?</p>
                      </div>
                      <Select value={internship} onValueChange={setInternship}>
                        <SelectTrigger className="w-[260px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INTERNSHIP_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Supervision</p>
                  <p className="text-xs text-muted-foreground">Connect with academic supervisors who can guide my research.</p>
                </div>
                <Switch checked={supervisionSignal} onCheckedChange={setSupervisionSignal} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Career Start</p>
                  <p className="text-xs text-muted-foreground">Show that you graduate soon, looking for a job.</p>
                </div>
                <Switch checked={careerStartSignal} onCheckedChange={setCareerStartSignal} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Preferences Tab ── */}
        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="ds-title-sm">Notifications</CardTitle>
              <CardDescription>Define on what notifications you would like to get informed via email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">New Topic</p>
                  <p className="text-xs text-muted-foreground">Get notification email when a new topic matching your fields is published.</p>
                </div>
                <Switch checked={notifyNewTopic} onCheckedChange={setNotifyNewTopic} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">New Job</p>
                  <p className="text-xs text-muted-foreground">Get notification email when a new job matching your fields is published.</p>
                </div>
                <Switch checked={notifyNewJob} onCheckedChange={setNotifyNewJob} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="ds-title-sm">Display</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-xs text-muted-foreground">Select your user language.</p>
                </div>
                <Select defaultValue="en">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
