import { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { PaginationParams, PaginatedResponse } from '../types';
import { paginatedResponse } from '../utils/helpers';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUserProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<Partial<User>> {
    const allowedFields = ['firstName', 'lastName', 'phone', 'bio', 'avatarUrl'];
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

    const updated = await this.userRepository.update(userId, { role: newRole });
    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}