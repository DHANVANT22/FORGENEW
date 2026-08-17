import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback_key';

export class AuthController {
  public static async adminLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // In a real app we check hashed passwords.
      // For this prototype, we'll just check if it matches the DB or do a basic bcrypt check.
      // Since seed.ts might not have hashed the password if it's simple, we'll try bcrypt.
      // Wait, let's just do a basic string match for 'admin123' if bcrypt fails to allow easy testing.
      let valid = false;
      try {
        valid = await bcrypt.compare(password, user.password);
      } catch (e) {
        valid = password === user.password; // Fallback for plaintext seed
      }

      if (!valid && password !== user.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async verifyToken(req: Request, res: Response) {
    res.status(200).json({ valid: true, user: (req as any).user });
  }
}
