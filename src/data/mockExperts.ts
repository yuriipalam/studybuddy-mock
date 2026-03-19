export interface Expert {
  id: string;
  name: string;
  avatar: string;
  company: string;
  role: string;
  university: string;
  degree: string;
  tags: string[];
  fields: string[];
}

export const mockExperts: Expert[] = [
  { id: "e1", name: "Dr. Maria Keller", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria", company: "SBB CFF FFS", role: "Head of Data Science", university: "ETH Zurich", degree: "PhD Computer Science", tags: ["Interviews", "Topic applications"], fields: ["Machine Learning", "Transportation"] },
  { id: "e2", name: "Prof. Jean-Pierre Dubois", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jean", company: "CERN", role: "Senior Researcher", university: "EPFL", degree: "PhD Physics", tags: ["Research", "Guest lectures"], fields: ["Quantum Computing", "Physics"] },
  { id: "e3", name: "Dr. Thomas Brunner", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas", company: "Sefar AG", role: "R&D Manager", university: "University of Basel", degree: "PhD Chemistry", tags: ["Topic applications", "Research"], fields: ["Materials Science", "Nanotechnology"] },
  { id: "e4", name: "Ing. Sarah Weber", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", company: "ABB Switzerland", role: "Principal Engineer", university: "ETH Zurich", degree: "MSc Electrical Engineering", tags: ["Interviews", "Topic applications", "Research"], fields: ["Energy", "Electrical Engineering"] },
  { id: "e5", name: "Dr. Lisa Meier", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa", company: "Swiss Re", role: "AI Research Lead", university: "University of Zurich", degree: "PhD AI", tags: ["Guest lectures", "Research"], fields: ["NLP", "AI"] },
  { id: "e6", name: "Dr. Marco Rossi", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marco", company: "Roche", role: "Data Scientist", university: "ETH Zurich", degree: "PhD Bioinformatics", tags: ["Interviews", "Topic applications"], fields: ["Bioinformatics", "Data Science"] },
  { id: "e7", name: "Dr. Anna Schmidt", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna", company: "Google Zurich", role: "Engineering Manager", university: "TU Munich", degree: "PhD Computer Science", tags: ["Interviews", "Guest lectures"], fields: ["Software Engineering", "Cloud Computing"] },
  { id: "e8", name: "Dr. Peter Huber", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Peter", company: "Novartis", role: "Research Director", university: "University of Basel", degree: "PhD Pharma", tags: ["Research", "Topic applications"], fields: ["Pharma", "Biotech"] },
];

export const fetchExperts = (): Promise<Expert[]> =>
  new Promise((resolve) => setTimeout(() => resolve([...mockExperts]), 200));
