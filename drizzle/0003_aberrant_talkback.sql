CREATE TABLE `admin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`staff_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_admin_sessions_staff` ON `admin_sessions` (`staff_id`);--> statement-breakpoint
CREATE INDEX `idx_admin_sessions_expires` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
ALTER TABLE `staff_members` ADD `login_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_members` ADD `password_hash` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_members` ADD `password_salt` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_members` ADD `failed_login_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `staff_members` ADD `locked_until` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_staff_login_id` ON `staff_members` (`login_id`);--> statement-breakpoint
PRAGMA optimize;
