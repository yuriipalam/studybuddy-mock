import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchExperts, getCompany, getFieldNames, fields, companies } from "@/data";
import type { Expert } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { EntityCard } from "@/components/EntityCard";

const OBJECTIVE_LABELS: Record<string, string> = {
  recruiting: "Recruiting",
  fresh_insights: "Fresh Insights",
  research_collaboration: "Research Collaboration",
  education_collaboration: "Education Collaboration",
  brand_visibility: "Brand Visibility",
};

export default function ExpertsPage() {
  const navigate = useNavigate();
  const [expertList, setExperts] = useState<Expert[]>([]);
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [objectiveFilter, setObjectiveFilter] = useState("all");

  useEffect(() => {
    fetchExperts().then(setExperts);
  }, []);

  const allFieldNames = useMemo(() => fields.map((f) => f.name), []);
  const companyNames = useMemo(() => {
    const usedIds = new Set(expertList.map((e) => e.companyId));
    return companies.filter((c) => usedIds.has(c.id)).map((c) => c.name).sort();
  }, [expertList]);
  const objectiveOptions = useMemo(() => Object.keys(OBJECTIVE_LABELS), []);

  const filtered = useMemo(() => {
    return expertList.filter((e) => {
      const name = `${e.firstName} ${e.lastName}`;
      const company = getCompany(e.companyId)?.name ?? "";
      if (search && !name.toLowerCase().includes(search.toLowerCase()) && !company.toLowerCase().includes(search.toLowerCase())) return false;
      if (fieldFilter !== "all") {
        const fieldNames = getFieldNames(e.fieldIds);
        if (!fieldNames.includes(fieldFilter)) return false;
      }
      if (companyFilter !== "all" && company !== companyFilter) return false;
      if (objectiveFilter !== "all" && !e.objectives.includes(objectiveFilter as any)) return false;
      return true;
    });
  }, [expertList, search, fieldFilter, companyFilter, objectiveFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="ds-title-lg">Experts</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search experts..."
        filters={[
          { label: "Fields", options: allFieldNames, value: fieldFilter, onChange: setFieldFilter },
          { label: "Industry Partners", options: companyNames, value: companyFilter, onChange: setCompanyFilter },
          { label: "Open to", options: objectiveOptions.map((k) => OBJECTIVE_LABELS[k]), value: objectiveFilter === "all" ? "all" : OBJECTIVE_LABELS[objectiveFilter] ?? "all", onChange: (v) => {
            if (v === "all") { setObjectiveFilter("all"); return; }
            const key = Object.entries(OBJECTIVE_LABELS).find(([, label]) => label === v)?.[0] ?? "all";
            setObjectiveFilter(key);
          }},
        ]}
      />
      <div className="grid-4-col">
        {filtered.map((expert) => {
          const company = getCompany(expert.companyId);
          const fieldNames = getFieldNames(expert.fieldIds);
          return (
            <EntityCard
              key={expert.id}
              name={`${expert.firstName} ${expert.lastName}`}
              avatar={`https://api.dicebear.com/7.x/avataaars/svg?seed=${expert.firstName}`}
              subtitle={`${company?.name ?? ""} · ${expert.title}`}
              tags={fieldNames}
              onClick={() => navigate(`/people/experts/${expert.id}`)}
            />
          );
        })}
      </div>
    </div>
  );
}
