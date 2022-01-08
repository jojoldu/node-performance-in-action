const express = require('express');
const pg = require('pg');

const app = express()
const port = 3000

const client = new pg.Client({
  host: 'localhost',
  user: 'test',
  password: 'test',
  database: 'test',
  port: 5432,
  statement_timeout: 1000,
})

client.connect(err => {
  if (err) {
    console.log('Failed to connect db ' + err)
  } else {
    console.log('Connect to db done!')
  }
})

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/test-timeout', async (req, res) => {
  const name = 'test-timeout';
  try {
    console.time(name);
    await client.query('SELECT pg_sleep(2);');
    console.timeEnd(name);
  } catch (e) {
    console.timeEnd(name);
    console.error('pg error', e);
  }

  res.send('test-timeout!')
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
