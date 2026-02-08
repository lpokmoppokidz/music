import { Router } from 'express';
import {
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addSongToAlbum,
} from '../controllers/albums.controller';

const router = Router();

router.get('/', getAlbums);
router.post('/', createAlbum);
router.get('/:id', getAlbumById);
router.patch('/:id', updateAlbum);
router.delete('/:id', deleteAlbum);
router.post('/:id/songs', addSongToAlbum);

export default router;
