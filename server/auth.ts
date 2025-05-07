import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import memorystore from "memorystore";
import { User } from "@shared/schema";

// Declare user type for Express
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      name: string;
      role: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Create memory store for sessions
const MemoryStore = memorystore(session);
storage.sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

// Hash password function
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
};

// Compare password function
export const comparePasswords = async (supplied: string, stored: string): Promise<boolean> => {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
};

// Setup authentication middleware
export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "your-session-secret-key";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production"
    }
  };

  // Setup session middleware
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          const isPasswordValid = await comparePasswords(password, user.password);
          if (!isPasswordValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          // Remove password from user object
          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword as Express.User);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword as Express.User);
    } catch (error) {
      done(error);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Export authentication middleware
  app.use((req, res, next) => {
    // Make isAuthenticated available on the app object
    (req as any).isAuthenticated = isAuthenticated;
    next();
  });

  // API routes for authentication
  // Register route
  app.post("/api/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password, name, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name,
        role: role || "user"
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Login the user
      req.login(userWithoutPassword, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Login route
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.json(req.user);
  });
}
