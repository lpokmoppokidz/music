import { Router } from 'express';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
} from '../controllers/favorites.controller';

const router = Router();

router.get('/', getFavorites);
router.post('/', addToFavorites);
router.delete('/:songId', removeFromFavorites);

export default router;
