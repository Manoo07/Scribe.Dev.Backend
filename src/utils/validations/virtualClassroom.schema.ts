import { HTTP_STATUS_BAD_REQUEST } from '@constants/constants';
import { Response } from 'express';

export function validateFields(fields: { key: string; value: any }[], res: Response): boolean {
  const missing = fields.filter((field) => !field.value).map((field) => field.key);
  if (missing.length > 0) {
    res.status(HTTP_STATUS_BAD_REQUEST).json({
      message: `${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} required`,
    });
    return false;
  }
  return true;
}
