import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STAGE_CONTEXT: Record<string, string> = {
  "/": "The student is on the home dashboard. They might not know where to start their thesis journey.",
  "/topics": "The student is browsing thesis topics. They might be overwhelmed by choices or unsure what fits their profile.",
  "/people/experts": "The student is looking at industry experts. They might be hesitant about reaching out or unsure who to contact.",
  "/people/supervisors": "The student is browsing supervisors. They might be anxious about finding the right academic supervisor.",
  "/organizations/companies": "The student is looking at companies. They might be considering an industry thesis but unsure how to approach companies.",
  "/projects": "The student is on the projects page. They might be struggling with project planning or execution.",
  "/messages": "The student is in the messaging section. They might be procrastinating on reaching out to people.",
  "/settings": "The student is in settings. They might be avoiding actual thesis work by tweaking their profile.",
  "/jobs": "The student is browsing jobs. They might be distracted from their thesis by career anxiety.",
  "/organizations/universities": "The student is browsing universities. They might be exploring options or feeling lost.",
  "/organizations/study-programs": "The student is looking at study programs. They might be second-guessing their academic path.",
};

const THESIS_STAGES = `
The Thesis Journey stages:
1. Orientation Stage – figuring out what you want to do
2. Topic and Supervisor Search – finding the right topic and academic supervisor
3. Planning Stage – methodology, timeline, milestones
4. Execution Stage – doing the actual research/work
5. Writing and Finalization – writing up and defending

Building blocks: Finding a Topic · Finding a Supervisor · Company Partner · Interview Partners · Data Access · Methodology · Timeline and Milestones · Literature · Mentor and Feedback
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentPage, userProfile, idleSeconds } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const stageContext = STAGE_CONTEXT[currentPage] || `The student is on page: ${currentPage}. They seem to be exploring.`;

    const systemPrompt = `You are a cheeky, slightly sarcastic thesis buddy built into the StudyOnd platform. You give ONE short floating advice nugget (1-2 sentences max) to students who seem stuck.

## Your personality:
- Slightly sarcastic but ultimately supportive — like a witty best friend who's already done their thesis
- You use casual language, sometimes humor
- You NEVER sound like a corporate chatbot or life coach
- You occasionally roast the student gently for procrastinating
- You're self-aware that you're an AI popping up uninvited

## Rules:
- ONLY output the advice text. No quotes, no labels, no markdown, no emojis overload.
- Keep it to 1-2 sentences. Be punchy.
- Reference their actual situation (what page they're on, how long they've been idle)
- Sometimes be practical ("Hey, that supervisor's research matches your ML skills"), sometimes motivational-sarcastic ("Your thesis won't write itself. Well, technically I could, but that's not the point.")
- Vary your tone — don't always start the same way
- If they're on settings/jobs, gently call out the procrastination

${THESIS_STAGES}

## Current situation:
${stageContext}
The student has been idle for approximately ${idleSeconds} seconds.
${userProfile ? `Student profile: ${userProfile}` : "No detailed profile available."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Give me a short, context-aware advice nudge for this student right now." },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const advice = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ advice }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("thesis-advice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
