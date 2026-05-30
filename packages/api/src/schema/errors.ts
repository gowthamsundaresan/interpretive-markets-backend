import type { FastifyReply } from 'fastify'

// --- Types ---

export type ErrorCode =
	| 'bad_request'
	| 'not_found'
	| 'rate_limit_exceeded'
	| 'internal_server_error'

export interface ErrorResponse {
	error: ErrorCode
	message: string
}

// --- Core functions ---

const errorCodeToHttpStatus: Record<ErrorCode, number> = {
	bad_request: 400,
	not_found: 404,
	rate_limit_exceeded: 429,
	internal_server_error: 500
}

export function sendError(reply: FastifyReply, code: ErrorCode, message: string) {
	return reply.status(errorCodeToHttpStatus[code]).send({ error: code, message })
}
