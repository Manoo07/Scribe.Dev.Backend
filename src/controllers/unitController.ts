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
        const { name, classroomId } = req.body;
        unitSchema.parse({ name, classroomId });

        logger.info('[UnitController] Creating unit with name:', name);

        try {
            const result = await this.unitService.createUnit({ name, classroomId });
            logger.info('[UnitController] Unit created:', result.unit);
            res.status(HTTP_STATUS_CREATED).json(result.unit);
        } catch (error: any) {
            logger.error('[UnitController] Error creating unit:', error.message || error);
            if (error instanceof ZodError) {
                logger.warn('[UnitService] Validation error during creation:', error.errors);
                const errorMessage = error.errors.map((e) => e.message).join(', ');
                res.status(HTTP_STATUS_BAD_REQUEST).json({
                    message: errorMessage,
                });
            }
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
                message: 'Something went wrong',
            });
        }
    };

    public getUnits = async (req: Request, res: Response): Promise<void> => {
        try {
            logger.info('[UnitController] Fetching all units');
            const units = await this.unitService.getUnits();
            logger.info('[UnitController] Fetched all units');
            res.status(HTTP_STATUS_OK).json(units);
        } catch (error) {
            logger.error('[UnitController] Error fetching units:', error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch units' });
        }
    };

    public getUnitById = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        logger.info(`[UnitController] Fetching unit by ID: ${id}`);

        try {
            const unit = await this.unitService.getUnitById(id);

            if (!unit) {
                logger.warn(`[UnitController] Unit not found for ID: ${id}`);
                res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Unit not found' });
                return;
            }

            logger.info(`[UnitController] Unit found for ID: ${id}`);
            res.status(HTTP_STATUS_OK).json(unit);
        } catch (error: any) {
            logger.error(`[UnitController] Error fetching unit by ID: ${id}`, error.message || error);

            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
                error: error.message || 'An unexpected error occurred',
            });
        }
    };

    public updateUnit = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const updateFields = req.body;

        logger.info(
            `[UnitController] Updating unit ID=${id} with name: ${updateFields.name} and classroomId: ${updateFields.classroomId}`
        );
        try {
            if (updateFields.name) {
                logger.info(`[UnitService] Validating update input for unit ID=${id}`);
                unitSchema.pick({ name: true }).parse({ name: updateFields.name });
            }
            const result = await this.unitService.updateUnit(id, updateFields);

            if (result.error) {
                logger.error(`[UnitController] Error updating unit ID=${id}:`, result.error);
                res.status(HTTP_STATUS_BAD_REQUEST).json({ error: result.error });
            }
            logger.info(`[UnitController] Unit updated ID=${id}:`, result.unit);
            res.status(HTTP_STATUS_OK).json(result.unit);
        } catch (error) {
            if (error instanceof ZodError) {
                logger.warn('[UnitService] Validation error during update:', error.errors);
                const errorMessage = error.errors.map((e) => e.message).join(', ');
                res.status(HTTP_STATUS_BAD_REQUEST).json({
                    message: errorMessage,
                });
            }
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
                message: 'Something went wrong',
            });
        }
    };

    public deleteUnit = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            logger.info(`[UnitController] Deleting unit ID=${id}`);
            await this.unitService.deleteUnit(id);
            logger.info(`[UnitController] Unit deleted ID=${id}`);
            res.status(HTTP_STATUS_NO_CONTENT).send();
        } catch (error) {
            logger.error(`[UnitController] Error deleting unit ID=${id}:`, error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete unit' });
        }
    };
}
