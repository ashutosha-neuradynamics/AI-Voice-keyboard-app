import { query, getClient, transaction, testConnection, closePool } from '@/lib/db';

describe('Database Connection', () => {
  it('should connect to database', async () => {
    const connected = await testConnection();
    expect(connected).toBe(true);
  });

  it('should execute queries', async () => {
    const result = await query('SELECT $1::text as message', ['Hello, World!']);
    expect(result.rows[0].message).toBe('Hello, World!');
  });

  it('should handle parameterized queries', async () => {
    const result = await query('SELECT $1::int + $2::int as sum', [5, 3]);
    expect(result.rows[0].sum).toBe(8);
  });

  it('should get a client from the pool', async () => {
    const client = await getClient();
    expect(client).toBeDefined();
    expect(client.query).toBeDefined();
    client.release();
  });

  it('should support transactions', async () => {
    await transaction(async (client) => {
      const result1 = await client.query('SELECT $1::text as message', ['Transaction test']);
      expect(result1.rows[0].message).toBe('Transaction test');

      const result2 = await client.query('SELECT $1::int * $2::int as product', [4, 7]);
      expect(result2.rows[0].product).toBe(28);
    });
  });

  it('should rollback transaction on error', async () => {
    await expect(
      transaction(async (client) => {
        await client.query('SELECT $1::text as message', ['Before error']);
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');
  });

  afterAll(async () => {
    await closePool();
  });
});

