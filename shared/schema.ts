import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["teacher", "student"] }).notNull(),
  name: text("name").notNull(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  gradeLevel: text("grade_level").notNull(),
  classCode: text("class_code").notNull().unique(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  classId: integer("class_id").notNull().references(() => classes.id),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
}, (table) => {
  return {
    studentClassUnique: primaryKey({ columns: [table.studentId, table.classId] }),
  };
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  status: text("status", { enum: ["present", "absent", "late", "excused"] }).notNull(),
  comment: text("comment"),
}, (table) => {
  return {
    attendanceUnique: primaryKey({ columns: [table.classId, table.studentId, table.date] }),
  };
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  comment: text("comment"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    gradeUnique: primaryKey({ columns: [table.assessmentId, table.studentId] }),
  };
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertAssessmentSchema = createInsertSchema(assessments).omit({ id: true, createdAt: true });
export const insertGradeSchema = createInsertSchema(grades).omit({ id: true, updatedAt: true });

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type InsertGrade = z.infer<typeof insertGradeSchema>;

// Select types
export type User = typeof users.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Grade = typeof grades.$inferSelect;

// Custom schemas for client validation
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["teacher", "student"]),
});

export const classCodeSchema = z.object({
  classCode: z.string().min(6, "Class code must be at least 6 characters"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type ClassCodeInput = z.infer<typeof classCodeSchema>;
