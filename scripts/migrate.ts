import { runMigrations } from '../lib/migrations';
import 'dotenv/config';

async function main() {
  try {
    console.log('Running database migrations...');
    await runMigrations();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();

