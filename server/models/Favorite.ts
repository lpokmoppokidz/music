import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
}, {
  timestamps: true,
});

favoriteSchema.index({ userId: 1, songId: 1 }, { unique: true });

export const Favorite = mongoose.model('Favorite', favoriteSchema);
