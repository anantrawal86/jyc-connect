import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { ArrowLeft, CalendarDays, Image as ImageIcon } from "lucide-react";
import { api } from "@/services/api";
import { ErrorMessage, Loading, SiteLayout, formatDate } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/stories/$storyId")({
  head: () => meta("JYC Story", "A story from the JYC campus community."),
  component: StoryDetailPage,
});

function StoryDetailPage() {
  const { storyId } = Route.useParams();
  const story = useQuery({ queryKey: ["stories", storyId], queryFn: () => api.getStory(storyId) });
  if (story.isLoading) return <SiteLayout><div className="container-page py-16"><Loading label="Loading story…" /></div></SiteLayout>;
  if (story.error || !story.data) return <SiteLayout><div className="container-page py-16"><ErrorMessage message="This story couldn’t be found." /><Link to="/stories" className="mt-5 inline-flex items-center gap-2 font-semibold text-brand"><ArrowLeft className="h-4 w-4" /> Back to JYC Stories</Link></div></SiteLayout>;
  const item = story.data;
  const paragraphs = item.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  return (
    <SiteLayout>
      <article className="container-page story-detail py-7 sm:py-10">
        <Link to="/stories" className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-brand/30 hover:text-brand"><ArrowLeft className="h-4 w-4" /> All stories</Link>
        <div className="mx-auto mt-6 max-w-5xl">
          <div className="story-detail-copy">
            <span className="inline-flex rounded-full bg-brand/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand">{item.category}</span>
            <h1 className="mt-3 max-w-4xl font-display text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl lg:text-5xl">{item.title}</h1>
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><CalendarDays className="h-4 w-4 text-brand" /> {formatDate(item.date)}</p>
            <p className="mt-5 max-w-4xl border-l-4 border-brand/45 pl-4 text-base font-semibold leading-7 text-navy sm:text-lg">{item.summary}</p>
          </div>
          {item.coverImageUrl && <img src={item.coverImageUrl} alt={item.title} className="story-detail-cover mt-7 aspect-[16/8] w-full rounded-[1.5rem] object-cover shadow-card" />}
          <div className="story-detail-content mt-7 max-w-4xl space-y-5">
            {paragraphs.map((paragraph, index) => <p key={index} className="text-base leading-7 text-foreground/80">{paragraph}</p>)}
          </div>
          {item.photos.length > 0 && (
            <section className="mt-14">
              <h2 className="flex items-center gap-3 font-display text-2xl font-bold text-navy sm:text-3xl"><ImageIcon className="h-6 w-6 text-brand" /> More moments</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {item.photos.map((photo, index) => <img key={photo.id} src={photo.url} alt={photo.alt} loading="lazy" className="story-photo aspect-[4/3] w-full rounded-2xl object-cover shadow-card" style={{ "--story-index": index } as CSSProperties} />)}
              </div>
            </section>
          )}
        </div>
      </article>
    </SiteLayout>
  );
}
