-- AddDescriptionToCompetition
-- Migration: add optional 'description' text column to the Competition table.
-- Safe to run on existing data — NULL default preserves all existing rows.

ALTER TABLE "Competition" ADD COLUMN "description" TEXT;
