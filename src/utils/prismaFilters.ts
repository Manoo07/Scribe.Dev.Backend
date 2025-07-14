import { ALLOWED_FILTER_KEYS } from '@constants/constants';

export const validateFilter = (filter: any): string[] => {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    throw new Error('Filter must be a valid object');
  }
  const invalidKeys = Object.keys(filter).filter((key) => !ALLOWED_FILTER_KEYS.has(key));
  return invalidKeys;
};
