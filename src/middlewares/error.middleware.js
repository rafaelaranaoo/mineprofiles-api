import { env } from '../config/env.js';

export function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Erro interno do servidor.';
  let details = error.details;

  if (error.name === 'ValidationError') {
    statusCode = 422;
    message = 'Dados invalidos.';
    details = Object.values(error.errors).map((item) => item.message);
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Identificador invalido.';
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'Registro duplicado.';
    details = error.keyValue;
  }

  const payload = {
    error: {
      message,
      statusCode
    }
  };

  if (details) {
    payload.error.details = details;
  }

  if (env.nodeEnv === 'development') {
    payload.error.stack = error.stack;
  }

  res.status(statusCode).json(payload);
}
