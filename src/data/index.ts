import type { University, StudyProgram, Field, Student, Supervisor, Company, Expert, Topic, ThesisProject } from "./types";
import universitiesData from "./json/universities.json";
import studyProgramsData from "./json/study-programs.json";
import fieldsData from "./json/fields.json";
import studentsData from "./json/students.json";
import supervisorsData from "./json/supervisors.json";
import companiesData from "./json/companies.json";
import expertsData from "./json/experts.json";
import topicsData from "./json/topics.json";
import projectsData from "./json/projects.json";

export const universities = universitiesData as University[];
export const studyPrograms = studyProgramsData as StudyProgram[];
export const fields = fieldsData as Field[];
export const students = studentsData as Student[];
export const supervisors = supervisorsData as Supervisor[];
export const companies = companiesData as Company[];
export const experts = expertsData as Expert[];
export const topics = topicsData as Topic[];
export const projects = projectsData as ThesisProject[];

// Helper lookups
export const getUniversity = (id: string) => universities.find((u) => u.id === id);
export const getStudyProgram = (id: string) => studyPrograms.find((p) => p.id === id);
export const getField = (id: string) => fields.find((f) => f.id === id);
export const getFieldNames = (ids: string[]) => ids.map((id) => getField(id)?.name).filter(Boolean) as string[];
export const getCompany = (id: string) => companies.find((c) => c.id === id);
export const getStudent = (id: string) => students.find((s) => s.id === id);
export const getSupervisor = (id: string) => supervisors.find((s) => s.id === id);
export const getExpert = (id: string) => experts.find((e) => e.id === id);

// Fetch helpers (simulate API delay)
const delay = <T>(data: T, ms = 100): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const fetchStudents = () => delay([...students]);
export const fetchSupervisors = () => delay([...supervisors]);
export const fetchExperts = () => delay([...experts]);
export const fetchCompanies = () => delay([...companies]);
export const fetchTopics = () => delay([...topics]);
export const fetchStudyPrograms = () => delay([...studyPrograms]);
export const fetchUniversities = () => delay([...universities]);
export const fetchFields = () => delay([...fields]);
export const fetchProjects = () => delay([...projects]);
