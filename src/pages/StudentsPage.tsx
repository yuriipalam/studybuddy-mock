import { useState, useEffect, useMemo } from "react";
import { fetchStudents, Student } from "@/data/mockStudents";
import { FilterBar } from "@/components/FilterBar";
import { EntityCard } from "@/components/EntityCard";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  useEffect(() => {
    fetchStudents().then(setStudents);
  }, []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (levelFilter !== "all" && s.level !== levelFilter) return false;
      return true;
    });
  }, [students, search, levelFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Students</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search students..."
        filters={[
          { label: "Level", options: ["Bachelor", "Master"], value: levelFilter, onChange: setLevelFilter },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((student) => (
          <EntityCard
            key={student.id}
            name={student.name}
            avatar={student.avatar}
            subtitle={`${student.university} · ${student.field}`}
            secondaryText={student.level}
            tags={student.tags}
          />
        ))}
      </div>
    </div>
  );
}
