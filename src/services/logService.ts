import * as winston from 'winston';
import { LOG_LEVEL } from '../constants';

const { splat, combine, timestamp, printf } = winston.format;

const customFormat = printf(({ timestamp, level, message, meta }) => {
  return `[${timestamp}] [${level.toUpperCase()}]  ${message}  ${meta ? JSON.stringify(meta) : ''}`;
});

export const logger = winston.createLogger({
  handleExceptions: true,
  level: LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZZ' }),
    splat(),
    customFormat
  ),
  transports: [new winston.transports.Console()],
});