ALTER TABLE "JycStory" ADD COLUMN "homepageOrder" INTEGER;
CREATE UNIQUE INDEX "JycStory_homepageOrder_key" ON "JycStory"("homepageOrder");
