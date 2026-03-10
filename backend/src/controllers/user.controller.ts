import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { successResponse } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import { ConflictError, BadRequestError, ForbiddenError } from '../utils/errors';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const user = await this.userService.getUserProfile(userId);
      res.json(successResponse(user, 'Profile fetched successfully'));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, email, phone, bio, avatarUrl, currentPassword, newPassword } = req.body;

      if (newPassword) {
        if (!currentPassword) {
          throw new BadRequestError('Current password is required to set a new password');
        }

        const user = await this.userService.getUserById(userId);
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
          throw new BadRequestError('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await this.userService.updatePassword(userId, hashedPassword);
      }

      const updatedUser = await this.userService.updateProfile(userId, {
        firstName,
        lastName,
        email,
        phone,
        bio,
        avatarUrl,
      });

      res.json(successResponse(updatedUser, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  getChurchMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const churchId = req.user!.churchId;

      if (!churchId) {
        throw new ForbiddenError('You must be assigned to a church to view members');
      }

      const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const members = await this.userService.getChurchMembers(churchId, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json(successResponse(members, 'Members fetched successfully'));
    } catch (error) {
      next(error);
    }
  };

  createMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const churchId = req.user!.churchId;

      if (!churchId) {
        throw new ForbiddenError('You must be assigned to a church to create members');
      }

      const { firstName, lastName, email, password, role = 'MEMBER' } = req.body;

      const existingUser = await this.userService.getUserByEmail(email);
      if (existingUser) {
        throw new ConflictError('Email already in use');
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const member = await this.userService.createMember({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        churchId,
        isActive: true,
        emailVerified: false,
      });

      res.status(201).json(successResponse(member, 'Member created successfully'));
    } catch (error) {
      next(error);
    }
  };

  updateMemberStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const churchId = req.user!.churchId;
      const adminId = req.user!.id;

      if (!churchId) {
        throw new ForbiddenError('You must be assigned to a church to perform this action');
      }

      if (typeof id !== 'string') {
        throw new BadRequestError('Invalid user ID');
      }

      const updatedMember = await this.userService.updateMemberStatus(
        adminId,
        id,
        isActive,
        churchId
      );

      res.json(successResponse(updatedMember, 'Member status updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const churchId = req.user!.churchId;
      const adminId = req.user!.id;

      if (!churchId) {
        throw new ForbiddenError('You must be assigned to a church to perform this action');
      }

      if (typeof id !== 'string') {
        throw new BadRequestError('Invalid user ID');
      }

      const updatedMember = await this.userService.updateUserRole(
        adminId,
        id,
        role,
        churchId
      );

      res.json(successResponse(updatedMember, 'Member role updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  assignToChurch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const { email, role } = req.body;
      const churchId = req.user!.churchId;

      if (!churchId) {
        throw new ForbiddenError('You must be assigned to a church to perform this action');
      }

      const user = await this.userService.assignUserToChurch(adminId, email, churchId, role);
      res.json(successResponse(user, 'User assigned to church successfully'));
    } catch (error) {
      next(error);
    }
  };

  getUnassignedUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user!.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access denied');
      }

      const users = await this.userService.getUnassignedUsers();
      res.json(successResponse(users, 'Unassigned users fetched successfully'));
    } catch (error) {
      next(error);
    }
  };
}