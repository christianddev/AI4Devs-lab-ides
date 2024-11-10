import { Request, Response, NextFunction } from 'express';
import { CandidateService } from '../services/candidate.service';
import { prisma } from '../index';
import { CreateCandidateDto, UpdateCandidateDto } from '../types/candidate.types';
import { validateCreateCandidate, validateUpdateCandidate } from '../validations/candidate.validation';

const candidateService = new CandidateService(prisma);

export class CandidateController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = validateCreateCandidate(req.body);
      const candidate = await candidateService.create(data);
      res.status(201).json(candidate);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status,
        search: req.query.search as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };
      const result = await candidateService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const candidate = await candidateService.findById(id);
      res.json(candidate);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = validateUpdateCandidate(req.body);
      const candidate = await candidateService.update(id, data);
      res.json(candidate);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await candidateService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}