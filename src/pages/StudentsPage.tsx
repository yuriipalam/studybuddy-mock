import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudents, getUniversity, getStudyProgram, getFieldNames, fields, universities } from "@/data";
import type { Student } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { EntityCard } from "@/components/EntityCard";

const OBJECTIVE_LABELS: Record<string, string> = {
  topic: "Topic",
  supervision: "Supervision",
  career_start: "Career Start",
  industry_access: "Industry Access",
  project_guidance: "Project Guidance",
};

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("all");
  const [uniFilter, setUniFilter] = useState("all");
  const [objectiveFilter, setObjectiveFilter] = useState("all");
  const [fieldFilter, setFieldFilter] = useState("all");

  useEffect(() => {
    fetchStudents().then(setStudents);
  }, []);

  const uniNames = useMemo(() => {
    const usedIds = new Set(students.map((s) => s.universityId));
    return universities.filter((u) => usedIds.has(u.id)).map((u) => u.name);
  }, [students]);

  const allFieldNames = useMemo(() => fields.map((f) => f.name), []);

  const objectiveOptions = useMemo(() => Object.keys(OBJECTIVE_LABELS), []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      if (degreeFilter !== "all" && s.degree !== degreeFilter) return false;
      if (uniFilter !== "all") {
        const uni = getUniversity(s.universityId);
        if (uni?.name !== uniFilter) return false;
      }
      if (objectiveFilter !== "all") {
        const key = Object.entries(OBJECTIVE_LABELS).find(([, v]) => v === objectiveFilter)?.[0];
        if (!key || !s.objectives.includes(key as any)) return false;
      }
      if (fieldFilter !== "all") {
        const fieldNames = getFieldNames(s.fieldIds);
        if (!fieldNames.includes(fieldFilter)) return false;
      }
      return true;
    });
  }, [students, search, degreeFilter, uniFilter, objectiveFilter, fieldFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="ds-title-lg">Students</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search students..."
        filters={[
          { label: "University", options: uniNames, value: uniFilter, onChange: setUniFilter },
          { label: "Level", options: ["bsc", "msc", "phd"], value: degreeFilter, onChange: setDegreeFilter },
          { label: "Looking for", options: objectiveOptions.map((k) => OBJECTIVE_LABELS[k]), value: objectiveFilter, onChange: setObjectiveFilter },
          { label: "Field", options: allFieldNames, value: fieldFilter, onChange: setFieldFilter },
        ]}
      />
      <div className="grid-4-col">
        {filtered.map((student) => {
          const uni = getUniversity(student.universityId);
          const program = getStudyProgram(student.studyProgramId);
          const fieldNames = getFieldNames(student.fieldIds);
          return (
            <EntityCard
              key={student.id}
              name={`${student.firstName} ${student.lastName}`}
              avatar={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName}`}
              subtitle={`${uni?.name ?? ""} · ${program?.name ?? ""}`}
              secondaryText={student.degree.toUpperCase()}
              tags={fieldNames}
              onClick={() => navigate(`/people/students/${student.id}`)}
            />
          );
        })}
      </div>
    </div>
  );
}
