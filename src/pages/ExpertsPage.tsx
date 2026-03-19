import { useState, useEffect, useMemo } from "react";
import { fetchExperts, Expert } from "@/data/mockExperts";
import { FilterBar } from "@/components/FilterBar";
import { EntityCard } from "@/components/EntityCard";

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");

  useEffect(() => {
    fetchExperts().then(setExperts);
  }, []);

  const allFields = useMemo(() => [...new Set(experts.flatMap((e) => e.fields))], [experts]);

  const filtered = useMemo(() => {
    return experts.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.company.toLowerCase().includes(search.toLowerCase())) return false;
      if (fieldFilter !== "all" && !e.fields.includes(fieldFilter)) return false;
      return true;
    });
  }, [experts, search, fieldFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Experts</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search experts..."
        filters={[
          { label: "Fields", options: allFields, value: fieldFilter, onChange: setFieldFilter },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((expert) => (
          <EntityCard
            key={expert.id}
            name={expert.name}
            avatar={expert.avatar}
            subtitle={`${expert.company} · ${expert.role}`}
            secondaryText={`${expert.university} · ${expert.degree}`}
            tags={expert.tags}
          />
        ))}
      </div>
    </div>
  );
}
