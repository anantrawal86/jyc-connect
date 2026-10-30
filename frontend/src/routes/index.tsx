import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { ArrowRight, Bell, BookOpen, CalendarDays, Layers, Megaphone, Users } from "lucide-react";
import { api } from "@/services/api";
import { LOGO_URL, useSiteImage } from "@/services/images";
import { COUNCIL_YEAR } from "@/data/council";
import type { Hub } from "@/data/devData";
import { AnnouncementCard, CouncilCard, EmptyState, ErrorMessage, EventCard, formatDate, GalleryGrid, HubCard, Img, Loading, SectionTitle, SiteLayout } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Home", "Find your people at JYC, Jaypee University Anoopshahr. Explore hubs, discover events and be part of the community."),
  component: Home,
});

function Home() {
  const hubs = useQuery({ queryKey: ["hubs"], queryFn: api.getHubs });
  const events = useQuery({ queryKey: ["events", "upcoming"], queryFn: () => api.getEvents("upcoming") });
  const announcements = useQuery({ queryKey: ["announcements"], queryFn: api.getAnnouncements });
  const stories = useQuery({ queryKey: ["stories"], queryFn: api.getStories });
  const council = useQuery({ queryKey: ["council"], queryFn: api.getCouncil });
  const hero = useSiteImage("hero");
  const campus = useSiteImage("campus");
  const availableHubs = hubs.data ?? [];
  const hubByName = (terms: string[]) => availableHubs.find((hub) => terms.some((term) => `${hub.id} ${hub.name}`.toLowerCase().includes(term)));
  const featuredHubs = [
    hubByName(["rossum"]) ?? hubByName(["ai-coding", "coding"]),
    hubByName(["sports"]),
    hubByName(["tinkering"]),
    hubByName(["cultural", "culture"]),
    hubByName(["literary"]),
  ].filter((hub, index, list): hub is Hub => Boolean(hub) && list.indexOf(hub) === index);

  return (
    <SiteLayout>
      <section className="home-hero relative overflow-hidden bg-gradient-navy text-navy-foreground">
        {hero && <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="container-page relative grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr]">
          <div className="hero-copy">
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Find your people.<br /><span className="text-brand-soft">Make things happen.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-navy-foreground/80">Explore hubs, discover campus events, and be part of JYC at Jaypee University, Anoopshahr.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/events" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lift hover:opacity-90">Explore Events <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/hubs" className="inline-flex items-center gap-2 rounded-lg border border-navy-foreground/30 px-5 py-3 font-semibold hover:bg-navy-foreground/10">Explore Hubs</Link>
            </div>
          </div>
          {!hero && <div className="hero-card relative mx-auto hidden aspect-[4/3] w-full max-w-md overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-8 shadow-2xl backdrop-blur-sm lg:flex lg:flex-col lg:justify-between">
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
        <div className="announcement-board overflow-hidden rounded-2xl border border-brand/10 bg-gradient-to-br from-white via-white to-accent/60 p-3.5 shadow-card sm:p-4 lg:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand"><Bell className="h-4 w-4" /> Stay in the loop</p>
              <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">The latest from JYC</h2>
              <p className="mt-1 max-w-xl text-xs text-muted-foreground sm:text-sm">Important updates, opportunities, and news from our campus community.</p>
            </div>
            <span className="hidden h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand sm:grid"><Megaphone className="h-5 w-5" /></span>
          </div>
          {announcements.isLoading ? <Loading label="Loading announcements…" /> : announcements.error ? <ErrorMessage message="Couldn't load announcements." /> : !announcements.data?.length ? (
            <div className="announcement-empty flex flex-col items-center rounded-2xl border border-dashed border-brand/20 bg-white/75 px-5 py-10 text-center sm:py-12">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand"><Bell className="h-6 w-6" /></span>
              <h3 className="mt-4 font-display text-xl font-bold text-navy">Good things are coming</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">There are no new notices just yet. Check back here for JYC updates, event news, and opportunities.</p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand/8 px-4 py-2 text-xs font-semibold text-brand"><span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> Updates will appear here</span>
            </div>
          ) : (
            announcements.data.length === 1 ? (
              <div className="announcement-item" style={{ "--announcement-index": 0 } as CSSProperties}>
                <AnnouncementCard title={announcements.data[0]!.title} body={announcements.data[0]!.body} date={announcements.data[0]!.date} featured />
              </div>
            ) : (
              <div className={`grid gap-4 ${announcements.data.length === 2 ? "md:grid-cols-2 xl:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
                {announcements.data.slice(0, 3).map((item, index) => (
                  <div className="announcement-item" style={{ "--announcement-index": index } as CSSProperties} key={item.id}>
                    <AnnouncementCard title={item.title} body={item.body} date={item.date} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionTitle title="Upcoming Events" action={<Link to="/events" className="text-sm font-semibold text-brand">View all events →</Link>} />
        {events.isLoading ? <Loading /> : events.error ? <ErrorMessage message="Couldn't load events." /> : !events.data?.length ? <EmptyState title="No upcoming events" /> : (
          <div className={events.data.length === 1 ? "grid max-w-4xl" : events.data.length === 2 ? "grid gap-5 sm:grid-cols-2" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>{events.data.slice(0, 3).map((e) => <EventCard key={e.id} event={e} featured={events.data.length === 1} />)}</div>
        )}
      </section>

      <section className="container-page mt-16">
        <SectionTitle title="JYC Stories" action={<Link to="/stories" className="text-sm font-semibold text-brand">View all stories →</Link>} />
        {stories.isLoading ? <Loading label="Loading JYC stories…" /> : stories.error ? <ErrorMessage message="Couldn't load JYC stories." /> : !stories.data?.length ? (
          <div className="home-story-empty rounded-2xl border border-brand/10 bg-gradient-to-r from-white to-accent/50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><BookOpen className="h-5 w-5" /></span><div><h3 className="font-display text-lg font-bold text-navy">Campus moments, remembered</h3><p className="mt-1 text-sm text-muted-foreground">Event recaps and JYC highlights will appear here.</p></div></div>
              <Link to="/stories" className="inline-flex items-center gap-2 font-semibold text-brand">Explore JYC Stories <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.data.slice(0, 3).map((story, index) => (
              <Link key={story.id} to="/stories/$storyId" params={{ storyId: story.id }} className="story-card group interactive-card overflow-hidden rounded-[1.5rem] border bg-card shadow-card" style={{ "--story-index": index } as CSSProperties}>
                <div className="story-card-image relative aspect-[16/10] overflow-hidden bg-gradient-navy">
                  {story.coverImageUrl ? <img src={story.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /> : <div className="grid h-full place-items-center text-white/45"><BookOpen className="h-12 w-12" strokeWidth={1.2} /></div>}
                  <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-navy/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur">{story.category}</span>
                  {story.homepageOrder !== null && <span className="featured-story-badge absolute right-4 top-4 rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand shadow-sm backdrop-blur">Featured</span>}
                  <span className="absolute inset-0 bg-gradient-to-t from-navy/45 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-90" />
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><CalendarDays className="h-3.5 w-3.5 text-brand" /> {formatDate(story.date)}</p>
                  <h3 className="mt-3 line-clamp-2 font-display text-xl font-bold leading-tight text-navy transition-colors group-hover:text-brand">{story.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{story.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand">Read story <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container-page mt-16">
        <SectionTitle title="Featured Hubs" action={<Link to="/hubs" className="text-sm font-semibold text-brand">View all hubs →</Link>} />
        {hubs.isLoading ? <Loading /> : hubs.error ? <ErrorMessage message="Couldn't load hubs." /> : !featuredHubs.length ? <EmptyState title="Hub information is not available yet" /> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">{featuredHubs.map((h) => <HubCard key={h.id} hub={h} />)}</div>
        )}
      </section>

      <section className="container-page mt-16">
        <div className="gallery-intro mb-6 flex flex-wrap items-end justify-between gap-4">
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
