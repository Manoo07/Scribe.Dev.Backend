import * as winston from 'winston';
import { LOG_FORMAT, LOG_LEVEL } from '../constants/constants';

const { splat, combine, timestamp, printf } = winston.format;

const customFormat = printf(({ timestamp, level, message, meta }) => {
  return `[${timestamp}] [${level.toUpperCase()}]  ${message}  ${meta ? JSON.stringify(meta) : ''}`;
});

export const logger = winston.createLogger({
  handleExceptions: true,
  level: LOG_LEVEL,
  format: combine(timestamp({ format: LOG_FORMAT }), splat(), customFormat),
  transports: [new winston.transports.Console()],
});
