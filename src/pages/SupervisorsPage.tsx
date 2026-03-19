import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSupervisors, getUniversity, getFieldNames, fields, universities } from "@/data";
import type { Supervisor } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { EntityCard } from "@/components/EntityCard";

const OBJECTIVE_LABELS: Record<string, string> = {
  student_matching: "Student Matching",
  research_collaboration: "Research Collaboration",
  network_expansion: "Network Expansion",
  funding_access: "Funding Access",
  project_management: "Project Management",
};

export default function SupervisorsPage() {
  const navigate = useNavigate();
  const [supervisorList, setSupervisors] = useState<Supervisor[]>([]);
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [uniFilter, setUniFilter] = useState("all");
  const [objectiveFilter, setObjectiveFilter] = useState("all");

  useEffect(() => {
    fetchSupervisors().then(setSupervisors);
  }, []);

  const uniNames = useMemo(() => {
    const usedIds = new Set(supervisorList.map((s) => s.universityId));
    return universities.filter((u) => usedIds.has(u.id)).map((u) => u.name);
  }, [supervisorList]);

  const allFieldNames = useMemo(() => fields.map((f) => f.name), []);
  const objectiveOptions = useMemo(() => Object.keys(OBJECTIVE_LABELS), []);

  const filtered = useMemo(() => {
    return supervisorList.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
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
  }, [supervisorList, search, uniFilter, objectiveFilter, fieldFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="ds-title-lg">Supervisors</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search supervisors..."
        filters={[
          { label: "University", options: uniNames, value: uniFilter, onChange: setUniFilter },
          { label: "Looking for", options: objectiveOptions.map((k) => OBJECTIVE_LABELS[k]), value: objectiveFilter, onChange: setObjectiveFilter },
          { label: "Field", options: allFieldNames, value: fieldFilter, onChange: setFieldFilter },
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
              onClick={() => navigate(`/people/supervisors/${supervisor.id}`)}
            />
          );
        })}
      </div>
    </div>
  );
}
