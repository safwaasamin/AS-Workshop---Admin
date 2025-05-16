
import {
  User, InsertUser, Event, InsertEvent, Attendee, InsertAttendee,
  Mentor, InsertMentor, FeedbackQuestion, InsertFeedbackQuestion,
  FeedbackResponse, InsertFeedbackResponse, Task, InsertTask,
  TaskProgress, InsertTaskProgress
} from "@shared/schema";

import { pool } from "./db";

export interface IStorage {
  // same interface as before
  sessionStore: any;

  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;

  // and so forth for all methods...
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // You can initialize sessionStore similarly if needed for mysql2
    this.sessionStore = null; // or your session store logic
  }

  // Helper to run queries
  private async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const rows = await this.query<User>("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const rows = await this.query<User>(
      "SELECT * FROM users WHERE LOWER(username) = LOWER(?)", [username]
    );
    return rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await this.query<User>(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [email]
    );
    return rows[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const keys = Object.keys(user);
    const values = Object.values(user);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO users (${keys.join(", ")}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values) as any;

    // result.insertId is the new id
    return this.getUser(result.insertId) as Promise<User>;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const rows = await this.query<Event>("SELECT * FROM events WHERE id = ?", [id]);
    return rows[0];
  }

  async getAllEvents(): Promise<Event[]> {
    return await this.query<Event>("SELECT * FROM events");
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const keys = Object.keys(event);
    const values = Object.values(event);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO events (${keys.join(", ")}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values) as any;
    return this.getEvent(result.insertId) as Promise<Event>;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const keys = Object.keys(event);
    if (keys.length === 0) return this.getEvent(id);

    const values = Object.values(event);
    const setClause = keys.map(k => `${k} = ?`).join(", ");

    const sql = `UPDATE events SET ${setClause} WHERE id = ?`;
    await pool.execute(sql, [...values, id]);
    return this.getEvent(id);
  }

  // Attendee operations
  async getAttendee(id: number): Promise<Attendee | undefined> {
    const rows = await this.query<Attendee>("SELECT * FROM attendees WHERE id = ?", [id]);
    return rows[0];
  }

  async getAttendeesByEvent(eventId: number): Promise<Attendee[]> {
    return await this.query<Attendee>("SELECT * FROM attendees WHERE eventId = ?", [eventId]);
  }

  async createAttendee(attendee: InsertAttendee): Promise<Attendee> {
    const keys = Object.keys(attendee);
    const values = Object.values(attendee);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO attendees (${keys.join(", ")}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values) as any;
    return this.getAttendee(result.insertId) as Promise<Attendee>;
  }

  async updateAttendee(id: number, attendee: Partial<InsertAttendee>): Promise<Attendee | undefined> {
    const keys = Object.keys(attendee);
    if (keys.length === 0) return this.getAttendee(id);

    const values = Object.values(attendee);
    const setClause = keys.map(k => `${k} = ?`).join(", ");

    const sql = `UPDATE attendees SET ${setClause} WHERE id = ?`;
    await pool.execute(sql, [...values, id]);
    return this.getAttendee(id);
  }

  async deleteAttendee(id: number): Promise<boolean> {
    await pool.execute("DELETE FROM attendees WHERE id = ?", [id]);
    return true;
  }

  async bulkCreateAttendees(attendeesList: InsertAttendee[]): Promise<Attendee[]> {
    if (attendeesList.length === 0) return [];

    const keys = Object.keys(attendeesList[0]);
    const placeholders = attendeesList
      .map(() => `(${keys.map(() => "?").join(", ")})`)
      .join(", ");
    const values = attendeesList.flatMap(Object.values);

    const sql = `INSERT INTO attendees (${keys.join(", ")}) VALUES ${placeholders}`;
    await pool.execute(sql, values);

    // Return all attendees for simplicity (you can optimize this)
    // If you want just the inserted ones, you'd need to query again or handle it differently
    return this.getAttendeesByEvent(attendeesList[0].eventId);
  }

  // Mentor operations
  async getMentor(id: number): Promise<Mentor | undefined> {
    const rows = await this.query<Mentor>("SELECT * FROM mentors WHERE id = ?", [id]);
    return rows[0];
  }

  async getMentorsByEvent(eventId: number): Promise<Mentor[]> {
    return await this.query<Mentor>("SELECT * FROM mentors WHERE eventId = ?", [eventId]);
  }

  async createMentor(mentor: InsertMentor): Promise<Mentor> {
    const keys = Object.keys(mentor);
    const values = Object.values(mentor);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO mentors (${keys.join(", ")}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values) as any;
    return this.getMentor(result.insertId) as Promise<Mentor>;
  }

  async updateMentor(id: number, mentor: Partial<InsertMentor>): Promise<Mentor | undefined> {
    const keys = Object.keys(mentor);
    if (keys.length === 0) return this.getMentor(id);

    const values = Object.values(mentor);
    const setClause = keys.map(k => `${k} = ?`).join(", ");

    const sql = `UPDATE mentors SET ${setClause} WHERE id = ?`;
    await pool.execute(sql, [...values, id]);
    return this.getMentor(id);
  }

  async deleteMentor(id: number): Promise<boolean> {
    await pool.execute("DELETE FROM mentors WHERE id = ?", [id]);
    return true;
  }

  async incrementAssignedCount(id: number): Promise<Mentor | undefined> {
    const mentor = await this.getMentor(id);
    if (!mentor) return undefined;

    const newCount = (mentor.assignedCount || 0) + 1;
    await pool.execute("UPDATE mentors SET assignedCount = ? WHERE id = ?", [newCount, id]);
    return this.getMentor(id);
  }

  // FeedbackQuestion operations
  async getFeedbackQuestion(id: number): Promise<FeedbackQuestion | undefined> {
    const rows = await this.query<FeedbackQuestion>("SELECT * FROM feedbackQuestions WHERE id = ?", [id]);
    return rows[0];
  }

  async getFeedbackQuestionsByEvent(eventId: number): Promise<FeedbackQuestion[]> {
    return await this.query<FeedbackQuestion>(
      "SELECT * FROM feedbackQuestions WHERE eventId = ? ORDER BY `order` ASC", [eventId]
    );
  }

  async createFeedbackQuestion(question: InsertFeedbackQuestion): Promise<FeedbackQuestion> {
    const keys = Object.keys(question);
    const values = Object.values(question);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO feedbackQuestions (${keys.join(", ")}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values) as any;
    return this.getFeedbackQuestion(result.insertId) as Promise<FeedbackQuestion>;
  }

  async createFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse> {
    const keys = Object.keys(response);
    const values = Object.values(response);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO feedbackResponses (${keys.join(", ")}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values) as any;
    return this.getFeedbackResponse(result.insertId) as Promise<FeedbackResponse>;
  }

  async getFeedbackResponse(id: number): Promise<FeedbackResponse | undefined> {
    const rows = await this.query<FeedbackResponse>("SELECT * FROM feedbackResponses WHERE id = ?", [id]);
    return rows[0];
  }

  async getFeedbackResponsesByQuestion(questionId: number): Promise<FeedbackResponse[]> {
    return await this.query<FeedbackResponse>("SELECT * FROM feedbackResponses WHERE questionId = ?", [questionId]);
  }

  async getFeedbackResponsesByAttendee(attendeeId: number): Promise<FeedbackResponse[]> {
    return await this.query<FeedbackResponse>("SELECT * FROM feedbackResponses WHERE attendeeId = ?", [attendeeId]);
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const rows = await this.query<Task>("SELECT * FROM tasks WHERE id = ?", [id]);
    return rows[0];
  }

  async getTasksByEvent(eventId: number): Promise<Task[]> {
    return await this.query<Task>("SELECT * FROM tasks WHERE eventId = ?", [eventId]);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const keys = Object.keys(task);
    const values = Object.values(task);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO tasks (${keys.join(", ")}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values) as any;
    return this.getTask(result.insertId) as Promise<Task>;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const keys = Object.keys(task);
    if (keys.length === 0) return this.getTask(id);

    const values = Object.values(task);
    const setClause = keys.map(k => `${k} = ?`).join(", ");

    const sql = `UPDATE tasks SET ${setClause} WHERE id = ?`;
    await pool.execute(sql, [...values, id]);
    return this.getTask(id);
  }

  async deleteTask(id: number): Promise<boolean> {
    await pool.execute("DELETE FROM tasks WHERE id = ?", [id]);
    return true;
  }

  // TaskProgress operations
  async getTaskProgress(id: number): Promise<TaskProgress | undefined> {
    const rows = await this.query<TaskProgress>("SELECT * FROM taskProgress WHERE id = ?", [id]);
    return rows[0];
  }

  async getTaskProgressByAttendee(attendeeId: number): Promise<TaskProgress[]> {
    return await this.query<TaskProgress>("SELECT * FROM taskProgress WHERE attendeeId = ?", [attendeeId]);
  }

  async createTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress> {
    const keys = Object.keys(progress);
    const values = Object.values(progress);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO taskProgress (${keys.join(", ")}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values) as any;
    return this.getTaskProgress(result.insertId) as Promise<TaskProgress>;
  }

  async updateTaskProgress(id: number, progress: Partial<InsertTaskProgress>): Promise<TaskProgress | undefined> {
    const keys = Object.keys(progress);
    if (keys.length === 0) return this.getTaskProgress(id);

    const values = Object.values(progress);
    const setClause = keys.map(k => `${k} = ?`).join(", ");

    const sql = `UPDATE taskProgress SET ${setClause} WHERE id = ?`;
    await pool.execute(sql, [...values, id]);
    return this.getTaskProgress(id);
  }
}

export const storage = new DatabaseStorage();