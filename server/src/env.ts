// Loaded first (see index.ts) so every module sees the .env values
import dotenv from 'dotenv';
dotenv.config({ quiet: true } as any);
