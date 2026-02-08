import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PlayerBar from './components/player/PlayerBar';
import LoginPage from './pages/LoginPage';
import SongsPage from './pages/SongsPage';
import FavoritesPage from './pages/FavoritesPage';
import AlbumsPage from './pages/AlbumsPage';
import AddSongPage from './pages/AddSongPage';
import { useAuth } from './lib/auth/AuthProvider';
import { usePlaybackStore } from './lib/stores/playbackStore';
import './App.css';

function App() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { currentTrack } = usePlaybackStore();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          user={user ? {
            name: user.displayName,
            email: user.email,
            avatar: user.avatarUrl
          } : undefined}
          onLogout={logout}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/albums" />} />
            <Route path="/songs" element={<SongsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/albums" element={<AlbumsPage />} />
            <Route path="/add-song" element={<AddSongPage />} />
            <Route path="*" element={<Navigate to="/albums" />} />
          </Routes>
        </main>
        <PlayerBar song={currentTrack ? {
          title: currentTrack.title,
          artist: currentTrack.artist,
          cover: currentTrack.thumbnailUrl || 'https://via.placeholder.com/64',
          duration: formatDuration(currentTrack.duration),
          currentTime: '0:00'
        } : {
          title: 'No track playing',
          artist: 'Select a song',
          cover: 'https://via.placeholder.com/64',
          duration: '0:00',
          currentTime: '0:00'
        }} />
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default App;
