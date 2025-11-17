-- CreateTable
CREATE TABLE "Presentation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "webinarId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "sourceFileUrl" TEXT,
    "sourceFileType" VARCHAR(20),
    "sourceFileSize" INTEGER,
    "pptxUrl" TEXT,
    "revealJsUrl" TEXT,
    "aiModel" VARCHAR(50),
    "extractedText" TEXT,
    "aiCostCents" INTEGER NOT NULL DEFAULT 0,
    "processingStatus" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "jobId" VARCHAR(100),
    "slideCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Presentation_webinarId_idx" ON "Presentation"("webinarId");

-- CreateIndex
CREATE INDEX "Presentation_processingStatus_idx" ON "Presentation"("processingStatus");

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
