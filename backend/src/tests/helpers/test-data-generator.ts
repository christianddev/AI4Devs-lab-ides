import { PrismaClient, Candidate } from '@prisma/client';
import { faker } from '@faker-js/faker';

export class TestDataGenerator {
  constructor(private prisma: PrismaClient) {}

  async generateCandidates(count: number): Promise<Candidate[]> {
    const candidates = Array(count).fill(null).map(() => ({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number('+346########'),
      address: faker.location.streetAddress(),
      linkedinUrl: `https://linkedin.com/in/${faker.internet.userName()}`,
      status: faker.helpers.arrayElement(['NEW', 'REVIEWING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED']),
    }));

    return await this.prisma.candidate.createMany({
      data: candidates,
      skipDuplicates: true,
    });
  }

  async cleanup(): Promise<void> {
    await this.prisma.candidateInteraction.deleteMany();
    await this.prisma.fileRecord.deleteMany();
    await this.prisma.experience.deleteMany();
    await this.prisma.education.deleteMany();
    await this.prisma.candidate.deleteMany();
  }
}