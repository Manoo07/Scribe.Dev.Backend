import {
    HTTP_STATUS_BAD_REQUEST,
    HTTP_STATUS_CREATED,
    HTTP_STATUS_INTERNAL_SERVER_ERROR,
    HTTP_STATUS_NO_CONTENT,
    HTTP_STATUS_OK,
    HTTP_STATUS_NOT_FOUND,
} from '@constants/constants';
import UnitService from '@services/unitService';
import { logger } from '@services/logService';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { unitSchema } from '@utils/validations/unit.schema';

export class UnitController {
    private unitService = new UnitService();

    public createUnit = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, classroomId, educationalContents } = req.body;
            logger.info('[UnitController] Validating unit creation request');
            unitSchema.parse({ name, classroomId });

            logger.info('[UnitController] Creating unit');
            const result = await this.unitService.createUnit({ name, classroomId, educationalContents });
            logger.info('[UnitController] Unit created successfully');
            res.status(HTTP_STATUS_CREATED).json(result.unit);
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errorMessage = error.errors.map((e) => e.message).join(', ');
                logger.warn(`[UnitController] Validation error: ${errorMessage}`);
                res.status(HTTP_STATUS_BAD_REQUEST).json({ message: errorMessage });
            } else {
                logger.error('[UnitController] Error creating unit:', error);
                res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
            }
        }
    };

    public getUnits = async (_: Request, res: Response): Promise<void> => {
        try {
            logger.info('[UnitController] Fetching all units');
            const units = await this.unitService.getUnits();
            res.status(HTTP_STATUS_OK).json(units);
        } catch (error) {
            logger.error('[UnitController] Error fetching units:', error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch units' });
        }
    };

    public getUnitById = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        try {
            logger.info(`[UnitController] Fetching unit with ID: ${id}`);
            const unit = await this.unitService.getUnitById(id);
            if (!unit) {
                logger.warn(`[UnitController] Unit not found with ID: ${id}`);
                res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Unit not found' });
            } else {
                res.status(HTTP_STATUS_OK).json(unit);
            }
        } catch (error) {
            logger.error(`[UnitController] Error fetching unit ID=${id}:`, error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch unit' });
        }
    };

    public updateUnit = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const updateFields = req.body;
        try {
            logger.info(`[UnitController] Updating unit ID=${id}`);
            const result = await this.unitService.updateUnit(id, updateFields);

            logger.info(`[UnitController] Unit ID=${id} updated successfully`);
            res.status(HTTP_STATUS_OK).json(result.unit);
        } catch (error) {
            logger.error(`[UnitController] Error updating unit ID=${id}:`, error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
        }
    };

    public deleteUnit = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        try {
            logger.info(`[UnitController] Deleting unit ID=${id}`);
            await this.unitService.deleteUnit(id);
            logger.info(`[UnitController] Unit ID=${id} deleted successfully`);
            res.status(HTTP_STATUS_NO_CONTENT).send();
        } catch (error) {
            logger.error(`[UnitController] Error deleting unit ID=${id}:`, error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete unit' });
        }
    };
}
