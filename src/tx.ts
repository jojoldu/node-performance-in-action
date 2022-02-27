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
    const funcName = 'insertAll';
    try {
        await client.query('BEGIN');

        await Promise.all([
            insert(1, failNumber, funcName),
            insert(2, failNumber, funcName),
            insertThrow(3, failNumber, funcName),
            insert(4, failNumber, funcName),
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
    const funName = 'insertAllWithAllSettled'
    try {
        await client.query('BEGIN');

        const result = await Promise.allSettled([
            insert(1, failNumber, funName),
            insert(2, failNumber, funName),
            insertThrow(3, failNumber, funName),
            insert(4, failNumber, funName),
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
    const funcName = 'insertAllWithPool'
    try {
        await client.query('BEGIN');

        await Promise.all([
            insert(1, failNumber, funcName, client),
            insert(2, failNumber, funcName, client),
            insertThrow(3, failNumber, funcName, client),
            insert(4, failNumber, funcName, client)
        ]);

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
    const funcName = 'insertAllWithPoolAndAllSettled'
    try {
        await client.query('BEGIN');

        const result = await Promise.allSettled([
            insert(1, failNumber, funcName, client),
            insert(2, failNumber, funcName, client),
            insertThrow(3, failNumber, funcName, client),
            insert(4, failNumber, funcName, client)
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

export async function selectAll(): Promise<INodeTest[]> {
    const client = await pool.connect();
    const query = await client.query('select * from node_test');
    return query.rows;
}


