import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { normalizeUsername, normalizeUuid } from '../utils/playerValidators.js';

const USER_AGENT = 'MineProfiles-API/1.0';

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(502, 'Mojang API retornou uma resposta invalida.');
  }
}

async function fetchMojangJson(url, notFoundMessage) {
  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT
      }
    });
  } catch (error) {
    throw new HttpError(502, 'Nao foi possivel conectar com a Mojang API.', {
      cause: error.message
    });
  }

  if (response.status === 204) {
    throw new HttpError(404, notFoundMessage);
  }

  const payload = await readJson(response);

  if (!response.ok) {
    if (response.status === 400) {
      throw new HttpError(400, 'Requisicao recusada pela Mojang API.', payload);
    }

    if (response.status === 404) {
      throw new HttpError(404, notFoundMessage, payload);
    }

    if (response.status === 429) {
      throw new HttpError(429, 'Limite de requisicoes da Mojang API atingido.', payload);
    }

    throw new HttpError(502, `Mojang API retornou status ${response.status}.`, payload);
  }

  if (!payload) {
    throw new HttpError(404, notFoundMessage);
  }

  return payload;
}

export async function getMojangProfileByUsername(username) {
  const normalizedUsername = normalizeUsername(username);
  const url = `${env.mojangApiBaseUrl}/users/profiles/minecraft/${encodeURIComponent(
    normalizedUsername
  )}`;

  return fetchMojangJson(url, 'Jogador nao encontrado na Mojang API.');
}

export async function getMojangSessionProfile(uuid) {
  const normalizedUuid = normalizeUuid(uuid);
  const url = `${env.mojangSessionBaseUrl}/session/minecraft/profile/${normalizedUuid}?unsigned=false`;

  return fetchMojangJson(url, 'Perfil nao encontrado no sessionserver da Mojang.');
}

function decodeTextures(sessionProfile) {
  const texturesProperty = sessionProfile.properties?.find(
    (property) => property.name === 'textures'
  );

  if (!texturesProperty?.value) {
    return {
      skinUrl: null,
      skinVariant: 'unknown',
      capeUrl: null,
      rawTextures: null
    };
  }

  let rawTextures;

  try {
    const decoded = Buffer.from(texturesProperty.value, 'base64').toString('utf8');
    rawTextures = JSON.parse(decoded);
  } catch {
    throw new HttpError(502, 'Nao foi possivel decodificar as textures da Mojang API.');
  }

  const skin = rawTextures.textures?.SKIN;
  const cape = rawTextures.textures?.CAPE;

  return {
    skinUrl: skin?.url || null,
    skinVariant: skin?.metadata?.model === 'slim' ? 'slim' : skin?.url ? 'classic' : 'unknown',
    capeUrl: cape?.url || null,
    rawTextures
  };
}

function toPlayerSnapshot(rawProfile, sessionProfile) {
  const textures = decodeTextures(sessionProfile);
  const username = normalizeUsername(sessionProfile.name || rawProfile.name);

  return {
    username,
    uuid: normalizeUuid(sessionProfile.id || rawProfile.id),
    displayName: username,
    mojang: {
      profileFetchedAt: new Date(),
      texturesFetchedAt: new Date(),
      skinUrl: textures.skinUrl,
      skinVariant: textures.skinVariant,
      capeUrl: textures.capeUrl,
      rawProfile: {
        usernameProfile: rawProfile,
        sessionProfile
      },
      rawTextures: textures.rawTextures
    }
  };
}

export async function loadMojangPlayerByUsername(username) {
  const profile = await getMojangProfileByUsername(username);
  const sessionProfile = await getMojangSessionProfile(profile.id);

  return toPlayerSnapshot(profile, sessionProfile);
}

export async function loadMojangPlayerByUuid(uuid) {
  const sessionProfile = await getMojangSessionProfile(uuid);

  return toPlayerSnapshot(sessionProfile, sessionProfile);
}
