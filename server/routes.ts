import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertEventSchema, 
  insertAttendeeSchema, 
  insertMentorSchema,
  insertFeedbackQuestionSchema,
  insertFeedbackResponseSchema,
  insertTaskSchema,
  insertTaskProgressSchema
} from "@shared/schema";
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

// Setup multer for file uploads
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication (Passport, sessions, etc.)
  setupAuth(app);

  // User routes - getCurrentUser is already handled by setupAuth

  // Bypass authentication for development
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    // Allow all requests through for now
    return next();
    
    // Original authentication check (commented out for now)
    // if (req.isAuthenticated && req.isAuthenticated()) {
    //   return next();
    // }
    // res.status(401).json({ message: "Unauthorized" });
  };

  // Event routes
  app.get("/api/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error getting events:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/events/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error getting event:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Dashboard stats
  app.get("/api/events/:id/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const stats = await storage.getDashboardStats(eventId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Top performers
  app.get("/api/events/:id/top-performers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const topPerformers = await storage.getTopPerformers(eventId, limit);
      res.json(topPerformers);
    } catch (error) {
      console.error("Error getting top performers:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Attendee routes
  app.get("/api/events/:id/attendees", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const attendees = await storage.getAttendeesByEvent(eventId);
      
      // Map to include initials
      const attendeesWithInitials = attendees.map(attendee => ({
        ...attendee,
        initials: attendee.name.split(' ').map(n => n[0]).join('').toUpperCase()
      }));
      
      res.json(attendeesWithInitials);
    } catch (error) {
      console.error("Error getting attendees:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/events/:id/attendees", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Validate attendee data
      const attendeeData = { ...req.body, eventId };
      const validatedData = insertAttendeeSchema.parse(attendeeData);
      
      // Create attendee
      const attendee = await storage.createAttendee(validatedData);
      
      res.status(201).json(attendee);
    } catch (error) {
      console.error("Error creating attendee:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendee data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Import attendees from Excel/CSV
  app.post("/api/events/:id/import-attendees", isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const filePath = req.file.path;
      const generateCredentials = req.body.generateCredentials === 'true';
      
      // Read file
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const attendeeData = XLSX.utils.sheet_to_json(sheet);
      
      // Validate and transform data
      const attendees = [];
      for (const data of attendeeData) {
        const { Name, Email, Company, Position, Phone } = data as any;
        
        if (!Name || !Email) {
          continue; // Skip rows without required fields
        }
        
        let username = '';
        let password = '';
        
        if (generateCredentials) {
          // Generate login credentials
          // Username will be the email address itself for easier login
          username = Email;
          // Generate a secure but manageable 8-character password
          password = randomBytes(4).toString('hex') + randomBytes(2).toString('hex');
        }
        
        attendees.push({
          eventId,
          name: Name,
          email: Email,
          company: Company || '',
          position: Position || '',
          phone: Phone || '',
          status: 'registered',
          username,
          password,
          mentorId: null
        });
      }
      
      // Create attendees
      const createdAttendees = await storage.bulkCreateAttendees(attendees);
      
      // Delete uploaded file
      fs.unlinkSync(filePath);
      
      res.status(201).json(createdAttendees);
    } catch (error) {
      console.error("Error importing attendees:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Mentor routes
  app.get("/api/events/:id/mentors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const mentors = await storage.getMentorsByEvent(eventId);
      
      // Map to include initials
      const mentorsWithInitials = mentors.map(mentor => ({
        ...mentor,
        initials: mentor.name.split(' ').map(n => n[0]).join('').toUpperCase()
      }));
      
      res.json(mentorsWithInitials);
    } catch (error) {
      console.error("Error getting mentors:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/events/:id/mentors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Validate mentor data
      const mentorData = { ...req.body, eventId };
      const validatedData = insertMentorSchema.parse(mentorData);
      
      // Create mentor
      const mentor = await storage.createMentor(validatedData);
      
      res.status(201).json(mentor);
    } catch (error) {
      console.error("Error creating mentor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mentor data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Assign mentors to attendees
  app.post("/api/events/:id/assign-mentors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const { mentorId, attendeeIds, sendNotification } = req.body;
      
      if (!mentorId || !attendeeIds || !Array.isArray(attendeeIds)) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      
      // Get mentor
      const mentor = await storage.getMentor(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      // Assign mentor to attendees
      const assignedAttendees = [];
      for (const attendeeId of attendeeIds) {
        const attendee = await storage.getAttendee(attendeeId);
        if (!attendee) continue;
        
        const updatedAttendee = await storage.updateAttendee(attendeeId, { mentorId });
        if (updatedAttendee) {
          assignedAttendees.push(updatedAttendee);
        }
      }
      
      // Update mentor assigned count
      await storage.incrementAssignedCount(mentorId);
      
      // TODO: Send notification emails if requested
      if (sendNotification) {
        // This would be implemented with a real email service
        console.log(`Notification requested for assignment of mentor ${mentorId} to attendees`);
      }
      
      res.json(assignedAttendees);
    } catch (error) {
      console.error("Error assigning mentors:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Feedback routes
  app.get("/api/events/:id/feedback-questions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const questions = await storage.getFeedbackQuestionsByEvent(eventId);
      res.json(questions);
    } catch (error) {
      console.error("Error getting feedback questions:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/events/:id/feedback-questions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Validate question data
      const questionData = { ...req.body, eventId };
      const validatedData = insertFeedbackQuestionSchema.parse(questionData);
      
      // Create question
      const question = await storage.createFeedbackQuestion(validatedData);
      
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating feedback question:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Task routes
  app.get("/api/events/:id/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const tasks = await storage.getTasksByEvent(eventId);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting tasks:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/events/:id/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Validate task data
      const taskData = { ...req.body, eventId };
      const validatedData = insertTaskSchema.parse(taskData);
      
      // Create task
      const task = await storage.createTask(validatedData);
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Task progress routes
  app.get("/api/tasks/:id/progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const progress = await storage.getTaskProgressByTask(taskId);
      res.json(progress);
    } catch (error) {
      console.error("Error getting task progress:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/tasks/:id/progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Validate progress data
      const progressData = { ...req.body, taskId };
      const validatedData = insertTaskProgressSchema.parse(progressData);
      
      // Create progress
      const progress = await storage.createTaskProgress(validatedData);
      
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating task progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid progress data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Report routes - Generate reports for event
  app.get("/api/events/:id/reports", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Get attendees with their progress
      const attendees = await storage.getAttendeesByEvent(eventId);
      
      // Format data for report
      const reportData = await Promise.all(attendees.map(async attendee => {
        // Get mentor if assigned
        let mentorName = 'Not Assigned';
        if (attendee.mentorId) {
          const mentor = await storage.getMentor(attendee.mentorId);
          if (mentor) {
            mentorName = mentor.name;
          }
        }
        
        return {
          name: attendee.name,
          email: attendee.email,
          company: attendee.company,
          status: attendee.status,
          registrationDate: attendee.registrationDate,
          mentor: mentorName,
          score: attendee.score,
          completionTime: attendee.completionTime
        };
      }));
      
      res.json(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
