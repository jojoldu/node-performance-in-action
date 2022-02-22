const pg = require('pg');

const connection = new pg.Pool({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    port: 5432,
    statement_timeout: 5000,
    connectionTimeoutMillis: 30000,
    max: 30,
});

connection.connect(err => {
    if (err) {
        console.log('Failed to connect db ' + err)
    } else {
        console.log('Connect to db done!')
    }
});


async function selectSleep() {
    const sql = 'select pg_sleep(10)'

    try {
        const promises = Array(8).map(() => connection.query(sql));
        await Promise.all(promises);
    } catch (error) {
        console.log('tx rollback', error);
    }
}

export async function insertAll(size: number, failSec: number) {

    try {
        await connection.transaction();
        const promises = Array(size).fill(0).map((_, i) => insert(i+1, failSec));
        await Promise.all(promises)
        await connection.commit();
    } catch (error) {
        console.log('tx rollback', error);
        await connection.abort();
    }
}

export async function insert(sec: number, failSec: number) {
    if(sec === failSec) {
        throw new Error('Insert Exception');
    }

    const sql = `insert into sample (created_at, updated_at, name, amount, order_date, order_date_time) values (now(), now(), pg_sleep(${sec}), 1000, now(), now())`;
    return connection.query(sql);
}

export async function selectAll(): Promise<object[]> {
    const query = await connection.query('select * from sample');
    return query.rows;
}

export async function deleteAll() {
    await connection.query('delete from sample');
}
