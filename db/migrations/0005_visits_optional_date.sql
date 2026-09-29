ALTER TABLE "visits" ALTER COLUMN "visit_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_year" smallint;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_visit_year_matches_date_check" CHECK ("visits"."visit_date" IS NULL OR "visits"."visit_year" IS NULL OR EXTRACT(YEAR FROM "visits"."visit_date") = "visits"."visit_year");