import { Pool, PoolClient } from 'pg';

const pg = require('pg');

const pool:Pool = new pg.Pool({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    port: 5432,
    statement_timeout: 10000,
    connectionTimeoutMillis: 30000,
    max: 30,
});

async function commit(client: PoolClient) {
    await client.query('COMMIT');
}
async function rollback(client: PoolClient) {
    await client.query('ROLLBACK');
}

export async function insertAll(size: number, failSec: number) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const promises = Array(size).fill(0)
            .map((_, i) => insert(i+1, failSec));
        await Promise.all(promises)

       await commit(client);
    } catch (error) {
        console.log('tx rollback', error);
        await rollback(client);
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

        await commit(client);
    } catch (error) {
        console.log('tx rollback', error);
        await rollback(client);
    } finally {
        await client.release();
    }
}


export async function insert(sec: number, failSec: number) {
    if(sec === failSec) {
        throw new Error('Insert Exception');
    }

    const sql = `insert into sample (created_at, updated_at, name, amount, order_date, order_date_time) values (now(), now(), pg_sleep(${sec}), ${sec}, now(), now())`;
    const client = await pool.connect();
    return client.query(sql);
}

export async function insertAllWithPool(size: number, failSec: number) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const promises = Array(size).fill(0)
            .map((_, i) => insertWithPool(client, i+1, failSec));
        await Promise.all(promises)

        await commit(client);
    } catch (error) {
        console.log('tx rollback', error);
        await rollback(client);
    } finally {
        await client.release();
    }
}

export async function insertAllWithPool2(size: number, failSec: number) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const promises = Array(size).fill(0)
            .map((_, i) => insertWithPool(client, i+1, failSec));

        const result = await Promise.allSettled(promises);

        if(result.length > 0) {
            throw new Error('Promise.allSettled exist Error');
        }

        await commit(client);
    } catch (error) {
        console.log('tx rollback', error);
        await rollback(client);
    } finally {
        await client.release();
    }
}

export async function insertWithPool(client:PoolClient, sec: number, failSec: number) {
    if(sec === failSec) {
        throw new Error('Insert Exception');
    }

    const start = new Date().getMilliseconds();
    const sql = `insert into sample (created_at, updated_at, name, amount, order_date, order_date_time) values (now(), now(), pg_sleep(${sec}), ${sec}, now(), now())`;
    const result = await client.query(sql);
    console.log(`sec=${sec}: \t${new Date().getMilliseconds() - start} ms`);
    return result;
}

export async function selectAll(): Promise<ISample[]> {
    const client = await pool.connect();
    const query = await client.query('select * from sample');
    return query.rows;
}

export async function deleteAll() {
    const client = await pool.connect();
    await client.query('delete from sample');
}
