export interface StudyProgram {
  id: string;
  name: string;
  university: string;
  universityLogo: string;
  degree: string;
  description: string;
  activeStudents: number;
  fields: string[];
}

export const mockStudyPrograms: StudyProgram[] = [
  { id: "sp1", name: "Computer Science", university: "ETH Zurich", universityLogo: "https://api.dicebear.com/7.x/initials/svg?seed=ETH&backgroundColor=1abc9c", degree: "MSc", description: "Advanced studies in algorithms, systems, AI, and software engineering with research opportunities.", activeStudents: 450, fields: ["Computer Science", "AI"] },
  { id: "sp2", name: "Physics", university: "EPFL", universityLogo: "https://api.dicebear.com/7.x/initials/svg?seed=EPFL&backgroundColor=e67e22", degree: "MSc", description: "Cutting-edge physics program with access to world-class labs and CERN collaboration.", activeStudents: 180, fields: ["Physics", "Mathematics"] },
  { id: "sp3", name: "Data Science", university: "University of Zurich", universityLogo: "https://api.dicebear.com/7.x/initials/svg?seed=UZH&backgroundColor=9b59b6", degree: "MSc", description: "Interdisciplinary program combining statistics, machine learning, and domain expertise.", activeStudents: 220, fields: ["Data Science", "Statistics"] },
  { id: "sp4", name: "Mechanical Engineering", university: "ETH Zurich", universityLogo: "https://api.dicebear.com/7.x/initials/svg?seed=ETH&backgroundColor=1abc9c", degree: "BSc", description: "Foundational engineering program with hands-on lab work and industry partnerships.", activeStudents: 380, fields: ["Mechanical Engineering"] },
  { id: "sp5", name: "Electrical Engineering", university: "EPFL", universityLogo: "https://api.dicebear.com/7.x/initials/svg?seed=EPFL&backgroundColor=e67e22", degree: "MSc", description: "Focus on power systems, signal processing, and embedded systems design.", activeStudents: 160, fields: ["Electrical Engineering", "Energy"] },
  { id: "sp6", name: "Biology", university: "University of Bern", universityLogo: "https://api.dicebear.com/7.x/initials/svg?seed=UniBern&backgroundColor=2ecc71", degree: "MSc", description: "Research-oriented biology program with specializations in molecular and computational biology.", activeStudents: 140, fields: ["Biology", "Bioinformatics"] },
  { id: "sp7", name: "Chemistry", university: "University of Basel", universityLogo: "https://api.dicebear.com/7.x/initials/svg?seed=UniBasel&backgroundColor=3498db", degree: "MSc", description: "Strong industry connections with pharma companies in the Basel region.", activeStudents: 120, fields: ["Chemistry", "Materials Science"] },
  { id: "sp8", name: "Robotics", university: "ETH Zurich", universityLogo: "https://api.dicebear.com/7.x/initials/svg?seed=ETH&backgroundColor=1abc9c", degree: "MSc", description: "Interdisciplinary program combining mechanical engineering, CS, and AI for autonomous systems.", activeStudents: 95, fields: ["Robotics", "AI"] },
];

export const fetchStudyPrograms = (): Promise<StudyProgram[]> =>
  new Promise((resolve) => setTimeout(() => resolve([...mockStudyPrograms]), 200));
