import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req, _res, next) {
  next(new HttpError(404, `Rota nao encontrada: ${req.method} ${req.originalUrl}`));
}
