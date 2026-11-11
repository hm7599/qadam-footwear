// Loaded first (see index.ts) so every module sees the .env values
import dotenv from 'dotenv';
dotenv.config({ quiet: true } as any);

// Vercel's filesystem is read-only except /tmp, so JSON fallbacks go there
if (process.env.VERCEL && !process.env.QADAM_DATA_DIR && !process.env.AURA_DATA_DIR) {
  process.env.QADAM_DATA_DIR = '/tmp/qadam-data';
}
