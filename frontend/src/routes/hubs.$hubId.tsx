import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/services/api";
import { CouncilCard, EmptyState, ErrorMessage, EventCard, GalleryGrid, HubIcon, Img, Loading, SiteLayout } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/hubs/$hubId")({
  head: () => meta("Hub", "Hub details, upcoming events, gallery and coordinators at JYC."),
  component: HubDetail,
});

function HubDetail() {
  const { hubId } = Route.useParams();
  const [tab, setTab] = useState<"events" | "gallery" | "team">("events");
  const hub = useQuery({ queryKey: ["hub", hubId], queryFn: () => api.getHub(hubId) });
  const events = useQuery({ queryKey: ["events", "upcoming"], queryFn: () => api.getEvents("upcoming") });
  const council = useQuery({ queryKey: ["council"], queryFn: api.getCouncil });

  if (hub.isLoading) return <SiteLayout><Loading /></SiteLayout>;
  if (hub.error) return <SiteLayout><div className="container-page py-16"><ErrorMessage message={hub.error.message || "Couldn't load this hub."} /><Link to="/hubs" className="mt-4 inline-block text-brand">← Back to hubs</Link></div></SiteLayout>;
  if (!hub.data) return <SiteLayout><div className="container-page py-16"><EmptyState title="Hub not found" /><Link to="/hubs" className="mt-4 inline-block text-brand">← Back to hubs</Link></div></SiteLayout>;
  const h = hub.data;
  const team = (council.data ?? []).filter((m) => m.group === h.councilGroup);
  const hubEvents = (events.data ?? []).filter((e) => e.hubId === h.id);

  return (
    <SiteLayout>
      <div className="container-page pt-6">
        <Link to="/hubs" className="inline-flex items-center gap-1 text-sm font-medium text-brand"><ArrowLeft className="h-4 w-4" /> Back to Hubs</Link>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl bg-gradient-navy p-8 text-navy-foreground shadow-lift">
            {h.imageUrl && <Img src={h.imageUrl} alt={`${h.name} photo`} className="mb-5 aspect-video w-full rounded-2xl" />}
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-foreground/10"><HubIcon icon={h.icon} className="h-7 w-7" /></span>
            <h1 className="mt-5 text-3xl font-bold sm:text-4xl">{h.name}</h1>
            <p className="mt-2 text-navy-foreground/80">{h.tagline}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setTab("team")} className="rounded-lg border border-navy-foreground/30 px-5 py-2.5 font-semibold">Contact Coordinators</button>
            </div>
          </div>
          <div className="rounded-3xl border bg-card p-6 shadow-card">
            <h2 className="font-semibold">About this hub</h2>
            <p className="mt-2 text-muted-foreground">{h.description}</p>
            <p className="mt-4 text-sm"><span className="font-semibold">{council.isLoading ? "—" : team.length}</span> <span className="text-muted-foreground">council coordinators</span></p>
          </div>
        </div>

        <div role="tablist" className="mt-10 flex gap-2 border-b">
          {(["events", "gallery", "team"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-semibold capitalize text-muted-foreground aria-selected:border-brand aria-selected:text-brand">
              {t === "events" ? "Upcoming Events" : t === "team" ? "Coordinators" : "Gallery"}
            </button>
          ))}
        </div>
        <div className="mt-6">
          {tab === "events" && (events.isLoading ? <Loading /> : events.error ? <ErrorMessage message="Couldn't load events." /> : !hubEvents.length ? <EmptyState title="No upcoming events for this hub yet" /> : (
            <div className={hubEvents.length === 1 ? "grid max-w-4xl" : hubEvents.length === 2 ? "grid gap-5 sm:grid-cols-2" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>{hubEvents.map((e) => <EventCard key={e.id} event={e} featured={hubEvents.length === 1} />)}</div>
          ))}
          {tab === "gallery" && <GalleryGrid hubId={h.id} />}
          {tab === "team" && (council.isLoading ? <Loading label="Loading coordinators…" /> : council.error ? <ErrorMessage message="Couldn't load coordinators." /> : team.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{team.map((m) => <CouncilCard key={m.enrollment} member={m} />)}</div> : <EmptyState title="Coordinators to be announced" />)}
        </div>
      </div>
    </SiteLayout>
  );
}
