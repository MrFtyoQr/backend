flutetimport mysql from 'mysql2/promise';
import 'dotenv/config';

async function checkUsers() {
  let pool;
  try {
    // Usar la misma configuración que el proyecto
    const dbConfig = process.env.DATABASE_URL 
      ? (() => {
          const url = new URL(process.env.DATABASE_URL);
          return {
            host: url.hostname,
            port: Number(url.port || 3306),
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.replace(/^\//, ''),
          };
        })()
      : {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT || 3306),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '654321',
          database: process.env.DB_NAME || 'private_wallet_db',
        };

    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
    });

    const [users] = await pool.execute(
      'SELECT user_id, email, subscription_type, created_at FROM users ORDER BY created_at DESC LIMIT 20'
    );

    console.log('\n📋 USUARIOS EN LA BASE DE DATOS:\n');
    if (users.length === 0) {
      console.log('❌ No hay usuarios registrados');
      console.log('💡 Necesitas registrarte desde la app móvil');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Usuario: "${user.user_id}"`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Plan: ${user.subscription_type}`);
        console.log(`   Creado: ${user.created_at}`);
        console.log('');
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error consultando usuarios:', error.message);
    if (pool) await pool.end();
    process.exit(1);
  }
}

checkUsers();

