import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSupervisors, getUniversity, getFieldNames, fields } from "@/data";
import type { Supervisor } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { EntityCard } from "@/components/EntityCard";

export default function SupervisorsPage() {
  const navigate = useNavigate();
  const [supervisorList, setSupervisors] = useState<Supervisor[]>([]);
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");

  useEffect(() => {
    fetchSupervisors().then(setSupervisors);
  }, []);

  const allFieldNames = useMemo(() => fields.map((f) => f.name), []);

  const filtered = useMemo(() => {
    return supervisorList.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      if (fieldFilter !== "all") {
        const fieldNames = getFieldNames(s.fieldIds);
        if (!fieldNames.includes(fieldFilter)) return false;
      }
      return true;
    });
  }, [supervisorList, search, fieldFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="ds-title-lg">Supervisors</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search supervisors..."
        filters={[
          { label: "Fields", options: allFieldNames, value: fieldFilter, onChange: setFieldFilter },
        ]}
      />
      <div className="grid-4-col">
        {filtered.map((supervisor) => {
          const uni = getUniversity(supervisor.universityId);
          const fieldNames = getFieldNames(supervisor.fieldIds);
          return (
            <EntityCard
              key={supervisor.id}
              name={`${supervisor.title} ${supervisor.firstName} ${supervisor.lastName}`}
              avatar={`https://api.dicebear.com/7.x/avataaars/svg?seed=${supervisor.firstName}`}
              subtitle={uni?.name ?? ""}
              secondaryText={supervisor.researchInterests.slice(0, 3).join(", ")}
              tags={fieldNames}
            />
          );
        })}
      </div>
    </div>
  );
}
