import { Types } from 'mongoose';
import { HttpError } from './httpError.js';

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,16}$/;
const UUID_PATTERN = /^[a-f0-9]{32}$/i;

export function assertValidObjectId(id) {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'ID invalido.');
  }
}

export function normalizeUsername(username) {
  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username.trim())) {
    throw new HttpError(
      422,
      'Username invalido. Use 3 a 16 caracteres com letras, numeros ou underscore.'
    );
  }

  return username.trim();
}

export function normalizeUuid(uuid) {
  if (typeof uuid !== 'string') {
    throw new HttpError(422, 'UUID deve ser uma string.');
  }

  const normalized = uuid.replaceAll('-', '').toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new HttpError(422, 'UUID invalido. Use 32 caracteres hexadecimais.');
  }

  return normalized;
}

export function normalizeBoolean(value, fieldName) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new HttpError(422, `${fieldName} deve ser booleano.`);
}

export function normalizeTags(tags) {
  if (tags === undefined) {
    return undefined;
  }

  if (!Array.isArray(tags)) {
    throw new HttpError(422, 'tags deve ser um array de strings.');
  }

  return [
    ...new Set(
      tags
        .map((tag) => {
          if (typeof tag !== 'string') {
            throw new HttpError(422, 'Cada tag deve ser uma string.');
          }
          return tag.trim().toLowerCase();
        })
        .filter(Boolean)
    )
  ];
}

export function normalizeNotes(notes) {
  if (notes === undefined) {
    return undefined;
  }

  if (typeof notes !== 'string') {
    throw new HttpError(422, 'notes deve ser uma string.');
  }

  if (notes.length > 500) {
    throw new HttpError(422, 'notes deve ter no maximo 500 caracteres.');
  }

  return notes.trim();
}

export function normalizeOptionalString(value, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new HttpError(422, `${fieldName} deve ser uma string.`);
  }

  return value.trim();
}
