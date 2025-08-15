import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';

interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Authenticating token:', token);

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err: any, user: any) => {
    if (err) {
      console.error('Token verification error:', err.message);
      return res.sendStatus(403); // Invalid token
    }
    console.log('Token verified. User:', user);
    req.user = user;
    next();
  });
};

export const authorizeRole = (roles: Array<'Admin' | 'Operator' | 'Viewer'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log('Authorizing role. Required roles:', roles, 'User role:', req.user?.role);
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      console.log('Authorization failed.');
      return res.sendStatus(403);
    }
    console.log('Authorization successful.');
    next();
  };
};
