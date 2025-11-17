-- AlterTable
ALTER TABLE "Presentation" ADD COLUMN     "aiPresenterEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AIPresenterTimeline" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "presentationId" UUID NOT NULL,
    "voiceModel" VARCHAR(50) NOT NULL DEFAULT 'tts-1-hd',
    "voiceName" VARCHAR(50) NOT NULL DEFAULT 'nova',
    "voiceSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "totalDuration" INTEGER NOT NULL,
    "slides" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "ttsTokens" INTEGER NOT NULL DEFAULT 0,
    "ttsCostCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPresenterTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIPresenterTimeline_presentationId_key" ON "AIPresenterTimeline"("presentationId");

-- CreateIndex
CREATE INDEX "AIPresenterTimeline_presentationId_idx" ON "AIPresenterTimeline"("presentationId");

-- CreateIndex
CREATE INDEX "AIPresenterTimeline_status_idx" ON "AIPresenterTimeline"("status");

-- AddForeignKey
ALTER TABLE "AIPresenterTimeline" ADD CONSTRAINT "AIPresenterTimeline_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
