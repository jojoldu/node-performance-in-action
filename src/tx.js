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

const sql = 'insert into sample (created_at, updated_at, name, amount, order_date, order_date_time) values (now(), now(), pg_sleep(3), 1000, now(), now());'

async function test1() {
    try {
        await connection.transaction();
        const promises = [];
        for (const elem of data) {
            promises.push(connection.query('updateElem', elem));
        }
        await Promise.all(promises)
        await connection.commit();
    } catch (error) {
        console.log('tx rollback', error);
        await connection.abort();
    }
}
