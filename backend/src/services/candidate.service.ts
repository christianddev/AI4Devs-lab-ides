import { PrismaClient, Candidate, CandidateStatus } from '@prisma/client';
import { AppError } from '../utils/error';
import { CreateCandidateDto, UpdateCandidateDto, CandidateFilters } from '../types/candidate.types';
import logger from '../utils/logger';

export class CandidateService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateCandidateDto): Promise<Candidate> {
    try {
      const candidate = await this.prisma.candidate.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          linkedinUrl: data.linkedinUrl,
          experiences: {
            create: data.experiences,
          },
          education: {
            create: data.education,
          },
        },
        include: {
          experiences: true,
          education: true,
        },
      });

      logger.info(`Created candidate with ID: ${candidate.id}`);
      return candidate;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new AppError('Email already exists', 400);
      }
      throw error;
    }
  }

  async findAll(filters: CandidateFilters) {
    const { status, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [candidates, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        include: {
          experiences: true,
          education: true,
          files: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return {
      candidates,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async findById(id: number) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        experiences: true,
        education: true,
        files: true,
        interactions: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new AppError('Candidate not found', 404);
    }

    return candidate;
  }

  async update(id: number, data: UpdateCandidateDto) {
    try {
      const candidate = await this.prisma.candidate.update({
        where: { id },
        data: {
          ...data,
          experiences: data.experiences && {
            deleteMany: {},
            create: data.experiences,
          },
          education: data.education
        },
        include: {
          experiences: true,
          education: true,
        },
      });

      logger.info(`Updated candidate with ID: ${candidate.id}`);
      return candidate;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new AppError('Email already exists', 400);
      }
      throw error;
    }
  }
}