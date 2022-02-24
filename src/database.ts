import pg from 'pg';

export function database() {
    return new pg.Pool({
        host: 'localhost',
        user: 'test',
        password: 'test',
        database: 'test',
        port: 5432,
        statement_timeout: 10000,
        connectionTimeoutMillis: 30000,
        max: 30,
    });
}
