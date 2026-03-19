export interface Topic {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  contactPerson: string;
  contactAvatar: string;
  fields: string[];
  description: string;
  coverImage: string;
  source: "Company" | "University";
  university?: string;
  bookmarked: boolean;
}

export const mockTopics: Topic[] = [
  {
    id: "t1",
    title: "Machine Learning for Predictive Maintenance in Railway Systems",
    company: "SBB CFF FFS",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=SBB&backgroundColor=c0392b",
    contactPerson: "Dr. Maria Keller",
    contactAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    fields: ["Machine Learning", "Transportation", "IoT"],
    description: "Develop and implement machine learning models for predictive maintenance of railway infrastructure. The project involves analyzing sensor data from trains and tracks to predict component failures before they occur, reducing downtime and improving safety. You will work with large-scale time-series data and deploy models in a production environment.",
    coverImage: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800",
    source: "Company",
    bookmarked: false,
  },
  {
    id: "t2",
    title: "Quantum Computing Applications in Particle Physics Simulation",
    company: "CERN",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=CERN&backgroundColor=2980b9",
    contactPerson: "Prof. Jean-Pierre Dubois",
    contactAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jean",
    fields: ["Quantum Computing", "Physics", "HPC"],
    description: "Explore the potential of quantum computing algorithms for simulating particle physics experiments. This thesis will investigate how quantum algorithms can accelerate Monte Carlo simulations used in high-energy physics research at the Large Hadron Collider.",
    coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
    source: "Company",
    bookmarked: true,
  },
  {
    id: "t3",
    title: "Advanced Filtration Membranes Using Nano-Materials",
    company: "Sefar AG",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=Sefar&backgroundColor=27ae60",
    contactPerson: "Dr. Thomas Brunner",
    contactAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas",
    fields: ["Materials Science", "Nanotechnology", "Chemistry"],
    description: "Research and develop next-generation filtration membranes incorporating nano-materials for improved performance in industrial applications. The project focuses on achieving higher throughput while maintaining selectivity in challenging chemical environments.",
    coverImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
    source: "Company",
    bookmarked: false,
  },
  {
    id: "t4",
    title: "Sustainable Energy Storage Solutions for Smart Grids",
    company: "ABB Switzerland",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=ABB&backgroundColor=e74c3c",
    contactPerson: "Ing. Sarah Weber",
    contactAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    fields: ["Energy", "Electrical Engineering", "Sustainability"],
    description: "Design and evaluate novel energy storage systems for integration into smart grid infrastructure. This thesis explores battery management systems, grid stability algorithms, and the economic viability of distributed energy storage in the Swiss energy market.",
    coverImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800",
    source: "Company",
    bookmarked: false,
  },
  {
    id: "t5",
    title: "Natural Language Processing for Multilingual Legal Document Analysis",
    company: "Swiss Re",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=SwissRe&backgroundColor=8e44ad",
    contactPerson: "Dr. Lisa Meier",
    contactAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    fields: ["NLP", "AI", "Legal Tech"],
    description: "Build NLP pipelines for analyzing legal documents across multiple languages (German, French, Italian, English). The project aims to automate contract review, risk assessment, and compliance checking using transformer-based models fine-tuned on legal corpora.",
    coverImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800",
    source: "Company",
    bookmarked: false,
  },
  {
    id: "t6",
    title: "Computer Vision for Autonomous Drone Navigation in Alpine Environments",
    company: "ETH Zurich",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=ETH&backgroundColor=1abc9c",
    contactPerson: "Prof. Andreas Müller",
    contactAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas",
    fields: ["Computer Vision", "Robotics", "AI"],
    description: "Develop computer vision algorithms enabling autonomous drone navigation in challenging alpine terrain. The research focuses on visual SLAM, obstacle avoidance, and path planning in GPS-denied environments with varying weather conditions.",
    coverImage: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800",
    source: "University",
    university: "ETH Zurich",
    bookmarked: false,
  },
];

export const fetchTopics = (): Promise<Topic[]> =>
  new Promise((resolve) => setTimeout(() => resolve([...mockTopics]), 200));
