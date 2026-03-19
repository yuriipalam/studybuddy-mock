import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchExperts, getCompany, getFieldNames, fields } from "@/data";
import type { Expert } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { EntityCard } from "@/components/EntityCard";

export default function ExpertsPage() {
  const navigate = useNavigate();
  const [expertList, setExperts] = useState<Expert[]>([]);
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");

  useEffect(() => {
    fetchExperts().then(setExperts);
  }, []);

  const allFieldNames = useMemo(() => fields.map((f) => f.name), []);

  const filtered = useMemo(() => {
    return expertList.filter((e) => {
      const name = `${e.firstName} ${e.lastName}`;
      const company = getCompany(e.companyId)?.name ?? "";
      if (search && !name.toLowerCase().includes(search.toLowerCase()) && !company.toLowerCase().includes(search.toLowerCase())) return false;
      if (fieldFilter !== "all") {
        const fieldNames = getFieldNames(e.fieldIds);
        if (!fieldNames.includes(fieldFilter)) return false;
      }
      return true;
    });
  }, [expertList, search, fieldFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="ds-title-lg">Experts</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search experts..."
        filters={[
          { label: "Fields", options: allFieldNames, value: fieldFilter, onChange: setFieldFilter },
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
            />
          );
        })}
      </div>
    </div>
  );
}
