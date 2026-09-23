const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@') : 'NÃO DEFINIDA');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000
});

pool.connect()
  .then(client => {
    console.log('✅ Conectado ao Supabase com sucesso!');
    return client.query('SELECT NOW() AS agora').then(res => {
      console.log('Hora no servidor:', res.rows[0].agora);
      client.release();
      pool.end();
    });
  })
  .catch(err => {
    console.error('❌ Erro de conexão:', err.message);
    console.error('Código:', err.code);
    pool.end();
  });
