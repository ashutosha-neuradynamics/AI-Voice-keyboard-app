import { query, getClient } from '@/lib/db';
import { runMigrations, tableExists, getTableInfo } from '@/lib/migrations';

describe('Database Schema', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  describe('Users table', () => {
    it('should have users table', async () => {
      const exists = await tableExists('users');
      expect(exists).toBe(true);
    });

    it('should have correct users table structure', async () => {
      const columns = await getTableInfo('users');
      const columnNames = columns.map((col) => col.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('password_hash');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');

      const emailColumn = columns.find((col) => col.column_name === 'email');
      expect(emailColumn?.is_nullable).toBe('NO');
      expect(emailColumn?.data_type).toBe('character varying');

      const passwordHashColumn = columns.find((col) => col.column_name === 'password_hash');
      expect(passwordHashColumn?.is_nullable).toBe('NO');
    });

    it('should enforce unique email constraint', async () => {
      await query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)`,
        ['test@example.com', 'hash123', 'Test User']
      );

      await expect(
        query(
          `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)`,
          ['test@example.com', 'hash456', 'Another User']
        )
      ).rejects.toThrow();

      await query(`DELETE FROM users WHERE email = $1`, ['test@example.com']);
    });
  });

  describe('Transcriptions table', () => {
    it('should have transcriptions table', async () => {
      const exists = await tableExists('transcriptions');
      expect(exists).toBe(true);
    });

    it('should have correct transcriptions table structure', async () => {
      const columns = await getTableInfo('transcriptions');
      const columnNames = columns.map((col) => col.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('text');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('metadata');

      const textColumn = columns.find((col) => col.column_name === 'text');
      expect(textColumn?.is_nullable).toBe('NO');
      expect(textColumn?.data_type).toBe('text');
    });

    it('should enforce foreign key constraint to users', async () => {
      await expect(
        query(
          `INSERT INTO transcriptions (user_id, text) VALUES ($1, $2)`,
          [99999, 'Test transcription']
        )
      ).rejects.toThrow();
    });

    it('should cascade delete when user is deleted', async () => {
      const userResult = await query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id`,
        ['cascade-test@example.com', 'hash123', 'Cascade Test']
      );
      const userId = userResult.rows[0].id;

      await query(
        `INSERT INTO transcriptions (user_id, text) VALUES ($1, $2)`,
        [userId, 'Test transcription for cascade']
      );

      await query(`DELETE FROM users WHERE id = $1`, [userId]);

      const transcriptionResult = await query(
        `SELECT * FROM transcriptions WHERE user_id = $1`,
        [userId]
      );
      expect(transcriptionResult.rows.length).toBe(0);
    });
  });

  describe('Dictionary table', () => {
    it('should have dictionary table', async () => {
      const exists = await tableExists('dictionary');
      expect(exists).toBe(true);
    });

    it('should have correct dictionary table structure', async () => {
      const columns = await getTableInfo('dictionary');
      const columnNames = columns.map((col) => col.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('keyword');
      expect(columnNames).toContain('spelling');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');

      const keywordColumn = columns.find((col) => col.column_name === 'keyword');
      expect(keywordColumn?.is_nullable).toBe('NO');

      const spellingColumn = columns.find((col) => col.column_name === 'spelling');
      expect(spellingColumn?.is_nullable).toBe('NO');
    });

    it('should enforce unique constraint on user_id and keyword combination', async () => {
      const userResult = await query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id`,
        ['dict-test@example.com', 'hash123', 'Dict Test']
      );
      const userId = userResult.rows[0].id;

      await query(
        `INSERT INTO dictionary (user_id, keyword, spelling) VALUES ($1, $2, $3)`,
        [userId, 'testword', 'test word']
      );

      await expect(
        query(
          `INSERT INTO dictionary (user_id, keyword, spelling) VALUES ($1, $2, $3)`,
          [userId, 'testword', 'different spelling']
        )
      ).rejects.toThrow();

      await query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    it('should cascade delete when user is deleted', async () => {
      const userResult = await query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id`,
        ['dict-cascade@example.com', 'hash123', 'Dict Cascade']
      );
      const userId = userResult.rows[0].id;

      await query(
        `INSERT INTO dictionary (user_id, keyword, spelling) VALUES ($1, $2, $3)`,
        [userId, 'cascadeword', 'cascade word']
      );

      await query(`DELETE FROM users WHERE id = $1`, [userId]);

      const dictResult = await query(`SELECT * FROM dictionary WHERE user_id = $1`, [userId]);
      expect(dictResult.rows.length).toBe(0);
    });
  });

  describe('Indexes', () => {
    it('should have indexes on foreign keys and common query columns', async () => {
      const indexesResult = await query(`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND (
          indexname LIKE 'idx_%' 
          OR indexname LIKE '%_pkey'
        )
        ORDER BY tablename, indexname;
      `);

      const indexNames = indexesResult.rows.map((row) => row.indexname);

      expect(indexNames.some((name) => name.includes('users_email'))).toBe(true);
      expect(indexNames.some((name) => name.includes('transcriptions_user_id'))).toBe(true);
      expect(indexNames.some((name) => name.includes('transcriptions_created_at'))).toBe(true);
      expect(indexNames.some((name) => name.includes('dictionary_user_id'))).toBe(true);
    });
  });

  describe('Triggers', () => {
    it('should automatically update updated_at on users table', async () => {
      const userResult = await query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, updated_at`,
        ['trigger-test@example.com', 'hash123', 'Trigger Test']
      );
      const userId = userResult.rows[0].id;
      const originalUpdatedAt = userResult.rows[0].updated_at;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await query(`UPDATE users SET name = $1 WHERE id = $2`, ['Updated Name', userId]);

      const updatedResult = await query(`SELECT updated_at FROM users WHERE id = $1`, [userId]);
      const newUpdatedAt = updatedResult.rows[0].updated_at;

      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());

      await query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    it('should automatically update updated_at on dictionary table', async () => {
      const userResult = await query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id`,
        ['dict-trigger@example.com', 'hash123', 'Dict Trigger']
      );
      const userId = userResult.rows[0].id;

      const dictResult = await query(
        `INSERT INTO dictionary (user_id, keyword, spelling) VALUES ($1, $2, $3) RETURNING id, updated_at`,
        [userId, 'triggerword', 'trigger word']
      );
      const dictId = dictResult.rows[0].id;
      const originalUpdatedAt = dictResult.rows[0].updated_at;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await query(`UPDATE dictionary SET spelling = $1 WHERE id = $2`, ['updated spelling', dictId]);

      const updatedResult = await query(`SELECT updated_at FROM dictionary WHERE id = $1`, [dictId]);
      const newUpdatedAt = updatedResult.rows[0].updated_at;

      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());

      await query(`DELETE FROM users WHERE id = $1`, [userId]);
    });
  });

  afterAll(async () => {
    const client = await getClient();
    try {
      await client.query('TRUNCATE TABLE transcriptions, dictionary, users, migrations CASCADE');
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    } finally {
      client.release();
    }
  });
});

