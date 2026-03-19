export interface Supervisor {
  id: string;
  name: string;
  avatar: string;
  university: string;
  role: string;
  tags: string[];
  fields: string[];
}

export const mockSupervisors: Supervisor[] = [
  { id: "sv1", name: "Prof. Andreas Müller", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas", university: "ETH Zurich", role: "Full Professor", tags: ["Interviews", "Topic applications", "Research collaboration"], fields: ["Robotics", "AI"] },
  { id: "sv2", name: "Prof. Clara Hoffmann", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Clara", university: "EPFL", role: "Associate Professor", tags: ["Research collaboration", "Topic applications"], fields: ["Quantum Computing", "Physics"] },
  { id: "sv3", name: "Prof. Robert Lang", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert", university: "University of Zurich", role: "Full Professor", tags: ["Interviews", "Research collaboration"], fields: ["NLP", "AI"] },
  { id: "sv4", name: "Prof. Elena Bianchi", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena", university: "ETH Zurich", role: "Assistant Professor", tags: ["Topic applications", "Research collaboration"], fields: ["Materials Science", "Chemistry"] },
  { id: "sv5", name: "Prof. Martin Steiner", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin", university: "University of Bern", role: "Full Professor", tags: ["Interviews", "Topic applications"], fields: ["Energy", "Sustainability"] },
  { id: "sv6", name: "Prof. Yuki Tanaka", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki", university: "EPFL", role: "Associate Professor", tags: ["Research collaboration"], fields: ["Computer Vision", "Robotics"] },
  { id: "sv7", name: "Prof. Laura Frei", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura", university: "University of Basel", role: "Full Professor", tags: ["Interviews", "Topic applications", "Research collaboration"], fields: ["Bioinformatics", "Data Science"] },
  { id: "sv8", name: "Prof. Stefan Vogel", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan", university: "ETH Zurich", role: "Full Professor", tags: ["Topic applications"], fields: ["Software Engineering", "Cloud Computing"] },
];

export const fetchSupervisors = (): Promise<Supervisor[]> =>
  new Promise((resolve) => setTimeout(() => resolve([...mockSupervisors]), 200));
