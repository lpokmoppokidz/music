# Secure Authentication System Documentation

## 🔐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │  AuthContext │  │ Access Token │  │ Playback State Storage  │   │
│  │  (Memory)    │  │  (Memory)    │  │    (localStorage)       │   │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Axios Interceptors                         │   │
│  │  • Add Bearer token to requests                               │   │
│  │  • Intercept 401 → auto-refresh                               │   │
│  │  • Queue requests during refresh                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ HTTPS
                                   │ (httpOnly cookie)
┌──────────────────────────────────▼───────────────────────────────────┐
│                         SERVER (Express)                             │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐    │
│  │  /auth/login   │  │ /auth/refresh  │  │  /auth/logout       │    │
│  │  /auth/register│  │                │  │  /auth/logout-all   │    │
│  └────────────────┘  └────────────────┘  └─────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Refresh Token Storage                      │   │
│  │  MongoDB: refreshTokens collection                            │   │
│  │  • Hashed opaque token strings                                │   │
│  │  • userId, expiresAt, revokedAt                               │   │
│  │  • Device info & IP for audit                                 │   │
│  │  • Token rotation: new token issued per refresh               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Security Features

### 1. Token Storage Strategy

| Token Type | Storage | Lifetime | Security |
|------------|---------|----------|----------|
| **Access Token** | Memory only (React state) | 15 minutes | XSS-safe (not in localStorage) |
| **Refresh Token** | httpOnly Secure SameSite cookie | 7 days | XSS-proof, CSRF-protected |
| **Refresh Token (DB)** | MongoDB (hashed) | 7 days | Revocable, auditable |

### 2. Why This Is Secure

**❌ Common Mistakes (AVOID):**
1. Storing access tokens in localStorage → XSS vulnerability
2. Stateless refresh tokens (JWT without DB) → Cannot revoke
3. Long-lived access tokens → More time for abuse if stolen
4. No token rotation → Replay attacks possible

**✅ Our Approach:**
1. **Memory-only access tokens** → Disappear on page close, XSS-safe
2. **DB-stored refresh tokens** → Can revoke on logout/password change
3. **Token rotation** → Every refresh issues new token, old one invalidated
4. **Short access token lifetime** → 15 minutes max exposure
5. **httpOnly cookies** → JavaScript cannot read refresh token

### 3. Token Refresh Flow

```
┌─────────┐          ┌──────────┐          ┌──────────┐
│ Client  │──────────▶│  Server  │          │ Database │
└────┬────┘  API Call └────┬─────┘          └────┬─────┘
     │                     │                    │
     │ Authorization:      │                    │
     │ Bearer {expired}    │                    │
     │────────────────────▶│                    │
     │                     │                    │
     │     401 Unauthorized│                    │
     │◀────────────────────│                    │
     │                     │                    │
     │ POST /auth/refresh  │                    │
     │ Cookie: refreshToken│                    │
     │────────────────────▶│                    │
     │                     │ Find & validate    │
     │                     │ refresh token      │
     │                     │───────────────────▶│
     │                     │                    │
     │                     │ Revoke old token   │
     │                     │ Create new token   │
     │                     │◀───────────────────│
     │                     │                    │
     │ Set new refresh     │                    │
     │ token in cookie     │                    │
     │                     │                    │
     │  { accessToken }    │                    │
     │◀────────────────────│                    │
     │                     │                    │
     │ Retry original API  │                    │
     │ with new token      │                    │
     │────────────────────▶│                    │
```

### 4. Playback State Persistence

**What we store:**
- Current track ID, position, playlist
- Volume, shuffle, repeat settings
- Queue and queue index

**Why it's safe:**
- No sensitive data (no tokens, no passwords)
- Public track information only
- Stored in localStorage for easy restoration
- Automatically cleared on logout

## 📁 File Structure

```
server/
├── models/
│   ├── User.ts              # User schema with password hashing
│   ├── RefreshToken.ts      # Refresh token storage schema
│   ├── Song.ts
│   ├── Album.ts
│   └── Favorite.ts
├── controllers/
│   ├── auth.controller.ts   # Login, register, refresh, logout
│   ├── songs.controller.ts
│   ├── albums.controller.ts
│   └── favorites.controller.ts
├── middleware/
│   └── auth.middleware.ts   # JWT verification middleware
├── routes/
│   ├── auth.routes.ts
│   ├── songs.routes.ts
│   ├── albums.routes.ts
│   └── favorites.routes.ts
├── db.ts                    # MongoDB connection
└── index.ts                 # Express app setup

src/lib/
├── auth/
│   └── AuthProvider.tsx     # React auth context with interceptors
├── stores/
│   └── playbackStore.ts     # Zustand playback state (persisted)
└── api/
    ├── hooks.ts             # TanStack Query hooks
    ├── client.ts
    └── queryClient.ts
```

## 🚀 Usage Examples

### Login
```typescript
const { login } = useAuth();

await login('user@example.com', 'password');
// Access token is now in memory
// Refresh token is set as httpOnly cookie
```

### Making Authenticated Requests
```typescript
const { api } = useAuth();

// Token is automatically added to headers
const { data } = await api.get('/songs');

// 401 responses are automatically handled
// Token refresh happens transparently
```

### Playback State
```typescript
const { 
  currentTrack, 
  currentTime, 
  isPlaying,
  setCurrentTrack,
  togglePlay 
} = usePlaybackStore();

// State is automatically persisted to localStorage
// Restored on page reload
```

### Logout
```typescript
const { logout, logoutAll } = useAuth();

// Logout from current device
await logout();

// Logout from ALL devices (revokes all refresh tokens)
await logoutAll();
```

## 🔧 Environment Variables

Create `.env` file in root:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://...

# Auth (generate strong secrets!)
JWT_SECRET=your-super-secret-key-min-32-chars-long
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Client
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api
```

## 🎵 Playback Persistence Flow

```
User is playing song X at 2:45
         │
         ▼
┌──────────────────────┐
│ 1. User refreshes    │
│    page or closes tab│
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ 2. App unmounts      │
│    Playback state    │
│    saved to          │
│    localStorage      │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ 3. User reopens app  │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ 4. AuthProvider      │
│    calls /refresh    │
│    (silently logs in)│
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ 5. Playback state    │
│    restored from     │
│    localStorage      │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ 6. Music resumes     │
│    from ~2:45        │
└──────────────────────┘
```

## ⚠️ Trade-offs

1. **Silent refresh on load**: Requires network call before app is ready
   - Mitigation: Show loading state during auth initialization

2. **Memory-only access token**: User must re-login after closing tab if refresh token expires
   - Mitigation: 7-day refresh token is reasonable for music apps

3. **Token rotation**: Increases DB writes
   - Mitigation: Minimal impact, improves security significantly

4. **Complexity**: More complex than simple JWT in localStorage
   - Mitigation: Well worth the security benefits

## 🧪 Testing the Security

1. **XSS Protection**: Try `localStorage.getItem('accessToken')` → null
2. **httpOnly Cookie**: Try `document.cookie` → refresh token not visible
3. **Token Rotation**: Check DB after refresh → old token marked revoked
4. **Logout**: After logout, refresh token revoked → cannot refresh
5. **Logout All**: All refresh tokens revoked for user

## 🔒 Production Checklist

- [ ] Change JWT_SECRET and JWT_REFRESH_SECRET to strong random strings
- [ ] Enable HTTPS (required for Secure cookies)
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Add rate limiting on auth endpoints
- [ ] Add request logging for security audit
- [ ] Consider adding CAPTCHA on login/register
- [ ] Implement password strength requirements
- [ ] Add email verification for registration
