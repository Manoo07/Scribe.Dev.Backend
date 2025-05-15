import EducationalContentDAO from "@dao/educationalContentDAO";
import { logger } from "./logService";


class EducationalContentService {
  async createEducationalContent(unitId: string, data: { content: string, type: string, version?: number }) {
    try {
      return await EducationalContentDAO.create(unitId, data);
    } catch (error) {
      logger.error('[EducationalContentService] Error creating content:', error);
      throw error;
    }
  }

  async getEducationalContentByUnitId(unitId: string) {
    try {
      return await EducationalContentDAO.findByUnitId(unitId);
    } catch (error) {
      logger.error('[EducationalContentService] Error fetching content by unit ID:', error);
      throw error;
    }
  }

  async updateEducationalContent(id: string, updateData: Record<string, any>) {
    try {
      return await EducationalContentDAO.update(id, updateData);
    } catch (error) {
      logger.error('[EducationalContentService] Error updating content:', error);
      throw error;
    }
  }

  async deleteEducationalContent(id: string) {
    try {
      return await EducationalContentDAO.delete(id);
    } catch (error) {
      logger.error('[EducationalContentService] Error deleting content:', error);
      throw error;
    }
  }
}

export default new EducationalContentService();
