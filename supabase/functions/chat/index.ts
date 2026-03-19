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

const SUPERVISORS = [
  { id: "supervisor-01", firstName: "Martin", lastName: "Vechev", title: "Prof. Dr.", universityId: "uni-01", researchInterests: ["reliable AI", "automated reasoning", "program synthesis"], about: "Full professor at ETH Zurich leading research on building reliable and trustworthy AI systems.", objectives: ["student_matching", "research_collaboration"], fieldIds: ["field-02"] },
  { id: "supervisor-02", firstName: "Sibylle", lastName: "Hechberger", title: "Prof. Dr.", universityId: "uni-01", researchInterests: ["computational mechanics", "digital twins", "additive manufacturing", "structural optimization"], about: "I lead the Computational Mechanics group at ETH Zurich, focusing on simulation-driven design and digital twin technologies.", objectives: ["student_matching", "research_collaboration", "funding_access"], fieldIds: ["field-01", "field-02"] },
  { id: "supervisor-03", firstName: "Carmela", lastName: "Troncoso", title: "Prof. Dr.", universityId: "uni-02", researchInterests: ["privacy engineering", "security analytics", "machine learning for security"], about: "Associate professor at EPFL heading the SPRING lab. Co-designed the DP-3T protocol.", objectives: ["student_matching", "network_expansion"], fieldIds: ["field-02"] },
  { id: "supervisor-04", firstName: "Bruno", lastName: "Correia", title: "Prof. Dr.", universityId: "uni-02", researchInterests: ["computational protein design", "synthetic biology", "machine learning for drug discovery"], about: null, objectives: ["research_collaboration", "funding_access"], fieldIds: ["field-04", "field-02"] },
  { id: "supervisor-05", firstName: "Jean-Philippe", lastName: "Bonardi", title: "Prof. Dr.", universityId: "uni-02", researchInterests: ["climate policy", "energy transition", "environmental economics"], about: "Full professor at EPFL and director of the Enterprise for Society Center (E4S).", objectives: ["student_matching", "research_collaboration", "network_expansion"], fieldIds: ["field-08", "field-06", "field-14"] },
  { id: "supervisor-06", firstName: "Andreas", lastName: "Herrmann", title: "Prof. Dr.", universityId: "uni-03", researchInterests: ["consumer behavior", "digital marketing", "autonomous mobility"], about: "Director of the Institute for Customer Insight at the University of St. Gallen.", objectives: ["student_matching", "project_management"], fieldIds: ["field-15", "field-13"] },
  { id: "supervisor-07", firstName: "Miriam", lastName: "Meckel", title: "Prof. Dr.", universityId: "uni-03", researchInterests: ["digital transformation", "media economics", "AI ethics"], about: null, objectives: ["student_matching", "network_expansion"], fieldIds: ["field-15", "field-02"] },
  { id: "supervisor-08", firstName: "Wolfgang", lastName: "Stölzle", title: "Prof. Dr.", universityId: "uni-03", researchInterests: ["logistics management", "supply chain resilience", "smart mobility"], about: "Chair of Logistics Management at HSG with over 20 years of experience.", objectives: ["research_collaboration", "network_expansion", "project_management"], fieldIds: ["field-11", "field-13"] },
  { id: "supervisor-09", firstName: "Abraham", lastName: "Bernstein", title: "Prof. Dr.", universityId: "uni-04", researchInterests: ["knowledge graphs", "semantic web", "human-AI collaboration"], about: "Professor of Informatics at the University of Zurich and co-director of the Digital Society Initiative.", objectives: ["student_matching", "research_collaboration"], fieldIds: ["field-02"] },
  { id: "supervisor-10", firstName: "Lena", lastName: "Doppel", title: "Prof. Dr.", universityId: "uni-04", researchInterests: ["behavioral economics", "decision-making under uncertainty", "experimental methods"], about: "Associate professor at the University of Zurich specializing in behavioral and experimental economics.", objectives: ["student_matching", "funding_access"], fieldIds: ["field-14", "field-16"] },
  { id: "supervisor-11", firstName: "Isabelle", lastName: "Stadelmann-Steffen", title: "Prof. Dr.", universityId: "uni-05", researchInterests: ["political behavior", "climate policy", "direct democracy"], about: "Full professor of Comparative Politics at the University of Bern.", objectives: ["research_collaboration", "funding_access"], fieldIds: ["field-17", "field-08"] },
  { id: "supervisor-12", firstName: "Thomas", lastName: "Stocker", title: "Prof. Dr.", universityId: "uni-05", researchInterests: ["climate modeling", "paleoclimatology", "carbon cycle dynamics"], about: "Professor of Climate and Environmental Physics at the University of Bern and former co-chair of IPCC Working Group I.", objectives: ["student_matching", "research_collaboration", "network_expansion"], fieldIds: ["field-06", "field-08"] },
  { id: "supervisor-13", firstName: "Torsten", lastName: "Schwede", title: "Prof. Dr.", universityId: "uni-06", researchInterests: ["structural bioinformatics", "protein modeling", "computational biology"], about: null, objectives: ["student_matching", "research_collaboration"], fieldIds: ["field-04", "field-02"] },
  { id: "supervisor-14", firstName: "Claudia", lastName: "Buser", title: "Prof. Dr.", universityId: "uni-06", researchInterests: ["pharmaceutical innovation", "drug regulation", "health economics"], about: "Associate professor at the University of Basel researching the economics of pharmaceutical innovation.", objectives: ["network_expansion", "project_management"], fieldIds: ["field-05", "field-14"] },
  { id: "supervisor-15", firstName: "Georg", lastName: "von Krogh", title: "Prof. Dr.", universityId: "uni-06", researchInterests: ["digital business models", "technology management", "open innovation"], about: null, objectives: ["student_matching", "research_collaboration"], fieldIds: ["field-13", "field-02"] },
  { id: "supervisor-16", firstName: "Elena", lastName: "Gavagnin", title: "Prof. Dr.", universityId: "uni-07", researchInterests: ["natural language processing", "multilingual AI", "corpus linguistics"], about: "Professor at ZHAW's Institute of Applied Information Technology.", objectives: ["student_matching", "project_management"], fieldIds: ["field-02", "field-15"] },
  { id: "supervisor-17", firstName: "Daniel", lastName: "Schilter", title: "Prof. Dr.", universityId: "uni-07", researchInterests: ["production systems", "lean management", "Industry 4.0"], about: null, objectives: ["student_matching", "network_expansion"], fieldIds: ["field-01", "field-11"] },
  { id: "supervisor-18", firstName: "Petra", lastName: "Kugler", title: "Prof. Dr.", universityId: "uni-07", researchInterests: ["digital business transformation", "IT governance", "enterprise architecture"], about: "Head of the Center for Digital Business at ZHAW.", objectives: ["research_collaboration", "network_expansion", "project_management"], fieldIds: ["field-13", "field-02"] },
  { id: "supervisor-19", firstName: "Manfred", lastName: "Vogel", title: "Prof. Dr.", universityId: "uni-08", researchInterests: ["applied machine learning", "computer vision", "time-series analysis"], about: "Professor at FHNW's School of Engineering, leading the Applied Machine Learning group.", objectives: ["student_matching", "research_collaboration"], fieldIds: ["field-02"] },
  { id: "supervisor-20", firstName: "Regula", lastName: "Baertschi", title: "Prof. Dr.", universityId: "uni-08", researchInterests: ["process automation", "smart manufacturing", "robotics"], about: null, objectives: ["student_matching", "funding_access"], fieldIds: ["field-01"] },
  { id: "supervisor-21", firstName: "Nicole", lastName: "Bischof", title: "Prof. Dr.", universityId: "uni-08", researchInterests: ["digital marketing analytics", "consumer data platforms", "marketing automation"], about: "Professor of Digital Marketing at FHNW School of Business.", objectives: ["research_collaboration", "network_expansion"], fieldIds: ["field-15", "field-02"] },
  { id: "supervisor-22", firstName: "Marco", lastName: "Züger", title: "Prof. Dr.", universityId: "uni-09", researchInterests: ["software engineering", "developer productivity", "DevOps"], about: null, objectives: ["student_matching", "project_management"], fieldIds: ["field-02"] },
  { id: "supervisor-23", firstName: "Sandra", lastName: "Tretter", title: "Prof. Dr.", universityId: "uni-09", researchInterests: ["renewable energy systems", "energy storage", "grid integration"], about: "Professor of Energy Systems at OST.", objectives: ["student_matching", "research_collaboration", "funding_access"], fieldIds: ["field-01", "field-06"] },
  { id: "supervisor-24", firstName: "Marc", lastName: "Langheinrich", title: "Prof. Dr.", universityId: "uni-10", researchInterests: ["ubiquitous computing", "privacy-aware systems", "IoT security"], about: null, objectives: ["student_matching", "network_expansion"], fieldIds: ["field-02"] },
  { id: "supervisor-25", firstName: "Silvia", lastName: "Bentivegna", title: "Prof. Dr.", universityId: "uni-10", researchInterests: ["health communication", "digital health literacy", "public engagement with science"], about: "Associate professor at USI's Faculty of Communication, Culture and Society.", objectives: ["research_collaboration", "network_expansion", "project_management"], fieldIds: ["field-15", "field-05"] },
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

const UNIVERSITIES: Record<string, string> = {
  "uni-01": "ETH Zurich", "uni-02": "EPFL", "uni-03": "University of St. Gallen (HSG)",
  "uni-04": "University of Zurich", "uni-05": "University of Bern", "uni-06": "University of Basel",
  "uni-07": "ZHAW", "uni-08": "FHNW", "uni-09": "OST", "uni-10": "USI",
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
  {
    name: "search_supervisors",
    description: "Search for thesis supervisors on the Studyond platform. Use this when the user is looking for a supervisor, wants supervisor recommendations, or needs academic guidance for their thesis. IMPORTANT: Before calling this tool, you MUST first understand the user's thesis topic or research area. If the user hasn't told you their thesis topic yet, ASK THEM FIRST — do not call this tool without knowing what they're working on.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords describing the thesis topic or research area the user needs supervision for" },
        field_ids: { type: "array", items: { type: "string" }, description: "Optional filter by field IDs" },
        university_id: { type: "string", description: "Optional filter by university ID (e.g. uni-01 for ETH Zurich)" },
        max_results: { type: "number", description: "Maximum number of results to return (default 5)" },
      },
      required: ["query"],
    },
  },
];

function searchTopics(params: { query: string; field_ids?: string[]; degree?: string; max_results?: number }) {
  const max = params.max_results ?? 5;
  let results = [...TOPICS];

  if (params.degree) {
    results = results.filter(t => t.degrees.includes(params.degree!));
  }

  if (params.field_ids?.length) {
    results = results.filter(t => t.fieldIds.some(f => params.field_ids!.includes(f)));
  }

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
    supervisors: t.supervisorIds.map(s => SUPERVISORS.find(sv => sv.id === s)).filter(Boolean).map(s => `${s!.title} ${s!.firstName} ${s!.lastName}`),
    employment: t.employment,
    employmentType: t.employmentType,
    workplaceType: t.workplaceType,
  }));
}

function searchSupervisors(params: { query: string; field_ids?: string[]; university_id?: string; max_results?: number }) {
  const max = params.max_results ?? 5;
  let results = [...SUPERVISORS];

  if (params.university_id) {
    results = results.filter(s => s.universityId === params.university_id);
  }

  if (params.field_ids?.length) {
    results = results.filter(s => s.fieldIds.some(f => params.field_ids!.includes(f)));
  }

  const keywords = params.query.toLowerCase().split(/\s+/).filter(Boolean);
  if (keywords.length > 0) {
    results = results.map(s => {
      const text = `${s.firstName} ${s.lastName} ${s.researchInterests.join(" ")} ${s.about || ""}`.toLowerCase();
      const fieldText = s.fieldIds.map(f => FIELDS[f] || "").join(" ").toLowerCase();
      const uniText = (UNIVERSITIES[s.universityId] || "").toLowerCase();
      const fullText = `${text} ${fieldText} ${uniText}`;
      const score = keywords.reduce((sc, kw) => sc + (fullText.includes(kw) ? 1 : 0), 0);
      return { ...s, score };
    }).filter(s => (s as any).score > 0).sort((a, b) => (b as any).score - (a as any).score);
  }

  // Also boost supervisors who are open to student_matching
  results.sort((a, b) => {
    const aMatch = a.objectives.includes("student_matching") ? 1 : 0;
    const bMatch = b.objectives.includes("student_matching") ? 1 : 0;
    if ((a as any).score !== (b as any).score) return ((b as any).score || 0) - ((a as any).score || 0);
    return bMatch - aMatch;
  });

  return results.slice(0, max).map(s => ({
    id: s.id,
    name: `${s.title} ${s.firstName} ${s.lastName}`,
    university: UNIVERSITIES[s.universityId] || s.universityId,
    researchInterests: s.researchInterests,
    fields: s.fieldIds.map(f => FIELDS[f]).filter(Boolean),
    about: s.about,
    openToStudents: s.objectives.includes("student_matching"),
    objectives: s.objectives,
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
3. **Explain your reasoning**: Tell the user WHY a topic or supervisor is a good match based on their skills and interests.
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

## CRITICAL: Using the search_supervisors Tool

**You MUST use the search_supervisors tool** whenever the user asks for help finding a supervisor.

**HOWEVER — BEFORE calling search_supervisors, you MUST first know the user's thesis topic or research area.** If the user says something like "help me find a supervisor" but hasn't told you their thesis topic or area of interest:
1. First ASK them: "What's your thesis topic or research area? I need to understand what you're working on to find the best supervisor match."
2. Check their profile for clues (fields of study, skills, about section)
3. Only call search_supervisors AFTER you have a clear understanding of their research direction

After receiving supervisor search results, you MUST include a supervisor card block:

:::supervisors
[{"id":"supervisor-01","name":"Prof. Dr. Martin Vechev","university":"ETH Zurich","researchInterests":["reliable AI","automated reasoning"],"fields":["Computer Science & Information Systems"],"openToStudents":true}]
:::

Rules for the supervisor card block:
- Place it AFTER your introductory text
- Include ALL supervisors from results that you mention
- The JSON must be valid and on a single line between the markers
- Each object must have: id, name, university, researchInterests (array), fields (array), openToStudents (boolean)
- Continue with your analysis of why each supervisor is a good match AFTER the block

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
    } else if (toolName === "search_supervisors") {
      toolResult = searchSupervisors(toolInput);
    } else {
      toolResult = { error: `Unknown tool: ${toolName}` };
    }

    // Collect any text blocks from the first response
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
