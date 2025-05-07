import { pgTable, text, serial, integer, boolean, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").default("admin").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
});

// Event table to store event information
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  status: text("status").default("active").notNull(),
});

export const insertEventSchema = createInsertSchema(events).pick({
  name: true,
  description: true,
  startDate: true,
  endDate: true,
  location: true,
  status: true,
});

// Attendees table
export const attendees = pgTable("attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  position: text("position"),
  phone: text("phone"),
  status: text("status").default("registered").notNull(),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
  username: text("username"),
  password: text("password"),
  mentorId: integer("mentor_id"),
  score: integer("score").default(0),
  completionTime: text("completion_time"),
});

export const insertAttendeeSchema = createInsertSchema(attendees).pick({
  eventId: true,
  name: true,
  email: true,
  company: true,
  position: true,
  phone: true,
  status: true,
  username: true,
  password: true,
  mentorId: true,
});

// Mentors table
export const mentors = pgTable("mentors", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  expertise: text("expertise").notNull(),
  bio: text("bio"),
  assignedCount: integer("assigned_count").default(0),
});

export const insertMentorSchema = createInsertSchema(mentors).pick({
  eventId: true,
  name: true,
  email: true,
  expertise: true,
  bio: true,
});

// Feedback questions
export const feedbackQuestions = pgTable("feedback_questions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  question: text("question").notNull(),
  type: text("type").notNull(), // 'rating' or 'text'
  order: integer("order").notNull(),
});

export const insertFeedbackQuestionSchema = createInsertSchema(feedbackQuestions).pick({
  eventId: true,
  question: true,
  type: true,
  order: true,
});

// Feedback responses
export const feedbackResponses = pgTable("feedback_responses", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  attendeeId: integer("attendee_id").notNull(),
  response: text("response").notNull(),
});

export const insertFeedbackResponseSchema = createInsertSchema(feedbackResponses).pick({
  questionId: true,
  attendeeId: true,
  response: true,
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status").default("active").notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  eventId: true,
  name: true,
  description: true,
  dueDate: true,
  status: true,
});

// Task progress
export const taskProgress = pgTable("task_progress", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  attendeeId: integer("attendee_id").notNull(),
  status: text("status").default("not_started").notNull(), // not_started, in_progress, completed
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  mentorReview: text("mentor_review"),
  mentorRating: integer("mentor_rating"),
});

export const insertTaskProgressSchema = createInsertSchema(taskProgress).pick({
  taskId: true,
  attendeeId: true,
  status: true,
  startTime: true,
  endTime: true,
  mentorReview: true,
  mentorRating: true,
});

// Types for frontend usage
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Attendee = typeof attendees.$inferSelect;
export type InsertAttendee = z.infer<typeof insertAttendeeSchema>;

export type Mentor = typeof mentors.$inferSelect;
export type InsertMentor = z.infer<typeof insertMentorSchema>;

export type FeedbackQuestion = typeof feedbackQuestions.$inferSelect;
export type InsertFeedbackQuestion = z.infer<typeof insertFeedbackQuestionSchema>;

export type FeedbackResponse = typeof feedbackResponses.$inferSelect;
export type InsertFeedbackResponse = z.infer<typeof insertFeedbackResponseSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskProgress = typeof taskProgress.$inferSelect;
export type InsertTaskProgress = z.infer<typeof insertTaskProgressSchema>;
