import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertClassSchema,
  insertEnrollmentSchema,
  insertAttendanceSchema,
  insertAssessmentSchema,
  insertGradeSchema,
  classCodeSchema,
  loginSchema,
  InsertClass
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = app.route('/api');

  // Auth routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username);

      if (!user || user.password !== data.password || user.role !== data.role) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // In a real app, you'd use sessions, JWT etc.
      // For simplicity, we'll just return the user object without password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const user = await storage.createUser(data);
      const { password, ...userWithoutPassword } = user;

      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Classes routes
  app.get('/api/classes', async (req: Request, res: Response) => {
    try {
      const teacherId = parseInt(req.query.teacherId as string);

      if (!teacherId || isNaN(teacherId)) {
        return res.status(400).json({ message: 'Teacher ID is required' });
      }

      const classes = await storage.getClassesByTeacher(teacherId);
      return res.status(200).json(classes);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/classes', async (req: Request, res: Response) => {
    try {
      // Debugging
      console.log('Class creation request body:', req.body);

      // Validate data
      const { teacherId, name, subject, description, gradeLevel } = req.body;

      if (!teacherId || typeof teacherId !== 'number') {
        return res.status(400).json({ message: 'Teacher ID is required and must be a number' });
      }

      // Create a validated object with only the required fields
      const classData = {
        teacherId,
        name,
        subject,
        description: description || '',
        gradeLevel,
        classCode: '' // Will be generated below
      };

      // Generate a unique class code
      const prefix = classData.subject.substring(0, 4).toUpperCase();
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      classData.classCode = `${prefix}-${randomStr}`;

      const classRecord = await storage.createClass(classData);
      return res.status(201).json(classRecord);
    } catch (error) {
      console.error('Error creating class:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/classes/:id', async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);

      if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      const classRecord = await storage.getClass(classId);

      if (!classRecord) {
        return res.status(404).json({ message: 'Class not found' });
      }

      return res.status(200).json(classRecord);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update a class
  app.put('/api/classes/:id', async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);

      if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      // Validate input
      const { name, subject, description, gradeLevel } = req.body;

      // Create a clean update object with only provided fields
      const updateData: Partial<InsertClass> = {};
      if (name !== undefined) updateData.name = name;
      if (subject !== undefined) updateData.subject = subject;
      if (description !== undefined) updateData.description = description || null;
      if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;

      try {
        const updatedClass = await storage.updateClass(classId, updateData);
        return res.status(200).json(updatedClass);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return res.status(404).json({ message: 'Class not found' });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating class:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete a class
  app.delete('/api/classes/:id', async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);

      if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      try {
        await storage.deleteClass(classId);
        return res.status(200).json({ message: 'Class deleted successfully' });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return res.status(404).json({ message: 'Class not found' });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Enrollments routes
  app.get('/api/enrollments', async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.query.studentId as string);

      if (!studentId || isNaN(studentId)) {
        return res.status(400).json({ message: 'Student ID is required' });
      }

      const classes = await storage.getEnrollmentsByStudent(studentId);
      if (!classes) {
        return res.status(200).json([]);
      }

      // Return the classes directly since getEnrollmentsByStudent now handles all the data processing
      return res.status(200).json(classes);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/enrollments', async (req: Request, res: Response) => {
    try {
      // Expect classCode and studentId in the request
      const { classCode, studentId } = req.body;

      const validatedClassCode = classCodeSchema.parse({ classCode }).classCode;

      if (!studentId || isNaN(studentId)) {
        return res.status(400).json({ message: 'Valid student ID is required' });
      }

      // Find the class by code
      const classRecord = await storage.getClassByCode(validatedClassCode);

      if (!classRecord) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Create enrollment
      const enrollment = await storage.createEnrollment({
        studentId,
        classId: classRecord.id
      });

      return res.status(201).json({
        message: 'Successfully enrolled in class',
        enrollment
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Students in class route
  app.get('/api/classes/:id/students', async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);

      if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      const students = await storage.getStudentsByClass(classId);
      return res.status(200).json(students);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Attendance routes
  app.get('/api/classes/:id/attendance', async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);
      const dateStr = req.query.date as string;

      if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      const date = dateStr ? new Date(dateStr) : new Date();

      const attendanceRecords = await storage.getAttendanceByClass(classId, date);
      return res.status(200).json(attendanceRecords);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/attendance', async (req: Request, res: Response) => {
    try {
      const data = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(data);
      return res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/attendance/bulk', async (req: Request, res: Response) => {
    try {
      const { records } = req.body;

      if (!Array.isArray(records)) {
        return res.status(400).json({ message: 'Records must be an array' });
      }

      const results = await Promise.all(
        records.map(record => storage.createAttendance(record))
      );

      return res.status(201).json({
        message: `${results.length} attendance records created`,
        records: results
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/students/:id/attendance/:classId', async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.id);
      const classId = parseInt(req.params.classId);

      if (isNaN(studentId) || isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid student or class ID' });
      }

      const attendanceRecords = await storage.getAttendanceByStudent(studentId, classId);

      // Calculate summary statistics
      let present = 0, absent = 0, late = 0, excused = 0;
      attendanceRecords.forEach(record => {
        switch (record.status) {
          case 'present': present++; break;
          case 'absent': absent++; break;
          case 'late': late++; break;
          case 'excused': excused++; break;
        }
      });

      const totalRecords = attendanceRecords.length;
      const attendanceRate = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0;

      return res.status(200).json({
        records: attendanceRecords,
        summary: {
          present,
          absent,
          late,
          excused,
          rate: attendanceRate
        }
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Assessment routes
  app.get('/api/classes/:id/assessments', async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);

      if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      const assessments = await storage.getAssessmentsByClass(classId);
      return res.status(200).json(assessments);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/assessments', async (req: Request, res: Response) => {
    try {
      const data = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.createAssessment(data);
      return res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Grade routes
  app.get('/api/assessments/:id/grades', async (req: Request, res: Response) => {
    try {
      const assessmentId = parseInt(req.params.id);

      if (isNaN(assessmentId)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }

      const grades = await storage.getGradesByAssessment(assessmentId);
      return res.status(200).json(grades);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/grades', async (req: Request, res: Response) => {
    try {
      const data = insertGradeSchema.parse(req.body);
      const grade = await storage.createGrade(data);
      return res.status(201).json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/grades/bulk', async (req: Request, res: Response) => {
    try {
      const { records } = req.body;

      if (!Array.isArray(records)) {
        return res.status(400).json({ message: 'Records must be an array' });
      }

      const results = await Promise.all(
        records.map(record => storage.createGrade(record))
      );

      return res.status(201).json({
        message: `${results.length} grade records created`,
        records: results
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/students/:id/grades/:classId', async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.id);
      const classId = parseInt(req.params.classId);

      if (isNaN(studentId) || isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid student or class ID' });
      }

      // Get all assessments for this class
      const assessments = await storage.getAssessmentsByClass(classId);

      // Get all grades for this student in this class
      const grades = await storage.getGradesByStudent(studentId, classId);

      // Combine assessment and grade data
      const gradeRecords = await Promise.all(
        grades.map(async (grade) => {
          const assessment = assessments.find(a => a.id === grade.assessmentId);
          return {
            id: grade.id,
            assessment: assessment ? assessment.name : 'Unknown',
            date: assessment ? assessment.createdAt : new Date(),
            grade: grade.score,
            comment: grade.comment || ''
          };
        })
      );

      // Calculate current average grade
      let totalScore = 0;
      grades.forEach(grade => totalScore += grade.score);
      const currentGrade = grades.length > 0 ? (totalScore / grades.length).toFixed(1) : 'N/A';

      return res.status(200).json({
        records: gradeRecords,
        current: currentGrade
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}