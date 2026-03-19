import { useState, useEffect, useMemo } from "react";
import { fetchCompanies, Company } from "@/data/mockCompanies";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, FolderKanban } from "lucide-react";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");

  useEffect(() => {
    fetchCompanies().then(setCompanies);
  }, []);

  const allFields = useMemo(() => [...new Set(companies.flatMap((c) => c.fields))], [companies]);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (fieldFilter !== "all" && !c.fields.includes(fieldFilter)) return false;
      return true;
    });
  }, [companies, search, fieldFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Industry Partners</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search companies..."
        filters={[
          { label: "Fields", options: allFields, value: fieldFilter, onChange: setFieldFilter },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-lg">
                  <AvatarImage src={company.logo} />
                  <AvatarFallback className="rounded-lg">{company.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">{company.name}</h3>
                  <p className="text-xs text-muted-foreground">{company.employees} employees</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {company.expertCount} experts</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {company.openTopics} topics</span>
                <span className="flex items-center gap-1"><FolderKanban className="h-3.5 w-3.5" /> {company.ongoingProjects} projects</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {company.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
