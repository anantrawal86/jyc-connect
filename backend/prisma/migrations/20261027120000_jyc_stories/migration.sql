CREATE TABLE "JycStory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Campus Life',
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "coverImageUrl" TEXT,
    "coverStorageKey" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JycStory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JycStoryPhoto" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "alt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JycStoryPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JycStory_published_date_idx" ON "JycStory"("published", "date");
CREATE INDEX "JycStoryPhoto_storyId_createdAt_idx" ON "JycStoryPhoto"("storyId", "createdAt");
ALTER TABLE "JycStoryPhoto" ADD CONSTRAINT "JycStoryPhoto_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "JycStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
