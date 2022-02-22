import { Pool } from 'pg';

const pg = require('pg');

const pool:Pool = new pg.Pool({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    port: 5432,
    statement_timeout: 5000,
    connectionTimeoutMillis: 30000,
    max: 30,
});

export async function insertAll(size: number, failSec: number) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const promises = Array(size).fill(0)
            .map((_, i) => insert(i+1, failSec));
        await Promise.all(promises)

        await client.query('COMMIT');
    } catch (error) {
        console.log('tx rollback', error);
        await client.query('ROLLBACK');
    } finally {
        await client.release();
    }
}

export async function insertAll2(size: number, failSec: number) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const promises = Array(size).fill(0)
            .map((_, i) => insert(i+1, failSec));

        const result = await Promise.allSettled(promises);

        if(result.length > 0) {
            throw new Error('Promise.allSettled exist Error');
        }

        await client.query('COMMIT');
    } catch (error) {
        console.log('tx rollback', error);
        await client.query('ROLLBACK');
    } finally {
        await client.release();
    }
}

export async function insert(sec: number, failSec: number) {
    if(sec === failSec) {
        throw new Error('Insert Exception');
    }

    const sql = `insert into sample (created_at, updated_at, name, amount, order_date, order_date_time) values (now(), now(), pg_sleep(${sec}), 1000, now(), now())`;
    const client = await pool.connect();
    return client.query(sql);
}

export async function selectAll(): Promise<object[]> {
    const client = await pool.connect();
    const query = await client.query('select * from sample');
    return query.rows;
}

export async function deleteAll() {
    const client = await pool.connect();
    await client.query('delete from sample');
}
