export interface Company {
  id: string;
  name: string;
  logo: string;
  employees: string;
  expertCount: number;
  openTopics: number;
  ongoingProjects: number;
  tags: string[];
  fields: string[];
}

export const mockCompanies: Company[] = [
  { id: "c1", name: "SBB CFF FFS", logo: "https://api.dicebear.com/7.x/initials/svg?seed=SBB&backgroundColor=c0392b", employees: "30,000+", expertCount: 12, openTopics: 5, ongoingProjects: 8, tags: ["Interviews", "Topics", "Guest lectures"], fields: ["Transportation", "Data Science"] },
  { id: "c2", name: "CERN", logo: "https://api.dicebear.com/7.x/initials/svg?seed=CERN&backgroundColor=2980b9", employees: "17,000+", expertCount: 24, openTopics: 14, ongoingProjects: 20, tags: ["Research", "Topics", "Internships"], fields: ["Physics", "Engineering"] },
  { id: "c3", name: "ABB Switzerland", logo: "https://api.dicebear.com/7.x/initials/svg?seed=ABB&backgroundColor=e74c3c", employees: "10,000+", expertCount: 8, openTopics: 6, ongoingProjects: 4, tags: ["Topics", "Internships"], fields: ["Electrical Engineering", "Energy"] },
  { id: "c4", name: "Sefar AG", logo: "https://api.dicebear.com/7.x/initials/svg?seed=Sefar&backgroundColor=27ae60", employees: "2,500+", expertCount: 3, openTopics: 2, ongoingProjects: 1, tags: ["Topics", "Research"], fields: ["Materials Science", "Chemistry"] },
  { id: "c5", name: "Swiss Re", logo: "https://api.dicebear.com/7.x/initials/svg?seed=SwissRe&backgroundColor=8e44ad", employees: "14,000+", expertCount: 6, openTopics: 4, ongoingProjects: 3, tags: ["Topics", "Internships", "Guest lectures"], fields: ["Insurance", "AI"] },
  { id: "c6", name: "Roche", logo: "https://api.dicebear.com/7.x/initials/svg?seed=Roche&backgroundColor=3498db", employees: "100,000+", expertCount: 15, openTopics: 10, ongoingProjects: 12, tags: ["Research", "Topics", "Internships"], fields: ["Pharma", "Biotech"] },
  { id: "c7", name: "Google Zurich", logo: "https://api.dicebear.com/7.x/initials/svg?seed=Google&backgroundColor=f39c12", employees: "5,000+", expertCount: 10, openTopics: 8, ongoingProjects: 6, tags: ["Interviews", "Topics", "Internships"], fields: ["Software Engineering", "AI"] },
  { id: "c8", name: "Novartis", logo: "https://api.dicebear.com/7.x/initials/svg?seed=Novartis&backgroundColor=16a085", employees: "78,000+", expertCount: 11, openTopics: 7, ongoingProjects: 9, tags: ["Research", "Topics"], fields: ["Pharma", "Data Science"] },
];

export const fetchCompanies = (): Promise<Company[]> =>
  new Promise((resolve) => setTimeout(() => resolve([...mockCompanies]), 200));
