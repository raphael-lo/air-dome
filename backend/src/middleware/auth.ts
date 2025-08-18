import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';

// Define a custom request type that includes the user property
interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = user;
    next();
  });
};

export const authorizeRole = (roles: Array<'Admin' | 'Operator' | 'Viewer'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};