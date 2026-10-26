ALTER TABLE "JycEvent" ADD COLUMN "registrationFormUrl" TEXT;

UPDATE "JycEvent" AS event
SET "registrationFormUrl" = hub."registrationFormUrl"
FROM "Hub" AS hub
WHERE event."hubId" = hub."id"
  AND hub."registrationFormUrl" IS NOT NULL;
