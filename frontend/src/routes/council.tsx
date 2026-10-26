import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/services/api";
import { COUNCIL_NOTES, COUNCIL_YEAR } from "@/data/council";
import { CouncilCard, EmptyState, ErrorMessage, Loading, PageHeader, SiteLayout } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/council")({
  head: () => meta("Student Council", `Meet the JYC Student Council ${COUNCIL_YEAR} at Jaypee University, Anoopshahr.`),
  component: Council,
});

function Council() {
  const [group, setGroup] = useState("All");
  const council = useQuery({ queryKey: ["council"], queryFn: api.getCouncil });
  const members = council.data ?? [];
  const groups = [...new Set(members.map((member) => member.group))];
  const list = group === "All" ? members : members.filter((m) => m.group === group);
  return (
    <SiteLayout>
      <PageHeader title="Meet Our Core Team" subtitle={`JYC Student Council ${COUNCIL_YEAR} — the people guiding, organizing and making things happen.`} />
      <div className="container-page mt-8">
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter by hub">
          {["All", ...groups].map((g) => (
            <button key={g} role="tab" aria-selected={group === g} onClick={() => setGroup(g)}
              className="shrink-0 rounded-full border bg-card px-4 py-2 text-sm font-medium aria-selected:border-navy aria-selected:bg-navy aria-selected:text-navy-foreground">{g}</button>
          ))}
        </div>
        {council.isLoading ? <Loading label="Loading council…" /> : council.error ? <ErrorMessage message="Couldn't load council members." /> : !members.length ? <EmptyState title="Council information is not available yet" /> : (group === "All" ? groups : [group]).map((g) => (
          <section key={g} className="mt-8">
            <h2 className="mb-4 text-lg font-bold">{g}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.filter((m) => m.group === g).map((m) => <CouncilCard key={m.enrollment} member={m} />)}</div>
          </section>
        ))}
        <section className="mt-12 rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Notes</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">{COUNCIL_NOTES.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>
      </div>
    </SiteLayout>
  );
}
