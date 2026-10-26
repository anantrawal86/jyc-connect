import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Layers, Users } from "lucide-react";
import { api } from "@/services/api";
import { LOGO_URL, useSiteImage } from "@/services/images";
import { COUNCIL_YEAR } from "@/data/council";
import { AnnouncementCard, CouncilCard, EmptyState, ErrorMessage, EventCard, GalleryGrid, HubCard, Img, Loading, SectionTitle, SiteLayout } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Home", "Find your people at JYC, Jaypee University Anoopshahr. Explore hubs, discover events and be part of the community."),
  component: Home,
});

function Home() {
  const hubs = useQuery({ queryKey: ["hubs"], queryFn: api.getHubs });
  const events = useQuery({ queryKey: ["events", "upcoming"], queryFn: () => api.getEvents("upcoming") });
  const announcements = useQuery({ queryKey: ["announcements"], queryFn: api.getAnnouncements });
  const council = useQuery({ queryKey: ["council"], queryFn: api.getCouncil });
  const hero = useSiteImage("hero");
  const campus = useSiteImage("campus");

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-gradient-navy text-navy-foreground">
        {hero && <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="container-page relative grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Find your people.<br /><span className="text-brand-soft">Make things happen.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-navy-foreground/80">Explore hubs, discover campus events, and be part of JYC at Jaypee University, Anoopshahr.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/events" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lift hover:opacity-90">Explore Events <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/hubs" className="inline-flex items-center gap-2 rounded-lg border border-navy-foreground/30 px-5 py-3 font-semibold hover:bg-navy-foreground/10">Explore Hubs</Link>
            </div>
          </div>
          {!hero && <div className="relative mx-auto hidden aspect-[4/3] w-full max-w-md overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-8 shadow-2xl backdrop-blur-sm lg:flex lg:flex-col lg:justify-between">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/50 blur-3xl" />
            <div className="relative flex items-center gap-3"><img src={LOGO_URL} alt="" className="h-12 w-12 rounded-xl object-cover" /><span className="text-sm font-semibold tracking-wide text-white/80">JAYPEE YOUTH CLUB</span></div>
            <div className="relative"><p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-soft">Find your community</p><p className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight text-white">Discover.<br />Participate.<br /><span className="text-brand-soft">Belong.</span></p></div>
            <div className="relative flex gap-2"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">Hubs</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">Events</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">People</span></div>
          </div>}
        </div>
      </section>

      <section className="container-page -mt-8 relative">
        <div className="grid grid-cols-1 gap-4 rounded-2xl border bg-card p-5 shadow-card sm:grid-cols-3">
          {[
            { icon: Layers, value: hubs.data?.length ?? "—", label: "Hubs to explore" },
            { icon: Users, value: council.data?.length ?? "—", label: `Council members ${COUNCIL_YEAR}` },
            { icon: CalendarDays, value: "∞", label: "Opportunities" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><s.icon className="h-5 w-5" /></span>
              <div><p className="font-display text-2xl font-bold">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-14 sm:mt-16">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Latest updates</p>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">Announcements</h2>
        </div>
        {announcements.isLoading ? <Loading label="Loading announcements…" /> : announcements.error ? <ErrorMessage message="Couldn't load announcements." /> : !announcements.data?.length ? <EmptyState title="No announcements yet" /> : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {announcements.data.slice(0, 3).map((item) => (
              <AnnouncementCard key={item.id} title={item.title} body={item.body} date={item.date} />
            ))}
          </div>
        )}
      </section>

      <section className="container-page mt-16">
        <SectionTitle title="Upcoming Events" action={<Link to="/events" className="text-sm font-semibold text-brand">View all events →</Link>} />
        {events.isLoading ? <Loading /> : events.error ? <ErrorMessage message="Couldn't load events." /> : !events.data?.length ? <EmptyState title="No upcoming events" /> : (
          <div className={events.data.length === 1 ? "grid max-w-4xl" : events.data.length === 2 ? "grid gap-5 sm:grid-cols-2" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>{events.data.slice(0, 3).map((e) => <EventCard key={e.id} event={e} featured={events.data.length === 1} />)}</div>
        )}
      </section>

      <section className="container-page mt-16">
        <SectionTitle title="Explore All Hubs" action={<Link to="/hubs" className="text-sm font-semibold text-brand">View all hubs →</Link>} />
        {hubs.isLoading ? <Loading /> : hubs.error ? <ErrorMessage message="Couldn't load hubs." /> : !hubs.data?.length ? <EmptyState title="Hub information is not available yet" /> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">{hubs.data.slice(0, 5).map((h) => <HubCard key={h.id} hub={h} />)}</div>
        )}
      </section>

      <section className="container-page mt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Gallery &amp; updates</p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Life at JYC</h2>
            <p className="mt-2 text-muted-foreground">Moments, memories, and milestones from across our campus community.</p>
          </div>
          <Link to="/gallery" className="inline-flex items-center gap-2 font-semibold text-brand hover:gap-3">View full gallery <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <GalleryGrid limit={6} showFilters={false} />
      </section>

      <section className="container-page mt-16 grid items-center gap-8 lg:grid-cols-2">
        <Img src={campus} alt="Jaypee University campus" className="aspect-[16/10] w-full rounded-2xl" label="Campus photo coming soon" />
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">About JYC</h2>
          <p className="mt-3 text-muted-foreground">JYC brings students of Jaypee University, Anoopshahr together through hubs that span culture, technology, sport, literature, enterprise and service — empowering leaders and inspiring change.</p>
          <Link to="/about" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-navy to-primary px-6 py-3 font-semibold text-primary-foreground shadow-lift transition hover:-translate-y-0.5 hover:opacity-95">Learn more about JYC <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionTitle title={`Student Council ${COUNCIL_YEAR}`} action={<Link to="/council" className="text-sm font-semibold text-brand">Meet the council →</Link>} />
        {council.isLoading ? <Loading label="Loading council…" /> : council.error ? <ErrorMessage message="Couldn't load council members." /> : !council.data?.length ? <EmptyState title="Council information is not available yet" /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{council.data.slice(0, 4).map((m) => <CouncilCard key={m.enrollment} member={m} />)}</div>}
      </section>
    </SiteLayout>
  );
}
