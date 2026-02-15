import { User, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { BaseRepository } from './base.repository';
import { PaginationParams } from '../types';

const memberSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

type MemberView = Prisma.UserGetPayload<{ select: typeof memberSelect }>;

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(prisma.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { church: true },
    });
  }

  async findByChurch(
    churchId: string,
    params?: PaginationParams
  ): Promise<MemberView[]> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params || {};

    return prisma.user.findMany({
      where: { churchId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
      select: memberSelect,
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async countByChurch(churchId: string): Promise<number> {
    return prisma.user.count({ where: { churchId } });
  }
}