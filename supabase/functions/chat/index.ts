import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_DATA = `
## Platform Overview
Studyond is a three-sided marketplace connecting Students, Companies, and Universities around real-world thesis topics, research projects, and talent sourcing in Switzerland. The platform hosts 7,500+ topics, 200+ companies, 44+ Swiss universities, and 1,680+ study programs.

## Available Thesis Topics (Sample)
1. "AI-Driven Demand Forecasting for Perishable Goods" — Nestlé, Expert: Laura Fischer. Fields: Data Science, AI. MSc.
2. "Circular Packaging Design Assessment Framework" — Nestlé, Expert: Philippe Dubois. Fields: Sustainability, Supply Chain Management. MSc.
3. "Biomarker Discovery Using Multi-Omics Data Integration" — Roche, Expert: Nadia Kessler. Fields: Biotechnology, Healthcare. MSc/PhD.
4. "Digital Twin for Collaborative Robot Work Cells" — ABB, Expert: Sven Eriksson. Fields: Mechanical Engineering, Electrical Engineering. MSc.
5. "Federated Learning for Telecom Network Optimization" — Swisscom, Expert: Marco Bentivoglio. Fields: Computer Science, AI. MSc.
6. "Predictive Maintenance for Rolling Stock Using IoT Data" — SBB, Expert: Patrick Zollinger. Fields: Data Science, Computer Science. MSc.
7. "Climate Risk Modeling with Alternative Data Sources" — Swiss Re, Expert: Julian Kraft. Fields: Data Science, Finance. MSc.
8. "Generative Models for Molecular Lead Optimization" — Novartis, Expert: Rahel Ammann. Fields: AI, Biotechnology. MSc/PhD.
9. "BIM-Integrated IoT Monitoring for Construction Site Safety" — Hilti, Expert: Reto Huber. Fields: Computer Science, Mechanical Engineering. MSc.
10. "Sustainable Cocoa Supply Chain Traceability" — Bühler Group, Expert: Jonas Beerli. Fields: Supply Chain Management, Sustainability. MSc.

## Supervisor Topics (Sample)
31. "Verification of Neural Network Robustness" — Prof. Dr. Martin Vechev, ETH Zurich. Fields: Computer Science, AI.
32. "Simulation-Driven Topology Optimization for Additive Manufacturing" — Prof. Dr. Sibylle Hechberger, ETH Zurich. Fields: Mechanical Engineering.
33. "Privacy-Preserving Health Data Analytics" — Prof. Dr. Carmela Troncoso, EPFL. Fields: Computer Science, Data Science.
34. "Computational Protein Design for Therapeutic Antibodies" — Prof. Dr. Bruno Correia, EPFL. Fields: Biotechnology, AI.
35. "Consumer Adoption of Autonomous Mobility Services" — Prof. Dr. Andreas Herrmann, HSG. Fields: Marketing, Business Administration.

## Industry Experts (Sample)
- Laura Fischer — Nestlé, Head of Data Science. Fields: Data Science, AI.
- Nadia Kessler — Roche, Principal Scientist, Computational Biology. Fields: Biotechnology, Healthcare.
- Sven Eriksson — ABB, VP Robotics R&D. Fields: Mechanical Engineering, Electrical Engineering.
- Marco Bentivoglio — Swisscom, Head of ML Engineering. Fields: Computer Science, AI.
- Patrick Zollinger — SBB, Head of Data Analytics & AI. Fields: Data Science, Computer Science.
- Julian Kraft — Swiss Re, Chief Data Officer. Fields: Data Science, Finance.
- Rahel Ammann — Novartis, Director of AI in Drug Discovery. Fields: AI, Biotechnology.

## Supervisors (Sample)
- Prof. Dr. Martin Vechev — ETH Zurich. Research: reliable AI, automated reasoning, program synthesis.
- Prof. Dr. Carmela Troncoso — EPFL. Research: privacy engineering, security analytics.
- Prof. Dr. Andreas Herrmann — University of St. Gallen. Research: consumer behavior, digital marketing, autonomous mobility.
- Prof. Dr. Abraham Bernstein — University of Zurich. Research: knowledge graphs, semantic web, human-AI collaboration.
- Prof. Dr. Thomas Stocker — University of Bern. Research: climate modeling, paleoclimatology, carbon cycle dynamics.

## Companies (Sample)
- Nestlé — 10,001+ employees. Domains: Consumer Goods, Food & Beverage.
- Roche — 10,001+ employees. Domains: Pharma & Healthcare, Biotechnology.
- ABB — 10,001+ employees. Domains: Industrial Technology, Energy.
- Swisscom — 5,001-10,000 employees. Domains: Telecommunications, IT Services.
- SBB — 10,001+ employees. Domains: Transportation, Logistics.
- Swiss Re — 5,001-10,000 employees. Domains: Insurance, Financial Services.
- Novartis — 10,001+ employees. Domains: Pharma & Healthcare.
- Hilti — 5,001-10,000 employees. Domains: Construction, Industrial Technology.
- Bühler Group — 5,001-10,000 employees. Domains: Food Processing, Manufacturing.
- On Running — 1,001-5,000 employees. Domains: Sportswear, Consumer Goods.

## Universities
ETH Zurich, EPFL, University of St. Gallen (HSG), University of Zurich, University of Bern, University of Basel, ZHAW, FHNW, OST, USI.

## Fields of Study
Engineering & Technology, Computer Science & Information Systems, Natural Sciences, Life Sciences & Biotechnology, Medicine & Healthcare, Environmental & Earth Sciences, Agriculture & Food Sciences, Energy & Sustainability, Mathematics & Statistics, Manufacturing & Production, Logistics & Supply Chain, Education & Training, Business & Management, Finance & Economics, Marketing & Communication, Social Sciences, Law & Public Policy, HR & Organizational Development, Humanities & Arts, Architecture & Design.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const systemPrompt = `You are the **Topic Suggestion Agent** for Studyond — a three-sided marketplace connecting students, companies, and universities around thesis topics and research in Switzerland.

## Your Role
You are a smart, proactive thesis advisor. Your primary job is to help students discover the best thesis topics, supervisors, and industry connections based on their profile and interests.

## Current User
- **Name**: Luca Meier
- **Degree**: MSc Computer Science at ETH Zurich
- **Skills**: Python, machine learning, distributed systems, Kubernetes
- **Interests**: AI and Computer Science
- **Objectives**: Finding a thesis topic and career start
- **About**: MSc Computer Science student at ETH Zurich, specializing in machine learning systems. Currently exploring thesis topics around efficient inference for large language models. Previously interned at Google Zurich.

## Behavior Guidelines

1. **Be proactive**: If the user's profile lacks information (e.g. empty "About me", no skills, unclear interests), gently ask them to provide more details. You can suggest they update their profile in Settings.
2. **Give specific recommendations**: When suggesting topics, always reference actual topics from the data with expert/supervisor names, companies, and fields.
3. **Explain your reasoning**: Tell the user WHY a topic is a good match for them based on their skills and interests.
4. **Be encouraging**: Thesis students are often anxious. Be supportive and confidence-building.
5. **Use rich formatting**: Use markdown headers, bullet points, bold text, and structured layouts. Keep responses well-organized.
6. **Ask clarifying questions** when needed: What specific area of CS interests them most? Do they prefer industry or academic supervision? Do they want an internship component?
7. **Cross-reference data**: Connect topics with relevant supervisors and experts. Suggest networking paths.
8. **Keep responses focused**: Don't dump all data at once. Curate 3-5 most relevant items per response.

## Important Rules
- Do NOT include Luca in lists of students
- Always ground your answers in the actual platform data below
- If asked about something outside the platform's scope, acknowledge it but redirect to how the platform can help

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
