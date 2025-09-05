import { createClerkClient, verifyToken } from '@clerk/backend';
import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

// Extend Express Request type to include auth from Clerk middleware
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string;
        sessionId?: string;
        orgId?: string | null;
        sessionClaims?: any;
      };
    }
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
  });

  return session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  // Session middleware
  app.use(getSession());

  // Clerk authentication middleware
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      console.log('Auth middleware - Path:', req.path);
      console.log('Auth middleware - Token present:', !!token);
      
      if (token) {
        try {
          // Use the correct options for verifyToken
          const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY!,
          });
          
          console.log('Token verified successfully, userId:', payload.sub);
          
          req.auth = {
            userId: payload.sub,
            sessionId: payload.sid,
          };
        } catch (error) {
          console.log('Token verification failed:', error?.message || error);
          // Don't set req.auth, let it be undefined for unauthenticated requests
        }
      } else {
        console.log('No token provided for path:', req.path);
      }
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      next();
    }
  });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log('isAuthenticated check - userId:', req.auth?.userId);
  if (!req.auth?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Helper function to get user from Clerk
export async function getClerkUser(userId: string) {
  try {
    const user = await clerkClient.users.getUser(userId);
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.imageUrl,
      role: user.publicMetadata?.role || 'employee',
    };
  } catch (error) {
    console.error('Error fetching user from Clerk:', error);
    return null;
  }
}

// Helper function to sync user with database
export async function syncUserWithDatabase(clerkUser: any) {
  try {
    console.log('Syncing user with database:', { 
      id: clerkUser.id, 
      email: clerkUser.email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName 
    });
    
    const existingUser = await storage.getUserByEmail(clerkUser.email);
    console.log('Existing user found:', !!existingUser);
    
    if (existingUser) {
      // Update existing user
      console.log('Updating existing user:', existingUser.id);
      return await storage.updateUser(existingUser.id, {
        email: clerkUser.email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImageUrl: clerkUser.profileImageUrl,
        role: clerkUser.role,
      });
    } else {
      // Create new user
      console.log('Creating new user with ID:', clerkUser.id);
      return await storage.createUser({
        id: clerkUser.id,
        email: clerkUser.email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImageUrl: clerkUser.profileImageUrl,
        role: clerkUser.role,
      });
    }
  } catch (error) {
    console.error('Error syncing user with database:', error);
    throw error;
  }
}
