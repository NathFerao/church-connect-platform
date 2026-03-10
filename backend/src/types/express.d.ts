import { User } from '@prisma/client';

export type RequestUser = Omit<
  User,
  'password' | 'resetPasswordToken' | 'resetPasswordExpires'
>;

declare global {
  namespace Express {
    // This fixes req.user (Passport uses this)
    interface User extends RequestUser {}

    // This fixes req.churchId
    interface Request {
      churchId?: string;
    }
  }
}

export {};