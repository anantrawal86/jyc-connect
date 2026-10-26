ALTER TABLE "GalleryImage" ADD COLUMN "hubId" TEXT;

CREATE INDEX "GalleryImage_hubId_createdAt_idx" ON "GalleryImage"("hubId", "createdAt");

ALTER TABLE "GalleryImage"
ADD CONSTRAINT "GalleryImage_hubId_fkey"
FOREIGN KEY ("hubId") REFERENCES "Hub"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
