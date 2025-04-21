import { z, ZodError } from 'zod';
import CollegeDAO from '../dao/CollegeDAO';
import { College } from '@prisma/client';

const collegeSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 1 character" }),
});

interface CollegeDAO {
  createCollege: (data: z.infer<typeof collegeSchema>) => Promise<College>;
}

class CollegeService {
  public async createCollege(
    params: { name: string }
  ): Promise<{ college?: College; error?: string }> {
    try {
      const validatedData = collegeSchema.parse(params);
      const college = await CollegeDAO.createCollege(validatedData.name);
      return { college };
    } catch (error) {
      if (error instanceof ZodError) {
        return { error: error.errors.map(e => e.message).join(', ') };
      }
      console.error("Unexpected error during college creation:", error);
      return { error: "An unexpected error occurred" }; // Provide a generic error message
    }
  }

  async getColleges(filterOptions: Partial<College> = {}): Promise<College[]> {
    return CollegeDAO.getColleges(filterOptions);
  }

  async updateCollege(
    id: string,
    updateFields: Partial<College>
  ): Promise<{ college?: College; error?: string }> {
    try {
      if (updateFields.name) {
        collegeSchema.pick({ name: true }).parse({ name: updateFields.name });
      }
  
      const college = await CollegeDAO.updateCollege(id, updateFields);
  
      // ✅ Convert null to undefined
      return { college: college ?? undefined };
    } catch (error) {
      if (error instanceof ZodError) {
        return { error: error.errors.map(e => e.message).join(', ') };
      }
      throw error;
    }
  }
  

  async deleteCollege(id: string): Promise<void> {
    await CollegeDAO.deleteCollege(id);
  }
}

export default CollegeService;
