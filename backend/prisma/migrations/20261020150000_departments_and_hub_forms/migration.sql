ALTER TABLE "User" ADD COLUMN "department" TEXT NOT NULL DEFAULT 'Not specified';
ALTER TABLE "OtpChallenge" ADD COLUMN "department" TEXT NOT NULL DEFAULT 'Not specified';
ALTER TABLE "RegistrationGrant" ADD COLUMN "department" TEXT NOT NULL DEFAULT 'Not specified';
ALTER TABLE "Hub" ADD COLUMN "registrationFormUrl" TEXT;
