export class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error?.code === 'P2002') return res.status(409).json({ code: 'CONFLICT', message: 'A record with these details already exists.' });
  if (error?.code === 'P2025') return res.status(404).json({ code: 'NOT_FOUND', message: 'The requested record was not found.' });
  const status = error.status ?? 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ code: error.code ?? 'INTERNAL_ERROR', message: status >= 500 ? 'An unexpected error occurred.' : error.message });
}
