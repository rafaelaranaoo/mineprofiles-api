import { Player } from '../models/player.model.js';
import {
  loadMojangPlayerByUsername,
  loadMojangPlayerByUuid
} from '../services/mojang.service.js';
import { HttpError } from '../utils/httpError.js';
import {
  assertValidObjectId,
  normalizeBoolean,
  normalizeNotes,
  normalizeOptionalString,
  normalizeTags,
  normalizeUsername,
  normalizeUuid
} from '../utils/playerValidators.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePositiveInt(value, fallback, max) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(400, 'Parametros page e limit devem ser inteiros positivos.');
  }

  return Math.min(parsed, max);
}

function buildLocalPayload(body, { partial = false } = {}) {
  const payload = {};

  if (!partial || body.username !== undefined) {
    payload.username = normalizeUsername(body.username);
  }

  if (!partial || body.uuid !== undefined) {
    payload.uuid = normalizeUuid(body.uuid);
  }

  if (!partial || body.displayName !== undefined) {
    payload.displayName =
      normalizeOptionalString(body.displayName, 'displayName') || payload.username;
  }

  if (!partial || body.favorite !== undefined) {
    payload.favorite =
      body.favorite === undefined ? false : normalizeBoolean(body.favorite, 'favorite');
  }

  if (!partial || body.notes !== undefined) {
    payload.notes = body.notes === undefined ? '' : normalizeNotes(body.notes);
  }

  if (!partial || body.tags !== undefined) {
    payload.tags = body.tags === undefined ? [] : normalizeTags(body.tags);
  }

  return payload;
}

function buildImportOptions(body) {
  const payload = {};

  if (body.favorite !== undefined) {
    payload.favorite = normalizeBoolean(body.favorite, 'favorite');
  }

  if (body.notes !== undefined) {
    payload.notes = normalizeNotes(body.notes);
  }

  if (body.tags !== undefined) {
    payload.tags = normalizeTags(body.tags);
  }

  return payload;
}

async function findPlayerOrFail(id) {
  assertValidObjectId(id);
  const player = await Player.findById(id);

  if (!player) {
    throw new HttpError(404, 'Jogador nao encontrado.');
  }

  return player;
}

export async function listPlayers(req, res) {
  const page = parsePositiveInt(req.query.page, 1, 1000);
  const limit = parsePositiveInt(req.query.limit, 10, 100);
  const skip = (page - 1) * limit;
  const filter = {};

  if (req.query.favorite !== undefined) {
    filter.favorite = normalizeBoolean(req.query.favorite, 'favorite');
  }

  if (req.query.tag) {
    filter.tags = String(req.query.tag).trim().toLowerCase();
  }

  if (req.query.search) {
    const search = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [{ username: search }, { displayName: search }, { notes: search }];
  }

  const [data, total] = await Promise.all([
    Player.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Player.countDocuments(filter)
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

export async function getPlayer(req, res) {
  const player = await findPlayerOrFail(req.params.id);
  res.json({ data: player });
}

export async function createPlayer(req, res) {
  const payload = buildLocalPayload(req.body || {});
  const player = await Player.create(payload);

  res.status(201).json({
    data: player,
    message: 'Jogador criado localmente.'
  });
}

export async function importPlayer(req, res) {
  const snapshot = await loadMojangPlayerByUsername(req.params.username);
  const options = buildImportOptions(req.body || {});
  const existing = await Player.findOne({ uuid: snapshot.uuid });

  if (existing) {
    existing.set({
      username: snapshot.username,
      uuid: snapshot.uuid,
      displayName: snapshot.displayName,
      mojang: snapshot.mojang,
      ...options
    });

    await existing.save();

    return res.json({
      data: existing,
      message: 'Jogador ja existia e foi atualizado com dados da Mojang API.'
    });
  }

  const player = await Player.create({
    ...snapshot,
    favorite: options.favorite ?? false,
    notes: options.notes ?? '',
    tags: options.tags ?? []
  });

  return res.status(201).json({
    data: player,
    message: 'Jogador importado da Mojang API.'
  });
}

export async function lookupPlayer(req, res) {
  const snapshot = await loadMojangPlayerByUsername(req.params.username);

  res.json({
    data: snapshot,
    message: 'Consulta feita na Mojang API sem salvar no banco.'
  });
}

export async function replacePlayer(req, res) {
  const player = await findPlayerOrFail(req.params.id);
  const payload = buildLocalPayload(req.body || {});

  player.set({
    username: payload.username,
    uuid: payload.uuid,
    displayName: payload.displayName,
    favorite: payload.favorite,
    notes: payload.notes,
    tags: payload.tags,
    mojang: {}
  });

  await player.save();

  res.json({
    data: player,
    message: 'Jogador substituido.'
  });
}

export async function updatePlayer(req, res) {
  const payload = buildLocalPayload(req.body || {}, { partial: true });

  if (Object.keys(payload).length === 0) {
    throw new HttpError(400, 'Informe ao menos um campo para atualizar.');
  }

  const player = await findPlayerOrFail(req.params.id);
  player.set(payload);
  await player.save();

  res.json({
    data: player,
    message: 'Jogador atualizado parcialmente.'
  });
}

export async function deletePlayer(req, res) {
  const player = await findPlayerOrFail(req.params.id);
  await player.deleteOne();

  res.json({
    data: {
      id: req.params.id
    },
    message: 'Jogador removido.'
  });
}

export async function syncPlayer(req, res) {
  const player = await findPlayerOrFail(req.params.id);
  const snapshot = await loadMojangPlayerByUuid(player.uuid);

  player.set({
    username: snapshot.username,
    uuid: snapshot.uuid,
    displayName: snapshot.displayName,
    mojang: snapshot.mojang
  });

  await player.save();

  res.json({
    data: player,
    message: 'Jogador sincronizado com a Mojang API.'
  });
}
