import { PaginationParams } from '../types';

export class BaseRepository<T> {
  constructor(protected model: any) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findAll(params?: PaginationParams): Promise<T[]> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params || {};
    return this.model.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  async create(data: any): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: any): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  async count(where?: any): Promise<number> {
    return this.model.count({ where });
  }
}
