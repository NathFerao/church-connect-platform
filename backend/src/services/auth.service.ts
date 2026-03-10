import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { config } from '../config/constants';
import redis from '../config/redis';
import { UnauthorizedError, ConflictError, BadRequestError } from '../utils/errors';
import { JwtPayload } from '../types';
import crypto from 'crypto';
import { sendEmail, emailTemplates } from '../config/email';
import prisma from '../config/database';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  churchId?: string; // ✅ Make optional
}): Promise<{ user: Partial<User>; token: string }> {
  // Check if user already exists
  const existingUser = await this.userRepository.findByEmail(data.email);
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Create user (churchId can be null)
  const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      churchId: data.churchId || null,
      role: 'MEMBER',
      isActive: true,
      emailVerified: false,
    });

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        churchId: user.churchId || '',
        role: user.role,
      },
      config.jwt.secret as jwt.Secret,
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    );

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(email: string, password: string): Promise<{ user: Partial<User>; token: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    await this.userRepository.updateLastLogin(user.id);

    const token = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new BadRequestError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  async logout(token: string): Promise<void> {
    await redis.setex(`blacklist:${token}`, 7 * 24 * 60 * 60, '1');
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    const isBlacklisted = await redis.get(`blacklist:${token}`);

    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been invalidated');
    }

    try {
      return jwt.verify(token, config.jwt.secret as jwt.Secret) as JwtPayload;
    } catch (_error) {
      throw new UnauthorizedError('Invalid token');
    }
  }

  private generateToken(user: User | null): string {
    // Guard: if user is somehow null, fail fast here.
    // After this line TypeScript knows user is non-null.
    if (!user) {
      throw new UnauthorizedError('User is required to generate token');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      churchId: user.churchId || '',
      role: user.role,
    };

    const secret = config.jwt.secret as jwt.Secret;
    const options: jwt.SignOptions = {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    };

    return jwt.sign(payload, secret, options);
  }
  async requestPasswordReset(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists or not (security)
      return true;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const resetPasswordExpires = new Date(Date.now() + config.email.resetTokenExpiry);

    // Save token to database
    await this.userRepository.update(user.id, {
      resetPasswordToken,
      resetPasswordExpires,
    });

    // Create reset URL
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    // Send email
    const { subject, html, text } = emailTemplates.passwordReset(resetUrl, user.firstName);
    await sendEmail(user.email, subject, html, text);

    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash the token to match database
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }
}