import { deleteAll, insert, insertAll, insertAll2, insertAllWithPool, insertAllWithPool2, selectAll } from '../src/tx';

describe('tx', () => {
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

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

        console.log(result.map(r => r.amount));
        expect(result.length).toBe(0);

    }, 60000);

    it('insertAll2', async () => {
        await insertAll2(3, 2);

        await sleep(5000);
        const result = await selectAll();

        console.log(result.map(r => r.amount));
        expect(result.length).toBe(0);

    }, 60000);

    it('insertAllWithPool', async () => {
        await insertAllWithPool(5, 3);

        const result = await selectAll();

        console.log(result.map(r => r.amount));
        expect(result.length).toBe(0);

    }, 60000);

    it('insertAllWithPool2', async () => {
        await insertAllWithPool2(5, 3);

        const result = await selectAll();

        console.log(result.map(r => r.amount));
        expect(result.length).toBe(0);

    }, 60000);

});
