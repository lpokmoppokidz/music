import mongoose from 'mongoose';

const albumSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  coverImageUrl: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
}, {
  timestamps: true,
});

export const Album = mongoose.model('Album', albumSchema);
