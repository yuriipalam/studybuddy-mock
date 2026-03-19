export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  type: string;
  fields: string[];
  description: string;
  coverImage: string;
  source: "Company" | "University";
  university?: string;
  bookmarked: boolean;
}

export const mockJobs: Job[] = [
  {
    id: "j1",
    title: "Research Internship — Accelerator Physics",
    company: "CERN",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=CERN&backgroundColor=2980b9",
    type: "Internship",
    fields: ["Physics", "Engineering"],
    description: "Join the CERN accelerator physics team for a 6-month internship working on beam dynamics simulations and measurements. You'll contribute to ongoing research on particle beam optimization and collaborate with an international team of scientists.",
    coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
    source: "Company",
    bookmarked: false,
  },
  {
    id: "j2",
    title: "Data Science Working Student",
    company: "SBB CFF FFS",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=SBB&backgroundColor=c0392b",
    type: "Working Student",
    fields: ["Data Science", "Transportation"],
    description: "Support our data science team in building analytical dashboards and predictive models for passenger flow optimization. Part-time position (40-60%) compatible with university studies.",
    coverImage: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800",
    source: "Company",
    bookmarked: true,
  },
  {
    id: "j3",
    title: "Software Engineering Intern — Cloud Platform",
    company: "ABB Switzerland",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=ABB&backgroundColor=e74c3c",
    type: "Internship",
    fields: ["Software Engineering", "Cloud Computing"],
    description: "Work on ABB's cloud platform team developing microservices for industrial IoT applications. You'll gain experience with Kubernetes, Go, and distributed systems at scale.",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    source: "Company",
    bookmarked: false,
  },
  {
    id: "j4",
    title: "Research Assistant — Robotics Lab",
    company: "ETH Zurich",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=ETH&backgroundColor=1abc9c",
    type: "Research Assistant",
    fields: ["Robotics", "AI", "Mechanical Engineering"],
    description: "Assist in cutting-edge robotics research at the Autonomous Systems Lab. Projects include legged locomotion, manipulation, and human-robot interaction. Ideal for students pursuing a thesis in robotics.",
    coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
    source: "University",
    university: "ETH Zurich",
    bookmarked: false,
  },
  {
    id: "j5",
    title: "UX Design Intern",
    company: "Swiss Re",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=SwissRe&backgroundColor=8e44ad",
    type: "Internship",
    fields: ["Design", "UX Research"],
    description: "Join our digital experience team to help redesign internal tools used by thousands of employees globally. You'll conduct user research, create prototypes, and work closely with engineering teams.",
    coverImage: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
    source: "Company",
    bookmarked: false,
  },
  {
    id: "j6",
    title: "Materials Testing Lab Technician",
    company: "Sefar AG",
    companyLogo: "https://api.dicebear.com/7.x/initials/svg?seed=Sefar&backgroundColor=27ae60",
    type: "Part-time",
    fields: ["Materials Science", "Quality Assurance"],
    description: "Support our R&D lab in testing filtration membrane performance. Responsibilities include sample preparation, measurement execution, data analysis, and reporting. Flexible hours for students.",
    coverImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
    source: "Company",
    bookmarked: false,
  },
];

export const fetchJobs = (): Promise<Job[]> =>
  new Promise((resolve) => setTimeout(() => resolve([...mockJobs]), 200));
