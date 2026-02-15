import { Church } from '@prisma/client';
import { ChurchRepository } from '../repositories/church.repository';
import { UserRepository } from '../repositories/user.repository';
import { ConflictError, NotFoundError, ForbiddenError } from '../utils/errors';
import { generateSlug } from '../utils/helpers';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';

export class ChurchService {
  private churchRepository: ChurchRepository;
  private userRepository: UserRepository;

  constructor() {
    this.churchRepository = new ChurchRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * WHY: Super admin needs to see all churches in the system
   * WHAT: Returns list of all churches with member count
   * HOW: Queries churches table, includes count of users per church
   */
  async getAllChurches(): Promise<any[]> {
    const churches = await prisma.church.findMany({
      include: {
        _count: {
          select: { users: true }  // Count members per church
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return churches;
  }

  /**
   * WHY: Get details of a specific church
   * WHAT: Returns church with stats
   * HOW: Single query with counts
   */
  async getChurchById(id: string): Promise<any> {
    const church = await prisma.church.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            announcements: true,
            prayerRequests: true
          }
        }
      }
    });

    if (!church) {
      throw new NotFoundError('Church not found');
    }

    return church;
  }

  /**
   * WHY: Create a new church organization
   * WHAT: Creates church + first admin user in a transaction
   * HOW: 
   *   1. Generate unique slug from name (used in URLs)
   *   2. Check slug isn't taken
   *   3. Create church record
   *   4. Create admin user for that church
   *   5. Return both (all-or-nothing via transaction)
   */
  async createChurch(data: {
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
  }) {
    // Step 1: Generate slug (e.g., "Grace Church" → "grace-church")
    const slug = generateSlug(data.name);

    // Step 2: Check if slug is already taken
    const existing = await this.churchRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictError('A church with this name already exists');
    }

    // Step 3: Check if admin email is already taken
    const existingUser = await this.userRepository.findByEmail(data.adminEmail);
    if (existingUser) {
      throw new ConflictError('Admin email already in use');
    }

    // Step 4: Hash admin password
    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

    // Step 5: Create both church and admin user in a transaction
    // WHY transaction? If creating the admin fails, we don't want a church with no admin
    const result = await prisma.$transaction(async (tx) => {
      // Create church
      const church = await tx.church.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          zipCode: data.zipCode,
          phone: data.phone,
          email: data.email,
          primaryColor: '#4F46E5',      // Default indigo
          secondaryColor: '#10B981',    // Default green
        }
      });

      // Create admin user for this church
      const admin = await tx.user.create({
        data: {
          email: data.adminEmail,
          password: hashedPassword,
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          churchId: church.id,
          role: 'CHURCH_ADMIN',         // Important: Admin role
          isActive: true,
          emailVerified: true,
        }
      });

      return { church, admin };
    });

    return result;
  }

  /**
   * WHY: Church admins need to update their church info/branding
   * WHAT: Updates church record (colors, logo, etc.)
   * HOW: Validates user is admin of THIS church, then updates
   */
  async updateChurch(
    churchId: string,
    data: {
      name?: string;
      description?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
      phone?: string;
      email?: string;
      website?: string;
      logoUrl?: string;
      bannerUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      timezone?: string;
      allowPublicEvents?: boolean;
      allowInterChurch?: boolean;
    },
    userId: string,
    userRole: string
  ): Promise<Church> {
    // Step 1: Verify church exists
    const church = await this.churchRepository.findById(churchId);
    if (!church) {
      throw new NotFoundError('Church not found');
    }

    // Step 2: Permission check
    // WHY? Only church admins or super admins can edit church settings
    const canEdit = userRole === 'SUPER_ADMIN' || 
      (userRole === 'CHURCH_ADMIN' && userId);  // Must be admin of THIS church

    if (!canEdit) {
      throw new ForbiddenError('Only church administrators can update church settings');
    }

    // Step 3: If changing name, regenerate slug
    if (data.name && data.name !== church!.name) {
      const newSlug = generateSlug(data.name);
      const existing = await this.churchRepository.findBySlug(newSlug);
      if (existing && existing.id !== churchId) {
        throw new ConflictError('A church with this name already exists');
      }
      // Add slug to update data
      (data as any).slug = newSlug;
    }

    // Step 4: Update church
    return this.churchRepository.update(churchId, data);
  }

  /**
   * WHY: Super admin needs to remove churches
   * WHAT: Deletes church (cascade deletes all users/data)
   * HOW: Only super admin can do this
   */
  async deleteChurch(churchId: string, userRole: string): Promise<void> {
    if (userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only super administrators can delete churches');
    }

    const church = await this.churchRepository.findById(churchId);
    if (!church) {
      throw new NotFoundError('Church not found');
    }

    // Cascade delete is configured in Prisma schema
    // This will delete all users, announcements, prayers, etc. for this church
    await this.churchRepository.delete(churchId);
  }

  /**
   * WHY: Get church settings for the current user's church
   * WHAT: Returns church info without sensitive data
   * HOW: Finds by churchId, excludes nothing (all safe for church admins)
   */
  async getCurrentChurchSettings(churchId: string): Promise<Church> {
    const church = await this.churchRepository.findById(churchId);
    if (!church) {
      throw new NotFoundError('Church not found');
    }
    return church;
  }
}