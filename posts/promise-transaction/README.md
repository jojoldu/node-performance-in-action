# Promise.all & Transactions (feat. Node.js)

> 모든 코드는 [Github](https://github.com/jojoldu/node-performance-in-action) 에 있습니다.

## 테스트 환경

* Node.js 16.3.1
* PostgreSQL 13.2

## Promise.all

```ts
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
```

```js
sleep: 1s, realTime: 1002.1712079942226

sleep: 2s, realTime: 2002.135666012764

sleep & Throw: 3s, realTime: 3001.1547079980373
Error: Sleep Error
    at /Users/jojoldu/git/node-performance-in-action/src/sleep.ts:18:15
    at async Promise.all (index 2)
    at Object.<anonymous> (/Users/jojoldu/git/node-performance-in-action/test/tx.test.ts:47:13)

    at Object.<anonymous> (test/tx.test.ts:54:21)


(mock) tx rollback!

sleep: 4s, realTime: 4001.101915985346
```


```ts
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
```

```js
sleep: 1s, realTime: 1000.9564159810543

sleep: 2s, realTime: 2001.6974580287933

sleep & Throw: 3s, realTime: 3001.664959013462

sleep: 4s, realTime: 4000.793624997139

[ 'fulfilled', 'fulfilled', 'rejected', 'fulfilled' ]

test finish!
```

## Promise.all & Transaction

```ts
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
```

### Promise.all & 개별 커넥션

```ts
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
```

```ts
it('[promise.all & pool 재사용 X] 1건이 실패해도 다른 promise는 실패하지 않으며, 데이터 롤백은 되지 않는다.', async () => {
    await insertAll(3, 2);

    const result = await selectAll();

    expect(result.length).toBe(0);

}, 60000);
```

### Promise.allSettled & 개별 커넥션

```ts
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
```

```ts
it('[promise.allSettled & pool 재사용 X] 다른 promise들의 결과를 다 수신해서 실패처리하지만, 데이터 롤백은 되지 않는다', async () => {
    await insertAllWithAllSettled(3, 2);

    const result = await selectAll();

    expect(result.length).toBe(0);

}, 60000);
```

### Promise.all & 단일 커넥션

```ts
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
```

```ts
it('[promise.all & pool 재사용 O] connection 사용을 위해 대기하고, 데이터 롤백 된다', async () => {
    await insertAllWithPool(5, 3);

    const result = await selectAll();

    console.log(result.map(r => r.name));
    expect(result.length).toBe(0);

}, 60000);
```

### Promise.allSettled & 단일 커넥션

```ts
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
```

```ts
it('[promise.allSettled & pool 재사용 O] connection 사용을 위해 대기하고, 데이터 롤백 된다', async () => {
    await insertAllWithPoolAndAllSettled(5, 3);

    const result = await selectAll();

    console.log(result.map(r => r.name));
    expect(result.length).toBe(0);

}, 60000);
```


## 마무리

* `Promise.all()` 을 사용하고 실패한다고 해서 아직 끝나지 않은 Promise가 강제 종료되진 않는다.
  * 단지 결과를 무시할 뿐이기 때문에 수행할 것들은 수행된다.
* `Promise.allSettled()` 를 사용하면 전체의 결과를 다 수집할때까지 기다린다. 
* 트랜잭션 Commit / Rollback을 위해서는 단일 커넥션 안에서 이루어져야 한다.
* 단일 커넥션을 사용한다면, 커넥션을 사용할 때까지 대기를 해야되기 때문에 Promise.all(allSettled)를 사용한다하더라도 비동기로 작업을 처리할 수가 없다.
* 트랜잭션으로 단일 커넥션만 사용하는 경우 `Promise.all()` (`Promise.allSettled()`) 보다 오히려 `for` 가 더 나을 수 있다.
  * 단일 커넥션만 사용하는 경우 어차피 **비동기 실행이 안된다**
  * 이미 앞에서 실패해서 더이상 실행하지 않아도 되는 경우에도 쿼리들이 수행된다.
    * 어차피 롤백해야되는 쿼리들이다.
  * `for` 로 실패하면 다음 쿼리들이 실행조차 안되도록 하는 것이 낫다. 
