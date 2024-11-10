import { z } from 'zod';
import { parsePhoneNumber } from 'libphonenumber-js';

const experienceSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  title: z.string().min(1),
  institution: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  description: z.string().optional(),
});

const createCandidateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().refine((val) => {
    try {
      const phoneNumber = parsePhoneNumber(val, 'ES');
      return phoneNumber.isValid();
    } catch {
      return false;
    }
  }, 'Invalid phone number'),
  address: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  experiences: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
});

const updateCandidateSchema = createCandidateSchema.partial().extend({
  status: z.enum(['NEW', 'REVIEWING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED']).optional(),
});

export const validateCreateCandidate = (data: unknown) => {
  return createCandidateSchema.parse(data);
};

export const validateUpdateCandidate = (data: unknown) => {
  return updateCandidateSchema.parse(data);
};