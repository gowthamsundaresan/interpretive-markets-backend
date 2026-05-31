import { loadEnv } from './env'
import pino from 'pino'

export const logger = pino({ level: loadEnv().LOG_LEVEL })
