import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { topics, getFieldNames, getCompany, getUniversity } from "@/data";
import type { Topic } from "@/data/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  ListOrdered,
  Info,
  Camera,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Rich Text Toolbar (visual only – stores as plain text for now)    */
/* ------------------------------------------------------------------ */
function RichTextToolbar() {
  const btnCls =
    "h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors";
  return (
    <div className="flex items-center gap-0.5 border-b border-border px-2 py-1">
      <button type="button" className={btnCls} title="Bold"><Bold className="h-3.5 w-3.5" /></button>
      <button type="button" className={btnCls} title="Italic"><Italic className="h-3.5 w-3.5" /></button>
      <button type="button" className={btnCls} title="Underline"><Underline className="h-3.5 w-3.5" /></button>
      <button type="button" className={btnCls} title="Link"><Link className="h-3.5 w-3.5" /></button>
      <Separator orientation="vertical" className="h-4 mx-1" />
      <button type="button" className={btnCls} title="Bullet list"><List className="h-3.5 w-3.5" /></button>
      <button type="button" className={btnCls} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rich Text Area                                                     */
/* ------------------------------------------------------------------ */
function RichTextArea({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="rounded-lg border border-input bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      <RichTextToolbar />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CV Upload Component                                                */
/* ------------------------------------------------------------------ */
function CvUpload({
  fileName,
  onFileSelect,
  onClear,
}: {
  fileName: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  if (fileName) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <span className="text-sm text-foreground truncate flex-1">{fileName}</span>
        <button type="button" onClick={onClear} className="text-muted-foreground hover:text-destructive">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-6 cursor-pointer transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40 hover:bg-accent/30"
      )}
    >
      <Upload className="h-5 w-5 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm text-foreground">
          <span className="font-medium text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">PDF preferred · Max 10 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Topic Summary Card                                                 */
/* ------------------------------------------------------------------ */
function TopicSummaryCard({ topic }: { topic: Topic }) {
  const owner = topic.companyId
    ? getCompany(topic.companyId)?.name
    : getUniversity(topic.universityId ?? "")?.name;
  const fieldNames = getFieldNames(topic.fieldIds);

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your thesis topic
        </h3>
        <Badge variant="secondary" className="text-xs">Topic selected</Badge>
      </div>
      <div>
        <p className="text-base font-semibold text-foreground leading-snug">{topic.title}</p>
        {owner && (
          <p className="text-sm text-muted-foreground mt-0.5">{owner}</p>
        )}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {topic.description}
      </p>
      {fieldNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {fieldNames.map((f) => (
            <Badge key={f} variant="outline" className="text-xs font-normal">{f}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function TopicApplicationPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const topic = topics.find((t) => t.id === topicId);

  // Form state
  const [motivation, setMotivation] = useState("");
  const [availability, setAvailability] = useState("");
  const [schedulingUrl, setSchedulingUrl] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing application data
  useEffect(() => {
    if (!currentUser || !topicId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("topic_applications")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("topic_id", topicId)
          .maybeSingle();
        if (data) {
          setMotivation((data as any).motivation || "");
          setAvailability((data as any).availability || "");
          setSchedulingUrl((data as any).scheduling_url || "");
          setCvFileName((data as any).cv_file_name || "");
        }
      } catch (e) {
        console.error("Failed to load application:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [currentUser, topicId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!motivation.trim()) errs.motivation = "Motivation is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async (status: "draft" | "submitted") => {
    if (status === "submitted" && !validate()) return;
    if (!currentUser || !topicId) return;

    setIsSaving(true);
    try {
      // Upload CV if a new file was selected
      let cvPath = "";
      let finalCvName = cvFileName;
      if (cvFile) {
        const path = `applications/${currentUser.id}/${topicId}/${cvFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("chat-files")
          .upload(path, cvFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        cvPath = path;
        finalCvName = cvFile.name;
      }

      const payload: Record<string, any> = {
        user_id: currentUser.id,
        topic_id: topicId,
        motivation,
        availability,
        scheduling_url: schedulingUrl,
        status,
        updated_at: new Date().toISOString(),
      };
      if (cvPath) {
        payload.cv_file_path = cvPath;
        payload.cv_file_name = finalCvName;
      }

      const { error } = await supabase
        .from("topic_applications")
        .upsert(payload, { onConflict: "user_id,topic_id" });
      if (error) throw error;

      toast.success(status === "draft" ? "Draft saved" : "Application submitted!");
      if (status === "submitted") {
        navigate("/topics");
      }
    } catch (e: any) {
      console.error("Save failed:", e);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!topic) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Topic not found.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 space-y-8">
            {/* Section 1: Topic Summary */}
            <TopicSummaryCard topic={topic} />

            <Separator />

            {/* Section 2: About You */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">About you</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tell us about yourself and your academic background.
                  </p>
                </div>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback className="text-lg">
                      {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* CV Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">CV</Label>
              <CvUpload
                fileName={cvFileName}
                onFileSelect={(file) => {
                  setCvFile(file);
                  setCvFileName(file.name);
                }}
                onClear={() => {
                  setCvFile(null);
                  setCvFileName("");
                }}
              />
            </div>

            {/* Motivation */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium">
                  Motivation <span className="text-destructive">*</span>
                </Label>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <RichTextArea
                value={motivation}
                onChange={setMotivation}
                placeholder="Briefly describe your academic interests, why this topic matters to you, and what kind of guidance you are looking for."
                rows={6}
              />
              {errors.motivation && (
                <p className="text-xs text-destructive">{errors.motivation}</p>
              )}
            </div>

            {/* Availability */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium">
                  Availability for a first call{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <RichTextArea
                value={availability}
                onChange={setAvailability}
                placeholder="Share your preferred days, time windows, time zone, and anything important for scheduling."
                rows={4}
              />
            </div>

            {/* Scheduling URL */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Scheduling URL{" "}
                <span className="text-muted-foreground font-normal">(Calendly or similar)</span>
              </Label>
              <Input
                value={schedulingUrl}
                onChange={(e) => setSchedulingUrl(e.target.value)}
                placeholder="https://calendly.com/your-name"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-border px-6 sm:px-8 py-4 flex items-center justify-between bg-muted/20">
            <Button variant="ghost" onClick={() => navigate(-1)} disabled={isSaving}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => save("draft")}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save draft
              </Button>
              <Button
                onClick={() => save("submitted")}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
