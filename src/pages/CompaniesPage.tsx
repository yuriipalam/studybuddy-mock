import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCompanies, experts as allExperts, topics as allTopics } from "@/data";
import type { Company } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen } from "lucide-react";

export default function CompaniesPage() {
  const navigate = useNavigate();
  const [companyList, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");

  useEffect(() => {
    fetchCompanies().then(setCompanies);
  }, []);

  const allDomains = useMemo(() => [...new Set(companyList.flatMap((c) => c.domains))], [companyList]);

  const filtered = useMemo(() => {
    return companyList.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (domainFilter !== "all" && !c.domains.includes(domainFilter)) return false;
      return true;
    });
  }, [companyList, search, domainFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="ds-title-lg">Industry Partners</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search companies..."
        filters={[
          { label: "Domain", options: allDomains, value: domainFilter, onChange: setDomainFilter },
        ]}
      />
      <div className="grid-4-col">
        {filtered.map((company) => {
          const expertCount = allExperts.filter((e) => e.companyId === company.id).length;
          const topicCount = allTopics.filter((t) => t.companyId === company.id).length;
          return (
            <Card key={company.id} className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/organizations/companies/${company.id}`)}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-lg">
                    <AvatarFallback className="rounded-lg text-sm font-semibold">
                      {company.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="ds-title-cards leading-tight transition-colors group-hover:text-primary">{company.name}</h3>
                    <p className="ds-caption text-muted-foreground">{company.size} employees</p>
                  </div>
                </div>
                <div className="flex gap-4 ds-caption text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="size-3.5" /> {expertCount} experts</span>
                  <span className="flex items-center gap-1"><BookOpen className="size-3.5" /> {topicCount} topics</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {company.domains.map((d) => (
                    <Badge key={d} variant="secondary" className="ds-badge font-normal">{d}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
