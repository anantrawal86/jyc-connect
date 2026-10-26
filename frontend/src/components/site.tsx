import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Menu, X, ChevronLeft, ChevronRight, Mail, MapPin, Briefcase, BookOpen, Camera, Code2, Drama, Globe, Heart, Palette, Trophy, Wrench,
  CalendarDays, Clock, ImageIcon, AlertCircle, Inbox, Loader2, User, ArrowRight, Building2, Megaphone,
} from "lucide-react";
import { LOGO_URL, useSiteImage, type SiteImageSlot } from "@/services/images";
import { api, ApiError } from "@/services/api";
import type { Hub, JycEvent } from "@/data/devData";
import type { CouncilMember } from "@/data/council";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/hubs", label: "Hubs" },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About JYC" },
  { to: "/council", label: "Council" },
  { to: "/contact", label: "Contact" },
] as const;

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <img src={LOGO_URL} alt="JYC logo" className="h-10 w-10 shrink-0 rounded-lg object-contain" />
      <span className="min-w-0 leading-tight">
        <span className={`block font-display text-base font-bold ${light ? "text-navy-foreground" : "text-navy"}`}>
          JYC <span className={light ? "text-brand-soft" : "text-brand"}>Connect</span>
        </span>
        <span className={`block truncate text-[11px] ${light ? "text-navy-foreground/70" : "text-muted-foreground"}`}>
          Discover. Participate. Belong.
        </span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const profile = useQuery({ queryKey: ["profile"], queryFn: api.getProfile, retry: false });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  async function logout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await api.logout();
      queryClient.clear();
      await navigate({ to: "/login", replace: true });
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Could not log out. Please try again.");
      setLoggingOut(false);
    }
  }
  const sessionExpired = profile.error instanceof ApiError && profile.error.status === 401;
  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="relative rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-gradient-to-r after:from-brand after:to-brand-soft after:transition-transform after:content-[''] hover:text-foreground data-[status=active]:text-brand data-[status=active]:after:scale-x-100">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {profile.isLoading ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">Checking session…</span>
          ) : profile.data ? (
            <>
              <Link to="/dashboard" className="hidden rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-accent sm:inline-flex">
                Dashboard
              </Link>
              <button type="button" disabled={loggingOut} onClick={() => void logout()} className="hidden rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground hover:opacity-90 disabled:opacity-60 sm:inline-flex">
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </>
          ) : sessionExpired ? (
            <Link to="/login" className="hidden rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground hover:opacity-90 sm:inline-flex">
              Login / Register
            </Link>
          ) : profile.error ? (
            <button onClick={() => void profile.refetch()} className="hidden text-sm font-medium text-destructive sm:inline-flex">
              Session check failed · Retry
            </button>
          ) : null}
          {logoutError && <span role="alert" className="hidden text-xs text-destructive sm:inline">{logoutError}</span>}
          <button className="rounded-md p-2 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t bg-card lg:hidden" aria-label="Mobile">
          <div className="container-page flex flex-col py-2">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} activeOptions={{ exact: n.to === "/" }}
                className="rounded-md px-3 py-3 font-medium data-[status=active]:bg-accent data-[status=active]:text-accent-foreground">
                {n.label}
              </Link>
            ))}
            {profile.isLoading ? (
              <p className="px-3 py-3 text-center text-sm text-muted-foreground">Checking session…</p>
            ) : profile.data ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="mt-2 rounded-lg border px-3 py-3 text-center font-semibold">
                  Student Dashboard
                </Link>
                <button type="button" disabled={loggingOut} onClick={() => void logout()} className="mt-2 rounded-lg bg-navy px-3 py-3 text-center font-semibold text-navy-foreground disabled:opacity-60">
                  {loggingOut ? "Logging out…" : "Log out"}
                </button>
              </>
            ) : sessionExpired || !profile.error ? (
              <Link to="/login" onClick={() => setOpen(false)} className="mt-2 rounded-lg bg-navy px-3 py-3 text-center font-semibold text-navy-foreground">
                Login / Register
              </Link>
            ) : (
              <button onClick={() => void profile.refetch()} className="mt-2 rounded-lg border px-3 py-3 text-center font-semibold text-destructive">
                Session check failed · Retry
              </button>
            )}
            {logoutError && <p role="alert" className="px-3 py-2 text-center text-sm text-destructive">{logoutError}</p>}
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 bg-gradient-navy text-navy-foreground">
      <div className="container-page grid gap-7 py-10 sm:grid-cols-2 xl:grid-cols-[1.15fr_0.8fr_1.2fr_0.95fr] xl:gap-8">
        <div className="space-y-3">
          <Logo light />
          <p className="max-w-xs text-sm text-navy-foreground/70">Jaypee University, Anoopshahr — Empowering Leaders, Inspiring Change.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Quick Links</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm text-navy-foreground/75">
            {NAV.map((n) => <li key={n.to}><Link to={n.to} className="hover:text-navy-foreground">{n.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Contact</h3>
          <ul className="space-y-2 text-sm text-navy-foreground/75">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0" /> Jaypee University, Anoopshahr</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0" /> Official email to be provided</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Made by</h3>
          <ul className="space-y-2 text-sm text-navy-foreground/75">
            <li>Anant Rawal</li>
            <li>Mayank Sharma</li>
            <li>Tanishq Upadhya</li>
            <li>Aadish Goyal</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="container-page flex flex-col gap-1 py-4 text-xs text-navy-foreground/60 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} JYC Connect. All rights reserved.</span>
          <span>Empowering Leaders, Inspiring Change</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main key={location.pathname} className="page-enter flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="bg-gradient-navy text-navy-foreground">
      <div className="container-page py-14 sm:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-soft">JYC Connect <span className="mx-1 text-navy-foreground/40">/</span> Student community</p>
        <h1 className="max-w-4xl text-4xl font-bold leading-[1.05] sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy-foreground/75">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="relative pl-4 font-display text-2xl font-bold tracking-tight text-navy before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-brand before:to-brand-soft sm:text-3xl">{title}</h2>
      {action}
    </div>
  );
}

export function AnnouncementCard({ title, body, date }: { title: string; body?: string | null | undefined; date: string }) {
  return (
    <article className="interactive-card group relative isolate flex min-h-[220px] flex-col overflow-hidden rounded-[1.5rem] border border-brand/10 bg-card p-5 shadow-card sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 -z-10 h-40 w-40 rounded-full bg-brand/10 blur-3xl transition-opacity group-hover:opacity-90" />
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-brand">
          <Megaphone className="h-3.5 w-3.5" aria-hidden="true" /> JYC update
        </span>
        <time className="shrink-0 text-xs font-semibold text-muted-foreground">{formatDate(date)}</time>
      </div>
      <div className="mt-5 h-1 w-12 rounded-full bg-gradient-to-r from-brand to-brand-soft" aria-hidden="true" />
      <h3 className="mt-4 font-display text-xl font-bold leading-tight tracking-tight text-navy sm:text-[1.35rem]">{title}</h3>
      {body && <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">{body}</p>}
    </article>
  );
}

/** Image with branded fallback when no photo has been supplied yet. */
export function Img({ src, alt, className = "", label, fit = "cover" }: { src: string | null; alt: string; className?: string; label?: string; fit?: "cover" | "contain" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div role="img" aria-label={alt} className={`flex flex-col items-center justify-center gap-2 bg-placeholder text-navy-foreground/80 ${className}`}>
        <ImageIcon className="h-7 w-7" />
        {label && <span className="px-3 text-center text-xs font-medium">{label}</span>}
      </div>
    );
  }
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  return <img src={src} alt={alt} onError={() => setFailed(true)} className={`${fitClass} ${className}`} loading="lazy" />;
}

const ICONS: Record<string, typeof Code2> = {
  drama: Drama, palette: Palette, code: Code2, book: BookOpen, trophy: Trophy, briefcase: Briefcase,
  wrench: Wrench, camera: Camera, heart: Heart, globe: Globe,
};
export function HubIcon({ icon, className = "h-6 w-6" }: { icon: string; className?: string }) {
  const I = ICONS[icon] ?? Globe;
  return <I className={className} aria-hidden />;
}

export function HubCard({ hub }: { hub: Hub }) {
  return (
    <Link to="/hubs/$hubId" params={{ hubId: hub.id }}
      className="interactive-card group flex flex-col rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
      {hub.imageUrl && <Img src={hub.imageUrl} alt={`${hub.name} photo`} className="mb-4 aspect-[16/9] w-full rounded-xl" />}
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
        <HubIcon icon={hub.icon} />
      </span>
      <h3 className="font-semibold">{hub.name}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{hub.description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
        Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function EventCard({ event, featured = false }: { event: JycEvent; featured?: boolean }) {
  const profile = useQuery({ queryKey: ["profile"], queryFn: api.getProfile, retry: false });
  const navigate = useNavigate();
  const date = new Date(`${event.date}T00:00:00`);
  const day = Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "numeric" });
  const month = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
  const isRegistrationOpen = event.status === "upcoming" && Boolean(event.registrationFormUrl);
  function registerForEvent() {
    if (!event.registrationFormUrl) return;
    if (profile.data) {
      window.location.assign(event.registrationFormUrl);
      return;
    }
    sessionStorage.setItem("jyc-pending-registration-url", event.registrationFormUrl);
    void navigate({ to: "/login" });
  }

  return (
    <article className={`interactive-card group relative cursor-pointer overflow-hidden rounded-[1.6rem] border bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift ${featured ? "grid md:grid-cols-[1.05fr_.95fr]" : "flex flex-col"}`}>
      <Link
        to="/events/$eventId"
        params={{ eventId: event.id }}
        aria-label={`View details for ${event.title}`}
        className="absolute inset-0 z-10 rounded-[1.6rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span className="sr-only">View event details</span>
      </Link>
      <div className={`relative isolate flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#ea580c_0%,#80334f_55%,#172554_100%)] px-8 text-center text-white ${featured ? "aspect-[16/10] md:aspect-auto md:min-h-[17rem]" : "aspect-[16/10]"}`}>
        {event.imageUrl && <Img src={event.imageUrl} alt={`${event.title} poster`} fit="contain" className="absolute inset-0 -z-20 h-full w-full transition duration-500 group-hover:scale-[1.02]" />}
        {!event.imageUrl && <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-700/45 via-fuchsia-950/45 to-blue-950/75" />}
        <span className="absolute left-4 top-4 grid min-h-[4.25rem] min-w-[3.25rem] place-content-center rounded-xl bg-white px-2 py-1 text-navy shadow-card">
          <span className="text-xl font-extrabold leading-none">{day}</span>
          <span className="mt-1 text-[0.65rem] font-bold tracking-wide text-brand">{month}</span>
        </span>
        {!event.imageUrl && <h3 className="max-w-md text-xl font-extrabold leading-tight drop-shadow sm:text-2xl">{event.title}</h3>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{event.hub?.name ?? (event.category || "JYC event")}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isRegistrationOpen ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
            {isRegistrationOpen ? "Registration open" : event.status === "past" ? "Event ended" : "Registration unavailable"}
          </span>
        </div>
        {event.imageUrl && <h3 className="text-lg font-bold leading-snug text-navy">{event.title}</h3>}
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-brand" />{formatDate(event.date)}{(event.startTime || event.endTime) && ` · ${event.startTime}${event.startTime && event.endTime ? " – " : ""}${event.endTime}`}</li>
          {event.venue && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-brand" />{event.venue}</li>}
        </ul>
        {event.summary && <p className="mt-3 min-h-[3rem] flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{event.summary}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link to="/events/$eventId" params={{ eventId: event.id }}
            className="relative z-20 inline-flex items-center justify-center rounded-full border border-border bg-card px-3 py-2.5 text-center text-sm font-semibold text-navy transition hover:bg-accent">
            View details
          </Link>
          {isRegistrationOpen ? (
            <button type="button" onClick={registerForEvent}
              className="relative z-20 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-navy to-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90">
              Register now
            </button>
          ) : (
            <button type="button" disabled className="relative z-20 inline-flex cursor-not-allowed items-center justify-center rounded-full bg-muted px-3 py-2.5 text-center text-sm font-semibold text-muted-foreground">
              {event.status === "past" ? "Registration closed" : "Form unavailable"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function CouncilCard({ member }: { member: CouncilMember }) {
  return (
    <article className="interactive-card flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-card">
      {member.photoUrl ? (
        <Img src={member.photoUrl} alt={member.name} className="h-14 w-14 shrink-0 rounded-full" />
      ) : (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground" aria-hidden>
          <User />
        </span>
      )}
      <div className="min-w-0">
        <h3 className="truncate font-semibold">{member.name}</h3>
        <p className="text-sm text-brand">{member.designation}</p>
        <p className="text-xs text-muted-foreground">{member.group}</p>
      </div>
    </article>
  );
}

const GALLERY_FILTERS = ["All", "Events", "Workshops", "Sports", "Culture", "Campus Life"] as const;

export function GalleryGrid({ hubId, limit, showFilters = true }: { hubId?: string; limit?: number; showFilters?: boolean }) {
  const [activeFilter, setActiveFilter] = useState<(typeof GALLERY_FILTERS)[number]>("All");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const gallery = useQuery({ queryKey: ["gallery", hubId ?? "life-at-jyc"], queryFn: () => api.getGallery(hubId), staleTime: 5 * 60_000 });
  const items = limit ? gallery.data?.slice(0, limit) ?? [] : gallery.data ?? [];
  const keywords: Record<Exclude<(typeof GALLERY_FILTERS)[number], "All">, string[]> = {
    Events: ["event", "fest", "competition", "tournament", "showcase"],
    Workshops: ["workshop", "seminar", "training", "session"],
    Sports: ["sport", "match", "game", "cricket", "football", "badminton", "volleyball", "basketball"],
    Culture: ["culture", "cultural", "dance", "music", "drama", "art", "performance", "festival"],
    "Campus Life": ["campus", "life", "gathering", "student", "team", "university", "community"],
  };
  const filteredItems = activeFilter === "All" ? items : items.filter((item) => {
    const searchable = `${item.category ?? ""} ${item.caption ?? ""} ${item.alt}`.toLowerCase();
    return keywords[activeFilter].some((keyword) => searchable.includes(keyword));
  });
  useEffect(() => {
    if (selectedIndex === null) return;
    const scrollY = window.scrollY;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    const previousOverflow = document.body.style.overflow;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowRight") setSelectedIndex((index) => index === null ? null : (index + 1) % filteredItems.length);
      if (event.key === "ArrowLeft") setSelectedIndex((index) => index === null ? null : (index - 1 + filteredItems.length) % filteredItems.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      document.body.style.overflow = previousOverflow;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, filteredItems.length]);
  const tileShapes = [
    "aspect-[4/5] rounded-[2rem_1rem_2rem_1rem]",
    "aspect-[5/3] rounded-[1rem_2.5rem_1rem_2.5rem]",
    "aspect-[3/4] rounded-[2.5rem_1rem_2.5rem_1rem]",
    "aspect-[4/3] rounded-[1rem_2rem_1rem_2rem]",
    "aspect-[2/3] rounded-[2.5rem_1rem_2.5rem_1rem]",
    "aspect-[5/4] rounded-[1.25rem_2.5rem_1.25rem_2.5rem]",
    "aspect-[3/2] rounded-[2.5rem_1rem_2.5rem_1rem]",
    "aspect-[4/5] rounded-[1rem_2.5rem_1rem_2.5rem]",
  ];
  if (gallery.isLoading) return <Loading label="Loading gallery…" />;
  if (gallery.error) return <ErrorMessage message={gallery.error instanceof Error ? gallery.error.message : "Couldn't load gallery."} />;
  if (!items.length) return <EmptyState title={hubId ? "This hub’s gallery is coming soon" : "Gallery coming soon"} text={hubId ? "Photos added to this hub’s gallery will appear here." : "Official JYC photographs will appear here once they're added."} />;
  return (
    <>
    <div className="space-y-6">
      {showFilters && (
        <div className="flex flex-wrap gap-2" aria-label="Filter gallery photos">
          {GALLERY_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={activeFilter === filter}
              onClick={() => { setActiveFilter(filter); setSelectedIndex(null); }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeFilter === filter ? "border-navy bg-navy text-navy-foreground shadow-card" : "bg-card text-muted-foreground hover:border-brand/40 hover:text-brand"}`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}
      {!filteredItems.length ? (
        <EmptyState title={`No ${activeFilter.toLowerCase()} photos yet`} text="Try another category to see more gallery photos." />
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 sm:gap-5 lg:columns-4 lg:gap-6">
          {filteredItems.map((g, index) => (
            <div key={g.id} className="mb-4 break-inside-avoid sm:mb-5 lg:mb-6">
              <button
                type="button"
                aria-label={`View photo: ${g.caption || g.alt}`}
                onClick={() => setSelectedIndex(index)}
                className={`gallery-photo group relative block w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0 text-left shadow-card transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lift motion-reduce:animate-none motion-reduce:transition-none ${tileShapes[index % tileShapes.length]}`}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <Img
                  src={g.url}
                  alt={g.alt}
                  className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent px-4 pb-4 pt-10 text-left text-sm font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  {g.caption || g.alt}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    {selectedIndex !== null && filteredItems[selectedIndex] && createPortal((
      <div
        className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-navy/90 p-2 backdrop-blur-sm sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Gallery photo viewer"
        onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedIndex(null); }}
      >
        <button
          type="button"
          onClick={() => setSelectedIndex(null)}
          aria-label="Close photo viewer"
          className="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:right-6 sm:top-6"
        >
          <X className="h-6 w-6" />
        </button>
        {filteredItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setSelectedIndex((selectedIndex - 1 + filteredItems.length) % filteredItems.length)}
              aria-label="Previous photo"
              className="absolute left-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:left-6 sm:h-14 sm:w-14"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedIndex((selectedIndex + 1) % filteredItems.length)}
              aria-label="Next photo"
              className="absolute right-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:right-6 sm:h-14 sm:w-14"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
        <figure className="flex h-full max-h-full w-full max-w-[min(96vw,1500px)] flex-col items-center justify-center gap-3 overflow-hidden">
          <img
            src={filteredItems[selectedIndex].url}
            alt={filteredItems[selectedIndex].alt}
            className="block max-h-[calc(100dvh-6rem)] max-w-full rounded-2xl object-contain shadow-2xl"
          />
          <figcaption className="text-center text-sm text-white/85">
            <span className="font-semibold">{filteredItems[selectedIndex].caption || filteredItems[selectedIndex].alt}</span>
            <span className="mx-2 text-white/50">·</span>
            {selectedIndex + 1} of {filteredItems.length}
          </figcaption>
        </figure>
      </div>
    ), document.body)}
    </>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground" role="status">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{message}</span>
    </div>
  );
}

export function RequiredMark() {
  return <><span aria-hidden="true" className="ml-1 font-bold text-brand">*</span><span className="sr-only"> (required)</span></>;
}

export function Field({ id, label, error, ...props }: { id: string; label: string; error?: string | undefined } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}{props.required && <RequiredMark />}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className="field-control w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive"
        {...props} />
      {error && <p id={`${id}-err`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AuthLayout({ title, subtitle, children, backgroundSlot = "login" }: { title: string; subtitle: string; children: ReactNode; backgroundSlot?: SiteImageSlot }) {
  const background = useSiteImage(backgroundSlot);
  return (
    <div className="page-enter grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-navy p-10 text-navy-foreground lg:flex lg:flex-col lg:justify-between">
        {background && <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" />}
        <div className="absolute inset-0 bg-gradient-to-br from-navy/55 via-navy/40 to-brand/45" />
        <div className="relative"><Logo light /></div>
        <div className="relative">
          <h2 className="text-4xl font-bold">{title}</h2>
          <p className="mt-3 max-w-sm text-navy-foreground/75">{subtitle}</p>
        </div>
        <p className="relative text-sm text-navy-foreground/60">Jaypee University, Anoopshahr</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          {children}
        </div>
      </main>
    </div>
  );
}
