import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple password hashing (for production, use bcrypt)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

const app = express();
const PORT = 8632;
// Use local data directory first (for existing users), then AppData for new users
const LOCAL_DATA_DIR = path.join(__dirname, 'data');
const APPDATA_DIR = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'AppleMusic', 'data')
  : path.join(os.homedir(), 'AppData', 'Roaming', 'AppleMusic', 'data');

// Helper to get the data directory (prefer local, fallback to AppData)
function getDataDir() {
  // Check if local data directory exists and has files
  try {
    const localUsersDir = path.join(LOCAL_DATA_DIR, 'users');
    if (fsSync.existsSync(localUsersDir)) {
      const files = fsSync.readdirSync(localUsersDir);
      if (files.length > 0) {
        return LOCAL_DATA_DIR;
      }
    }
  } catch (error) {
    // If local doesn't exist or has issues, use AppData
  }
  return APPDATA_DIR;
}

const DATA_DIR = getDataDir();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
async function ensureDataDir() {
  try {
    // Ensure both directories exist
    await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
    await fs.mkdir(path.join(LOCAL_DATA_DIR, 'users'), { recursive: true });
    await fs.mkdir(path.join(LOCAL_DATA_DIR, 'playlists'), { recursive: true });
    
    await fs.mkdir(APPDATA_DIR, { recursive: true });
    await fs.mkdir(path.join(APPDATA_DIR, 'users'), { recursive: true });
    await fs.mkdir(path.join(APPDATA_DIR, 'playlists'), { recursive: true });
  } catch (error) {
    console.error('Error creating data directories:', error);
  }
}

// Helper to find user by ID in both directories
async function findUserById(userId) {
  const dirs = [LOCAL_DATA_DIR, APPDATA_DIR];
  
  for (const dir of dirs) {
    try {
      const userPath = path.join(dir, 'users', `${userId}.json`);
      if (fsSync.existsSync(userPath)) {
        const user = await readJsonFile(userPath);
        if (user) {
          return { user, dir };
        }
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

// Helper to search users in both directories
async function findUserInDirectories(username, isEmail = false) {
  const dirs = [LOCAL_DATA_DIR, APPDATA_DIR];
  
  for (const dir of dirs) {
    try {
      const usersDir = path.join(dir, 'users');
      if (!fsSync.existsSync(usersDir)) {
        continue;
      }
      
      const files = await fs.readdir(usersDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const userData = await readJsonFile(path.join(usersDir, file));
            if (userData) {
              const matchesUsername = userData.username === username;
              const matchesEmail = userData.email && userData.email.toLowerCase() === username.toLowerCase();
              
              if (matchesUsername || matchesEmail) {
                return { user: userData, dir };
              }
            }
          } catch (error) {
            continue;
          }
        }
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

// Helper functions
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    // Clean the data: remove any content after the first valid JSON
    let cleanedData = data.trim();
    
    // Try to find where the JSON ends by counting braces
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    let jsonEnd = -1;
    
    for (let i = 0; i < cleanedData.length; i++) {
      const char = cleanedData[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
        
        // If we've closed all braces and brackets, we found the end
        if (braceCount === 0 && bracketCount === 0 && i > 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
    
    // Extract only the valid JSON part
    if (jsonEnd > 0) {
      cleanedData = cleanedData.substring(0, jsonEnd);
    }
    
    return JSON.parse(cleanedData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    // If JSON parsing fails, log error and try to fix the file
    console.error(`Error parsing JSON file ${filePath}:`, error.message);
    console.error('Attempting to fix corrupted JSON file...');
    
    try {
      // Try to extract valid JSON by finding the first complete object
      const data = await fs.readFile(filePath, 'utf8');
      const firstBrace = data.indexOf('{');
      if (firstBrace >= 0) {
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let endPos = -1;
        
        for (let i = firstBrace; i < data.length; i++) {
          const char = data[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            
            if (braceCount === 0 && i > firstBrace) {
              endPos = i + 1;
              break;
            }
          }
        }
        
        if (endPos > 0) {
          const fixedData = data.substring(firstBrace, endPos);
          const parsed = JSON.parse(fixedData);
          // Rewrite the file with clean JSON
          await writeJsonFile(filePath, parsed);
          console.log(`Fixed corrupted JSON file: ${filePath}`);
          return parsed;
        }
      }
    } catch (fixError) {
      console.error('Failed to fix JSON file:', fixError.message);
    }
    
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Users API
app.get('/api/users', async (req, res) => {
  try {
    const usersDir = path.join(DATA_DIR, 'users');
    const files = await fs.readdir(usersDir);
    const users = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const userData = await readJsonFile(path.join(usersDir, file));
        if (userData) users.push(userData);
      }
    }
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await findUserById(req.params.id);
    
    if (!result || !result.user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send password hash
    const { passwordHash, ...userResponse } = result.user;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/username/:username', async (req, res) => {
  try {
    const result = await findUserInDirectories(req.params.username, false);
    
    if (!result || !result.user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send password hash
    const { passwordHash, ...userResponse } = result.user;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if username looks like an email
    const isEmail = username.includes('@');
    
    // Search in both directories
    const result = await findUserInDirectories(username, isEmail);
    
    if (result && result.user) {
      if (verifyPassword(password, result.user.passwordHash)) {
        // Don't send password hash
        const { passwordHash, ...userResponse } = result.user;
        return res.json(userResponse);
      } else {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }
    }
    
    res.status(404).json({ error: 'Email ou mot de passe incorrect' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password is required and must be at least 4 characters' });
    }
    
    // Check if username already exists in both directories
    const existingUser = await findUserInDirectories(username, false);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    // Also check by email if provided
    if (email) {
      const existingEmail = await findUserInDirectories(email, true);
      if (existingEmail) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }
    
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username,
      email: email || `${username}@local`,
      passwordHash: hashPassword(password),
      createdAt: Date.now(),
      preferences: {
        theme: 'dark',
        colorTheme: 'default',
        volume: 1,
        autoplay: true,
        shuffle: false,
        repeat: 'none',
        language: 'fr',
      },
      likedTracks: [],
      recentTracks: [],
    };
    
    // Use AppData for new users (or local if it's the active directory)
    const activeDataDir = getDataDir();
    const userPath = path.join(activeDataDir, 'users', `${newUser.id}.json`);
    await writeJsonFile(userPath, newUser);
    
    // Don't send password hash to client
    const { passwordHash, ...userResponse } = newUser;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const result = await findUserById(req.params.id);
    
    if (!result || !result.user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const existingUser = result.user;
    const userDir = result.dir;
    
    // Don't allow password hash to be updated via PUT (use separate endpoint if needed)
    const { passwordHash, ...bodyWithoutPassword } = req.body;
    const updatedUser = { ...existingUser, ...bodyWithoutPassword };
    // Preserve existing passwordHash if not provided
    if (existingUser.passwordHash && !passwordHash) {
      updatedUser.passwordHash = existingUser.passwordHash;
    }
    
    // Ensure preferences have colorTheme (migration for existing users)
    if (updatedUser.preferences && !updatedUser.preferences.colorTheme) {
      updatedUser.preferences.colorTheme = 'default';
    }
    
    const userPath = path.join(userDir, 'users', `${req.params.id}.json`);
    await writeJsonFile(userPath, updatedUser);
    
    // Don't send password hash
    const { passwordHash: _, ...userResponse } = updatedUser;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Playlists API
app.get('/api/playlists', async (req, res) => {
  try {
    const userId = req.query.userId;
    const playlistsDir = path.join(DATA_DIR, 'playlists');
    const files = await fs.readdir(playlistsDir);
    const playlists = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const playlistData = await readJsonFile(path.join(playlistsDir, file));
        if (playlistData && (!userId || playlistData.userId === userId)) {
          playlists.push(playlistData);
        }
      }
    }
    
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlists/:id', async (req, res) => {
  try {
    const playlistPath = path.join(DATA_DIR, 'playlists', `${req.params.id}.json`);
    const playlist = await readJsonFile(playlistPath);
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/playlists', async (req, res) => {
  try {
    const { userId, name, description } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ error: 'UserId and name are required' });
    }
    
    const newPlaylist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      description: description || '',
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const playlistPath = path.join(DATA_DIR, 'playlists', `${newPlaylist.id}.json`);
    await writeJsonFile(playlistPath, newPlaylist);
    
    res.json(newPlaylist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/playlists/:id', async (req, res) => {
  try {
    const playlistPath = path.join(DATA_DIR, 'playlists', `${req.params.id}.json`);
    const existingPlaylist = await readJsonFile(playlistPath);
    
    if (!existingPlaylist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    const updatedPlaylist = {
      ...existingPlaylist,
      ...req.body,
      updatedAt: Date.now(),
    };
    
    await writeJsonFile(playlistPath, updatedPlaylist);
    
    res.json(updatedPlaylist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/playlists/:id', async (req, res) => {
  try {
    const playlistPath = path.join(DATA_DIR, 'playlists', `${req.params.id}.json`);
    
    try {
      await fs.unlink(playlistPath);
      res.json({ success: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'Playlist not found' });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Liked tracks API
app.get('/api/users/:id/liked', async (req, res) => {
  try {
    const result = await findUserById(req.params.id);
    
    if (!result || !result.user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.user.likedTracks || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:id/liked', async (req, res) => {
  try {
    const { trackId } = req.body;
    const result = await findUserById(req.params.id);
    
    if (!result || !result.user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.user;
    const userDir = result.dir;
    
    if (!user.likedTracks) {
      user.likedTracks = [];
    }
    
    if (!user.likedTracks.includes(trackId)) {
      user.likedTracks.push(trackId);
      const userPath = path.join(userDir, 'users', `${req.params.id}.json`);
      await writeJsonFile(userPath, user);
    }
    
    res.json(user.likedTracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id/liked/:trackId', async (req, res) => {
  try {
    const result = await findUserById(req.params.id);
    
    if (!result || !result.user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.user;
    const userDir = result.dir;
    
    if (!user.likedTracks) {
      user.likedTracks = [];
    }
    
    user.likedTracks = user.likedTracks.filter(id => id !== req.params.trackId);
    const userPath = path.join(userDir, 'users', `${req.params.id}.json`);
    await writeJsonFile(userPath, user);
    
    res.json(user.likedTracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Current user API
// SECURITY: Current user is now stored in browser localStorage, not on server
// This endpoint is kept for backward compatibility but returns null
// Each browser/device maintains its own session independently
app.get('/api/current-user', async (req, res) => {
  // Return null - session is now managed client-side in localStorage
  // This prevents security issues where one device's login affects others
  res.json(null);
});

// SECURITY: This endpoint is deprecated - sessions are now browser-specific
// Kept for backward compatibility but does nothing
app.post('/api/current-user', async (req, res) => {
  // Do nothing - sessions are now stored in browser localStorage
  // This ensures each device/browser has its own independent session
  res.json({ success: true, message: 'Session is now managed client-side for security' });
});

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Start server
async function startServer() {
  await ensureDataDir();
  const activeDir = getDataDir();
  const localIP = getLocalIP();
  
  // Clean up old global session file for security
  for (const dir of [LOCAL_DATA_DIR, APPDATA_DIR]) {
    try {
      const currentUserPath = path.join(dir, 'current-user.json');
      if (fsSync.existsSync(currentUserPath)) {
        await fs.unlink(currentUserPath);
        console.log(`Removed old global session file for security: ${currentUserPath}`);
      }
    } catch (error) {
      // File doesn't exist or can't be deleted, that's fine
    }
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Local data server running on http://localhost:${PORT}`);
    console.log(`Network access: http://${localIP}:${PORT}`);
    console.log(`Active data directory: ${activeDir}`);
    console.log(`Local data directory: ${LOCAL_DATA_DIR}`);
    console.log(`AppData directory: ${APPDATA_DIR}`);
    console.log(`\nTo access from your phone, use: http://${localIP}:${PORT}`);
    console.log(`\n🔒 SECURITY: Sessions are now browser-specific (localStorage)`);
    console.log(`   Each device/browser maintains its own independent session.`);
  });
}

startServer();

