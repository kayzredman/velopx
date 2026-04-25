import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'Validation failed',
      issues: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    })
    return
  }

  // Known operational errors with a status code
  if (isHttpError(err)) {
    res.status(err.status).json({ error: err.message })
    return
  }

  // Unexpected errors
  console.error('[errorHandler]', err)
  res.status(500).json({ error: 'Internal server error' })
}

// Minimal typed HTTP error compatible with http-errors and manual throws
interface HttpError extends Error {
  status: number
  statusCode?: number
}

function isHttpError(err: unknown): err is HttpError {
  return (
    err instanceof Error &&
    'status' in err &&
    typeof (err as HttpError).status === 'number'
  )
}

export function createHttpError(status: number, message: string): HttpError {
  const err = new Error(message) as HttpError
  err.status = status
  return err
}
