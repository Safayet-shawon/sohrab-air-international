import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("new"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  payloadJson: text("payload_json").notNull().default("{}"),
  fileKey: text("file_key"),
  area: text("area").notNull().default("Unspecified"),
  travellersCount: integer("travellers_count").notNull().default(1),
  groupLeaderName: text("group_leader_name"),
  packageId: text("package_id"),
  revenue: integer("revenue").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_submissions_created_at").on(table.createdAt),
  index("idx_submissions_type_area").on(table.type, table.area),
  index("idx_submissions_group_leader").on(table.groupLeaderName),
]);

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  submissionId: text("submission_id").notNull(),
  action: text("action").notNull(),
  actorId: text("actor_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const staffMembers = sqliteTable("staff_members", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  loginId: text("login_id").notNull().default(""),
  passwordHash: text("password_hash").notNull().default(""),
  passwordSalt: text("password_salt").notNull().default(""),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: text("locked_until"),
  name: text("name").notNull(),
  role: text("role").notNull().default("manager"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_staff_identifier").on(table.identifier),
  uniqueIndex("idx_staff_login_id").on(table.loginId),
]);

export const adminSessions = sqliteTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  staffId: text("staff_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_admin_sessions_staff").on(table.staffId),
  index("idx_admin_sessions_expires").on(table.expiresAt),
]);

export const packages = sqliteTable("packages", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  nameBn: text("name_bn").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionBn: text("description_bn").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  price: integer("price").notNull().default(0),
  durationDays: integer("duration_days").notNull().default(0),
  destinationsJson: text("destinations_json").notNull().default("[]"),
  inclusionsJson: text("inclusions_json").notNull().default("[]"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_packages_category_active").on(table.category, table.active)]);
