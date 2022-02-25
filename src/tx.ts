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

export async function insertAll(size: number, failNumber: number) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await Promise.all([
            insert(1, failNumber, 'insertAll'),
            insert(2, failNumber, 'insertAll'),
            insertThrow(3, failNumber, 'insertAll'),
            insert(4, failNumber, 'insertAll'),
        ]);

        await commit(client);
    } catch (error) {
        console.log('tx rollback', error);
        await rollback(client);
    } finally {
        await client.release();
    }
}

export async function insertAllWithAllSettled(size: number, failNumber: number) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await Promise.allSettled([
            insert(1, failNumber, 'insertAll'),
            insert(2, failNumber, 'insertAll'),
            insertThrow(3, failNumber, 'insertAll'),
            insert(4, failNumber, 'insertAll'),
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

export async function insertAllWithPool(size: number, failNumber: number) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await Promise.all(Array(size).fill(0)
            .map((_, i) => insertWithPerformance(i + 1, failNumber, 'insertAllWithPoolAndAllSettled', client)))

        await commit(client);
    } catch (error) {
        console.log('tx rollback', error);
        await rollback(client);
    } finally {
        await client.release();
    }
}

export async function insertAllWithPoolAndAllSettled(size: number, failNumber: number) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await Promise.allSettled(Array(size).fill(0)
            .map((_, i) => insertWithPerformance(i + 1, failNumber, 'insertAllWithPoolAndAllSettled', client)));

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

export async function insertWithPerformance(sec: number, failNumber: number, funcName: string, client?: PoolClient) {
    const start = performance.now();
    const sql = `insert into node_test (name, sleep)
                 values (\'${funcName}-${sec}\', pg_sleep(${sec}))`;

    const connection = client ? client : await pool.connect();
    const result = await connection.query(sql);

    console.log(`sec=${sec}s: \t${performance.now() - start} ms`);

    if (sec === failNumber) {
        console.log(`Insert Exception: failNumber=${failNumber}`);
        throw new Error('Insert Exception');
    }

    return result;
}

export async function insert(sec: number, failNumber: number, funcName: string, client?: PoolClient) {
    const sql = `insert into node_test (name, sleep)
                 values (\'${funcName}-${sec}\', pg_sleep(${sec}))`;

    const connection = client ? client : await pool.connect();
    return connection.query(sql);
}

export async function insertThrow(sec: number, failNumber: number, funcName: string, client?: PoolClient) {
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


