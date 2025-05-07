import {
  users, type User, type InsertUser,
  events, type Event, type InsertEvent,
  attendees, type Attendee, type InsertAttendee,
  mentors, type Mentor, type InsertMentor,
  feedbackQuestions, type FeedbackQuestion, type InsertFeedbackQuestion,
  feedbackResponses, type FeedbackResponse, type InsertFeedbackResponse,
  tasks, type Task, type InsertTask,
  taskProgress, type TaskProgress, type InsertTaskProgress
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private attendees: Map<number, Attendee>;
  private mentors: Map<number, Mentor>;
  private feedbackQuestions: Map<number, FeedbackQuestion>;
  private feedbackResponses: Map<number, FeedbackResponse>;
  private tasks: Map<number, Task>;
  private taskProgress: Map<number, TaskProgress>;
  
  // Counters for generating IDs
  private userCounter: number;
  private eventCounter: number;
  private attendeeCounter: number;
  private mentorCounter: number;
  private feedbackQuestionCounter: number;
  private feedbackResponseCounter: number;
  private taskCounter: number;
  private taskProgressCounter: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.attendees = new Map();
    this.mentors = new Map();
    this.feedbackQuestions = new Map();
    this.feedbackResponses = new Map();
    this.tasks = new Map();
    this.taskProgress = new Map();
    
    this.userCounter = 1;
    this.eventCounter = 1;
    this.attendeeCounter = 1;
    this.mentorCounter = 1;
    this.feedbackQuestionCounter = 1;
    this.feedbackResponseCounter = 1;
    this.taskCounter = 1;
    this.taskProgressCounter = 1;
    
    // Add a default admin user
    this.createUser({
      username: 'admin',
      password: '$2a$10$sCiMJvQd5YtYe2yBlP4/4uXpXNGNFpnxd4jJY8EyQw.BQRCsIEiLC', // 'password' hashed
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    });
    
    // Create a sample event
    this.createEvent({
      name: 'Tech Conference 2023',
      description: 'Annual technology conference',
      startDate: new Date('2023-09-15'),
      endDate: new Date('2023-09-20'),
      location: 'San Francisco, CA',
      status: 'active'
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventCounter++;
    const newEvent: Event = { ...event, id };
    this.events.set(id, newEvent);
    return newEvent;
  }
  
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...event };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  // Attendee operations
  async getAttendee(id: number): Promise<Attendee | undefined> {
    return this.attendees.get(id);
  }
  
  async getAttendeesByEvent(eventId: number): Promise<Attendee[]> {
    return Array.from(this.attendees.values()).filter(
      (attendee) => attendee.eventId === eventId
    );
  }
  
  async createAttendee(attendee: InsertAttendee): Promise<Attendee> {
    const id = this.attendeeCounter++;
    const registrationDate = new Date();
    const newAttendee: Attendee = { ...attendee, id, registrationDate, score: 0, completionTime: '' };
    this.attendees.set(id, newAttendee);
    return newAttendee;
  }
  
  async updateAttendee(id: number, attendee: Partial<InsertAttendee>): Promise<Attendee | undefined> {
    const existingAttendee = this.attendees.get(id);
    if (!existingAttendee) return undefined;
    
    const updatedAttendee = { ...existingAttendee, ...attendee };
    this.attendees.set(id, updatedAttendee);
    return updatedAttendee;
  }
  
  async deleteAttendee(id: number): Promise<boolean> {
    return this.attendees.delete(id);
  }
  
  async bulkCreateAttendees(attendees: InsertAttendee[]): Promise<Attendee[]> {
    const createdAttendees: Attendee[] = [];
    
    for (const attendee of attendees) {
      const newAttendee = await this.createAttendee(attendee);
      createdAttendees.push(newAttendee);
    }
    
    return createdAttendees;
  }

  // Mentor operations
  async getMentor(id: number): Promise<Mentor | undefined> {
    return this.mentors.get(id);
  }
  
  async getMentorsByEvent(eventId: number): Promise<Mentor[]> {
    return Array.from(this.mentors.values()).filter(
      (mentor) => mentor.eventId === eventId
    );
  }
  
  async createMentor(mentor: InsertMentor): Promise<Mentor> {
    const id = this.mentorCounter++;
    const newMentor: Mentor = { ...mentor, id, assignedCount: 0 };
    this.mentors.set(id, newMentor);
    return newMentor;
  }
  
  async updateMentor(id: number, mentor: Partial<InsertMentor>): Promise<Mentor | undefined> {
    const existingMentor = this.mentors.get(id);
    if (!existingMentor) return undefined;
    
    const updatedMentor = { ...existingMentor, ...mentor };
    this.mentors.set(id, updatedMentor);
    return updatedMentor;
  }
  
  async deleteMentor(id: number): Promise<boolean> {
    return this.mentors.delete(id);
  }
  
  async incrementAssignedCount(id: number): Promise<Mentor | undefined> {
    const existingMentor = this.mentors.get(id);
    if (!existingMentor) return undefined;
    
    const updatedMentor = { ...existingMentor, assignedCount: existingMentor.assignedCount + 1 };
    this.mentors.set(id, updatedMentor);
    return updatedMentor;
  }

  // Feedback operations
  async getFeedbackQuestion(id: number): Promise<FeedbackQuestion | undefined> {
    return this.feedbackQuestions.get(id);
  }
  
  async getFeedbackQuestionsByEvent(eventId: number): Promise<FeedbackQuestion[]> {
    return Array.from(this.feedbackQuestions.values())
      .filter((question) => question.eventId === eventId)
      .sort((a, b) => a.order - b.order);
  }
  
  async createFeedbackQuestion(question: InsertFeedbackQuestion): Promise<FeedbackQuestion> {
    const id = this.feedbackQuestionCounter++;
    const newQuestion: FeedbackQuestion = { ...question, id };
    this.feedbackQuestions.set(id, newQuestion);
    return newQuestion;
  }
  
  async createFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse> {
    const id = this.feedbackResponseCounter++;
    const newResponse: FeedbackResponse = { ...response, id };
    this.feedbackResponses.set(id, newResponse);
    return newResponse;
  }
  
  async getFeedbackResponsesByQuestion(questionId: number): Promise<FeedbackResponse[]> {
    return Array.from(this.feedbackResponses.values()).filter(
      (response) => response.questionId === questionId
    );
  }
  
  async getFeedbackResponsesByAttendee(attendeeId: number): Promise<FeedbackResponse[]> {
    return Array.from(this.feedbackResponses.values()).filter(
      (response) => response.attendeeId === attendeeId
    );
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksByEvent(eventId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.eventId === eventId
    );
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskCounter++;
    const newTask: Task = { ...task, id };
    this.tasks.set(id, newTask);
    return newTask;
  }
  
  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...task };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Task progress operations
  async getTaskProgress(id: number): Promise<TaskProgress | undefined> {
    return this.taskProgress.get(id);
  }
  
  async getTaskProgressByAttendee(attendeeId: number): Promise<TaskProgress[]> {
    return Array.from(this.taskProgress.values()).filter(
      (progress) => progress.attendeeId === attendeeId
    );
  }
  
  async getTaskProgressByTask(taskId: number): Promise<TaskProgress[]> {
    return Array.from(this.taskProgress.values()).filter(
      (progress) => progress.taskId === taskId
    );
  }
  
  async createTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress> {
    const id = this.taskProgressCounter++;
    const newProgress: TaskProgress = { ...progress, id };
    this.taskProgress.set(id, newProgress);
    return newProgress;
  }
  
  async updateTaskProgress(id: number, progress: Partial<InsertTaskProgress>): Promise<TaskProgress | undefined> {
    const existingProgress = this.taskProgress.get(id);
    if (!existingProgress) return undefined;
    
    const updatedProgress = { ...existingProgress, ...progress };
    this.taskProgress.set(id, updatedProgress);
    return updatedProgress;
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
        notStarted: `${Math.round(((totalApplications - participantsStarted) / totalApplications) * 100)}%`,
        inProgress: `${Math.round(((participantsStarted - participantsCompleted) / totalApplications) * 100)}%`,
        completed: `${Math.round((participantsCompleted / totalApplications) * 100)}%`
      }
    };
  }
  
  async getTopPerformers(eventId: number, limit: number = 5): Promise<any[]> {
    const eventAttendees = await this.getAttendeesByEvent(eventId);
    
    // Sort by score (descending) and take the top performers
    return eventAttendees
      .filter(a => a.status === 'completed' && a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(a => ({
        id: a.id,
        name: a.name,
        score: a.score,
        completionTime: a.completionTime || '3h 00m',
        initials: a.name.split(' ').map(n => n[0]).join('').toUpperCase()
      }));
  }
}

// Create and export a singleton instance
export const storage = new MemStorage();
