import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  role: text('role').notNull(),
  name: text('name').notNull()
});

export const classes = sqliteTable('classes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  description: text('description'),
  gradeLevel: text('grade_level').notNull(),
  classCode: text('class_code').unique().notNull(),
  teacherId: integer('teacher_id').references(() => users.id).notNull(),
  createdAt: text('created_at').default(String(new Date().toISOString()))
});

export const enrollments = sqliteTable('enrollments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => users.id).notNull(),
  classId: integer('class_id').references(() => classes.id).notNull(),
  enrolledAt: text('enrolled_at').default(String(new Date().toISOString()))
});

export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => users.id).notNull(),
  classId: integer('class_id').references(() => classes.id).notNull(),
  status: text('status').notNull(),
  date: text('date').default(String(new Date().toISOString()))
});

export const assessments = sqliteTable('assessments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  classId: integer('class_id').references(() => classes.id).notNull(),
  name: text('name').notNull(),
  createdAt: text('created_at').default(String(new Date().toISOString()))
});

export const grades = sqliteTable('grades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => users.id).notNull(),
  assessmentId: integer('assessment_id').references(() => assessments.id).notNull(),
  score: integer('score').notNull(),
  comment: text('comment'),
  updatedAt: text('updated_at').default(String(new Date().toISOString()))
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