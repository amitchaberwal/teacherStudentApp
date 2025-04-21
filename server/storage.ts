import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, and, inArray } from 'drizzle-orm';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema';

const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite);

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    grade_level TEXT NOT NULL,
    class_code TEXT UNIQUE NOT NULL,
    teacher_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    assessment_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    comment TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
  );
`);

export class Storage {
  async createUser(userData: schema.InsertUser) {
    try {
      const result = await db.insert(schema.users).values(userData).returning().get();
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string) {
    try {
      const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).get();
      return result;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserById(id: number) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async createClass(classData: schema.InsertClass) {
    return await db.insert(schema.classes).values(classData).returning().get();
  }

  async getClasses() {
    return await db.select().from(schema.classes);
  }

  async getClassById(id: number) {
    return await db.select().from(schema.classes).where(eq(schema.classes.id, id)).get();
  }

  async getClassesByTeacher(teacherId: number) {
    return await db.select().from(schema.classes).where(eq(schema.classes.teacherId, teacherId));
  }

  async updateClass(id: number, classData: Partial<schema.InsertClass>) {
    return await db.update(schema.classes)
      .set(classData)
      .where(eq(schema.classes.id, id))
      .returning()
      .get();
  }

  async deleteClass(id: number) {
    await db.delete(schema.classes).where(eq(schema.classes.id, id));
  }

  async createEnrollment(enrollmentData: schema.InsertEnrollment) {
    return await db.insert(schema.enrollments).values(enrollmentData).returning().get();
  }

  async getUser(id: number) {
    try {
      return await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .get();
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getEnrollmentsByStudent(studentId: number) {
    try {
      const enrollments = await db.select()
        .from(schema.enrollments)
        .where(eq(schema.enrollments.studentId, studentId))
        .all();

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const classIds = enrollments.map(enrollment => enrollment.classId);
      const classes = await db.select()
        .from(schema.classes)
        .where(inArray(schema.classes.id, classIds))
        .all();

      if (!classes || classes.length === 0) {
        return [];
      }

      const teacherIds = classes.map(c => c.teacherId);
      if (teacherIds.length === 0) return classes;

      const teachers = await db.select()
        .from(schema.users)
        .where(inArray(schema.users.id, teacherIds))
        .all();

      return classes.map(classItem => {
        const teacher = teachers.find(t => t.id === classItem.teacherId);
        return {
          ...classItem,
          teacher: teacher ? teacher.name : 'Unknown',
          attendance: '0%',
          grade: 'N/A'
        };
      });
    } catch (error) {
      console.error('Error getting enrollments:', error);
      return [];
    }
  }

  async getStudentsByClass(classId: number) {
    const enrollments = await db.select().from(schema.enrollments).where(eq(schema.enrollments.classId, classId));
    const studentIds = enrollments.map(enrollment => enrollment.studentId);
    return await db.select().from(schema.users).where(inArray(schema.users.id, studentIds));
  }

  async createAssessment(assessmentData: schema.InsertAssessment) {
    return await db.insert(schema.assessments).values(assessmentData).returning().get();
  }

  async getAssessmentsByClass(classId: number) {
    return await db.select().from(schema.assessments).where(eq(schema.assessments.classId, classId));
  }

  async createGrade(gradeData: schema.InsertGrade) {
    return await db.insert(schema.grades).values(gradeData).returning().get();
  }

  async getGradesByAssessment(assessmentId: number) {
    return await db.select().from(schema.grades).where(eq(schema.grades.assessmentId, assessmentId));
  }

  async getGradesByStudent(studentId: number, classId: number) {
    try {
      const assessments = await this.getAssessmentsByClass(classId);
      const assessmentIds = assessments.map(assessment => assessment.id);
      if (assessmentIds.length === 0) return [];
      
      return await db.select()
        .from(schema.grades)
        .where(and(
          eq(schema.grades.studentId, studentId),
          inArray(schema.grades.assessmentId, assessmentIds)
        ))
        .all();
    } catch (error) {
      console.error('Error getting grades:', error);
      return [];
    }
  }

  async getClassByCode(classCode: string) {
    try {
      return await db.select()
        .from(schema.classes)
        .where(eq(schema.classes.classCode, classCode))
        .get();
    } catch (error) {
      console.error('Error getting class by code:', error);
      return null;
    }
  }

  async createAttendance(attendanceData: schema.InsertAttendance) {
    return await db.insert(schema.attendance).values(attendanceData).returning().get();
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
    return await db.update(schema.attendance)
      .set(attendanceData)
      .where(eq(schema.attendance.id, id))
      .returning()
      .get();
  }
}

export const storage = new Storage();