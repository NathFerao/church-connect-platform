import { Church, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { BaseRepository } from './base.repository';

const publicChurchSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  city: true,
  state: true,
  country: true,
} as const;

type PublicChurch = Prisma.ChurchGetPayload<{ select: typeof publicChurchSelect }>;

export class ChurchRepository extends BaseRepository<Church> {
  constructor() {
    super(prisma.church);
  }

  async findBySlug(slug: string): Promise<Church | null> {
    return prisma.church.findUnique({ where: { slug } });
  }

  async findPublicChurches(): Promise<PublicChurch[]> {
    return prisma.church.findMany({
      where: {
        OR: [
          { allowPublicEvents: true },
          { allowInterChurch: true },
        ],
      },
      select: publicChurchSelect,
    });
  }

  async findAllWithStats(): Promise<any[]> {
    return prisma.church.findMany({
      include: {
        _count: {
          select: {
            users: true,              // Count members
            announcements: true,       // Count announcements
            prayerRequests: true,      // Count prayer requests
          },
        },
      },
      orderBy: { createdAt: 'desc' },  // Newest first
    });
  }

  async findByIdWithStats(id: string): Promise<any> {
    return prisma.church.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            announcements: true,
            prayerRequests: true,
            testimonies: true,
            events: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<Church>): Promise<Church> {
    return prisma.church.update({
      where: { id },
      data,
    });
  }
  async delete(id: string): Promise<Church> {
    return prisma.church.delete({
      where: { id },
    });
  }

  async countAll(): Promise<number> {
    return prisma.church.count();
  }

  async searchByName(searchTerm: string): Promise<Church[]> {
    return prisma.church.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',  // Case-insensitive search
        },
      },
      take: 10,  // Limit results for autocomplete
      orderBy: { name: 'asc' },
    });
  }
}