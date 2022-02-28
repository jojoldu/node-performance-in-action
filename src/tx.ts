import { Pool, PoolClient } from 'pg';
import { database } from './database';
import { performance } from 'perf_hooks';

const pg = require('pg');

const pool: Pool = database();

async function commit(client: PoolClient) {
    await client.query('COMMIT');
}

async function rollback(client: PoolClient) {
    await client.query('ROLLBACK');
}

export async function insertAllWithPoolAndAllSettled() {
    const client = await pool.connect();
    const funcName = 'insertAllWithPoolAndAllSettled'
    try {
        await client.query('BEGIN');

        const result = await Promise.allSettled([
            insert(1, funcName, client),
            insert(2, funcName, client),
            insert(3, funcName, client),
            insertThrow(4, funcName, client),
            insert(5, funcName, client)
        ]);

        if (result.map(r => r.status === 'rejected').length > 0) {
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

export async function insertAllWithPool() {
    const client = await pool.connect();
    const funcName = 'insertAllWithPool'
    try {
        await client.query('BEGIN');

        await Promise.all([
            insert(1, funcName, client),
            insert(2, funcName, client),
            insert(3, funcName, client),
            insertThrow(4, funcName, client),
            insert(5, funcName, client)
        ]);

        await commit(client);
    } catch (error) {
        console.log('tx rollback', error);
        await rollback(client);
    } finally {
        await client.release();
    }
}

export async function insertAllWithAllSettled() {
    const client = await pool.connect();
    const funcName = 'insertAllWithAllSettled'
    try {
        await client.query('BEGIN');

        const result = await Promise.allSettled([
            insert(1, funcName),
            insert(2, funcName),
            insert(3, funcName),
            insertThrow(4, funcName),
            insert(5, funcName)
        ]);

        if (result.map(r => r.status === 'rejected').length > 0) {
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

export async function insertAll() {
    const client = await pool.connect();
    const funcName = 'insertAll';
    try {
        await client.query('BEGIN');

        await Promise.all([
            insert(1, funcName),
            insert(2, funcName),
            insert(3, funcName),
            insertThrow(4, funcName),
            insert(5, funcName)
        ]);

        await commit(client);
    } catch (error) {
        console.log('tx rollback', error);
        await rollback(client);
    } finally {
        await client.release();
    }
}

export async function insertAllWithForEach() {
    const client = await pool.connect();
    const funcName = 'insertAllWithForEach'
    try {
        await client.query('BEGIN');

        await insert(1, funcName, client);
        await insert(2, funcName, client);
        await insertThrow(3, funcName, client);
        await insert(4, funcName, client);

        await commit(client);
    } catch (error) {
        console.log('tx rollback', error);
        await rollback(client);
    } finally {
        await client.release();
    }
}

export async function insert(sec: number, funcName: string, client?: PoolClient) {
    const start = performance.now();
    const sql = `insert into node_test (name, sleep)
                 values (\'${funcName}-${sec}\', pg_sleep(${sec}))`;

    const connection = client ? client : await pool.connect();
    return connection.query(sql)
        .then((result) => {
            console.log(`insert: ${sec}s, realTime: ${performance.now()- start}`);
            return result;
        });
}

export async function insertThrow(sec: number, funcName: string, client?: PoolClient) {
    // 오류나는 쿼리
    const sql = `insert into node_test (name, sleep, throw)
                 values (\'${funcName}-${sec}\', pg_sleep(${sec}))`;

    const connection = client ? client : await pool.connect();
    return connection.query(sql);
}

export async function selectAll(): Promise<INodeTest[]> {
    const client = await pool.connect();
    const query = await client.query('select * from node_test');
    return query.rows;
}


