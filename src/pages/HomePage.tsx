import { Play, Plus } from 'lucide-react'

const quickAccess = [
  { id: 1, title: 'Liked Songs', icon: 'heart', color: 'bg-gradient-to-br from-purple-500 to-blue-500' },
  { id: 2, title: 'Recently Added', icon: 'clock', color: 'bg-gradient-to-br from-green-500 to-teal-500' },
]

const recentlySaved = [
  { id: 1, title: 'Deep House Mix', artist: 'Various Artists', cover: 'https://i.scdn.co/image/ab67616d0000b2735c84b42b592badc52b148e66' },
  { id: 2, title: 'Summer Vibes', artist: 'Chill Mix', cover: 'https://i.scdn.co/image/ab67616d0000b2735c84b42b592badc52b148e66' },
  { id: 3, title: 'Workout Energy', artist: 'Gym Playlist', cover: 'https://i.scdn.co/image/ab67616d0000b2735c84b42b592badc52b148e66' },
]

const history = [
  { id: 1, title: 'Space Oddity', album: 'Space Oddity', duration: '5:15' },
  { id: 2, title: 'Heroes', album: 'Heroes', duration: '6:07' },
  { id: 3, title: 'Starman', album: 'The Rise and Fall...', duration: '4:14' },
  { id: 4, title: 'Rebel Rebel', album: 'Diamond Dogs', duration: '4:30' },
  { id: 5, title: 'Fame', album: 'Young Americans', duration: '4:16' },
]

export default function HomePage() {
  return (
    <div className="p-8">
      {/* Quick Access */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Good evening</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccess.map((item) => (
            <div
              key={item.id}
              className="flex items-center bg-black/5 dark:bg-white/5 rounded-md overflow-hidden cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors group"
            >
              <div className={`w-20 h-20 ${item.color} flex items-center justify-center`}>
                {item.icon === 'heart' ? (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                )}
              </div>
              <span className="ml-4 font-bold text-base flex-1">{item.title}</span>
              <button className="mr-4 w-12 h-12 rounded-full bg-primary text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Saved */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Recently Saved
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {recentlySaved.map((item) => (
            <div key={item.id} className="bg-black/5 dark:bg-white/5 p-4 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer group">
              <div className="aspect-square rounded-md mb-4 shadow-md relative overflow-hidden">
                <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                <button className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary text-white shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all flex items-center justify-center">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
              </div>
              <h3 className="font-semibold text-sm truncate">{item.title}</h3>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">{item.artist}</p>
            </div>
          ))}
          <div className="border border-dashed border-border-light dark:border-border-dark rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
            <Plus className="w-10 h-10 text-text-secondary-light dark:text-text-secondary-dark mb-2 group-hover:text-text-primary-light dark:group-hover:text-text-primary-dark transition-colors" />
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark group-hover:text-text-primary-light dark:group-hover:text-text-primary-dark transition-colors">
              New Playlist
            </span>
          </div>
        </div>
      </section>

      {/* History */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </h2>
        <div className="w-full">
          <div className="flex items-center text-text-secondary-light dark:text-text-secondary-dark pb-2 border-b border-border-light dark:border-border-dark text-xs uppercase tracking-wide">
            <div className="w-8">#</div>
            <div className="flex-1">Title</div>
            <div className="w-32 hidden md:block">Album</div>
            <div className="w-24 text-right">Duration</div>
          </div>
          {history.map((song, index) => (
            <div
              key={song.id}
              className="group flex items-center py-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -mx-1 cursor-pointer transition-colors"
            >
              <div className="w-8 text-text-secondary-light dark:text-text-secondary-dark group-hover:hidden">
                {index + 1}
              </div>
              <div className="w-8 hidden group-hover:block">
                <Play className="w-4 h-4" />
              </div>
              <div className="flex-1 font-medium">{song.title}</div>
              <div className="w-32 text-text-secondary-light dark:text-text-secondary-dark hidden md:block">
                {song.album}
              </div>
              <div className="w-24 text-right text-text-secondary-light dark:text-text-secondary-dark">
                {song.duration}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
