import pino from 'pino'

import { loadEnv } from './env'

export const logger = pino({ level: loadEnv().LOG_LEVEL })
