import './env.js';
import http from 'http';
import app, { ready, allowed, PORT } from './app.js';
import { isMongoConnected } from './config/db.js';
import { IS_PROD } from './security/index.js';
import { startBackupJob } from './backup/backup.js';
import { startRecoveryJob } from './marketing/recovery.js';
import { attachLiveSocket, startLiveAnalytics } from './analytics/live.js';

// ── Start ─────────────────────────────────────────────
async function startServer() {
  await ready();
  if (IS_PROD && !isMongoConnected) {
    console.error('❌ [QADAM Server] MongoDB is not connected. In production, orders and accounts will be refused until the database is back.');
  }
  startRecoveryJob();
  startBackupJob();
  const server = http.createServer(app);
  server.headersTimeout = 20000;
  server.requestTimeout = 30000;
  attachLiveSocket(server, allowed);
  startLiveAnalytics();
  server.listen(PORT, () => {
    console.log(`✨ [QADAM Server] Live and running on http://localhost:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer();
