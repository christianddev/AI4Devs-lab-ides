import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthRequest } from '../types';

export const authenticate = passport.authenticate('jwt', { session: false });

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};