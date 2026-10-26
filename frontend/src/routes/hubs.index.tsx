import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/services/api";
import { EmptyState, ErrorMessage, HubCard, Loading, PageHeader, SiteLayout } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/hubs/")({
  head: () => meta("Explore Hubs", "Discover the hubs at JYC and find where your interests come to life."),
  component: Hubs,
});

function Hubs() {
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useQuery({ queryKey: ["hubs"], queryFn: api.getHubs });
  const list = (data ?? []).filter((h) => (h.name + h.description).toLowerCase().includes(q.toLowerCase()));
  return (
    <SiteLayout>
      <PageHeader title="Explore Hubs" subtitle="Discover the hubs at JYC and find where your interests come to life." />
      <div className="container-page mt-8">
        <label className="relative block max-w-md">
          <span className="sr-only">Search hubs</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hubs or interests…" className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/20" />
        </label>
        <div className="mt-6">
          {isLoading ? <Loading /> : error ? <ErrorMessage message="Couldn't load hubs." /> : !list.length ? <EmptyState title="No hubs match your search" /> : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{list.map((h) => <HubCard key={h.id} hub={h} />)}</div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
