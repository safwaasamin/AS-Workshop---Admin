import {
  User, InsertUser, Event, InsertEvent, Attendee, InsertAttendee,
  Mentor, InsertMentor, FeedbackQuestion, InsertFeedbackQuestion,
  FeedbackResponse, InsertFeedbackResponse, Task, InsertTask,
  TaskProgress, InsertTaskProgress, 
  users, events, attendees, mentors, feedbackQuestions, feedbackResponses, tasks, taskProgress
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, asc, sql, and, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import connectPg from "connect-pg-simple";
import session from "express-session";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store for authentication
  sessionStore: any;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  
  // Attendee operations
  getAttendee(id: number): Promise<Attendee | undefined>;
  getAttendeesByEvent(eventId: number): Promise<Attendee[]>;
  createAttendee(attendee: InsertAttendee): Promise<Attendee>;
  updateAttendee(id: number, attendee: Partial<InsertAttendee>): Promise<Attendee | undefined>;
  deleteAttendee(id: number): Promise<boolean>;
  bulkCreateAttendees(attendees: InsertAttendee[]): Promise<Attendee[]>;
  
  // Mentor operations
  getMentor(id: number): Promise<Mentor | undefined>;
  getMentorsByEvent(eventId: number): Promise<Mentor[]>;
  createMentor(mentor: InsertMentor): Promise<Mentor>;
  updateMentor(id: number, mentor: Partial<InsertMentor>): Promise<Mentor | undefined>;
  deleteMentor(id: number): Promise<boolean>;
  incrementAssignedCount(id: number): Promise<Mentor | undefined>;
  
  // Feedback operations
  getFeedbackQuestion(id: number): Promise<FeedbackQuestion | undefined>;
  getFeedbackQuestionsByEvent(eventId: number): Promise<FeedbackQuestion[]>;
  createFeedbackQuestion(question: InsertFeedbackQuestion): Promise<FeedbackQuestion>;
  createFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse>;
  getFeedbackResponsesByQuestion(questionId: number): Promise<FeedbackResponse[]>;
  getFeedbackResponsesByAttendee(attendeeId: number): Promise<FeedbackResponse[]>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByEvent(eventId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  
  // Task progress operations
  getTaskProgress(id: number): Promise<TaskProgress | undefined>;
  getTaskProgressByAttendee(attendeeId: number): Promise<TaskProgress[]>;
  getTaskProgressByTask(taskId: number): Promise<TaskProgress[]>;
  createTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress>;
  updateTaskProgress(id: number, progress: Partial<InsertTaskProgress>): Promise<TaskProgress | undefined>;
  
  // Dashboard statistics
  getDashboardStats(eventId: number): Promise<any>;
  getTopPerformers(eventId: number, limit: number): Promise<any[]>;
  
  // Initialize database with default data
  initializeDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(sql`LOWER(${users.username})`, username.toLowerCase()));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(sql`LOWER(${users.email})`, email.toLowerCase()));
    return result[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }
  
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }
  
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }
  
  // Attendee operations
  async getAttendee(id: number): Promise<Attendee | undefined> {
    const result = await db.select().from(attendees).where(eq(attendees.id, id));
    return result[0];
  }
  
  async getAttendeesByEvent(eventId: number): Promise<Attendee[]> {
    return await db.select().from(attendees)
      .where(eq(attendees.eventId, eventId));
  }
  
  async createAttendee(attendee: InsertAttendee): Promise<Attendee> {
    const result = await db.insert(attendees).values(attendee).returning();
    return result[0];
  }
  
  async updateAttendee(id: number, attendee: Partial<InsertAttendee>): Promise<Attendee | undefined> {
    const result = await db.update(attendees)
      .set(attendee)
      .where(eq(attendees.id, id))
      .returning();
    return result[0];
  }
  
  async deleteAttendee(id: number): Promise<boolean> {
    const result = await db.delete(attendees)
      .where(eq(attendees.id, id));
    return true;
  }
  
  async bulkCreateAttendees(attendeesList: InsertAttendee[]): Promise<Attendee[]> {
    const result = await db.insert(attendees).values(attendeesList).returning();
    return result;
  }
  
  // Mentor operations
  async getMentor(id: number): Promise<Mentor | undefined> {
    const result = await db.select().from(mentors).where(eq(mentors.id, id));
    return result[0];
  }
  
  async getMentorsByEvent(eventId: number): Promise<Mentor[]> {
    return await db.select().from(mentors)
      .where(eq(mentors.eventId, eventId));
  }
  
  async createMentor(mentor: InsertMentor): Promise<Mentor> {
    const result = await db.insert(mentors).values(mentor).returning();
    return result[0];
  }
  
  async updateMentor(id: number, mentor: Partial<InsertMentor>): Promise<Mentor | undefined> {
    const result = await db.update(mentors)
      .set(mentor)
      .where(eq(mentors.id, id))
      .returning();
    return result[0];
  }
  
  async deleteMentor(id: number): Promise<boolean> {
    await db.delete(mentors).where(eq(mentors.id, id));
    return true;
  }
  
  async incrementAssignedCount(id: number): Promise<Mentor | undefined> {
    const mentor = await this.getMentor(id);
    if (!mentor) return undefined;
    
    const newCount = (mentor.assignedCount || 0) + 1;
    return await this.updateMentor(id, { assignedCount: newCount });
  }
  
  // Feedback operations
  async getFeedbackQuestion(id: number): Promise<FeedbackQuestion | undefined> {
    const result = await db.select().from(feedbackQuestions)
      .where(eq(feedbackQuestions.id, id));
    return result[0];
  }
  
  async getFeedbackQuestionsByEvent(eventId: number): Promise<FeedbackQuestion[]> {
    return await db.select().from(feedbackQuestions)
      .where(eq(feedbackQuestions.eventId, eventId))
      .orderBy(asc(feedbackQuestions.order));
  }
  
  async createFeedbackQuestion(question: InsertFeedbackQuestion): Promise<FeedbackQuestion> {
    const result = await db.insert(feedbackQuestions).values(question).returning();
    return result[0];
  }
  
  async createFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse> {
    const result = await db.insert(feedbackResponses).values(response).returning();
    return result[0];
  }
  
  async getFeedbackResponsesByQuestion(questionId: number): Promise<FeedbackResponse[]> {
    return await db.select().from(feedbackResponses)
      .where(eq(feedbackResponses.questionId, questionId));
  }
  
  async getFeedbackResponsesByAttendee(attendeeId: number): Promise<FeedbackResponse[]> {
    return await db.select().from(feedbackResponses)
      .where(eq(feedbackResponses.attendeeId, attendeeId));
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }
  
  async getTasksByEvent(eventId: number): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.eventId, eventId));
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }
  
  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }
  
  // Task progress operations
  async getTaskProgress(id: number): Promise<TaskProgress | undefined> {
    const result = await db.select().from(taskProgress)
      .where(eq(taskProgress.id, id));
    return result[0];
  }
  
  async getTaskProgressByAttendee(attendeeId: number): Promise<TaskProgress[]> {
    return await db.select().from(taskProgress)
      .where(eq(taskProgress.attendeeId, attendeeId));
  }
  
  async getTaskProgressByTask(taskId: number): Promise<TaskProgress[]> {
    return await db.select().from(taskProgress)
      .where(eq(taskProgress.taskId, taskId));
  }
  
  async createTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress> {
    const result = await db.insert(taskProgress).values(progress).returning();
    return result[0];
  }
  
  async updateTaskProgress(id: number, progress: Partial<InsertTaskProgress>): Promise<TaskProgress | undefined> {
    const result = await db.update(taskProgress)
      .set(progress)
      .where(eq(taskProgress.id, id))
      .returning();
    return result[0];
  }
  
  // Dashboard statistics
  async getDashboardStats(eventId: number): Promise<any> {
    const eventAttendees = await this.getAttendeesByEvent(eventId);
    
    const totalApplications = eventAttendees.length;
    const participantsStarted = eventAttendees.filter(a => a.status !== 'registered').length;
    const participantsCompleted = eventAttendees.filter(a => a.status === 'completed').length;
    const avgCompletionRate = totalApplications > 0 
      ? Math.round((participantsCompleted / totalApplications) * 100) 
      : 0;
    
    return {
      totalApplications,
      participantsStarted,
      participantsCompleted,
      avgCompletionRate: `${avgCompletionRate}%`,
      // Mock trends for initial data
      applicationTrend: '+12% from last week',
      startedTrend: '+5% from last week',
      completedTrend: '+8% from last week',
      rateTrend: '+3% from last week',
      progressStats: {
        notStarted: eventAttendees.filter(a => a.status === 'registered').length,
        inProgress: eventAttendees.filter(a => a.status === 'in_progress').length,
        completed: participantsCompleted
      }
    };
  }
  
  async getTopPerformers(eventId: number, limit: number = 5): Promise<any[]> {
    // Get attendees with scores, sorted by score descending
    const topAttendees = await db.select()
      .from(attendees)
      .where(and(
        eq(attendees.eventId, eventId),
        sql`${attendees.score} > 0`
      ))
      .orderBy(desc(attendees.score))
      .limit(limit);
    
    return topAttendees.map(attendee => ({
      id: attendee.id,
      name: attendee.name,
      score: attendee.score || 0,
      completionTime: attendee.completionTime || 'N/A',
      email: attendee.email,
      company: attendee.company || 'N/A'
    }));
  }
  
  // Initialize database with default data
  async initializeDefaultData(): Promise<void> {
    // Check if any users exist
    const existingUsers = await db.select({ count: count() }).from(users);
    if (existingUsers[0].count > 0) {
      console.log('Database already has data, skipping initialization');
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('password', 10);
    await this.createUser({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    });
    console.log('Default admin user created: admin@example.com / password');
    
    // Create a sample event
    const event = await this.createEvent({
      name: 'AspiraSys Workshop System',
      description: 'Technical skill development workshop',
      startDate: new Date('2023-09-15'),
      endDate: new Date('2023-09-20'),
      location: 'Bangalore, India',
      status: 'active'
    });
    
    // Add sample attendees
    await this.createAttendee({
      eventId: event.id,
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      company: 'Tech Innovations',
      position: 'Junior Developer',
      phone: '9876543210',
      status: 'registered',
      username: 'priya.sharma@example.com',
      password: 'abc123',
      mentorId: null,
      score: 0,
      completionTime: null
    });
    
    await this.createAttendee({
      eventId: event.id,
      name: 'Rahul Patel',
      email: 'rahul.patel@example.com',
      company: 'Digital Solutions',
      position: 'UI/UX Designer',
      phone: '8765432109',
      status: 'in_progress',
      username: 'rahul.patel@example.com',
      password: 'abc123',
      mentorId: null,
      score: 45,
      completionTime: null
    });
    
    await this.createAttendee({
      eventId: event.id,
      name: 'Ananya Kumar',
      email: 'ananya.k@example.com',
      company: 'WebTech',
      position: 'Software Engineer',
      phone: '7654321098',
      status: 'completed',
      username: 'ananya.k@example.com',
      password: 'abc123',
      mentorId: null,
      score: 92,
      completionTime: '2h 15m'
    });
  }
}

export const storage = new DatabaseStorage();