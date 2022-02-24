import { deleteAll, insert, insertAll, insertAll2, insertAllWithPool, insertAllWithPool2, selectAll } from '../src/tx';
import { Pool } from 'pg';
import { database } from '../src/database';

describe('tx', () => {
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    const pool:Pool = database();

    beforeAll(async () => {
        const client = await pool.connect();

        await client.query('drop table node_test');

        const ddl = 'create table IF NOT EXISTS public.node_test(\n' +
            '    id bigserial constraint pk_node_test_id primary key,\n' +
            '    created_at timestamp with time zone not null default current_timestamp,\n' +
            '    name varchar(255) not null,\n' +
            '    sleep varchar(255) not null\n' +
            ');';

        await client.query(ddl);
    });

    afterAll(async () => {
        await pool.end();
    })

    beforeEach(async () => {
        await deleteAll();
    });

    afterEach(async () => {
        await deleteAll();
    });

    it('insert - select', async () => {
        await insert(0.1, 10);
        const result = await selectAll();

        expect(result.length).toBe(1);
    });

    it('insertAll', async () => {
        await insertAll(3, 2);

        await sleep(5000);
        const result = await selectAll();

        console.log(result.map(r => r.name));
        expect(result.length).toBe(0);

    }, 60000);

    it('insertAll2', async () => {
        await insertAll2(3, 2);

        await sleep(5000);
        const result = await selectAll();

        console.log(result.map(r => r.name));
        expect(result.length).toBe(0);

    }, 60000);

    it('insertAllWithPool', async () => {
        await insertAllWithPool(5, 3);

        const result = await selectAll();

        console.log(result.map(r => r.name));
        expect(result.length).toBe(0);

    }, 60000);

    it('insertAllWithPool2', async () => {
        await insertAllWithPool2(5, 3);

        const result = await selectAll();

        console.log(result.map(r => r.name));
        expect(result.length).toBe(0);

    }, 60000);

});
