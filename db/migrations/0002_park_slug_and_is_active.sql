ALTER TABLE "parks" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "parks" SET "slug" = trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'));--> statement-breakpoint
ALTER TABLE "parks" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "parks" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "parks" ADD CONSTRAINT "parks_slug_unique" UNIQUE("slug");
