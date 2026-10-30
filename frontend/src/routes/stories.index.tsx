import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { ArrowRight, BookOpen, CalendarDays, Sparkles } from "lucide-react";
import { api } from "@/services/api";
import { EmptyState, ErrorMessage, Loading, SiteLayout, formatDate } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/stories/")({
  head: () => meta("JYC Stories", "Event recaps, campus moments, and stories from the JYC community."),
  component: StoriesPage,
});

function StoriesPage() {
  const stories = useQuery({ queryKey: ["stories"], queryFn: api.getStories });
  return (
    <SiteLayout>
      <section className="stories-hero relative isolate overflow-hidden bg-gradient-navy text-navy-foreground">
        <div className="stories-orb stories-orb-one" aria-hidden="true" />
        <div className="stories-orb stories-orb-two" aria-hidden="true" />
        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div className="stories-hero-copy max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-soft"><Sparkles className="h-4 w-4" /> From our campus</span>
            <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">JYC <span className="text-brand-soft">Stories</span></h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">Relive the events, people, and little moments that make our campus community special.</p>
          </div>
          <div className="stories-hero-mark absolute bottom-8 right-8 hidden h-40 w-40 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/70 lg:grid"><BookOpen className="h-16 w-16" strokeWidth={1.2} /></div>
        </div>
      </section>
      <section className="container-page py-12 sm:py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">What’s happening at JYC</p><h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">Campus highlights</h2></div>
          <span className="hidden items-center gap-2 text-sm font-medium text-muted-foreground sm:flex"><BookOpen className="h-4 w-4 text-brand" /> Stories from our community</span>
        </div>
        {stories.isLoading ? <Loading label="Loading JYC stories…" /> : stories.error ? <ErrorMessage message="Couldn't load JYC stories." /> : !stories.data?.length ? <EmptyState title="The first story is on its way" text="Event recaps and campus highlights will appear here after they’re published by the JYC team." /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.data.map((story, index) => (
              <Link key={story.id} to="/stories/$storyId" params={{ storyId: story.id }} className="story-card group interactive-card overflow-hidden rounded-[1.5rem] border bg-card shadow-card" style={{ "--story-index": index } as CSSProperties}>
                <div className="story-card-image relative aspect-[16/10] overflow-hidden bg-gradient-navy">
                  {story.coverImageUrl ? <img src={story.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /> : <div className="grid h-full place-items-center text-white/45"><BookOpen className="h-14 w-14" strokeWidth={1.2} /></div>}
                  <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-navy/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur">{story.category}</span>
                  {story.homepageOrder !== null && <span className="featured-story-badge absolute right-4 top-4 rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand shadow-sm backdrop-blur">Homepage #{story.homepageOrder}</span>}
                  <span className="absolute inset-0 bg-gradient-to-t from-navy/45 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-90" />
                </div>
                <div className="p-5 sm:p-6">
                  <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><CalendarDays className="h-3.5 w-3.5 text-brand" /> {formatDate(story.date)}</p>
                  <h3 className="mt-3 line-clamp-2 font-display text-xl font-bold leading-tight text-navy transition-colors group-hover:text-brand sm:text-2xl">{story.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{story.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand">Read the story <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
