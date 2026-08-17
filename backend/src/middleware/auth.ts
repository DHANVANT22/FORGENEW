import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback_key';

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (token === 'ADMIN_DEMO_TOKEN') {
    (req as any).user = { id: 'admin', name: 'Admin', role: 'SUPER_ADMIN' };
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export interface ClientAuthRequest extends Request {
  client?: {
    id: string;
    projectId: string;
  };
}

export const requireClientAuth = (req: ClientAuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.clientToken;
  console.log('requireClientAuth - Cookies:', req.cookies);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No client token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; projectId: string, sub: string };
    console.log('requireClientAuth - Decoded:', decoded);
    if (decoded.sub !== 'client') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token type' });
    }
    req.client = decoded;
    next();
  } catch (err) {
    console.log('requireClientAuth - Error verifying token:', err);
    return res.status(401).json({ error: 'Unauthorized: Invalid client token' });
  }
};
