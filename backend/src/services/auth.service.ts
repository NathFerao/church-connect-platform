import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { config } from '../config/constants';
import redis from '../config/redis';
import { UnauthorizedError, ConflictError, BadRequestError } from '../utils/errors';
import { JwtPayload } from '../types';

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
    churchId: string;
    phone?: string;
  }): Promise<{ user: Partial<User>; token: string }> {
    const existingUser = await this.userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      role: 'MEMBER',
    });

    const token = this.generateToken(user);
    const { password, ...userWithoutPassword } = user;

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
      churchId: user.churchId,
      role: user.role,
    };

    const secret = config.jwt.secret as jwt.Secret;
    const options: jwt.SignOptions = {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    };

    return jwt.sign(payload, secret, options);
  }
}