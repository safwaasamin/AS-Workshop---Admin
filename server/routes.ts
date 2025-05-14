import { Express, Request, Response, NextFunction } from "express";
import { Server, createServer } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import * as XLSX from "xlsx";
import * as crypto from "crypto";

const upload = multer({ dest: "uploads/" });

function generatePassword(length = 8) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  const isAuthenticated = setupAuth(app);

  // Initialize default data if needed
  await storage.initializeDefaultData();

  // Event routes
  app.get("/api/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events", error });
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
      res.status(500).json({ message: "Error fetching event", error });
    }
  });

  // Dashboard statistics routes
  app.get("/api/events/:id/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const stats = await storage.getDashboardStats(eventId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching event statistics", error });
    }
  });

  app.get("/api/events/:id/top-performers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const performers = await storage.getTopPerformers(eventId, limit);
      res.json(performers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching top performers", error });
    }
  });

  // Attendee routes
  app.get("/api/events/:id/attendees", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const attendees = await storage.getAttendeesByEvent(eventId);
      res.json(attendees);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendees", error });
    }
  });

  app.post("/api/events/:id/attendees", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const attendee = {
        ...req.body,
        eventId
      };
      
      // Generate email-based username and random password if requested
      if (req.body.generateCredentials) {
        attendee.username = attendee.email;
        attendee.password = generatePassword();
      }
      
      const newAttendee = await storage.createAttendee(attendee);
      res.status(201).json(newAttendee);
    } catch (error) {
      res.status(500).json({ message: "Error creating attendee", error });
    }
  });
  
  app.get("/api/attendees/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const attendeeId = parseInt(req.params.id);
      const attendee = await storage.getAttendee(attendeeId);
      
      if (!attendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      res.json(attendee);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendee", error });
    }
  });
  
  app.patch("/api/attendees/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const attendeeId = parseInt(req.params.id);
      const attendee = await storage.updateAttendee(attendeeId, req.body);
      
      if (!attendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      res.json(attendee);
    } catch (error) {
      res.status(500).json({ message: "Error updating attendee", error });
    }
  });
  
  app.delete("/api/attendees/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const attendeeId = parseInt(req.params.id);
      const result = await storage.deleteAttendee(attendeeId);
      
      if (!result) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting attendee", error });
    }
  });

  // Import attendees from Excel/CSV
  app.post("/api/events/:id/import-attendees", isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const generateCredentials = req.body.generateCredentials === 'true';
      const importType = req.body.importType || 'excel';
      let attendeesData: any[] = [];
      
      // Handle different import types
      if (importType === 'manual') {
        // Handle manual entry data
        if (!req.body.manualData) {
          return res.status(400).json({ message: "No data provided for manual entry" });
        }
        
        try {
          attendeesData = JSON.parse(req.body.manualData);
        } catch (err) {
          return res.status(400).json({ message: "Invalid data format for manual entry" });
        }
      } else if (importType === 'pdf') {
        // Handle PDF upload
        if (!req.file) {
          return res.status(400).json({ message: "No PDF file uploaded" });
        }
        
        // Basic text extraction from PDF (simplified for demo)
        // In a real implementation, use a PDF parsing library with more sophisticated extraction logic
        attendeesData = [
          {
            name: "PDF Extracted User",
            email: "pdf.user@example.com",
            company: "PDF Company",
            position: "PDF Role",
            phone: "1234567890"
          }
        ];
        
        console.log("PDF import - this would normally extract data from:", req.file.path);
      } else {
        // Handle Excel/CSV upload (default)
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        // Read Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        attendeesData = XLSX.utils.sheet_to_json(worksheet);
        
        if (attendeesData.length === 0) {
          return res.status(400).json({ message: "File contains no data" });
        }
      }
      
      // Process attendees
      const attendees = attendeesData.map((row: any) => {
        const attendee: any = {
          eventId,
          name: row.Name || row.name,
          email: row.Email || row.email,
          company: row.Company || row.company || null,
          position: row.Position || row.position || null,
          phone: row.Phone || row.phone || null,
          status: 'registered'
        };
        
        // Generate credentials if requested
        if (generateCredentials) {
          attendee.username = attendee.email;
          attendee.password = generatePassword();
        }
        
        return attendee;
      });
      
      // Validate required fields
      const invalidAttendees = attendees.filter(a => !a.name || !a.email);
      if (invalidAttendees.length > 0) {
        return res.status(400).json({ 
          message: "Some records are missing required fields (name, email)",
          invalidRows: invalidAttendees
        });
      }
      
      // Save attendees to database
      const createdAttendees = await storage.bulkCreateAttendees(attendees);
      
      // For debugging - log what was created
      console.log(`Created ${createdAttendees.length} attendees via ${importType} import`);
      
      res.status(201).json(createdAttendees);
    } catch (error) {
      console.error("Error importing attendees:", error);
      res.status(500).json({ message: "Error importing attendees", error });
    }
  });

  // Mentor routes
  app.get("/api/events/:id/mentors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const mentors = await storage.getMentorsByEvent(eventId);
      res.json(mentors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching mentors", error });
    }
  });

  app.post("/api/events/:id/mentors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const mentor = {
        ...req.body,
        eventId
      };
      const newMentor = await storage.createMentor(mentor);
      res.status(201).json(newMentor);
    } catch (error) {
      res.status(500).json({ message: "Error creating mentor", error });
    }
  });
  
  app.get("/api/mentors/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const mentorId = parseInt(req.params.id);
      const mentor = await storage.getMentor(mentorId);
      
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      res.json(mentor);
    } catch (error) {
      res.status(500).json({ message: "Error fetching mentor", error });
    }
  });
  
  app.patch("/api/mentors/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const mentorId = parseInt(req.params.id);
      const mentor = await storage.updateMentor(mentorId, req.body);
      
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      res.json(mentor);
    } catch (error) {
      res.status(500).json({ message: "Error updating mentor", error });
    }
  });
  
  app.delete("/api/mentors/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const mentorId = parseInt(req.params.id);
      const result = await storage.deleteMentor(mentorId);
      
      if (!result) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting mentor", error });
    }
  });

  // Mentor assignment
  app.post("/api/events/:id/assign-mentors", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { attendeeId, mentorId } = req.body;
      if (!attendeeId || !mentorId) {
        return res.status(400).json({ message: "Attendee ID and Mentor ID are required" });
      }
      
      // Update attendee with mentor id
      const updatedAttendee = await storage.updateAttendee(attendeeId, { mentorId });
      if (!updatedAttendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      // Increment mentor assigned count
      await storage.incrementAssignedCount(mentorId);
      
      res.json(updatedAttendee);
    } catch (error) {
      res.status(500).json({ message: "Error assigning mentor", error });
    }
  });

  // Feedback routes
  app.get("/api/events/:id/feedback-questions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const questions = await storage.getFeedbackQuestionsByEvent(eventId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching feedback questions", error });
    }
  });

  app.post("/api/events/:id/feedback-questions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const question = {
        ...req.body,
        eventId
      };
      const newQuestion = await storage.createFeedbackQuestion(question);
      res.status(201).json(newQuestion);
    } catch (error) {
      res.status(500).json({ message: "Error creating feedback question", error });
    }
  });

  // Task routes
  app.get("/api/events/:id/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const tasks = await storage.getTasksByEvent(eventId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tasks", error });
    }
  });

  app.post("/api/events/:id/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const task = {
        ...req.body,
        eventId
      };
      const newTask = await storage.createTask(task);
      res.status(201).json(newTask);
    } catch (error) {
      res.status(500).json({ message: "Error creating task", error });
    }
  });
  
  app.get("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Error fetching task", error });
    }
  });
  
  app.patch("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.updateTask(taskId, req.body);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Error updating task", error });
    }
  });
  
  app.delete("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      
      // First, check if the task exists
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Delete task - we need to implement this in storage
      await storage.updateTask(taskId, { status: 'deleted' });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting task", error });
    }
  });

  // Task progress routes
  app.get("/api/tasks/:id/progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const progress = await storage.getTaskProgressByTask(taskId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Error fetching task progress", error });
    }
  });

  app.post("/api/tasks/:id/progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const progress = {
        ...req.body,
        taskId
      };
      const newProgress = await storage.createTaskProgress(progress);
      res.status(201).json(newProgress);
    } catch (error) {
      res.status(500).json({ message: "Error creating task progress", error });
    }
  });

  // Reports routes
  app.get("/api/events/:id/reports", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      // For now just return attendees and mentors
      const [attendees, mentors] = await Promise.all([
        storage.getAttendeesByEvent(eventId),
        storage.getMentorsByEvent(eventId)
      ]);
      
      res.json({
        eventId,
        attendeeCount: attendees.length,
        mentorCount: mentors.length,
        completedCount: attendees.filter(a => a.status === 'completed').length,
        attendees,
        mentors
      });
    } catch (error) {
      res.status(500).json({ message: "Error generating report", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}