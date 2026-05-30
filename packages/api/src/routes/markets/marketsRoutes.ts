import { ListMarketsQuerySchema, MarketParamsSchema } from '../../schema/markets'
import { getMarket, getMarketVerdict, listMarkets } from './marketsController'
import type { FastifyInstance } from 'fastify'

// --- Core functions ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const register = (server: FastifyInstance, _: any, next: () => void) => {
	server.get('/', { schema: { querystring: ListMarketsQuerySchema } }, listMarkets)
	server.get('/:id', { schema: { params: MarketParamsSchema } }, getMarket)
	server.get('/:id/verdict', { schema: { params: MarketParamsSchema } }, getMarketVerdict)
	next()
}
