import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/services/api";
import { EmptyState, ErrorMessage, EventCard, Loading, PageHeader, SiteLayout } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/events/")({
  head: () => meta("Events", "Workshops, competitions, cultural fests and more at JYC."),
  component: Events,
});

function Events() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [q, setQ] = useState("");
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["events", tab], queryFn: () => api.getEvents(tab) });
  const list = (data ?? []).filter((e) => (e.title + e.category + e.venue).toLowerCase().includes(q.toLowerCase()));
  return (
    <SiteLayout>
      <PageHeader title="Events" subtitle="Workshops, competitions, cultural fests and more — find your next experience." />
      <div className="container-page mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" className="inline-flex rounded-xl bg-muted p-1">
            {(["upcoming", "past"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className="rounded-lg px-5 py-2 text-sm font-semibold capitalize text-muted-foreground aria-selected:bg-navy aria-selected:text-navy-foreground">{t}</button>
            ))}
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Search events</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/20" />
          </label>
        </div>
        <div className="mt-6">
          {isLoading ? <Loading /> : error ? <div className="space-y-3"><ErrorMessage message="Couldn't load events." /><button onClick={() => refetch()} className="text-sm font-semibold text-brand">Try again</button></div>
            : !list.length ? <EmptyState title={`No ${tab} events found`} /> : (
              <div className={list.length === 1 ? "grid max-w-4xl" : list.length === 2 ? "grid gap-5 sm:grid-cols-2" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>{list.map((e) => <EventCard key={e.id} event={e} featured={list.length === 1} />)}</div>
            )}
        </div>
      </div>
    </SiteLayout>
  );
}
