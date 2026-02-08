# EzConv Music - React App

A music streaming app with YouTube/TikTok to MP3 conversion.

## Features

- **Authentication**: Email and OAuth (Google, Facebook, TikTok)
- **Music Library**: Manage songs, albums, and favorites
- **Convert Feature**: Paste YouTube/TikTok URLs to convert to MP3
- **Music Player**: Full playback controls with progress bar
- **Dark Mode**: Grok-inspired pure black dark mode

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── layout/        # Sidebar, Header
│   ├── player/        # PlayerBar
│   ├── songs/         # Song components
│   ├── albums/        # Album components
│   └── auth/          # Auth components
├── pages/             # Page components
├── lib/               # Utilities
├── stores/            # Zustand stores
└── App.tsx            # Main app
```

## Design System

See `../DESIGN.md` for the complete design system specification.
