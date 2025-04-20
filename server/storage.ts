import { 
  users, User, InsertUser, 
  classes, Class, InsertClass,
  enrollments, Enrollment, InsertEnrollment,
  attendance, Attendance, InsertAttendance,
  assessments, Assessment, InsertAssessment,
  grades, Grade, InsertGrade
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Class operations
  getClass(id: number): Promise<Class | undefined>;
  getClassByCode(classCode: string): Promise<Class | undefined>;
  getClassesByTeacher(teacherId: number): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: number): Promise<void>;
  
  // Enrollment operations
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getStudentsByClass(classId: number): Promise<User[]>;
  enrollStudent(enrollment: InsertEnrollment): Promise<Enrollment>;
  
  // Attendance operations
  getAttendanceByClass(classId: number, date: Date): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: number, classId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance>;
  
  // Assessment operations
  getAssessmentsByClass(classId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  
  // Grade operations
  getGradesByAssessment(assessmentId: number): Promise<Grade[]>;
  getGradesByStudent(studentId: number, classId: number): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<InsertGrade>): Promise<Grade>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private classes: Map<number, Class>;
  private enrollments: Map<number, Enrollment>;
  private attendanceRecords: Map<number, Attendance>;
  private assessments: Map<number, Assessment>;
  private grades: Map<number, Grade>;
  
  private userId: number;
  private classId: number;
  private enrollmentId: number;
  private attendanceId: number;
  private assessmentId: number;
  private gradeId: number;

  constructor() {
    this.users = new Map();
    this.classes = new Map();
    this.enrollments = new Map();
    this.attendanceRecords = new Map();
    this.assessments = new Map();
    this.grades = new Map();
    
    this.userId = 1;
    this.classId = 1;
    this.enrollmentId = 1;
    this.attendanceId = 1;
    this.assessmentId = 1;
    this.gradeId = 1;
    
    // Initialize with sample data for testing
    this.seedSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Class operations
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClassByCode(classCode: string): Promise<Class | undefined> {
    return Array.from(this.classes.values()).find(
      (cls) => cls.classCode === classCode,
    );
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(
      (cls) => cls.teacherId === teacherId,
    );
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const id = this.classId++;
    const createdAt = new Date();
    const classRecord: Class = { ...classData, id, createdAt };
    this.classes.set(id, classRecord);
    return classRecord;
  }
  
  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class> {
    const existingClass = this.classes.get(id);
    if (!existingClass) {
      throw new Error(`Class with id ${id} not found`);
    }
    
    const updatedClass: Class = { 
      ...existingClass, 
      ...classData,
      // Keep the original id and createdAt values
      id: existingClass.id,
      createdAt: existingClass.createdAt
    };
    
    this.classes.set(id, updatedClass);
    return updatedClass;
  }
  
  async deleteClass(id: number): Promise<void> {
    const existingClass = this.classes.get(id);
    if (!existingClass) {
      throw new Error(`Class with id ${id} not found`);
    }
    
    // Delete the class from the map
    this.classes.delete(id);
    
    // Optional: Also delete related records (enrollments, attendance, etc.)
    // This is a simplified implementation - in a real database, you'd use cascading deletes
    
    // Delete enrollments
    const enrollmentsToDelete = Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.classId === id);
      
    enrollmentsToDelete.forEach(enrollment => {
      this.enrollments.delete(enrollment.id);
    });
    
    // Delete attendance records for this class
    const attendanceToDelete = Array.from(this.attendanceRecords.values())
      .filter(record => record.classId === id);
      
    attendanceToDelete.forEach(record => {
      this.attendanceRecords.delete(record.id);
    });
    
    // Delete assessments for this class
    const assessmentsToDelete = Array.from(this.assessments.values())
      .filter(assessment => assessment.classId === id);
    
    // Delete grades for the assessments in this class
    assessmentsToDelete.forEach(assessment => {
      const gradesToDelete = Array.from(this.grades.values())
        .filter(grade => grade.assessmentId === assessment.id);
        
      gradesToDelete.forEach(grade => {
        this.grades.delete(grade.id);
      });
      
      this.assessments.delete(assessment.id);
    });
  }

  // Enrollment operations
  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.studentId === studentId,
    );
  }

  async getStudentsByClass(classId: number): Promise<User[]> {
    const studentIds = Array.from(this.enrollments.values())
      .filter((enrollment) => enrollment.classId === classId)
      .map((enrollment) => enrollment.studentId);
    
    return Array.from(this.users.values()).filter(
      (user) => studentIds.includes(user.id) && user.role === "student"
    );
  }

  async enrollStudent(enrollmentData: InsertEnrollment): Promise<Enrollment> {
    // Check if enrollment already exists
    const existingEnrollment = Array.from(this.enrollments.values()).find(
      (enrollment) => 
        enrollment.studentId === enrollmentData.studentId && 
        enrollment.classId === enrollmentData.classId
    );
    
    if (existingEnrollment) {
      return existingEnrollment;
    }
    
    const id = this.enrollmentId++;
    const enrolledAt = new Date();
    const enrollment: Enrollment = { ...enrollmentData, id, enrolledAt };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  // Attendance operations
  async getAttendanceByClass(classId: number, date: Date): Promise<Attendance[]> {
    const dateString = date.toISOString().split('T')[0];
    
    return Array.from(this.attendanceRecords.values()).filter(
      (record) => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return record.classId === classId && recordDate === dateString;
      }
    );
  }

  async getAttendanceByStudent(studentId: number, classId: number): Promise<Attendance[]> {
    return Array.from(this.attendanceRecords.values()).filter(
      (record) => record.studentId === studentId && record.classId === classId
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    // Check if attendance already exists for this student/class/date
    const existingAttendance = Array.from(this.attendanceRecords.values()).find(
      (record) => 
        record.studentId === attendanceData.studentId && 
        record.classId === attendanceData.classId &&
        new Date(record.date).toISOString().split('T')[0] === new Date(attendanceData.date).toISOString().split('T')[0]
    );
    
    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = attendanceData.status;
      existingAttendance.comment = attendanceData.comment;
      this.attendanceRecords.set(existingAttendance.id, existingAttendance);
      return existingAttendance;
    }
    
    const id = this.attendanceId++;
    const attendance: Attendance = { ...attendanceData, id };
    this.attendanceRecords.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance> {
    const attendance = this.attendanceRecords.get(id);
    if (!attendance) {
      throw new Error(`Attendance record with id ${id} not found`);
    }
    
    const updatedAttendance = { ...attendance, ...attendanceData };
    this.attendanceRecords.set(id, updatedAttendance);
    return updatedAttendance;
  }

  // Assessment operations
  async getAssessmentsByClass(classId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values()).filter(
      (assessment) => assessment.classId === classId
    );
  }

  async createAssessment(assessmentData: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentId++;
    const createdAt = new Date();
    const assessment: Assessment = { ...assessmentData, id, createdAt };
    this.assessments.set(id, assessment);
    return assessment;
  }

  // Grade operations
  async getGradesByAssessment(assessmentId: number): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(
      (grade) => grade.assessmentId === assessmentId
    );
  }

  async getGradesByStudent(studentId: number, classId: number): Promise<Grade[]> {
    // First get all assessments for this class
    const assessments = await this.getAssessmentsByClass(classId);
    const assessmentIds = assessments.map(assessment => assessment.id);
    
    // Then get all grades for this student and these assessments
    return Array.from(this.grades.values()).filter(
      (grade) => grade.studentId === studentId && assessmentIds.includes(grade.assessmentId)
    );
  }

  async createGrade(gradeData: InsertGrade): Promise<Grade> {
    // Check if grade already exists for this student/assessment
    const existingGrade = Array.from(this.grades.values()).find(
      (grade) => 
        grade.studentId === gradeData.studentId && 
        grade.assessmentId === gradeData.assessmentId
    );
    
    if (existingGrade) {
      // Update existing grade
      existingGrade.score = gradeData.score;
      existingGrade.comment = gradeData.comment;
      existingGrade.updatedAt = new Date();
      this.grades.set(existingGrade.id, existingGrade);
      return existingGrade;
    }
    
    const id = this.gradeId++;
    const updatedAt = new Date();
    const grade: Grade = { ...gradeData, id, updatedAt };
    this.grades.set(id, grade);
    return grade;
  }

  async updateGrade(id: number, gradeData: Partial<InsertGrade>): Promise<Grade> {
    const grade = this.grades.get(id);
    if (!grade) {
      throw new Error(`Grade with id ${id} not found`);
    }
    
    const updatedGrade = { ...grade, ...gradeData, updatedAt: new Date() };
    this.grades.set(id, updatedGrade);
    return updatedGrade;
  }
  
  // Seed sample data for testing
  private seedSampleData() {
    // Create sample teachers
    const teacher1: InsertUser = {
      username: "teacher1",
      password: "password123",
      role: "teacher",
      name: "John Smith"
    };
    
    // Create sample students
    const student1: InsertUser = {
      username: "student1",
      password: "password123",
      role: "student",
      name: "Alice Johnson"
    };
    
    const student2: InsertUser = {
      username: "student2", 
      password: "password123",
      role: "student",
      name: "Bob Smith"
    };
    
    // Create users
    this.createUser(teacher1).then(teacherUser => {
      // Create sample classes
      const mathClass: InsertClass = {
        name: "Mathematics 101",
        subject: "mathematics",
        description: "Introductory calculus and algebra for first-year students",
        gradeLevel: "10",
        classCode: "MATH101-XYZ",
        teacherId: teacherUser.id
      };
      
      const physicsClass: InsertClass = {
        name: "Physics 202",
        subject: "science",
        description: "Advanced mechanics and electromagnetism",
        gradeLevel: "11",
        classCode: "PHYS202-ABC",
        teacherId: teacherUser.id
      };
      
      // Create classes
      Promise.all([
        this.createClass(mathClass),
        this.createClass(physicsClass),
        this.createUser(student1),
        this.createUser(student2)
      ]).then(([mathClassObj, physicsClassObj, student1User, student2User]) => {
        // Enroll students in classes
        this.enrollStudent({ studentId: student1User.id, classId: mathClassObj.id });
        this.enrollStudent({ studentId: student2User.id, classId: mathClassObj.id });
        this.enrollStudent({ studentId: student1User.id, classId: physicsClassObj.id });
        
        // Create assessments
        const quiz1: InsertAssessment = {
          classId: mathClassObj.id,
          name: "Quiz 1"
        };
        
        const midterm: InsertAssessment = {
          classId: mathClassObj.id,
          name: "Midterm Exam"
        };
        
        // Create assessments
        Promise.all([
          this.createAssessment(quiz1),
          this.createAssessment(midterm)
        ]).then(([quiz1Obj, midtermObj]) => {
          // Add grades
          this.createGrade({
            assessmentId: quiz1Obj.id,
            studentId: student1User.id,
            score: 85,
            comment: "Good work"
          });
          
          this.createGrade({
            assessmentId: midtermObj.id,
            studentId: student1User.id,
            score: 88,
            comment: "Strong understanding of concepts"
          });
          
          this.createGrade({
            assessmentId: quiz1Obj.id,
            studentId: student2User.id,
            score: 78,
            comment: "Needs improvement"
          });
          
          // Add attendance
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          this.createAttendance({
            classId: mathClassObj.id,
            studentId: student1User.id,
            date: today,
            status: "present",
            comment: ""
          });
          
          this.createAttendance({
            classId: mathClassObj.id,
            studentId: student2User.id,
            date: today,
            status: "absent",
            comment: "Called in sick"
          });
          
          this.createAttendance({
            classId: mathClassObj.id,
            studentId: student1User.id,
            date: yesterday,
            status: "present",
            comment: ""
          });
          
          this.createAttendance({
            classId: mathClassObj.id,
            studentId: student2User.id,
            date: yesterday,
            status: "late",
            comment: "Arrived 10 minutes late"
          });
        });
      });
    });
  }
}

export const storage = new MemStorage();
