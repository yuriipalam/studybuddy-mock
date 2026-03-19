export interface Student {
  id: string;
  name: string;
  avatar: string;
  university: string;
  field: string;
  level: string;
  tags: string[];
}

export const mockStudents: Student[] = [
  { id: "s1", name: "Lena Fischer", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lena", university: "ETH Zurich", field: "Computer Science", level: "Master", tags: ["Topic", "Career Start"] },
  { id: "s2", name: "Noah Müller", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah", university: "EPFL", field: "Physics", level: "Master", tags: ["Topic", "Supervision"] },
  { id: "s3", name: "Sophie Martin", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie", university: "University of Zurich", field: "Data Science", level: "Bachelor", tags: ["Career Start"] },
  { id: "s4", name: "Lukas Schmid", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas", university: "ETH Zurich", field: "Mechanical Engineering", level: "Master", tags: ["Topic", "Career Start", "Supervision"] },
  { id: "s5", name: "Emma Keller", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma", university: "University of Bern", field: "Biology", level: "Master", tags: ["Topic"] },
  { id: "s6", name: "Julian Brunner", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julian", university: "EPFL", field: "Electrical Engineering", level: "Bachelor", tags: ["Career Start", "Supervision"] },
  { id: "s7", name: "Mia Weber", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia", university: "ETH Zurich", field: "AI", level: "Master", tags: ["Topic", "Career Start"] },
  { id: "s8", name: "David Huber", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David", university: "University of Basel", field: "Chemistry", level: "Master", tags: ["Topic", "Supervision"] },
];

export const fetchStudents = (): Promise<Student[]> =>
  new Promise((resolve) => setTimeout(() => resolve([...mockStudents]), 200));
