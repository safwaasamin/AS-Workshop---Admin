import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './storage';

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// Generate JWT token
export const generateToken = (userId: number, username: string): string => {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Authenticate user and generate token
export const authenticate = async (email: string, password: string): Promise<{ token: string, user: any } | null> => {
  // Find user by email
  const user = await storage.getUserByEmail(email);
  if (!user) return null;
  
  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;
  
  // Generate token
  const token = generateToken(user.id, user.username);
  
  // Return token and user info (without password)
  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};

// Middleware to verify JWT token
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Get token from authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, username: string };
    
    // Add user info to request
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};
