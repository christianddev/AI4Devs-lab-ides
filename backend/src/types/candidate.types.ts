import { CandidateStatus } from '@prisma/client';

export interface CreateCandidateDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  linkedinUrl?: string;
  experiences?: {
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }[];
  education?: {
    title: string;
    institution: string;
    startDate: Date;
    endDate: Date;
    description?: string;
  }[];
}

export interface UpdateCandidateDto extends Partial<CreateCandidateDto> {
  status?: CandidateStatus;
}

export interface CandidateFilters {
  status?: CandidateStatus;
  search?: string;
  page?: number;
  limit?: number;
}