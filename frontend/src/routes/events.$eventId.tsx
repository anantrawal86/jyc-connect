import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin } from "lucide-react";
import { api } from "@/services/api";
import { EmptyState, ErrorMessage, formatDate, Img, Loading, SiteLayout } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/events/$eventId")({
  head: () => meta("Event Details", "Event details, schedule, venue and registration at JYC."),
  component: EventDetail,
});

function EventDetail() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const ev = useQuery({ queryKey: ["event", eventId], queryFn: () => api.getEvent(eventId) });
  const hubs = useQuery({ queryKey: ["hubs"], queryFn: api.getHubs });
  const profile = useQuery({ queryKey: ["profile"], queryFn: api.getProfile, retry: false });

  if (ev.isLoading)
    return (
      <SiteLayout>
        <Loading />
      </SiteLayout>
    );
  if (ev.error)
    return (
      <SiteLayout>
        <div className="container-page py-16">
          <ErrorMessage message={ev.error.message || "Couldn't load this event."} />
          <Link to="/events" className="mt-4 inline-block text-brand">
            ← Back to events
          </Link>
        </div>
      </SiteLayout>
    );
  if (!ev.data)
    return (
      <SiteLayout>
        <div className="container-page py-16">
          <EmptyState title="Event not found" />
          <Link to="/events" className="mt-4 inline-block text-brand">
            ← Back to events
          </Link>
        </div>
      </SiteLayout>
    );
  const e = ev.data;
  const hub = hubs.data?.find((h) => h.id === e.hubId);
  const formUrl = e.registrationFormUrl;
  function openRegistrationForm() {
    if (!formUrl) return;
    if (profile.data) {
      window.location.assign(formUrl);
      return;
    }
    sessionStorage.setItem("jyc-pending-registration-url", formUrl);
    void navigate({ to: "/login" });
  }

  return (
    <SiteLayout>
      <div className="container-page pt-6">
        <Link
          to="/events"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <Img
            src={e.imageUrl ?? null}
            alt={`${e.title} poster`}
            fit="contain"
            className="aspect-[4/3] w-full rounded-3xl bg-white p-2 shadow-card sm:p-4"
            label="Poster coming soon"
          />
          <div>
            {e.category && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{e.category}</span>}
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{e.title}</h1>
            <ul className="mt-4 space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-brand" />
                {formatDate(e.date)}
              </li>
              {(e.startTime || e.endTime) && <li className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand" />
                {e.startTime}{e.startTime && e.endTime ? " – " : ""}{e.endTime}
              </li>}
              {e.venue && <li className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand" />
                {e.venue}
              </li>}
            </ul>
            {e.status === "upcoming" && (
              <div className="mt-6 space-y-3">
                <button
                  onClick={openRegistrationForm}
                  disabled={!formUrl || hubs.isLoading}
                  className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 sm:w-auto"
                >
                  {hubs.isLoading ? "Loading form…" : "Open Registration Form →"}
                </button>
                {!hubs.isLoading && !formUrl && (
                  <p role="status" className="text-sm text-muted-foreground">
                    This hub has not added its Google registration form yet. Please contact the hub
                    coordinator.
                  </p>
                )}
              </div>
            )}
            {hub && (
              <p className="mt-6 text-sm">
                Organized by{" "}
                <Link
                  to="/hubs/$hubId"
                  params={{ hubId: hub.id }}
                  className="font-semibold text-brand"
                >
                  {hub.name}
                </Link>
              </p>
            )}
          </div>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <section>
            {e.description && <><h2 className="text-xl font-bold">About the Event</h2><p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">{e.description}</p></>}
            {!!e.highlights.length && <><h2 className="mt-8 text-xl font-bold">Event Highlights</h2><ul className="mt-3 space-y-2">{e.highlights.map((h) => <li key={h} className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-success" />{h}</li>)}</ul></>}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}
