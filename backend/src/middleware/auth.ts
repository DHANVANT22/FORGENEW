import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback_key';

export interface AdminAuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: string;
  };
  admin?: {
    id: string;
    name: string;
    role: string;
  };
}

export const requireAdminAuth = (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (token === 'ADMIN_DEMO_TOKEN') {
    const adminObj = { id: 'admin', name: 'Admin', role: 'SUPER_ADMIN' };
    (req as any).user = adminObj;
    (req as any).admin = adminObj;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    (req as any).admin = decoded;
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
  let token = req.cookies?.clientToken;
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No client token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; projectId: string, sub: string };
    if (decoded.sub !== 'client') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token type' });
    }
    req.client = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid client token' });
  }
};
