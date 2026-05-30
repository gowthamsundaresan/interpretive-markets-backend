import pino from 'pino'

import { loadEnv } from './env.js'

export const logger = pino({ level: loadEnv().LOG_LEVEL })
