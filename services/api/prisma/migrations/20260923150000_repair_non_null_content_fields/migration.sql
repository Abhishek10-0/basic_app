UPDATE "User"
SET
  "businessActivities" = COALESCE("businessActivities", ''),
  "city" = COALESCE("city", '')
WHERE "businessActivities" IS NULL OR "city" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "businessActivities" SET DEFAULT '',
  ALTER COLUMN "businessActivities" SET NOT NULL,
  ALTER COLUMN "city" SET DEFAULT '',
  ALTER COLUMN "city" SET NOT NULL;

UPDATE "Enquiry"
SET
  "businessActivities" = COALESCE("businessActivities", ''),
  "industrialSectors" = COALESCE("industrialSectors", ''),
  "specificInterest" = COALESCE("specificInterest", ''),
  "yearOfRegistration" = COALESCE("yearOfRegistration", ''),
  "interests" = COALESCE("interests", ARRAY[]::TEXT[])
WHERE
  "businessActivities" IS NULL
  OR "industrialSectors" IS NULL
  OR "specificInterest" IS NULL
  OR "yearOfRegistration" IS NULL
  OR "interests" IS NULL;

ALTER TABLE "Enquiry"
  ALTER COLUMN "businessActivities" SET DEFAULT '',
  ALTER COLUMN "businessActivities" SET NOT NULL,
  ALTER COLUMN "industrialSectors" SET DEFAULT '',
  ALTER COLUMN "industrialSectors" SET NOT NULL,
  ALTER COLUMN "specificInterest" SET DEFAULT '',
  ALTER COLUMN "specificInterest" SET NOT NULL,
  ALTER COLUMN "yearOfRegistration" SET DEFAULT '',
  ALTER COLUMN "yearOfRegistration" SET NOT NULL,
  ALTER COLUMN "interests" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "interests" SET NOT NULL;
