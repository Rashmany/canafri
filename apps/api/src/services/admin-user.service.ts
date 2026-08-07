import { prisma } from '../lib/prisma.js';

export interface PaginatedQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class AdminUserService {
  /**
   * Paginated Buyers list with SQL-level filtering & sorting
   */
  static async getPaginatedBuyers(params: PaginatedQueryParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { role: 'MEMBER' };

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const sortField = params.sort || 'createdAt';
    const sortOrder = params.order || 'desc';
    const orderBy: any = {};

    if (['createdAt', 'trustScore', 'riskScore', 'displayName'].includes(sortField)) {
      orderBy[sortField] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          displayName: true,
          username: true,
          email: true,
          country: true,
          avatarUrl: true,
          status: true,
          trustScore: true,
          riskScore: true,
          needsReview: true,
          createdAt: true,
          _count: {
            select: { postedJobs: true, freelanceJobs: true },
          },
          postedJobs: {
            select: { id: true, status: true, amountCC: true },
          },
          riskFlags: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Paginated Sellers list with SQL-level filtering & sorting
   */
  static async getPaginatedSellers(params: PaginatedQueryParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { role: 'MEMBER', isSeller: true };

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const sortField = params.sort || 'createdAt';
    const sortOrder = params.order || 'desc';
    const orderBy: any = {};

    if (['createdAt', 'trustScore', 'riskScore', 'displayName'].includes(sortField)) {
      orderBy[sortField] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          displayName: true,
          username: true,
          email: true,
          country: true,
          avatarUrl: true,
          status: true,
          isSeller: true,
          sellerApproved: true,
          sellerApplied: true,
          trustScore: true,
          riskScore: true,
          needsReview: true,
          createdAt: true,
          creatorStake: true,
          freelanceJobs: {
            select: { id: true, status: true, amountCC: true },
          },
          riskFlags: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Paginated Content Creators list with SQL-level filtering & sorting
   */
  static async getPaginatedCreators(params: PaginatedQueryParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { role: 'MEMBER', isCreator: true };

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const sortField = params.sort || 'createdAt';
    const sortOrder = params.order || 'desc';
    const orderBy: any = {};

    if (['createdAt', 'trustScore', 'riskScore', 'displayName'].includes(sortField)) {
      orderBy[sortField] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          displayName: true,
          username: true,
          email: true,
          country: true,
          avatarUrl: true,
          status: true,
          isCreator: true,
          trustScore: true,
          riskScore: true,
          needsReview: true,
          createdAt: true,
          creatorStake: true,
          content: {
            select: { id: true, title: true, status: true, publishedAt: true },
          },
          riskFlags: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
