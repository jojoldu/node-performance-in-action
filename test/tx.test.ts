import {
    insertWithPerformance,
    insertAll,
    insertAllWithAllSettled,
    insertAllWithPool,
    insertAllWithPoolAndAllSettled,
    selectAll, insertAllWithForEach
} from '../src/tx';
import { Pool } from 'pg';
import { database } from '../src/database';
import { sleep, sleepThrow } from '../src/sleep';

describe('tx', () => {
    let pool: Pool;

    async function deleteAll() {
        const client = await pool.connect();
        await client.query('delete from node_test');
    }

    beforeAll(async () => {
        pool = database();
        const client = await pool.connect();

        await client.query('drop table IF EXISTS node_test');

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

    it('promise.all - sleep', async () => {
        try {
            await Promise.all([
                sleep(1),
                sleep(2),
                sleepThrow(3),
                sleep(4),
            ]);
        } catch (e) {
            console.log(e);
            console.log('(mock) tx rollback!');
        }
    });

    it('promise.allSettled - sleep', async () => {
        const result = await Promise.allSettled([
            sleep(1),
            sleep(2),
            sleepThrow(3),
            sleep(4),
        ]);

        console.log(result.map(r => r.status));
        console.log('test finish!');
    });

    it('insert - select', async () => {
        await insertWithPerformance(1, 10, 'test-insert');
        const result = await selectAll();

        expect(result.length).toBe(1);
    });


    it('[promise.all & pool 재사용 O] connection 사용을 위해 대기하고, 데이터 롤백 된다', async () => {
        await insertAllWithPool(5, 3);

        const result = await selectAll();

        console.log(result.map(r => r.name));
        expect(result.length).toBe(0);

    }, 60000);

    it('[promise.allSettled & pool 재사용 O] connection 사용을 위해 대기하고, 데이터 롤백 된다', async () => {
        await insertAllWithPoolAndAllSettled(5, 3);

        const result = await selectAll();

        console.log(result.map(r => r.name));
        expect(result.length).toBe(0);

    }, 60000);

    it('[promise.all & pool 재사용 X] 1건이 실패해도 다른 promise는 실패하지 않으며, 데이터 롤백은 되지 않는다.', async () => {
        await insertAll(3, 2);

        const result = await selectAll();

        expect(result.length).toBe(0);

    }, 60000);

    it('[promise.allSettled & pool 재사용 X] 다른 promise들의 결과를 다 수신해서 실패처리하지만, 데이터 롤백은 되지 않는다', async () => {
        await insertAllWithAllSettled(3, 2);

        const result = await selectAll();

        expect(result.length).toBe(0);

    }, 60000);


    it('[forEach & pool 재사용 O] connection 사용을 위해 대기하고, 데이터 롤백 된다', async () => {
        await insertAllWithForEach(5, 3);

        const result = await selectAll();

        console.log(result.map(r => r.name));
        expect(result.length).toBe(0);

    }, 60000);

});
