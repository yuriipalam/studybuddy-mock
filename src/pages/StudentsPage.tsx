import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudents, getUniversity, getStudyProgram, getFieldNames } from "@/data";
import type { Student } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { EntityCard } from "@/components/EntityCard";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("all");

  useEffect(() => {
    fetchStudents().then(setStudents);
  }, []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      if (degreeFilter !== "all" && s.degree !== degreeFilter) return false;
      return true;
    });
  }, [students, search, degreeFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="ds-title-lg">Students</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search students..."
        filters={[
          { label: "Degree", options: ["bsc", "msc", "phd"], value: degreeFilter, onChange: setDegreeFilter },
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
            />
          );
        })}
      </div>
    </div>
  );
}
