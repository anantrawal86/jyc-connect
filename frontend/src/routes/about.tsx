import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Lightbulb, Sprout, Users, Award, Save } from "lucide-react";
import { ImageCropPicker } from "@/components/image-crop-picker";
import { api, ApiError } from "@/services/api";
import { useSiteImage } from "@/services/images";
import { COUNCIL_YEAR } from "@/data/council";
import { CouncilCard, EmptyState, ErrorMessage, HubIcon, Img, Loading, SiteLayout } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/about")({
  head: () => meta("About JYC", "JYC at Jaypee University, Anoopshahr — Empowering Leaders, Inspiring Change."),
  component: About,
});

function About() {
  const queryClient = useQueryClient();
  const hubs = useQuery({ queryKey: ["hubs"], queryFn: api.getHubs });
  const council = useQuery({ queryKey: ["council"], queryFn: api.getCouncil });
  const coordinator = useQuery({ queryKey: ["faculty-coordinator"], queryFn: api.getFacultyCoordinator });
  const currentUser = useQuery({ queryKey: ["profile"], queryFn: api.getProfile, retry: false, staleTime: 60_000 });
  const campus = useSiteImage("about");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (coordinator.data) {
      setName(coordinator.data.name);
      setDesignation(coordinator.data.designation);
    }
  }, [coordinator.data]);

  const saveProfile = useMutation({
    mutationFn: () => api.updateFacultyCoordinator({ name, designation }),
    onSuccess: async () => {
      setNotice("Faculty coordinator details saved.");
      await queryClient.invalidateQueries({ queryKey: ["faculty-coordinator"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not save the details."),
  });
  const uploadPhoto = useMutation({
    mutationFn: (file: File) => api.uploadFacultyCoordinatorPhoto(file),
    onSuccess: async () => {
      setNotice("Photo uploaded and updated.");
      await queryClient.invalidateQueries({ queryKey: ["faculty-coordinator"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not upload the photo."),
  });
  const isAdmin = currentUser.data?.role === "ADMIN";

  return (
    <SiteLayout>
      <section className="bg-muted/50 py-16 sm:py-20 lg:py-24">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">About JYC</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight text-navy sm:text-5xl">
              Building a Stronger Campus Community
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Jaypee Youth Club is the student body that brings together hubs, events and
              opportunities to help every student grow, connect and create a lasting impact. Ten
              hubs cover culture, technology, sports, arts, business, media, social work and more —
              so there is a place here for everyone.
            </p>
          </div>
          <Img
            src={campus}
            alt="Jaypee Youth Club and campus community"
            className="aspect-[4/3] w-full rounded-[1.5rem] shadow-lift sm:rounded-[2rem]"
            label="Choose an About JYC background in Admin → Site settings"
          />
        </div>
      </section>

      <section id="core-team" className="container-page mt-16 scroll-mt-24 sm:mt-20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">Core Team</p>
        <h2 className="mt-2 text-3xl font-extrabold text-navy">Student Council {COUNCIL_YEAR}</h2>
        {council.isLoading ? <Loading label="Loading the core team…" /> : council.error ? <ErrorMessage message="Couldn't load the core team." /> : !council.data?.length ? <EmptyState title="Core team information is not available yet" /> : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {council.data.slice(0, 4).map((member) => <CouncilCard key={member.enrollment} member={member} />)}
          </div>
        )}
      </section>

      <section id="our-mission" className="container-page mt-16 scroll-mt-24 sm:mt-20">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">Our Mission</p>
            <h2 className="mt-2 text-3xl font-extrabold text-navy">A place to grow, create, and belong</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">To provide a platform for students of Jaypee University, Anoopshahr to grow, collaborate and create a positive impact through cultural, technical, sports and academic activities.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[{ i: Award, l: "Leadership" }, { i: Lightbulb, l: "Creativity" }, { i: Users, l: "Community" }, { i: Sprout, l: "Growth" }].map((v) => (
              <div key={v.l} className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center shadow-card">
                <v.i className="h-6 w-6 text-brand" /><span className="text-sm font-semibold">{v.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <h2 className="text-2xl font-bold">Faculty Coordinator</h2>
        {coordinator.isLoading ? <Loading label="Loading faculty coordinator…" /> : coordinator.error ? <ErrorMessage message={coordinator.error instanceof ApiError && coordinator.error.status === 404 ? "Faculty coordinator details have not been added yet." : "Couldn't load faculty coordinator details."} /> : coordinator.data && (
          <div className="mt-5 grid items-center gap-6 rounded-2xl border bg-card p-5 shadow-card sm:grid-cols-[180px_1fr] sm:p-7">
            <Img src={coordinator.data.photoUrl} alt={coordinator.data.name} className="aspect-square w-40 rounded-2xl" label="Photo can be added by a JYC administrator" />
            <div>
              <h3 className="text-xl font-bold">{coordinator.data.name}</h3>
              <p className="mt-1 text-brand">{coordinator.data.designation}</p>
              {isAdmin && <div className="mt-5 grid max-w-xl gap-3">
                <label className="grid gap-1 text-sm font-medium">Name
                  <input className="rounded-lg border bg-background px-3 py-2" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="grid gap-1 text-sm font-medium">Role / designation
                  <input className="rounded-lg border bg-background px-3 py-2" value={designation} maxLength={160} onChange={(e) => setDesignation(e.target.value)} />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" disabled={saveProfile.isPending || name.trim().length < 2 || designation.trim().length < 2} onClick={() => { setNotice(""); saveProfile.mutate(); }} className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground disabled:opacity-50"><Save className="h-4 w-4" />{saveProfile.isPending ? "Saving…" : "Save details"}</button>
                  <ImageCropPicker id="faculty-coordinator-photo" label={uploadPhoto.isPending ? "Uploading…" : "Choose / replace photo"} aspect={1} disabled={uploadPhoto.isPending} onCrop={(file) => { setNotice(""); uploadPhoto.mutate(file); }} />
                </div>
                {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
                <p className="text-xs text-muted-foreground">Admin only. JPG, PNG, WebP, or GIF; maximum 8 MB. Replacing a photo updates the site image.</p>
              </div>}
            </div>
          </div>
        )}
      </section>

      <section className="container-page mt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Our Hubs</h2>
          <Link to="/hubs" className="text-sm font-semibold text-brand">Learn more →</Link>
        </div>
        {hubs.isLoading ? <Loading label="Loading hubs…" /> : hubs.error ? <ErrorMessage message="Couldn't load hubs." /> : !hubs.data?.length ? <EmptyState title="Hub information is not available yet" /> : <div className="mt-5 flex flex-wrap gap-3">
          {hubs.data.map((h) => (
            <Link key={h.id} to="/hubs/$hubId" params={{ hubId: h.id }} className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-card hover:text-brand">
              <HubIcon icon={h.icon} className="h-4 w-4" />{h.name}
            </Link>
          ))}
        </div>}
      </section>
    </SiteLayout>
  );
}
