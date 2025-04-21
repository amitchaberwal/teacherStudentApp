import { 
  users, User, InsertUser, 
  classes, Class, InsertClass,
  enrollments, Enrollment, InsertEnrollment,
  attendance, Attendance, InsertAttendance,
  assessments, Assessment, InsertAssessment,
  grades, Grade, InsertGrade
} from "@shared/schema";

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';
import type { InsertUser, InsertClass, InsertEnrollment, InsertAssessment, InsertGrade, InsertAttendance } from '../shared/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export class Storage {
  async createUser(userData: InsertUser) {
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
  }

  async getUser(username: string) {
    const [user] = await db.select().from(schema.users).where(sql`username = ${username}`);
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(sql`id = ${id}`);
    return user;
  }

  async createClass(classData: InsertClass) {
    const [newClass] = await db.insert(schema.classes).values(classData).returning();
    return newClass;
  }

  async getClasses() {
    return await db.select().from(schema.classes);
  }

  async getClassById(id: number) {
    const [class_] = await db.select().from(schema.classes).where(sql`id = ${id}`);
    return class_;
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return await db.select().from(schema.classes).where(sql`teacher_id = ${teacherId}`);
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class> {
    const [updatedClass] = await db.update(schema.classes).set(classData).where(sql`id = ${id}`).returning();
    return updatedClass;
  }

  async deleteClass(id: number): Promise<void> {
    await db.delete(schema.classes).where(sql`id = ${id}`);
  }

  async createEnrollment(enrollmentData: InsertEnrollment) {
    const [enrollment] = await db.insert(schema.enrollments).values(enrollmentData).returning();
    return enrollment;
  }

  async getEnrollments(studentId: number) {
    return await db.select().from(schema.enrollments).where(sql`student_id = ${studentId}`);
  }

  async getStudentsByClass(classId: number): Promise<User[]> {
    const enrollments = await db.select().from(schema.enrollments).where(sql`class_id = ${classId}`);
    const studentIds = enrollments.map(enrollment => enrollment.studentId);
    const students = await db.select().from(schema.users).where(sql`id IN ${studentIds} AND role = 'student'`);
    return students;
  }


  async createAssessment(assessmentData: InsertAssessment) {
    const [assessment] = await db.insert(schema.assessments).values(assessmentData).returning();
    return assessment;
  }

  async getAssessmentsByClass(classId: number) {
    return await db.select().from(schema.assessments).where(sql`class_id = ${classId}`);
  }

  async createGrade(gradeData: InsertGrade) {
    const [grade] = await db.insert(schema.grades).values(gradeData).returning();
    return grade;
  }

  async getGradesByAssessment(assessmentId: number) {
    return await db.select().from(schema.grades).where(sql`assessment_id = ${assessmentId}`);
  }

  async getGradesByStudent(studentId: number, classId: number): Promise<Grade[]> {
    const assessments = await this.getAssessmentsByClass(classId);
    const assessmentIds = assessments.map(assessment => assessment.id);
    return await db.select().from(schema.grades).where(sql`student_id = ${studentId} AND assessment_id IN ${assessmentIds}`);
  }

  async updateGrade(id: number, gradeData: Partial<InsertGrade>): Promise<Grade> {
    const [updatedGrade] = await db.update(schema.grades).set(gradeData).where(sql`id = ${id}`).returning();
    return updatedGrade;
  }

  async createAttendance(attendanceData: InsertAttendance) {
    const [attendance] = await db.insert(schema.attendance).values(attendanceData).returning();
    return attendance;
  }

  async getAttendanceByClass(classId: number) {
    return await db.select().from(schema.attendance).where(sql`class_id = ${classId}`);
  }

  async getAttendanceByStudent(studentId: number, classId: number): Promise<Attendance[]> {
    return await db.select().from(schema.attendance).where(sql`student_id = ${studentId} AND class_id = ${classId}`);
  }

  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance> {
    const [updatedAttendance] = await db.update(schema.attendance).set(attendanceData).where(sql`id = ${id}`).returning();
    return updatedAttendance;
  }

}

export const storage = new Storage();