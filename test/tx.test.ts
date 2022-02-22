import { deleteAll, insert, selectAll } from '../src/tx';

describe('tx', () => {
    afterEach(async () => {
        await deleteAll();
    });

    it('insert - select', async () => {
        await insert(0.1, 10);
        const result = await selectAll();

        expect(result.length).toBe(1);
    });


});
