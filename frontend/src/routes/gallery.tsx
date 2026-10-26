import { createFileRoute } from "@tanstack/react-router";
import { GalleryGrid, PageHeader, SiteLayout } from "@/components/site";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/gallery")({
  head: () => meta("Life at JYC", "Moments, memories and milestones from across the JYC campus community."),
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <SiteLayout>
      <PageHeader
        title="Life at JYC"
        subtitle="Moments, memories, and milestones from across our campus community."
      />
      <main className="container-page py-12 sm:py-16">
        <GalleryGrid />
      </main>
    </SiteLayout>
  );
}
