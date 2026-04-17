import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'apsadmin',
    password: process.env.DB_PASSWORD || 'adminpassword',
    database: process.env.DB_NAME || 'apartment_booking',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
    // console.log('Database connected');
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(-1);
});

export async function query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
        const result = await pool.query<T>(text, params);
        const duration = Date.now() - start;

        if (process.env.LOG_QUERIES === 'true') {
            console.log('Query executed:', { text, duration, rows: result.rowCount });
        }

        return result;
    } catch (error) {
        console.error('Database query error:', { text, error });
        throw error;
    }
}

export async function getClient(): Promise<PoolClient> {
    return await pool.connect();
}

export async function transaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function closePool(): Promise<void> {
    await pool.end();
    console.log('Database pool closed');
}

export default pool;