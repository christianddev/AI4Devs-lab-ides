import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { LocalFileStorage } from '../services/local-file.service';
import { AppError } from '../utils/error';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const fileStorage = new LocalFileStorage();

export class FileController {
  async uploadCandidateFile(req: Request, res: Response, next: NextFunction) {
    try {
      const candidateId = parseInt(req.params.candidateId);
      const file = req.file;

      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404);
      }

      const fileMetadata = await fileStorage.save(file);

      const fileRecord = await prisma.fileRecord.create({
        data: {
          ...fileMetadata,
          candidateId,
        },
      });

      logger.info(`File uploaded for candidate ${candidateId}: ${fileMetadata.filename}`);
      res.status(201).json(fileRecord);
    } catch (error) {
      next(error);
    }
  }

  async getFile(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = parseInt(req.params.id);
      const file = await prisma.fileRecord.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new AppError('File not found', 404);
      }

      const filePath = fileStorage.getPath(file.filename);
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = parseInt(req.params.id);
      const file = await prisma.fileRecord.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new AppError('File not found', 404);
      }

      await fileStorage.delete(file.filename);
      await prisma.fileRecord.delete({
        where: { id: fileId },
      });

      logger.info(`File deleted: ${file.filename}`);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}