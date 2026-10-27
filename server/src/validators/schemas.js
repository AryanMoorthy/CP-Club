import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().optional(),
  codeforcesHandle: z
    .string()
    .max(24, 'Handle too long')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid Codeforces handle format')
    .optional()
    .or(z.literal('')),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  college: z.string().max(200).optional().or(z.literal('')),
  batch: z.string().max(20).optional().or(z.literal('')),
  practiceGoals: z.object({
    dailyProblems: z.number().int().min(0).max(50).optional(),
    weeklyContests: z.number().int().min(0).max(10).optional(),
    targetRating: z.number().int().min(0).max(4000).optional(),
  }).optional(),
});

export const connectCodeforcesSchema = z.object({
  handle: z
    .string()
    .min(1, 'Handle is required')
    .max(24, 'Handle too long')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid handle format'),
});

export const problemSheetSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  topic: z.string().max(100).optional().or(z.literal('')),
  difficulty: z.enum(['beginner', 'easy', 'medium', 'hard', 'expert']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  deadline: z.string().datetime().optional().nullable(),
  problems: z.array(z.object({
    contestId: z.number().int().positive(),
    index: z.string().min(1).max(5),
    name: z.string().min(1).max(500),
    rating: z.number().int().min(800).max(4000).optional().nullable(),
    tags: z.array(z.string()).optional(),
    url: z.string().url().optional().or(z.literal('')),
    order: z.number().int().min(0).optional(),
  })).optional().default([]),
});

export const assignmentSchema = z.object({
  problemSheet: z.string().length(24, 'Invalid sheet ID'),
  assignedTo: z.string().length(24, 'Invalid user ID'),
  batch: z.string().max(50).optional().or(z.literal('')),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  dueDate: z.string().datetime('Invalid date format'),
});

export const practiceRoomSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  participantLimit: z.number().int().min(1).max(500).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  invitationCode: z.string().max(50).optional().or(z.literal('')),
  problems: z.array(z.object({
    contestId: z.number().int().positive(),
    index: z.string().min(1).max(5),
    name: z.string().min(1).max(500),
    points: z.number().int().min(0).max(10000).optional().default(100),
    rating: z.number().int().optional().nullable(),
    url: z.string().url().optional().or(z.literal('')),
    order: z.number().int().min(0).optional(),
  })).optional().default([]),
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(300),
  content: z.string().min(1).max(5000),
  audience: z.enum(['all', 'students', 'mentors']).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});
