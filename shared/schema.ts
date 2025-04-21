import { pgTable, serial, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  password: varchar('password', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull()
});

export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  subject: varchar('subject', { length: 50 }).notNull(),
  description: text('description'),
  gradeLevel: varchar('grade_level', { length: 20 }).notNull(),
  classCode: varchar('class_code', { length: 20 }).unique().notNull(),
  teacherId: serial('teacher_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  studentId: serial('student_id').references(() => users.id).notNull(),
  classId: serial('class_id').references(() => classes.id).notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow()
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  studentId: serial('student_id').references(() => users.id).notNull(),
  classId: serial('class_id').references(() => classes.id).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  date: timestamp('date').defaultNow()
});

export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  classId: serial('class_id').references(() => classes.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const grades = pgTable('grades', {
  id: serial('id').primaryKey(),
  studentId: serial('student_id').references(() => users.id).notNull(),
  assessmentId: serial('assessment_id').references(() => assessments.id).notNull(),
  score: serial('score').notNull(),
  comment: text('comment'),
  updatedAt: timestamp('updated_at').defaultNow()
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