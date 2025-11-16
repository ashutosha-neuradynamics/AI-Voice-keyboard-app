import { query, getClient } from './db';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'database', 'migrations');

export async function ensureMigrationsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_migrations_name ON migrations(name);`);
  } catch (error) {
    console.error('Error creating migrations table:', error);
    throw error;
  }
}

export async function getExecutedMigrations(): Promise<string[]> {
  try {
    await ensureMigrationsTable();
    const result = await query('SELECT name FROM migrations ORDER BY executed_at ASC');
    return result.rows.map((row) => row.name);
  } catch (error) {
    console.error('Error fetching executed migrations:', error);
    throw error;
  }
}

export async function markMigrationAsExecuted(migrationName: string) {
  try {
    await query('INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [
      migrationName,
    ]);
  } catch (error) {
    console.error('Error marking migration as executed:', error);
    throw error;
  }
}

export async function runMigration(migrationName: string, sql: string) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await markMigrationAsExecuted(migrationName);
    await client.query('COMMIT');
    console.log(`✓ Migration ${migrationName} executed successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Migration ${migrationName} failed:`, error);
    throw error;
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  try {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }

    const executedMigrations = await getExecutedMigrations();
    const pendingMigrations = files.filter((file) => !executedMigrations.includes(file));

    if (pendingMigrations.length === 0) {
      console.log('All migrations are up to date');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s)`);

    for (const file of pendingMigrations) {
      const migrationPath = join(MIGRATIONS_DIR, file);
      const sql = readFileSync(migrationPath, 'utf-8');
      await runMigration(file, sql);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

export async function getTableInfo(tableName: string) {
  try {
    const result = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    return result.rows;
  } catch (error) {
    console.error(`Error getting table info for ${tableName}:`, error);
    throw error;
  }
}

export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    throw error;
  }
}

