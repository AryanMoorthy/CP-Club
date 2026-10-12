import 'dotenv/config';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { scheduleEODSync, stopEODSync } from './src/services/eodSync.js';

// Validate required env vars
const REQUIRED_VARS = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || '5000');

async function start() {
  await connectDB(process.env.MONGODB_URI);

  // Initialize automated midnight EOD sync
  scheduleEODSync();

  const server = app.listen(PORT, () => {
    console.log(`🚀 CP Club API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    stopEODSync();
    server.close(async () => {
      const { disconnectDB } = await import('./src/config/db.js');
      await disconnectDB();
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
