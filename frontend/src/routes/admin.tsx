import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { ImageCropPicker } from "@/components/image-crop-picker";
import {
  api,
  ApiError,
  type AdminAnnouncement,
  type AdminEvent,
  type AdminOverview,
  type GalleryImage,
  type JycStory,
} from "@/services/api";
import type { Hub } from "@/data/devData";
import { AnnouncementCard, EmptyState, ErrorMessage, Field, formatDate, Img, Loading, Logo, RequiredMark } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/admin")({
  head: () =>
    meta(
      "Admin Dashboard",
      "Manage JYC Connect events, hubs, announcements, media and site settings.",
    ),
  component: AdminDashboard,
});

type Tab = "overview" | "events" | "hubs" | "announcements" | "stories" | "media" | "site";
const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "hubs", label: "Hubs", icon: Users },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "stories", label: "JYC Stories", icon: BookOpen },
  { id: "media", label: "Media library", icon: Image },
  { id: "site", label: "Site settings", icon: Settings },
];

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const client = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: api.getProfile, retry: false });
  const overview = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: api.getAdminOverview,
    enabled: profile.data?.role === "ADMIN",
  });
  const events = useQuery({
    queryKey: ["admin", "events"],
    queryFn: api.getAdminEvents,
    enabled: profile.data?.role === "ADMIN",
  });
  const hubs = useQuery({
    queryKey: ["hubs"],
    queryFn: api.getHubs,
    enabled: profile.data?.role === "ADMIN",
  });
  const announcements = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: api.getAdminAnnouncements,
    enabled: profile.data?.role === "ADMIN",
  });
  const stories = useQuery({
    queryKey: ["admin", "stories"],
    queryFn: api.getAdminStories,
    enabled: profile.data?.role === "ADMIN",
  });
  const gallery = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: api.getAdminGallery,
    enabled: profile.data?.role === "ADMIN",
  });
  const council = useQuery({
    queryKey: ["council"],
    queryFn: api.getCouncil,
    enabled: profile.data?.role === "ADMIN",
  });

  useEffect(() => {
    if (profile.error instanceof ApiError && profile.error.status === 401)
      void navigate({ to: "/login" });
  }, [profile.error, navigate]);
  const refresh = async (...keys: string[][]) => {
    await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
  };
  const run = async (action: () => Promise<unknown>, message: string, keys: string[][] = []) => {
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      await refresh(...keys);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The action could not be completed.");
    }
  };
  const runStoryAction = async (action: () => Promise<unknown>, message: string, keys: string[][] = []) => {
    let succeeded = false;
    await run(async () => { await action(); succeeded = true; }, message, keys);
    return succeeded;
  };
  async function logout() {
    await api.logout();
    client.clear();
    await navigate({ to: "/login", replace: true });
  }

  if (profile.isLoading)
    return (
      <div className="min-h-screen bg-background">
        <Loading label="Checking administrator access…" />
      </div>
    );
  if (!profile.data)
    return (
      <div className="container-page py-16">
        <ErrorMessage
          message={
            profile.error instanceof Error ? profile.error.message : "Please log in to continue."
          }
        />
        <Link to="/login" className="mt-4 inline-block font-semibold text-brand">
          Go to login
        </Link>
      </div>
    );
  if (profile.data.role !== "ADMIN")
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-brand" />
          <h1 className="mt-4 text-2xl font-bold">Admin access required</h1>
          <p className="mt-2 text-muted-foreground">
            This account does not have administrator permissions.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    );

  const nav = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Admin dashboard">
      <div className="mb-7">
        <Logo />
      </div>
      <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Administration
      </p>
      {tabs.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setTab(item.id);
            setMenuOpen(false);
          }}
          aria-current={tab === item.id ? "page" : undefined}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground"
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
      <Link
        to="/about"
        className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent"
      >
        Faculty coordinator
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:block">{nav}</aside>
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-navy/50"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative h-full w-72 bg-sidebar">{nav}</aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b bg-card px-4 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open admin menu"
            >
              <Menu />
            </button>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-brand">JYC Connect</p>
              <h1 className="text-lg font-bold">{tabs.find((item) => item.id === tab)?.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {profile.data.fullName}
            </span>
            <Link to="/" className="text-sm font-semibold text-brand">
              View site
            </Link>
          </div>
        </header>
        <main key={tab} className="page-enter mx-auto max-w-6xl space-y-6 p-4 sm:p-7">
          {(notice || error) && (
            <div className="space-y-2">
              {notice && (
                <p
                  role="status"
                  className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
                >
                  {notice}
                </p>
              )}
              {error && <ErrorMessage message={error} />}
            </div>
          )}
          {tab === "overview" && (
            <Overview
              data={overview.data}
              isLoading={overview.isLoading}
              events={events.data ?? []}
              announcements={announcements.data ?? []}
            />
          )}
          {tab === "events" && (
            <EventsPanel events={events.data ?? []} hubs={hubs.data ?? []} onAction={run} />
          )}
          {tab === "hubs" && <HubsPanel hubs={hubs.data ?? []} onAction={run} />}
          {tab === "announcements" && (
            <AnnouncementsPanel items={announcements.data ?? []} onAction={run} />
          )}
          {tab === "stories" && (
            <StoriesPanel items={stories.data ?? []} onAction={runStoryAction} />
          )}
          {tab === "media" && (
            <MediaPanel
              images={gallery.data ?? []}
              hubs={hubs.data ?? []}
              council={council.data ?? []}
              onAction={run}
            />
          )}
          {tab === "site" && <SitePanel onAction={run} />}
        </main>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="interactive-card min-w-0 rounded-2xl border bg-card p-5 shadow-card sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Overview({
  data,
  isLoading,
  events,
  announcements,
}: {
  data: AdminOverview | undefined;
  isLoading: boolean;
  events: AdminEvent[];
  announcements: AdminAnnouncement[];
}) {
  if (isLoading) return <Loading label="Loading admin overview…" />;
  if (!data) return <ErrorMessage message="Couldn't load the admin overview." />;
  const cards = [
    { label: "Students", value: data.students, icon: Users },
    { label: "Events", value: data.events, icon: CalendarDays },
    { label: "Hubs", value: data.hubs, icon: LayoutDashboard },
    { label: "Announcements", value: data.announcements, icon: Bell },
  ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-5 shadow-card">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>
      <Panel
        title="Recently updated events"
        description="Check event dates and publishing status."
      >
        {events.length ? (
          <div className="divide-y">
            {events.slice(0, 6).map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(event.date)}{event.category && ` · ${event.category}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${event.published ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {event.published ? "Published" : "Draft"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No events yet"
            text="Create your first event from the Events section."
          />
        )}
      </Panel>
      <Panel title="Published announcements" description="The latest announcements visible to students and visitors.">
        {announcements.filter((item) => item.published).length ? (
          <div className="divide-y">
            {announcements.filter((item) => item.published).slice(0, 5).map((item) => (
              <article key={item.id} className="py-3">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.date)}</p>
                {item.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.body}</p>}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No published announcements" text="Published announcements will appear here." />
        )}
      </Panel>
    </>
  );
}

function EventsPanel({
  events,
  hubs,
  onAction,
}: {
  events: AdminEvent[];
  hubs: { id: string; name: string }[];
  onAction: (action: () => Promise<unknown>, message: string, keys?: string[][]) => Promise<void>;
}) {
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const empty = {
    title: "",
    hubId: hubs[0]?.id ?? "",
    category: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    summary: "",
    description: "",
    highlights: "",
    registrationFormUrl: "",
    published: false,
    imageFile: null as File | null,
  };
  const [form, setForm] = useState(empty);
  useEffect(() => {
    const firstHub = hubs[0];
    if (!form.hubId && firstHub) setForm((old) => ({ ...old, hubId: firstHub.id }));
  }, [hubs, form.hubId]);
  function startEdit(event: AdminEvent) {
    setEditing(event);
    setForm({
      title: event.title,
      hubId: event.hubId,
      category: event.category,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue,
      summary: event.summary,
      description: event.description,
      highlights: event.highlights.join("\n"),
      registrationFormUrl: event.registrationFormUrl ?? "",
      published: event.published,
      imageFile: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { imageFile, ...eventForm } = form;
    const payload = {
      ...eventForm,
      registrationFormUrl: form.registrationFormUrl.trim() || null,
      highlights: form.highlights
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    await onAction(
      async () => {
        const saved = editing
          ? await api.updateEvent(editing.id, payload)
          : await api.createEvent(payload);
        if (imageFile) await api.uploadMedia("event", saved.id, imageFile, `${saved.title} poster`);
      },
      editing ? "Event updated." : "Event created.",
      [["admin", "events"], ["events"], ["admin", "overview"]],
    );
    setSaving(false);
    setEditing(null);
    setForm({ ...empty, hubId: hubs[0]?.id ?? "", imageFile: null });
  }
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.85fr)]">
      <Panel title="Events" description="Manage published events and drafts.">
        {events.length ? (
          <div className="divide-y">
            {events.map((event) => (
              <article
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(event.date)} · {event.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.published ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                  >
                    {event.published ? "Published" : "Draft"}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(event)}
                    className="rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-accent"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Delete “${event.title}”? Its JYC registrations will also be deleted.`)) return;
                      if (editing?.id === event.id) setEditing(null);
                      void onAction(
                        () => api.deleteEvent(event.id),
                        "Event and its JYC registrations deleted.",
                        [["admin", "events"], ["events"], ["dashboard"], ["admin", "overview"]],
                      );
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No events found" />
        )}
      </Panel>
      <Panel
        title={editing ? "Edit event" : "Create event"}
        description="Add the event details; save as a draft or publish it."
      >
        <form className="grid gap-3" onSubmit={(e) => void submit(e)}>
          <Field
            id="event-title"
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <label className="grid gap-1.5 text-sm font-medium">
            <span>Hub<RequiredMark /></span>
            <select
              required
              value={form.hubId}
              onChange={(e) => setForm({ ...form, hubId: e.target.value })}
              className="rounded-lg border border-input bg-card px-3 py-2.5"
            >
              {hubs.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            id="event-registration-form"
            label="Event Google Form URL"
            type="url"
            required={form.published}
            placeholder="https://docs.google.com/forms/d/e/.../viewform"
            value={form.registrationFormUrl}
            onChange={(e) => setForm({ ...form, registrationFormUrl: e.target.value })}
          />
          <DeviceImagePicker
            id="event-poster"
            label="Event poster (optional)"
            imageUrl={editing?.imageUrl ?? null}
            file={form.imageFile}
            onChange={(imageFile) => setForm({ ...form, imageFile })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="event-category"
              label="Category (optional)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Field
              id="event-date"
              label="Date"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="event-start"
              label="Start time (optional)"
              placeholder="10:00 AM"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <Field
              id="event-end"
              label="End time (optional)"
              placeholder="4:00 PM"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <Field
            id="event-venue"
            label="Venue (optional)"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
          />
          <Field
            id="event-summary"
            label="Short summary (optional)"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
          <label className="grid gap-1.5 text-sm font-medium">
            <span>Description <span className="font-normal text-muted-foreground">(optional)</span></span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-lg border border-input bg-card px-3 py-2.5"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Highlights <span className="font-normal text-muted-foreground">One per line</span>
            <textarea
              rows={3}
              value={form.highlights}
              onChange={(e) => setForm({ ...form, highlights: e.target.value })}
              className="rounded-lg border border-input bg-card px-3 py-2.5"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.published}
              disabled={!form.registrationFormUrl.trim() && !form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />{" "}
            Publish event now
          </label>
          {!form.registrationFormUrl.trim() && (
            <p className={`text-sm ${form.published ? "text-destructive" : "text-muted-foreground"}`}>
              Add this event’s Google Form URL before publishing it.
            </p>
          )}
          <div className="flex gap-2">
            <button
              disabled={saving || !hubs.length}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Create event"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm({ ...empty, hubId: hubs[0]?.id ?? "", imageFile: null });
                }}
                className="rounded-lg border px-4 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </Panel>
    </div>
  );
}

function HubsPanel({
  hubs,
  onAction,
}: {
  hubs: Hub[];
  onAction: (action: () => Promise<unknown>, message: string, keys?: string[][]) => Promise<void>;
}) {
  const [editingHubId, setEditingHubId] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    name: "",
    tagline: "",
    description: "",
    icon: "globe",
    councilGroup: "",
    imageFile: null as File | null,
  });
  const [saving, setSaving] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onAction(
      async () => {
        const { imageFile, ...hubForm } = form;
        const created = await api.createHub(hubForm);
        if (imageFile) await api.uploadMedia("hub", created.id, imageFile, `${created.name} preview`);
      },
      "Hub created.",
      [["hubs"], ["admin", "overview"]],
    );
    setSaving(false);
    setForm({
      id: "",
      name: "",
      tagline: "",
      description: "",
      icon: "globe",
      councilGroup: "",
      imageFile: null,
    });
  }
  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Panel title="Existing hubs">
        {hubs.length ? (
          <div className="divide-y">
            {hubs.map((hub) => (
              <div key={hub.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{hub.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {hub.tagline} · ID: {hub.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingHubId(editingHubId === hub.id ? null : hub.id)}
                    className="rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-accent"
                  >
                    {editingHubId === hub.id ? "Close" : "Edit details"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Delete “${hub.name}”? A hub with events cannot be deleted.`)) return;
                      if (editingHubId === hub.id) setEditingHubId(null);
                      void onAction(
                        () => api.deleteHub(hub.id),
                        "Hub deleted.",
                        [["hubs"], ["admin", "overview"]],
                      );
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
                {editingHubId === hub.id && (
                  <HubEditForm hub={hub} onAction={onAction} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No hubs yet" />
        )}
      </Panel>
      <Panel title="Create hub" description="The hub ID is used in links and should be unique.">
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <Field
            id="hub-id"
            label="ID / URL slug"
            required
            placeholder="for example, visual-art"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
          <Field
            id="hub-name"
            label="Hub name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Field
            id="hub-tagline"
            label="Tagline"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
          <Field
            id="hub-icon"
            label="Icon key"
            required
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
          <Field
            id="hub-group"
            label="Council group"
            required
            value={form.councilGroup}
            onChange={(e) => setForm({ ...form, councilGroup: e.target.value })}
          />
          <DeviceImagePicker
            id="new-hub-image"
            label="Hub photo (optional)"
            imageUrl={null}
            file={form.imageFile}
            onChange={(imageFile) => setForm({ ...form, imageFile })}
            onRemove={() => setForm({ ...form, imageFile: null })}
          />
          <label className="grid gap-1.5 text-sm font-medium">
            <span>Description<RequiredMark /></span>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-lg border border-input bg-card px-3 py-2.5"
            />
          </label>
          <button
            disabled={saving}
            className="w-fit rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create hub"}
          </button>
        </form>
      </Panel>
    </div>
  );
}

function HubEditForm({
  hub,
  onAction,
}: {
  hub: Hub;
  onAction: (action: () => Promise<unknown>, message: string, keys?: string[][]) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: hub.name,
    tagline: hub.tagline,
    description: hub.description,
    icon: hub.icon,
    councilGroup: hub.councilGroup,
    imageFile: null as File | null,
    removeImage: false,
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm({
    name: hub.name,
    tagline: hub.tagline,
    description: hub.description,
    icon: hub.icon,
    councilGroup: hub.councilGroup,
    imageFile: null,
    removeImage: false,
  }), [hub]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onAction(
      async () => {
        const { imageFile, removeImage, ...hubForm } = form;
        await api.updateHub(hub.id, { ...hubForm, ...(removeImage ? { imageUrl: null } : {}) });
        if (imageFile) await api.uploadMedia("hub", hub.id, imageFile, `${hub.name} preview`);
      },
      `${hub.name} updated.`,
      [["hubs"], ["events"], ["admin", "events"], ["admin", "overview"]],
    );
    setSaving(false);
  }
  return (
    <form onSubmit={(e) => void submit(e)} className="mt-4 grid gap-3 rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">Hub ID / URL slug: {hub.id} (cannot be changed)</p>
      <Field id={`hub-name-${hub.id}`} label="Hub name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Field id={`hub-tagline-${hub.id}`} label="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
      <Field id={`hub-icon-${hub.id}`} label="Icon key" required value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
      <Field id={`hub-group-${hub.id}`} label="Council group" required value={form.councilGroup} onChange={(e) => setForm({ ...form, councilGroup: e.target.value })} />
      <DeviceImagePicker
        id={`hub-image-${hub.id}`}
        label="Hub photo (optional)"
        imageUrl={form.removeImage ? null : hub.imageUrl ?? null}
        file={form.imageFile}
        onChange={(imageFile) => setForm({ ...form, imageFile, removeImage: false })}
        onRemove={() => setForm({ ...form, imageFile: null, removeImage: Boolean(hub.imageUrl) })}
      />
      <label className="grid gap-1.5 text-sm font-medium">
        <span>Description<RequiredMark /></span>
        <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-input bg-card px-3 py-2.5" />
      </label>
      <button disabled={saving} className="w-fit rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
        {saving ? "Saving…" : "Save hub details"}
      </button>
    </form>
  );
}

function DeviceImagePicker({
  id,
  label,
  imageUrl,
  file,
  onChange,
  onRemove,
}: {
  id: string;
  label: string;
  imageUrl: string | null;
  file: File | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
}) {
  const [localPreview, setLocalPreview] = useState("");
  useEffect(() => {
    if (!file) {
      setLocalPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function chooseFile(candidate?: File) {
    if (!candidate) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(candidate.type)) {
      alert("Choose a JPEG, PNG, WebP, or GIF photo.");
      return;
    }
    if (candidate.size > 8 * 1024 * 1024) {
      alert("Choose an image smaller than 8 MB.");
      return;
    }
    onChange(candidate);
  }
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <ImageCropPicker id={id} label="Choose from device" aspect={16 / 9} onCrop={chooseFile} />
      <p className="text-xs text-muted-foreground">Choose a photo, then adjust its zoom and position in the crop preview before upload. Maximum 8 MB.</p>
      {onRemove && (file || imageUrl) && (
        <button type="button" onClick={onRemove} className="w-fit rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/5">
          Remove photo
        </button>
      )}
      {(localPreview || imageUrl) && (
        <Img src={localPreview || imageUrl} alt={label.replace(" (optional)", "")} className="aspect-video w-full max-w-sm rounded-lg" />
      )}
    </div>
  );
}

function AnnouncementsPanel({
  items,
  onAction,
}: {
  items: { id: string; title: string; body: string | null; date: string; published: boolean }[];
  onAction: (action: () => Promise<unknown>, message: string, keys?: string[][]) => Promise<void>;
}) {
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [form, setForm] = useState({
    title: "",
    body: "",
    date: new Date().toISOString().slice(0, 10),
    published: true,
  });
  const [saving, setSaving] = useState(false);
  function startEdit(item: AdminAnnouncement) {
    setEditing(item);
    setForm({
      title: item.title,
      body: item.body ?? "",
      date: item.date,
      published: item.published,
    });
  }
  function cancelEdit() {
    setEditing(null);
    setForm({ title: "", body: "", date: new Date().toISOString().slice(0, 10), published: true });
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onAction(
      () => (editing ? api.updateAnnouncement(editing.id, form) : api.createAnnouncement(form)),
      editing ? "Announcement updated." : "Announcement created.",
      [
      ["admin", "announcements"],
      ["announcements"],
      ["admin", "overview"],
      ],
    );
    setSaving(false);
    cancelEdit();
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Panel title="Announcements" description="Drafts remain private until published.">
        {items.length ? (
          <div className="grid gap-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.title}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.published ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                  >
                    {item.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.date)}</p>
                {item.body && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.body}</p>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="mt-3 rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(`Delete announcement “${item.title}”?`)) return;
                    if (editing?.id === item.id) cancelEdit();
                    void onAction(
                      () => api.deleteAnnouncement(item.id),
                      "Announcement deleted.",
                      [["admin", "announcements"], ["announcements"], ["dashboard"], ["admin", "overview"]],
                    );
                  }}
                  className="ml-2 mt-3 inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No announcements yet" />
        )}
      </Panel>
      <Panel title={editing ? "Edit announcement" : "New announcement"}>
        <form onSubmit={(e) => void submit(e)} className="grid min-w-0 gap-3">
          <Field
            id="announcement-title"
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <label className="grid gap-1.5 text-sm font-medium">
            Message
            <textarea
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Share the important news or invitation…"
              className="min-h-28 w-full min-w-0 max-w-full resize-y rounded-xl border border-input bg-card px-3 py-3.5 leading-7"
            />
            <span className="-mt-1 text-xs leading-5 text-muted-foreground">For event details, put each on its own line, like <span className="font-semibold text-foreground">Date - 24 Oct 2026</span> and <span className="font-semibold text-foreground">Venue - Main Ground</span>. They’ll appear as styled detail cards.</span>
          </label>
          <div className="admin-announcement-preview min-w-0 overflow-hidden rounded-2xl border border-brand/10 bg-accent/30 p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-navy"><Bell className="h-4 w-4 text-brand" /> Public preview</div>
            <AnnouncementCard title={form.title || "Your announcement title"} body={form.body} date={form.date} featured />
          </div>
          <Field
            id="announcement-date"
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />{" "}
            Publish now
          </label>
          <button
            disabled={saving}
            className="w-fit rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Save announcement" : "Create announcement"}
          </button>
          {editing && (
            <button type="button" onClick={cancelEdit} className="w-fit rounded-lg border px-4 py-2.5 text-sm font-semibold">
              Cancel edit
            </button>
          )}
        </form>
      </Panel>
    </div>
  );
}

function StoriesPanel({
  items,
  onAction,
}: {
  items: JycStory[];
  onAction: (action: () => Promise<unknown>, message: string, keys?: string[][]) => Promise<boolean>;
}) {
  const freshDate = () => new Date().toISOString().slice(0, 10);
  const blankForm = () => ({ title: "", category: "Campus Life", summary: "", content: "", date: freshDate(), published: false });
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState<JycStory | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const publishedCount = items.filter((item) => item.published).length;
  function reset() { setEditing(null); setForm(blankForm()); setCoverFile(null); setPhotoFiles([]); }
  function editStory(item: JycStory) {
    setEditing(item);
    setForm({ title: item.title, category: item.category, summary: item.summary, content: item.content, date: item.date, published: item.published });
    setCoverFile(null);
    setPhotoFiles([]);
  }
  function validImage(file: File) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) { alert("Choose a JPEG, PNG, WebP, or GIF image."); return false; }
    if (file.size > 8 * 1024 * 1024) { alert("Each image must be 8 MB or smaller."); return false; }
    return true;
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing && !coverFile) { alert("Choose a cover image for this story."); return; }
    setSaving(true);
    let savedStory: JycStory | null = editing;
    let uploadedPhotoCount = 0;
    let coverUploaded = false;
    const success = await onAction(async () => {
      savedStory = editing
        ? await api.updateStory(editing.id, form)
        : await api.createStory(form);
      if (coverFile && savedStory) { await api.uploadStoryCover(savedStory.id, coverFile); coverUploaded = true; }
      for (const file of photoFiles) {
        if (!savedStory) break;
        await api.uploadStoryPhoto(savedStory.id, file, file.name.replace(/\.[^.]+$/, ""));
        uploadedPhotoCount += 1;
      }
    }, editing ? "Story updated." : "Story created.", [["admin", "stories"], ["stories"]]);
    setSaving(false);
    if (success) reset();
    else if (savedStory) {
      setEditing(savedStory);
      if (coverUploaded) setCoverFile(null);
      if (uploadedPhotoCount) setPhotoFiles((files) => files.slice(uploadedPhotoCount));
    }
  }
  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Panel title="JYC Stories" description="Event recaps and campus highlights. Drafts stay private until published." action={<span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand">{items.length} {items.length === 1 ? "story" : "stories"}</span>}>
        {items.length ? <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => <article key={item.id} className="story-admin-card interactive-card group min-w-0 overflow-hidden rounded-2xl border bg-card shadow-card">
            <div className="relative aspect-[16/9] overflow-hidden bg-gradient-navy">
              {item.coverImageUrl ? <img src={item.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <BookOpen className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/60" />}
              <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${item.published ? "bg-success text-white" : "bg-white/90 text-muted-foreground"}`}>{item.published ? "Live" : "Draft"}</span>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand">{item.category} · {formatDate(item.date)}</p>
              <h3 className="mt-2 line-clamp-2 font-display text-lg font-bold leading-tight text-navy">{item.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.summary}</p>
              <label className="mt-3 grid gap-1 text-xs font-semibold text-muted-foreground">Homepage spot
                <select disabled={!item.published} value={item.homepageOrder?.toString() ?? ""} onChange={(event) => { const value = event.currentTarget.value; void onAction(() => api.setStoryHomepageOrder(item.id, value ? Number(value) : null), value ? `Story assigned homepage spot ${value}.` : "Story unpinned from the homepage.", [["admin", "stories"], ["stories"]]); }} className="w-full rounded-lg border bg-card px-2.5 py-2 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">Not pinned</option><option value="1">Pin to spot 1</option><option value="2">Pin to spot 2</option><option value="3">Pin to spot 3</option>
                </select>
              </label>
              {!item.published && <p className="mt-1 text-[11px] text-muted-foreground">Publish the story before pinning it.</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => editStory(item)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-accent">Edit</button>
                {item.published && <Link to="/stories/$storyId" params={{ storyId: item.id }} className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-brand hover:bg-accent">View</Link>}
                <button type="button" onClick={() => { if (confirm(`Delete “${item.title}” and its photos?`)) void onAction(() => api.deleteStory(item.id), "Story deleted.", [["admin", "stories"], ["stories"]]); }} className="ml-auto rounded-lg border border-destructive/25 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/5">Delete</button>
              </div>
            </div>
          </article>)}
        </div> : <EmptyState title="No stories yet" text="Create a story to share what happened at a JYC event or around campus." />}
      </Panel>
      <Panel title={editing ? "Edit story" : "Create a story"} description="Write the recap, add photos, then publish when it’s ready.">
        <form onSubmit={(event) => void submit(event)} className="grid min-w-0 gap-4">
          <Field id="story-title" label="Story title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Freshers 2026: A day to remember" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="story-category" label="Category" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Campus Life, Events…" />
            <Field id="story-date" label="Event date" type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </div>
          <label className="grid gap-1.5 text-sm font-medium">Short introduction
            <textarea required minLength={10} maxLength={500} rows={2} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="A short line that makes people want to read the story…" className="w-full min-w-0 resize-y rounded-xl border border-input bg-card px-3 py-3 leading-6" />
            <span className="text-xs text-muted-foreground">{form.summary.length}/500 characters</span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Full story
            <textarea required minLength={20} maxLength={50000} rows={8} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Tell readers what happened, who took part, and what made the day special. Use a blank line between paragraphs." className="w-full min-w-0 resize-y rounded-xl border border-input bg-card px-3 py-3 leading-7" />
            <span className="text-xs text-muted-foreground">Separate paragraphs with a blank line. {form.content.length}/50,000 characters.</span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Cover image {editing?.coverImageUrl && <span className="font-normal text-muted-foreground">(upload a new image to replace it)</span>}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" required={!editing && !coverFile} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file && validImage(file)) setCoverFile(file); event.currentTarget.value = ""; }} className="w-full min-w-0 rounded-xl border bg-card p-2 text-sm" />
            <span className="text-xs text-muted-foreground">JPG, PNG, WebP, or GIF up to 8 MB. {coverFile ? `Selected: ${coverFile.name}` : "A cover is required."}</span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Story photo gallery <span className="font-normal text-muted-foreground">(optional, up to 20 photos)</span>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const chosen = Array.from(event.currentTarget.files ?? []).filter(validImage); const remaining = Math.max(0, 20 - (editing?.photos.length ?? 0) - photoFiles.length); if (chosen.length > remaining) alert(`You can add ${remaining} more photo${remaining === 1 ? "" : "s"}.`); setPhotoFiles((files) => [...files, ...chosen.slice(0, remaining)]); event.currentTarget.value = ""; }} className="w-full min-w-0 rounded-xl border bg-card p-2 text-sm" />
            <span className="text-xs text-muted-foreground">Each image can be up to 8 MB. {photoFiles.length ? `${photoFiles.length} new photo${photoFiles.length === 1 ? "" : "s"} selected.` : ""}</span>
          </label>
          {editing?.photos.length ? <div className="grid grid-cols-3 gap-2">{editing.photos.map((photo) => <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl"><img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" /><button type="button" aria-label="Remove story photo" onClick={() => void onAction(() => api.deleteStoryPhoto(editing.id, photo.id), "Photo removed.", [["admin", "stories"], ["stories"]])} className="absolute right-1.5 top-1.5 rounded-full bg-navy/75 px-2 py-1 text-xs font-bold text-white">Remove</button></div>)}</div> : null}
          <label className="flex items-center gap-2 rounded-xl border bg-accent/30 p-3 text-sm font-semibold"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Publish this story on the public site</label>
          {!form.published && publishedCount > 0 && <p className="-mt-2 text-xs text-muted-foreground">Leave unchecked to save this as a private draft.</p>}
          <div className="flex flex-wrap gap-3">
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lift transition hover:-translate-y-0.5 disabled:opacity-50"><BookOpen className="h-4 w-4" />{saving ? "Saving story…" : editing ? "Save changes" : form.published ? "Publish story" : "Save draft"}</button>
            {editing && <button type="button" onClick={reset} className="rounded-xl border px-5 py-3 text-sm font-semibold">Cancel</button>}
          </div>
        </form>
      </Panel>
    </div>
  );
}

function MediaPanel({
  images,
  hubs,
  council,
  onAction,
}: {
  images: GalleryImage[];
  hubs: { id: string; name: string }[];
  council: { enrollment: string; name: string; designation: string; photoUrl?: string | null }[];
  onAction: (action: () => Promise<unknown>, message: string, keys?: string[][]) => Promise<void>;
}) {
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [galleryHubId, setGalleryHubId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [uploading, setUploading] = useState(false);
  const selectable = council.map((member) => ({
    id: member.enrollment,
    name: `${member.name} — ${member.designation}`,
  }));
  useEffect(() => {
    if (!selectable.some((item) => item.id === targetId)) setTargetId(selectable[0]?.id ?? "");
  }, [selectable, targetId]);
  async function uploadGallery(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Choose an image smaller than 8 MB.");
      return;
    }
    setUploading(true);
    try {
      await onAction(
        async () => {
          await api.uploadGalleryImage(
            file,
            alt || "JYC gallery image",
            caption || undefined,
            category || undefined,
            galleryHubId || undefined,
          );
          setAlt("");
          setCaption("");
          setCategory("");
          setGalleryHubId("");
        },
        "Image added to the gallery.",
        [["admin", "gallery"], ["gallery"]],
      );
    } finally {
      setUploading(false);
    }
  }
  async function attach(file?: File) {
    if (!file || !targetId) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Choose an image smaller than 8 MB.");
      return;
    }
    setUploading(true);
    await onAction(
      () => api.uploadMedia("council", targetId, file, alt || undefined),
      "Council member photo updated.",
      [["council"]],
    );
    setUploading(false);
  }
  async function removeCouncilPhoto() {
    if (!targetId || !window.confirm("Remove this council member's photo?")) return;
    setUploading(true);
    await onAction(
      () => api.deleteCouncilMemberPhoto(targetId),
      "Council member photo removed.",
      [["council"]],
    );
    setUploading(false);
  }
  const filePicker = (id: string, label: string, aspect: number, onPick: (file?: File) => void) => (
    <ImageCropPicker id={id} label={uploading ? "Uploading…" : label} aspect={aspect} disabled={uploading} onCrop={onPick} />
  );
  return (
    <div className="space-y-6">
      <Panel
        title="Upload media"
        description="Upload photos to the Life at JYC gallery or to a specific hub gallery. Event posters and hub photos are managed in their own sections; council member photos are managed here. Maximum size: 8 MB."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border p-4">
            <h3 className="font-semibold">Gallery image</h3>
            <label className="grid gap-1.5 text-sm font-medium">
              Gallery collection
              <select
                value={galleryHubId}
                onChange={(e) => setGalleryHubId(e.target.value)}
                className="rounded-lg border border-input bg-card px-3 py-2.5"
              >
                <option value="">Life at JYC (all-site gallery)</option>
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>{hub.name}</option>
                ))}
              </select>
            </label>
            <Field
              id="gallery-alt"
              label="Image description"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
            <Field
              id="gallery-caption"
              label="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <Field
              id="gallery-category"
              label="Category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            {filePicker("gallery-upload", "Choose image", 4 / 3, (file) => void uploadGallery(file))}
          </div>
          <div className="space-y-3 rounded-xl border p-4">
            <h3 className="font-semibold">Council member photo</h3>
            <label className="grid gap-1.5 text-sm font-medium">
              Council member
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="rounded-lg border border-input bg-card px-3 py-2.5"
              >
                {selectable.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            {council.find((member) => member.enrollment === targetId)?.photoUrl && (
              <Img
                src={council.find((member) => member.enrollment === targetId)?.photoUrl ?? null}
                alt={`${council.find((member) => member.enrollment === targetId)?.name ?? "Council member"} photo`}
                className="aspect-video w-full max-w-sm rounded-lg"
              />
            )}
            {filePicker("council-photo-upload", "Choose image", 1, (file) => void attach(file))}
            {council.find((member) => member.enrollment === targetId)?.photoUrl && (
              <button
                type="button"
                onClick={() => void removeCouncilPhoto()}
                disabled={uploading}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {uploading ? "Removing…" : "Remove photo"}
              </button>
            )}
          </div>
        </div>
      </Panel>
      <Panel
        title="Gallery"
        description={`${images.length} image${images.length === 1 ? "" : "s"} in the public gallery`}
      >
        {images.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {images.map((image) => (
              <article key={image.id} className="overflow-hidden rounded-xl border">
                <Img src={image.url} alt={image.alt} className="aspect-[4/3] w-full" />
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{image.caption || image.alt}</p>
                    <p className="text-xs text-muted-foreground">
                      {image.category || "Uncategorized"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Remove this image from the gallery?"))
                        void onAction(
                          () => api.deleteGalleryImage(image.id),
                          "Gallery image deleted.",
                          [["admin", "gallery"], ["gallery"]],
                        );
                    }}
                    aria-label={`Delete ${image.alt}`}
                    className="rounded-md p-2 text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="The gallery is empty"
            text="Upload an image above to add it to the public gallery."
          />
        )}
      </Panel>
    </div>
  );
}

function SitePanel({
  onAction,
}: {
  onAction: (action: () => Promise<unknown>, message: string, keys?: string[][]) => Promise<void>;
}) {
  const [slot, setSlot] = useState<"hero" | "login" | "register" | "about" | "campus">("hero");
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const asset = useQuery({
    queryKey: ["site-asset", slot],
    queryFn: () => api.getSiteAsset(slot),
    retry: false,
  });
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Choose an image smaller than 8 MB.");
      return;
    }
    setUploading(true);
    await onAction(
      () => api.uploadSiteAsset(slot, file),
      `${slot.charAt(0).toUpperCase()}${slot.slice(1)} background updated.`,
      [["site-asset", slot]],
    );
    setUploading(false);
  }
  async function removeBackground() {
    if (!window.confirm("Remove this page's custom background image and restore its default?")) return;
    setRemoving(true);
    await onAction(
      () => api.deleteSiteAsset(slot),
      `${slot.charAt(0).toUpperCase()}${slot.slice(1)} background removed.`,
      [["site-asset", slot]],
    );
    setRemoving(false);
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Panel
        title="Page backgrounds"
        description="Replace the image used in a page’s hero or auth panel."
      >
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Page
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as typeof slot)}
              className="rounded-lg border border-input bg-card px-3 py-2.5"
            >
              {(
                [
                  ["hero", "Home page"],
                  ["login", "Login"],
                  ["register", "Registration"],
                  ["about", "About JYC"],
                  ["campus", "Campus"],
                ] as const
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-3">
          <ImageCropPicker id="site-background-upload" label={uploading ? "Uploading…" : "Choose background image"} aspect={16 / 9} disabled={uploading || removing} onCrop={(file) => void upload(file)} />
          {asset.data && (
            <button
              type="button"
              onClick={() => void removeBackground()}
              disabled={uploading || removing}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-destructive px-4 py-2.5 text-sm font-semibold text-destructive disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {removing ? "Removing…" : "Remove background"}
            </button>
          )}
          </div>
          {asset.data ? (
            <div className="max-w-sm rounded-xl border p-2">
              <Img src={asset.data.url} alt={asset.data.alt || `${slot} page background`} className="aspect-video w-full rounded-lg" />
              <p className="px-1 pt-2 text-xs text-muted-foreground">Current background for this page</p>
            </div>
          ) : !asset.isLoading ? (
            <p className="text-xs text-muted-foreground">No custom background is set; the page default is active.</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP or GIF, up to 8 MB. Changes become visible on the selected page.
          </p>
        </div>
      </Panel>
      <Panel
        title="Faculty coordinator"
        description="Update the displayed coordinator details and photo."
      >
        <p className="text-sm text-muted-foreground">
          The About JYC page contains the editor for faculty coordinator name, designation, and
          photo.
        </p>
        <Link
          to="/about"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-accent"
        >
          Open About JYC <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">
          Council member photos can be uploaded from the Council page.
        </p>
        <Link to="/council" className="mt-2 inline-block text-sm font-semibold text-brand">
          Open council →
        </Link>
      </Panel>
    </div>
  );
}
