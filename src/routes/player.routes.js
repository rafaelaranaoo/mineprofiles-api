import { Router } from 'express';
import {
  createPlayer,
  deletePlayer,
  getPlayer,
  importPlayer,
  listPlayers,
  lookupPlayer,
  replacePlayer,
  syncPlayer,
  updatePlayer
} from '../controllers/player.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const playerRouter = Router();

playerRouter.get('/', asyncHandler(listPlayers));
playerRouter.get('/lookup/:username', asyncHandler(lookupPlayer));
playerRouter.post('/import/:username', asyncHandler(importPlayer));
playerRouter.get('/:id', asyncHandler(getPlayer));
playerRouter.post('/', asyncHandler(createPlayer));
playerRouter.put('/:id', asyncHandler(replacePlayer));
playerRouter.patch('/:id', asyncHandler(updatePlayer));
playerRouter.delete('/:id', asyncHandler(deletePlayer));
playerRouter.post('/:id/sync', asyncHandler(syncPlayer));
