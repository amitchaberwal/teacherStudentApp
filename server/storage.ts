import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema';

const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite);

// Create tables if they don't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL
)`);

export class Storage {
  async createUser(userData: schema.InsertUser) {
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
  }

  async getUser(username: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async getUserById(id: number) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async createClass(classData: schema.InsertClass) {
    const [newClass] = await db.insert(schema.classes).values(classData).returning();
    return newClass;
  }

  async getClasses() {
    return await db.select().from(schema.classes);
  }

  async getClassById(id: number) {
    const [class_] = await db.select().from(schema.classes).where(eq(schema.classes.id, id));
    return class_;
  }

  async getClassesByTeacher(teacherId: number) {
    return await db.select().from(schema.classes).where(eq(schema.classes.teacherId, teacherId));
  }

  async updateClass(id: number, classData: Partial<schema.InsertClass>) {
    const [updatedClass] = await db.update(schema.classes)
      .set(classData)
      .where(eq(schema.classes.id, id))
      .returning();
    return updatedClass;
  }

  async deleteClass(id: number) {
    await db.delete(schema.classes).where(eq(schema.classes.id, id));
  }

  async createEnrollment(enrollmentData: schema.InsertEnrollment) {
    const [enrollment] = await db.insert(schema.enrollments).values(enrollmentData).returning();
    return enrollment;
  }

  async getEnrollments(studentId: number) {
    return await db.select().from(schema.enrollments).where(eq(schema.enrollments.studentId, studentId));
  }

  async getStudentsByClass(classId: number) {
    const enrollments = await db.select().from(schema.enrollments).where(eq(schema.enrollments.classId, classId));
    const studentIds = enrollments.map(enrollment => enrollment.studentId);
    return await db.select().from(schema.users).where(inArray(schema.users.id, studentIds));
  }

  async createAssessment(assessmentData: schema.InsertAssessment) {
    const [assessment] = await db.insert(schema.assessments).values(assessmentData).returning();
    return assessment;
  }

  async getAssessmentsByClass(classId: number) {
    return await db.select().from(schema.assessments).where(eq(schema.assessments.classId, classId));
  }

  async createGrade(gradeData: schema.InsertGrade) {
    const [grade] = await db.insert(schema.grades).values(gradeData).returning();
    return grade;
  }

  async getGradesByAssessment(assessmentId: number) {
    return await db.select().from(schema.grades).where(eq(schema.grades.assessmentId, assessmentId));
  }

  async getGradesByStudent(studentId: number, classId: number) {
    const assessments = await this.getAssessmentsByClass(classId);
    const assessmentIds = assessments.map(assessment => assessment.id);
    return await db.select().from(schema.grades).where(inArray(schema.grades.assessmentId, assessmentIds));
  }

  async updateGrade(id: number, gradeData: Partial<schema.InsertGrade>) {
    const [updatedGrade] = await db.update(schema.grades)
      .set(gradeData)
      .where(eq(schema.grades.id, id))
      .returning();
    return updatedGrade;
  }

  async createAttendance(attendanceData: schema.InsertAttendance) {
    const [attendance] = await db.insert(schema.attendance).values(attendanceData).returning();
    return attendance;
  }

  async getAttendanceByClass(classId: number) {
    return await db.select().from(schema.attendance).where(eq(schema.attendance.classId, classId));
  }

  async getAttendanceByStudent(studentId: number, classId: number) {
    return await db.select()
      .from(schema.attendance)
      .where(and(
        eq(schema.attendance.studentId, studentId),
        eq(schema.attendance.classId, classId)
      ));
  }

  async updateAttendance(id: number, attendanceData: Partial<schema.InsertAttendance>) {
    const [updatedAttendance] = await db.update(schema.attendance)
      .set(attendanceData)
      .where(eq(schema.attendance.id, id))
      .returning();
    return updatedAttendance;
  }
}

export const storage = new Storage();