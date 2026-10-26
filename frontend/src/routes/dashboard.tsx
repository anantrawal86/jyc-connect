import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { api, ApiError } from "@/services/api";
import { AnnouncementCard, EmptyState, ErrorMessage, formatDate, Loading, Logo } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    meta(
      "Student Dashboard",
      "Your JYC Connect dashboard: upcoming events, registration forms and announcements.",
    ),
  component: Dashboard,
});

type Section = "overview" | "events" | "announcements" | "profile";
const NAV: { id: Section; label: string; icon: typeof User }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "events", label: "My Events", icon: CalendarCheck },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "profile", label: "Profile", icon: User },
];

function Dashboard() {
  const [section, setSection] = useState<Section>("overview");
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: api.getDashboard, retry: false });
  const events = useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: () => api.getEvents("upcoming"),
  });
  const discoverEvents = events.data ?? [];
  const announcements = dashboard.data?.announcements ?? [];

  useEffect(() => {
    if (dashboard.error instanceof ApiError && dashboard.error.status === 401)
      void navigate({ to: "/login" });
  }, [dashboard.error, navigate]);

  async function logout() {
    setLoggingOut(true);
    setActionError("");
    try {
      await api.logout();
      queryClient.clear();
      await navigate({ to: "/login", replace: true });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't log out. Please try again.");
      setLoggingOut(false);
    }
  }

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Dashboard">
      <div className="mb-6">
        <Logo />
      </div>
      {NAV.map((n) => (
        <button
          key={n.id}
          onClick={() => {
            setSection(n.id);
            setOpen(false);
          }}
          aria-current={section === n.id ? "page" : undefined}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground"
        >
          <n.icon className="h-4 w-4" />
          {n.label}
        </button>
      ))}
      <div className="my-3 border-t" />
      <Link
        to="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={() => setOpen(false)}
      >
        Home <ArrowRight className="ml-auto h-4 w-4" />
      </Link>
      <Link
        to="/events"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={() => setOpen(false)}
      >
        Browse events <ArrowRight className="ml-auto h-4 w-4" />
      </Link>
      <button
        type="button"
        disabled={loggingOut}
        onClick={() => void logout()}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-navy/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-64 bg-sidebar">{sidebar}</aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu />
            </button>
            <h1 className="truncate text-lg font-bold">
              {NAV.find((n) => n.id === section)?.label}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {dashboard.data?.user.role === "ADMIN" && (
              <Link to="/admin" className="text-sm font-medium text-brand">
                Admin
              </Link>
            )}
            <Link to="/" className="text-sm font-medium text-brand">
              Home
            </Link>
            <Link to="/events" className="text-sm font-medium text-brand">
              Events
            </Link>
          </div>
        </header>
        <main key={section} className="page-enter space-y-6 p-4 sm:p-6">
          {dashboard.isLoading ? (
            <Loading label="Loading your dashboard…" />
          ) : dashboard.error ? (
            <ErrorMessage message={dashboard.error.message} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Welcome, {dashboard.data?.user.fullName}.
            </p>
          )}
          {actionError && <ErrorMessage message={actionError} />}
          {!dashboard.isLoading && !dashboard.error && (
            <>
              {(section === "overview" || section === "events") && (
                <>
                  {section === "overview" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { label: "Upcoming Events", value: events.data?.length ?? 0, icon: CalendarDays },
                        { label: "Announcements", value: announcements.length, icon: Bell },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center gap-3 rounded-2xl border bg-card p-5 shadow-card"
                        >
                          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                            <s.icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="font-display text-2xl font-bold">{s.value}</p>
                            <p className="text-sm text-muted-foreground">{s.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <section className="rounded-2xl border bg-card p-5 shadow-card">
                    <h2 className="font-semibold">Register for an event</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Choose an event below to open that event’s Google Form. Registration is submitted
                      and managed in that form.
                    </p>
                  </section>
                  <section className="rounded-2xl border bg-card p-5 shadow-card">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="font-semibold">Discover Events</h2>
                      <Link to="/events" className="text-sm font-semibold text-brand">
                        All events →
                      </Link>
                    </div>
                    {events.isLoading ? (
                      <Loading label="Loading events…" />
                    ) : events.error ? (
                      <ErrorMessage message="Couldn't load events." />
                    ) : !events.data?.length ? (
                      <EmptyState title="No upcoming events" />
                    ) : (
                      <ul className="divide-y">
                        {discoverEvents.map((event) => (
                          <li
                            key={event.id}
                            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <Link
                                to="/events/$eventId"
                                params={{ eventId: event.id }}
                                className="font-medium hover:text-brand"
                              >
                                {event.title}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(event.date)}{event.venue && ` · ${event.venue}`}
                              </p>
                            </div>
                            {event.registrationFormUrl ? (
                              <button
                                onClick={() => window.location.assign(event.registrationFormUrl!)}
                                className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                              >
                                Register ↗
                              </button>
                            ) : (
                              <span className="shrink-0 text-xs text-muted-foreground">
                                  "Form not available"
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}
              {(section === "overview" || section === "announcements") && (
                <section className="rounded-2xl border bg-card p-5 shadow-card">
                  <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">Recent Announcements</h2>
                  {!announcements.length ? (
                    <EmptyState title="No announcements" />
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {announcements.map((a) => (
                        <AnnouncementCard key={a.id} title={a.title} body={a.body} date={a.date} />
                      ))}
                    </div>
                  )}
                </section>
              )}
              {section === "profile" && (
                <section className="rounded-2xl border bg-card p-6 shadow-card">
                  <div className="space-y-2">
                    <h2 className="font-semibold">{dashboard.data?.user.fullName}</h2>
                    <p className="text-sm text-muted-foreground">{dashboard.data?.user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Roll number: {dashboard.data?.user.rollNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Department: {dashboard.data?.user.department}
                    </p>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
