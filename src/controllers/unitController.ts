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
import Zod, { ZodError } from 'zod';
import { unitSchema, updateUnitSchema } from '@utils/validations/unit.schema';

export class UnitController {
    private unitService = new UnitService();

    public createUnit = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, description, classroomId, educationalContents } = req.body;
            logger.info('[UnitController] Validating unit creation request');
            unitSchema.parse({ name, classroomId });

            logger.info('[UnitController] Creating unit');
            const result = await this.unitService.createUnit({ name, description, classroomId, educationalContents });
            logger.info('[UnitController] Unit created successfully');
            res.status(HTTP_STATUS_CREATED).json(result);
        } catch (error) {
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

    public getUnitByUnitId = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        try {
            logger.info(`[UnitController] Fetching unit with ID: ${id}`);
            const unit = await this.unitService.getUnitByUnitId(id);
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


    public getUnitByClassroomId = async (req: Request, res: Response): Promise<void> => {
        const { classroomId } = req.params;
        try {
            logger.info(`[UnitController] Fetching unit with ID: ${classroomId}`);
            const unit = await this.unitService.getUnitByClassroomId(classroomId);
            if (!unit) {
                logger.warn(`[UnitController] Unit not found with classroomID: ${classroomId}`);
                res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Unit not found' });
            } else {
                res.status(HTTP_STATUS_OK).json(unit);
            }
        } catch (error) {
            logger.error(`[UnitController] Error fetching classroom ID=${classroomId}:`, error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch unit' });
        }
    };


    public async filterUnits(req: Request, res: Response): Promise<void> {
        try {
            const filters = req.body.filter || {};
            logger.info('[UnitController] Received filters for unit search (GET body):', filters);

            const units = await this.unitService.filterUnits(filters);
            res.status(200).json(units);
        } catch (error) {
            logger.error('[UnitController] Error filtering units:', error);
            res.status(500).json({ error: 'Failed to filter units' });
        }
    }




    public updateUnit = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const updateFields = req.body;
        try {
            const validatedFields = updateUnitSchema.parse(updateFields);
            logger.info(`[UnitController] Updating unit ID=${id}`);
            const result = await this.unitService.updateUnit(id, validatedFields);

            logger.info(`[UnitController] Unit ID=${id} updated successfully`);
            res.status(HTTP_STATUS_OK).json(result);
        } catch (error) {
            if (error instanceof Zod.ZodError) {
                logger.warn(
                    `[UnitController] Validation failed for unit update ID=${id}: ${error.errors
                        .map((e) => e.message)
                        .join(', ')}`
                );
                res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Validation error', details: error.errors });
            } else {
                logger.error(`[UnitController] Error updating unit ID=${id}:`, error);
                res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
            }
        }
    };

    public deleteUnitByUnitId = async (req: Request, res: Response): Promise<void> => {
        const { unitId } = req.params;

        try {
            logger.info(`[UnitController] Checking if unit ID=${unitId} exists`);
            const existingUnit = await this.unitService.getUnitByUnitId(unitId);

            if (!existingUnit) {
                logger.warn(`[UnitController] Unit ID=${unitId} not found`);
                res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Unit not found' });
                return;
            }

            logger.info(`[UnitController] Deleting unit ID=${unitId}`);
            await this.unitService.deleteUnit(unitId);

            logger.info(`[UnitController] Unit ID=${unitId} deleted successfully`);
            res.status(HTTP_STATUS_NO_CONTENT).send({ message: `Unit with ID=${unitId} deleted successfully` });
        } catch (error) {
            logger.error(`[UnitController] Error deleting unit ID=${unitId}:`, error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete unit' });
        }
    };
}
