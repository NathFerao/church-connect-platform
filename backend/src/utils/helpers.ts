import { ApiResponse, PaginatedResponse, PaginationParams } from '../types';

export const successResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
  };
};

export const errorResponse = (
  error: string,
  errors?: any[]
): ApiResponse => {
  return {
    success: false,
    error,
    errors,
  };
};

export const paginatedResponse = <T>(
  data: T[],
  params: PaginationParams,
  total: number
): PaginatedResponse<T> => {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const parseQueryParams = (query: any): PaginationParams => {
  return {
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 10,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc',
  };
};