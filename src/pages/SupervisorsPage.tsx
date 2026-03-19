import { useState, useEffect, useMemo } from "react";
import { fetchSupervisors, Supervisor } from "@/data/mockSupervisors";
import { FilterBar } from "@/components/FilterBar";
import { EntityCard } from "@/components/EntityCard";

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");

  useEffect(() => {
    fetchSupervisors().then(setSupervisors);
  }, []);

  const allFields = useMemo(() => [...new Set(supervisors.flatMap((s) => s.fields))], [supervisors]);

  const filtered = useMemo(() => {
    return supervisors.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (fieldFilter !== "all" && !s.fields.includes(fieldFilter)) return false;
      return true;
    });
  }, [supervisors, search, fieldFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Supervisors</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search supervisors..."
        filters={[
          { label: "Fields", options: allFields, value: fieldFilter, onChange: setFieldFilter },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((supervisor) => (
          <EntityCard
            key={supervisor.id}
            name={supervisor.name}
            avatar={supervisor.avatar}
            subtitle={`${supervisor.university} · ${supervisor.role}`}
            tags={supervisor.tags}
          />
        ))}
      </div>
    </div>
  );
}
