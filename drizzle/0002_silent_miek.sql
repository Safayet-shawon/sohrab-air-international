CREATE TABLE `packages` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`name_bn` text NOT NULL,
	`name_en` text NOT NULL,
	`description_bn` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`duration_days` integer DEFAULT 0 NOT NULL,
	`destinations_json` text DEFAULT '[]' NOT NULL,
	`inclusions_json` text DEFAULT '[]' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_packages_category_active` ON `packages` (`category`,`active`);--> statement-breakpoint
CREATE TABLE `staff_members` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'manager' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_staff_identifier` ON `staff_members` (`identifier`);--> statement-breakpoint
ALTER TABLE `submissions` ADD `area` text DEFAULT 'Unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `travellers_count` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `group_leader_name` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `package_id` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `revenue` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_submissions_type_area` ON `submissions` (`type`,`area`);--> statement-breakpoint
CREATE INDEX `idx_submissions_group_leader` ON `submissions` (`group_leader_name`);--> statement-breakpoint
PRAGMA optimize;
