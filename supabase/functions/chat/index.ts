import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Embedded platform data ──────────────────────────────────────────

const TOPICS = [
  { id: "topic-01", title: "AI-Driven Demand Forecasting for Perishable Goods", description: "Develop a machine learning model to predict demand for short-shelf-life products across Nestlé's European distribution network.", type: "topic", degrees: ["msc"], fieldIds: ["field-02"], companyId: "company-01", expertIds: ["expert-01"], supervisorIds: [], employment: "open", employmentType: "working_student", workplaceType: "hybrid" },
  { id: "topic-02", title: "Circular Packaging Design Assessment Framework", description: "Create a quantitative framework for evaluating environmental impact of alternative packaging materials.", type: "topic", degrees: ["msc"], fieldIds: ["field-08","field-11"], companyId: "company-01", expertIds: ["expert-02"], supervisorIds: [], employment: "no", employmentType: null, workplaceType: null },
  { id: "topic-03", title: "Biomarker Discovery Using Multi-Omics Data Integration", description: "Apply computational biology methods to integrate transcriptomic, proteomic, and metabolomic datasets for identifying novel biomarkers in oncology.", type: "topic", degrees: ["msc","phd"], fieldIds: ["field-04","field-05"], companyId: "company-02", expertIds: ["expert-03"], supervisorIds: [], employment: "yes", employmentType: "internship", workplaceType: "on_site" },
  { id: "topic-04", title: "Wearable-Based Patient Monitoring for Clinical Trials", description: "Design and evaluate a digital health pipeline that ingests data from consumer wearables for decentralized clinical trials.", type: "job", degrees: ["msc"], fieldIds: ["field-05","field-02"], companyId: "company-02", expertIds: ["expert-04"], supervisorIds: [], employment: "yes", employmentType: "graduate_program", workplaceType: "hybrid" },
  { id: "topic-05", title: "Digital Twin for Collaborative Robot Work Cells", description: "Build a simulation-based digital twin of a collaborative robot work cell using ABB's RobotStudio platform.", type: "topic", degrees: ["msc"], fieldIds: ["field-01"], companyId: "company-03", expertIds: ["expert-05"], supervisorIds: [], employment: "open", employmentType: "internship", workplaceType: "on_site" },
  { id: "topic-06", title: "Edge AI for Industrial Quality Inspection", description: "Develop and benchmark computer vision models that run on edge devices for real-time quality inspection in manufacturing.", type: "job", degrees: ["msc"], fieldIds: ["field-02"], companyId: "company-03", expertIds: ["expert-06"], supervisorIds: [], employment: "yes", employmentType: "working_student", workplaceType: "on_site" },
  { id: "topic-07", title: "Federated Learning for Telecom Network Optimization", description: "Investigate how federated learning can optimize Swisscom's mobile network without centralizing sensitive user data.", type: "topic", degrees: ["msc"], fieldIds: ["field-02"], companyId: "company-04", expertIds: ["expert-07"], supervisorIds: ["supervisor-01"], employment: "yes", employmentType: "working_student", workplaceType: "hybrid" },
  { id: "topic-08", title: "Platform Ecosystem Strategy for Swiss SME Digitalization", description: "Analyze how Swisscom can design a digital platform ecosystem to accelerate digitalization among Swiss SMEs.", type: "topic", degrees: ["msc"], fieldIds: ["field-13","field-15"], companyId: "company-04", expertIds: ["expert-08"], supervisorIds: [], employment: "no", employmentType: null, workplaceType: null },
  { id: "topic-09", title: "Predictive Maintenance for Rolling Stock Using IoT Data", description: "Design a predictive maintenance model for SBB train bogies using sensor telemetry from onboard IoT systems.", type: "job", degrees: ["msc"], fieldIds: ["field-02"], companyId: "company-05", expertIds: ["expert-09"], supervisorIds: [], employment: "yes", employmentType: "internship", workplaceType: "on_site" },
  { id: "topic-10", title: "Carbon Footprint Optimization of Swiss Rail Freight", description: "Develop a decision-support tool that optimizes routing and scheduling of SBB freight operations to minimize carbon emissions.", type: "topic", degrees: ["msc"], fieldIds: ["field-08","field-06"], companyId: "company-05", expertIds: ["expert-10"], supervisorIds: [], employment: "no", employmentType: null, workplaceType: null },
  { id: "topic-11", title: "Climate Risk Modeling with Alternative Data Sources", description: "Explore how satellite imagery, social-media sentiment, and IoT weather stations can enhance Swiss Re's catastrophe risk models.", type: "topic", degrees: ["msc"], fieldIds: ["field-02","field-14"], companyId: "company-06", expertIds: ["expert-11"], supervisorIds: [], employment: "open", employmentType: "internship", workplaceType: "hybrid" },
  { id: "topic-12", title: "Explainable AI for Insurance Underwriting", description: "Develop interpretable ML models for automating insurance underwriting decisions while meeting regulatory transparency requirements.", type: "topic", degrees: ["msc"], fieldIds: ["field-02","field-14"], companyId: "company-06", expertIds: ["expert-12"], supervisorIds: [], employment: "yes", employmentType: "working_student", workplaceType: "hybrid" },
  { id: "topic-13", title: "Generative Models for Molecular Lead Optimization", description: "Apply generative deep learning models to optimize drug candidate molecules for potency, selectivity, and ADMET properties.", type: "topic", degrees: ["msc","phd"], fieldIds: ["field-02","field-04"], companyId: "company-07", expertIds: ["expert-13"], supervisorIds: [], employment: "yes", employmentType: "internship", workplaceType: "on_site" },
  { id: "topic-14", title: "Real-World Evidence Analytics for Drug Repositioning", description: "Mine real-world clinical data to identify opportunities for repositioning existing Novartis drugs for new therapeutic indications.", type: "topic", degrees: ["msc"], fieldIds: ["field-05","field-02"], companyId: "company-07", expertIds: ["expert-14"], supervisorIds: [], employment: "no", employmentType: null, workplaceType: null },
  { id: "topic-15", title: "BIM-Integrated IoT Monitoring for Construction Site Safety", description: "Design and prototype an IoT-based safety monitoring system that integrates with BIM models to detect hazards on construction sites in real time.", type: "topic", degrees: ["msc"], fieldIds: ["field-02","field-01"], companyId: "company-08", expertIds: ["expert-15"], supervisorIds: [], employment: "open", employmentType: "working_student", workplaceType: "on_site" },
  { id: "topic-16", title: "Autonomous Drilling Optimization Using Reinforcement Learning", description: "Apply reinforcement learning to optimize drilling parameters in real time, reducing tool wear and improving precision for Hilti's cordless tools.", type: "topic", degrees: ["msc"], fieldIds: ["field-01","field-02"], companyId: "company-08", expertIds: ["expert-16"], supervisorIds: [], employment: "yes", employmentType: "internship", workplaceType: "on_site" },
  { id: "topic-17", title: "Sustainable Cocoa Supply Chain Traceability", description: "Design a blockchain- or IoT-based traceability system for Bühler Group's cocoa processing supply chain.", type: "topic", degrees: ["msc"], fieldIds: ["field-11","field-08"], companyId: "company-09", expertIds: ["expert-17"], supervisorIds: [], employment: "open", employmentType: "working_student", workplaceType: "hybrid" },
  { id: "topic-18", title: "Energy-Efficient Drying Processes in Food Manufacturing", description: "Model and optimize energy consumption in industrial grain drying using physics-informed ML.", type: "topic", degrees: ["msc"], fieldIds: ["field-08","field-07"], companyId: "company-09", expertIds: ["expert-18"], supervisorIds: [], employment: "no", employmentType: null, workplaceType: null },
  { id: "topic-19", title: "Biomechanical Gait Analysis for Running Shoe Personalization", description: "Use motion capture and pressure sensor data to develop a personalized shoe recommendation engine for On Running.", type: "topic", degrees: ["msc"], fieldIds: ["field-01","field-02"], companyId: "company-10", expertIds: ["expert-19"], supervisorIds: [], employment: "yes", employmentType: "internship", workplaceType: "on_site" },
  { id: "topic-20", title: "Sustainable Material Innovation in Performance Footwear", description: "Evaluate bio-based and recycled materials for running shoe components, balancing performance metrics with environmental impact.", type: "topic", degrees: ["msc","bsc"], fieldIds: ["field-08","field-01"], companyId: "company-10", expertIds: ["expert-20"], supervisorIds: [], employment: "open", employmentType: null, workplaceType: null },
  { id: "topic-31", title: "Verification of Neural Network Robustness", description: "Develop formal methods to verify that deep neural networks are robust against adversarial perturbations.", type: "topic", degrees: ["msc","phd"], fieldIds: ["field-02"], companyId: null, expertIds: [], supervisorIds: ["supervisor-01"], employment: "no", employmentType: null, workplaceType: null },
  { id: "topic-32", title: "Simulation-Driven Topology Optimization for Additive Manufacturing", description: "Explore topology optimization for lightweight structures using FEA with manufacturing constraints for 3D printing.", type: "topic", degrees: ["msc"], fieldIds: ["field-01"], companyId: null, expertIds: [], supervisorIds: ["supervisor-02"], employment: "no", employmentType: null, workplaceType: null },
  { id: "topic-33", title: "Privacy-Preserving Health Data Analytics", description: "Design privacy-preserving ML systems for health data analysis using differential privacy and secure computation.", type: "topic", degrees: ["msc","phd"], fieldIds: ["field-02","field-05"], companyId: null, expertIds: [], supervisorIds: ["supervisor-03"], employment: "no", employmentType: null, workplaceType: null },
  { id: "topic-34", title: "Computational Protein Design for Therapeutic Antibodies", description: "Apply computational methods to design protein sequences with desired binding properties for therapeutic antibodies.", type: "topic", degrees: ["msc","phd"], fieldIds: ["field-04","field-02"], companyId: null, expertIds: [], supervisorIds: ["supervisor-04"], employment: "no", employmentType: null, workplaceType: null },
  { id: "topic-35", title: "Consumer Adoption of Autonomous Mobility Services", description: "Study consumer attitudes and adoption barriers for autonomous transportation services in Swiss cities.", type: "topic", degrees: ["msc"], fieldIds: ["field-15","field-13"], companyId: null, expertIds: [], supervisorIds: ["supervisor-05"], employment: "no", employmentType: null, workplaceType: null },
];

const FIELDS: Record<string, string> = {
  "field-01": "Engineering & Technology", "field-02": "Computer Science & Information Systems",
  "field-03": "Natural Sciences", "field-04": "Life Sciences & Biotechnology",
  "field-05": "Medicine & Healthcare", "field-06": "Environmental & Earth Sciences",
  "field-07": "Agriculture & Food Sciences", "field-08": "Energy & Sustainability",
  "field-09": "Mathematics & Statistics", "field-10": "Manufacturing & Production",
  "field-11": "Logistics & Supply Chain", "field-12": "Education & Training",
  "field-13": "Business & Management", "field-14": "Finance & Economics",
  "field-15": "Marketing & Communication", "field-16": "Social Sciences",
  "field-17": "Law & Public Policy", "field-18": "HR & Organizational Development",
  "field-19": "Humanities & Arts", "field-20": "Architecture & Design",
};

const COMPANIES: Record<string, string> = {
  "company-01": "Nestlé", "company-02": "Roche", "company-03": "ABB",
  "company-04": "Swisscom", "company-05": "SBB", "company-06": "Swiss Re",
  "company-07": "Novartis", "company-08": "Hilti", "company-09": "Bühler Group",
  "company-10": "On Running",
};

const EXPERTS: Record<string, string> = {
  "expert-01": "Laura Fischer", "expert-02": "Philippe Dubois", "expert-03": "Nadia Kessler",
  "expert-04": "Thomas Meier", "expert-05": "Sven Eriksson", "expert-06": "Lukas Hofmann",
  "expert-07": "Marco Bentivoglio", "expert-08": "Simone Brandt", "expert-09": "Patrick Zollinger",
  "expert-10": "Andrea Kofler", "expert-11": "Julian Kraft", "expert-12": "Christina Vogt",
  "expert-13": "Rahel Ammann", "expert-14": "Florian Roth", "expert-15": "Reto Huber",
  "expert-16": "Dominik Tschuor", "expert-17": "Jonas Beerli", "expert-18": "Helen Gerber",
  "expert-19": "Martin Steiner", "expert-20": "Sophie Anderegg",
};

const SUPERVISORS: Record<string, string> = {
  "supervisor-01": "Prof. Dr. Martin Vechev", "supervisor-02": "Prof. Dr. Sibylle Hechberger",
  "supervisor-03": "Prof. Dr. Carmela Troncoso", "supervisor-04": "Prof. Dr. Bruno Correia",
  "supervisor-05": "Prof. Dr. Andreas Herrmann",
};

// ── Tool definitions ────────────────────────────────────────────────

const TOOLS = [
  {
    name: "search_topics",
    description: "Search available thesis topics on the Studyond platform. Use this whenever the user asks about available topics, wants topic suggestions, or is looking for thesis ideas. Returns enriched topic data with company, expert, supervisor, and field names.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords describing what the user is looking for" },
        field_ids: { type: "array", items: { type: "string" }, description: "Optional filter by field IDs (e.g. field-02 for CS)" },
        degree: { type: "string", enum: ["bsc", "msc", "phd"], description: "Optional filter by required degree" },
        max_results: { type: "number", description: "Maximum number of results to return (default 5)" },
      },
      required: ["query"],
    },
  },
];

function searchTopics(params: { query: string; field_ids?: string[]; degree?: string; max_results?: number }) {
  const max = params.max_results ?? 5;
  let results = [...TOPICS];

  // Filter by degree
  if (params.degree) {
    results = results.filter(t => t.degrees.includes(params.degree!));
  }

  // Filter by field
  if (params.field_ids?.length) {
    results = results.filter(t => t.fieldIds.some(f => params.field_ids!.includes(f)));
  }

  // Simple keyword search in title + description
  const keywords = params.query.toLowerCase().split(/\s+/).filter(Boolean);
  if (keywords.length > 0) {
    results = results.map(t => {
      const text = `${t.title} ${t.description}`.toLowerCase();
      const fieldText = t.fieldIds.map(f => FIELDS[f] || "").join(" ").toLowerCase();
      const companyText = (t.companyId ? COMPANIES[t.companyId] || "" : "").toLowerCase();
      const fullText = `${text} ${fieldText} ${companyText}`;
      const score = keywords.reduce((s, kw) => s + (fullText.includes(kw) ? 1 : 0), 0);
      return { ...t, score };
    }).filter(t => (t as any).score > 0).sort((a, b) => (b as any).score - (a as any).score);
  }

  return results.slice(0, max).map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    type: t.type,
    degrees: t.degrees,
    fields: t.fieldIds.map(f => FIELDS[f]).filter(Boolean),
    company: t.companyId ? COMPANIES[t.companyId] : null,
    experts: t.expertIds.map(e => EXPERTS[e]).filter(Boolean),
    supervisors: t.supervisorIds.map(s => SUPERVISORS[s]).filter(Boolean),
    employment: t.employment,
    employmentType: t.employmentType,
    workplaceType: t.workplaceType,
  }));
}

// ── Main handler ────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProfile } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const userSection = userProfile
      ? `## Current User Profile (live from their settings)\n${userProfile}`
      : `## Current User\nName: Luca Meier\nDegree: MSc Computer Science at ETH Zurich\nSkills: Python, machine learning, distributed systems, Kubernetes`;

    const systemPrompt = `You are the **Topic Suggestion Agent** for Studyond — a three-sided marketplace connecting students, companies, and universities around thesis topics and research in Switzerland.

## Your Role
You are a smart, proactive thesis advisor. Your primary job is to help students discover the best thesis topics, supervisors, and industry connections based on their profile and interests.

${userSection}

## Behavior Guidelines

1. **Be proactive**: If the user's profile lacks information, gently ask them to provide more details.
2. **Give specific recommendations**: Always reference actual topics with expert/supervisor names, companies, and fields.
3. **Explain your reasoning**: Tell the user WHY a topic is a good match based on their skills and interests.
4. **Be encouraging**: Thesis students are often anxious. Be supportive.
5. **Always use Markdown formatting**: Structure every response with markdown — use headers (##, ###), bullet points, numbered lists, **bold**, *italics*, code blocks, and tables where appropriate. Never output plain unformatted text.
6. **Ask clarifying questions** when needed.
7. **Cross-reference data**: Connect topics with relevant supervisors and experts.
8. **Keep responses focused**: Curate 3-5 most relevant items per response.
9. **Consider preferences**: Pay attention to the user's signals.
10. **Profile completeness**: Encourage filling it out for better recommendations.

## CRITICAL: Using the search_topics Tool

**You MUST use the search_topics tool** whenever the user asks about available topics, wants suggestions, or is looking for thesis ideas. Do NOT list topics from memory alone.

After receiving tool results, you MUST include a topic card block in your response using this exact format:

:::topics
[{"id":"topic-01","title":"Topic Title","company":"Company Name","fields":["Field 1"],"degrees":["msc"],"employment":"open","employmentType":"working_student","workplaceType":"hybrid"}]
:::

Rules for the topic card block:
- Place it AFTER your introductory text explaining why these topics match
- Include ALL topics from the search results that you mention
- The JSON must be valid and on a single line between the markers
- Each object must have: id, title, company (string or null), fields (array), degrees (array), employment, employmentType, workplaceType
- Continue with additional commentary/analysis AFTER the block
- You can include multiple :::topics blocks if organizing topics into categories

## Important Rules
- Do NOT include the current user in lists of students
- Always ground your answers in the actual platform data
- If asked about something outside scope, redirect to how the platform can help`;

    // ── Step 1: Initial Claude call with tools ──

    const apiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const firstResponse = await fetch("https://api.anthropic.com/v1/messages", {
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
        messages: apiMessages,
        tools: TOOLS,
      }),
    });

    if (!firstResponse.ok) {
      const status = firstResponse.status;
      const text = await firstResponse.text();
      console.error("Anthropic API error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstResult = await firstResponse.json();

    // Check if Claude wants to use a tool
    const toolUseBlock = firstResult.content?.find((b: any) => b.type === "tool_use");

    if (!toolUseBlock) {
      // No tool call — stream a simple response
      // Re-do the call with streaming for consistent UX
      const streamResponse = await fetch("https://api.anthropic.com/v1/messages", {
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
          messages: apiMessages,
          stream: true,
        }),
      });

      if (!streamResponse.ok || !streamResponse.body) {
        return new Response(JSON.stringify({ error: "AI service error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return streamAnthropicResponse(streamResponse);
    }

    // ── Step 2: Execute the tool ──

    const toolName = toolUseBlock.name;
    const toolInput = toolUseBlock.input;
    let toolResult: any;

    if (toolName === "search_topics") {
      toolResult = searchTopics(toolInput);
    } else {
      toolResult = { error: `Unknown tool: ${toolName}` };
    }

    // Collect any text blocks from the first response to include as context
    const prefixTexts = firstResult.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    // ── Step 3: Send tool result back to Claude for final response (streaming) ──

    const messagesWithToolResult = [
      ...apiMessages,
      { role: "assistant", content: firstResult.content },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult),
          },
        ],
      },
    ];

    const finalResponse = await fetch("https://api.anthropic.com/v1/messages", {
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
        messages: messagesWithToolResult,
        stream: true,
      }),
    });

    if (!finalResponse.ok || !finalResponse.body) {
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If there was prefix text from before the tool call, prepend it
    return streamAnthropicResponse(finalResponse, prefixTexts || undefined);

  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function streamAnthropicResponse(response: Response, prefixText?: string) {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // Send prefix text if any
      if (prefixText) {
        const chunk = JSON.stringify({ choices: [{ delta: { content: prefixText } }] });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      }

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
}
