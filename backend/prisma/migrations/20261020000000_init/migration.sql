CREATE TYPE "Role" AS ENUM ('STUDENT', 'COORDINATOR', 'ADMIN');
CREATE TYPE "AssetSlot" AS ENUM ('HERO', 'LOGIN', 'REGISTER', 'ABOUT', 'CAMPUS');
CREATE TABLE "User" (
  "id" TEXT NOT NULL, "fullName" TEXT NOT NULL, "email" TEXT NOT NULL, "rollNumber" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'STUDENT', "emailVerifiedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OtpChallenge" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "fullName" TEXT NOT NULL, "rollNumber" TEXT NOT NULL,
  "otpHash" TEXT NOT NULL, "attempts" INTEGER NOT NULL DEFAULT 0, "expiresAt" TIMESTAMP(3) NOT NULL,
  "resendAfter" TIMESTAMP(3) NOT NULL, "consumedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RegistrationGrant" (
  "id" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "email" TEXT NOT NULL, "fullName" TEXT NOT NULL,
  "rollNumber" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "RegistrationGrant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Hub" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "tagline" TEXT NOT NULL, "description" TEXT NOT NULL, "icon" TEXT NOT NULL,
  "councilGroup" TEXT NOT NULL, "imageUrl" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Hub_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "JycEvent" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "hubId" TEXT NOT NULL, "category" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL,
  "startTime" TEXT NOT NULL, "endTime" TEXT NOT NULL, "venue" TEXT NOT NULL, "summary" TEXT NOT NULL, "description" TEXT NOT NULL,
  "highlights" TEXT[] NOT NULL, "imageUrl" TEXT, "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JycEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EventRegistration" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "eventId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CouncilMember" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "designation" TEXT NOT NULL, "group" TEXT NOT NULL,
  "enrollment" TEXT NOT NULL, "photoUrl" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "CouncilMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "body" TEXT, "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GalleryImage" (
  "id" TEXT NOT NULL, "url" TEXT NOT NULL, "alt" TEXT NOT NULL, "caption" TEXT, "category" TEXT,
  "storageKey" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SiteAsset" (
  "id" TEXT NOT NULL, "slot" "AssetSlot" NOT NULL, "url" TEXT NOT NULL, "storageKey" TEXT NOT NULL,
  "alt" TEXT, "mimeType" TEXT, "sizeBytes" INTEGER, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteAsset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ContactMessage" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "message" TEXT NOT NULL, "ipHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_rollNumber_key" ON "User"("rollNumber");
CREATE INDEX "OtpChallenge_email_createdAt_idx" ON "OtpChallenge"("email", "createdAt");
CREATE UNIQUE INDEX "RegistrationGrant_tokenHash_key" ON "RegistrationGrant"("tokenHash");
CREATE INDEX "JycEvent_date_published_idx" ON "JycEvent"("date", "published");
CREATE UNIQUE INDEX "EventRegistration_userId_eventId_key" ON "EventRegistration"("userId", "eventId");
CREATE UNIQUE INDEX "CouncilMember_enrollment_key" ON "CouncilMember"("enrollment");
CREATE INDEX "Announcement_published_date_idx" ON "Announcement"("published", "date");
CREATE UNIQUE INDEX "SiteAsset_slot_key" ON "SiteAsset"("slot");
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
ALTER TABLE "JycEvent" ADD CONSTRAINT "JycEvent_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "JycEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
