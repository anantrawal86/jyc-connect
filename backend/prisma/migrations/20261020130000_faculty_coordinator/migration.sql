CREATE TABLE "FacultyCoordinator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "photoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FacultyCoordinator_pkey" PRIMARY KEY ("id")
);
