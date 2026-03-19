import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_DATA = `
## Available Thesis Topics
1. "Machine Learning for Predictive Maintenance in Railway Systems" — Company: SBB CFF FFS, Contact: Dr. Maria Keller, Fields: Machine Learning, Transportation, IoT. Develop ML models to predict railway component failures using sensor data.
2. "Quantum Computing Applications in Particle Physics Simulation" — Company: CERN, Contact: Prof. Jean-Pierre Dubois, Fields: Quantum Computing, Physics, HPC. Explore quantum algorithms for accelerating Monte Carlo simulations.
3. "Advanced Filtration Membranes Using Nano-Materials" — Company: Sefar AG, Contact: Dr. Thomas Brunner, Fields: Materials Science, Nanotechnology, Chemistry. Develop next-gen filtration membranes with nano-materials.
4. "Sustainable Energy Storage Solutions for Smart Grids" — Company: ABB Switzerland, Contact: Ing. Sarah Weber, Fields: Energy, Electrical Engineering, Sustainability. Design novel energy storage for smart grid infrastructure.
5. "Natural Language Processing for Multilingual Legal Document Analysis" — Company: Swiss Re, Contact: Dr. Lisa Meier, Fields: NLP, AI, Legal Tech. Build NLP pipelines for analyzing legal documents across DE/FR/IT/EN.
6. "Computer Vision for Autonomous Drone Navigation in Alpine Environments" — University: ETH Zurich, Contact: Prof. Andreas Müller, Fields: Computer Vision, Robotics, AI. Develop CV algorithms for drone navigation in alpine terrain.

## Industry Experts
- Dr. Maria Keller — SBB CFF FFS, Head of Data Science, PhD Computer Science (ETH Zurich). Fields: Machine Learning, Transportation.
- Prof. Jean-Pierre Dubois — CERN, Senior Researcher, PhD Physics (EPFL). Fields: Quantum Computing, Physics.
- Dr. Thomas Brunner — Sefar AG, R&D Manager, PhD Chemistry (University of Basel). Fields: Materials Science, Nanotechnology.
- Ing. Sarah Weber — ABB Switzerland, Principal Engineer, MSc Electrical Engineering (ETH Zurich). Fields: Energy, Electrical Engineering.
- Dr. Lisa Meier — Swiss Re, AI Research Lead, PhD AI (University of Zurich). Fields: NLP, AI.
- Dr. Marco Rossi — Roche, Data Scientist, PhD Bioinformatics (ETH Zurich). Fields: Bioinformatics, Data Science.
- Dr. Anna Schmidt — Google Zurich, Engineering Manager, PhD Computer Science (TU Munich). Fields: Software Engineering, Cloud Computing.
- Dr. Peter Huber — Novartis, Research Director, PhD Pharma (University of Basel). Fields: Pharma, Biotech.

## Supervisors
- Prof. Andreas Müller — ETH Zurich, Full Professor. Fields: Robotics, AI.
- Prof. Clara Hoffmann — EPFL, Associate Professor. Fields: Quantum Computing, Physics.
- Prof. Robert Lang — University of Zurich, Full Professor. Fields: NLP, AI.
- Prof. Elena Bianchi — ETH Zurich, Assistant Professor. Fields: Materials Science, Chemistry.
- Prof. Martin Steiner — University of Bern, Full Professor. Fields: Energy, Sustainability.
- Prof. Yuki Tanaka — EPFL, Associate Professor. Fields: Computer Vision, Robotics.
- Prof. Laura Frei — University of Basel, Full Professor. Fields: Bioinformatics, Data Science.
- Prof. Stefan Vogel — ETH Zurich, Full Professor. Fields: Software Engineering, Cloud Computing.

## Students on the Platform
- Lena Fischer — ETH Zurich, Computer Science, Master
- Noah Müller — EPFL, Physics, Master
- Sophie Martin — University of Zurich, Data Science, Bachelor
- Lukas Schmid — ETH Zurich, Mechanical Engineering, Master
- Emma Keller — University of Bern, Biology, Master
- Julian Brunner — EPFL, Electrical Engineering, Bachelor
- Mia Weber — ETH Zurich, AI, Master
- David Huber — University of Basel, Chemistry, Master

## Available Jobs
1. "Research Internship — Accelerator Physics" — CERN, Internship. Fields: Physics, Engineering.
2. "Data Science Working Student" — SBB CFF FFS, Working Student. Fields: Data Science, Transportation.
3. "Software Engineering Intern — Cloud Platform" — ABB Switzerland, Internship. Fields: Software Engineering, Cloud Computing.
4. "Research Assistant — Robotics Lab" — ETH Zurich, Research Assistant. Fields: Robotics, AI, Mechanical Engineering.
5. "UX Design Intern" — Swiss Re, Internship. Fields: Design, UX Research.
6. "Materials Testing Lab Technician" — Sefar AG, Part-time. Fields: Materials Science, Quality Assurance.

## Industry Partners
- SBB CFF FFS — 30,000+ employees, 12 experts, 5 open topics. Fields: Transportation, Data Science.
- CERN — 17,000+ employees, 24 experts, 14 open topics. Fields: Physics, Engineering.
- ABB Switzerland — 10,000+ employees, 8 experts, 6 open topics. Fields: Electrical Engineering, Energy.
- Sefar AG — 2,500+ employees, 3 experts, 2 open topics. Fields: Materials Science, Chemistry.
- Swiss Re — 14,000+ employees, 6 experts, 4 open topics. Fields: Insurance, AI.
- Roche — 100,000+ employees, 15 experts, 10 open topics. Fields: Pharma, Biotech.
- Google Zurich — 5,000+ employees, 10 experts, 8 open topics. Fields: Software Engineering, AI.
- Novartis — 78,000+ employees, 11 experts, 7 open topics. Fields: Pharma, Data Science.

## Study Programs
- MSc Computer Science — ETH Zurich, 450 active students
- MSc Physics — EPFL, 180 active students
- MSc Data Science — University of Zurich, 220 active students
- BSc Mechanical Engineering — ETH Zurich, 380 active students
- MSc Electrical Engineering — EPFL, 160 active students
- MSc Biology — University of Bern, 140 active students
- MSc Chemistry — University of Basel, 120 active students
- MSc Robotics — ETH Zurich, 95 active students
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const systemPrompt = `You are the AI assistant for Studyond, a platform connecting students with thesis topics, industry experts, supervisors, and jobs.

You have full access to the platform's current data. Use it to give accurate, specific answers. When users ask about topics, experts, jobs, etc., reference the actual data below.

The current user is Alex Johnson, a Computer Science Master student at ETH Zurich. Do NOT include Alex in lists of students.

Keep answers clear, well-structured, and use markdown formatting. Use bullet points, bold text, and headers when helpful.

${PLATFORM_DATA}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("Anthropic API error:", status, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              try {
                const event = JSON.parse(jsonStr);
                if (event.type === "content_block_delta" && event.delta?.text) {
                  const chunk = JSON.stringify({
                    choices: [{ delta: { content: event.delta.text } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
