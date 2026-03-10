import { User } from '@prisma/client';
import prisma from '../config/database';
import { UserRepository } from '../repositories/user.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { PaginationParams, PaginatedResponse } from '../types';
import { paginatedResponse } from '../utils/helpers';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // Existing methods...
  async getUserProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<Partial<User>> {
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'bio', 'avatarUrl'];
    const updateData = Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: data[key as keyof User] }), {});

    const user = await this.userRepository.update(userId, updateData);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getChurchMembers(
    churchId: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<Partial<User>>> {
    const users = await this.userRepository.findByChurch(churchId, params);
    const total = await this.userRepository.countByChurch(churchId);
    return paginatedResponse(users, params, total);
  }

  async updateUserRole(
    adminId: string,
    userId: string,
    newRole: string,
    churchId: string
  ): Promise<Partial<User>> {
    const admin = await this.userRepository.findById(adminId);
    const user = await this.userRepository.findById(userId);

    if (!admin || !user) {
      throw new NotFoundError('User not found');
    }

    if (user.churchId !== churchId) {
      throw new ForbiddenError('Cannot modify users from other churches');
    }

    if (!['CHURCH_ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      throw new ForbiddenError('Only admins can change user roles');
    }

    if(user.role === 'CHURCH_ADMIN' && newRole !== 'CHURCH_ADMIN') {
      const churchAdminsCount = await this.userRepository.countByRole(churchId, 'CHURCH_ADMIN');
      if (churchAdminsCount <= 1) {
        throw new ForbiddenError('Cannot remove the last church admin, please assign another user as admin before changing this user\'s role');
      }
    }

    const updated = await this.userRepository.update(userId, { role: newRole });
    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  // NEW METHODS BELOW

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  async createMember(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    churchId: string;
    isActive: boolean;
    emailVerified: boolean;
  }): Promise<Partial<User>> {
    const user = await this.userRepository.create(data);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateMemberStatus(
    adminId: string,
    userId: string,
    isActive: boolean,
    churchId: string
  ): Promise<Partial<User>> {
    const admin = await this.userRepository.findById(adminId);
    const user = await this.userRepository.findById(userId);

    if (!admin || !user) {
      throw new NotFoundError('User not found');
    }

    if (user.churchId !== churchId) {
      throw new ForbiddenError('Cannot modify users from other churches');
    }

    if (!['CHURCH_ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      throw new ForbiddenError('Only admins can change user status');
    }

    // Prevent admins from deactivating themselves
    if (userId === adminId) {
      throw new ForbiddenError('Cannot deactivate your own account');
    }

    const updated = await this.userRepository.update(userId, { isActive });
    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async assignUserToChurch(
    adminId: string,
    userEmail: string,
    churchId: string,
    role: string = 'MEMBER'
  ): Promise<Partial<User>> {
    const admin = await this.userRepository.findById(adminId);

    if (!admin || !['CHURCH_ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      throw new ForbiddenError('Only church admins can assign users');
    }

    const user = await this.userRepository.findByEmail(userEmail);

    if (!user) {
      throw new NotFoundError('User not found with that email');
    }

    if (user.churchId) {
      throw new ConflictError('User is already assigned to a church');
    }

    const updated = await this.userRepository.update(user.id, {
      churchId,
      role,
    });

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async getUnassignedUsers(): Promise<Partial<User>[]> {
    const users = await prisma.user.findMany({
      where: {
        churchId: { equals: null },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return users;
  }
}