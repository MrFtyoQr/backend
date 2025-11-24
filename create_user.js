import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function createUser() {
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

    // Datos del nuevo usuario
    const user_id = 'testuser';
    const email = 'test@example.com';
    const password = '123456'; // Contraseña simple para pruebas
    const subscription_type = 'free';

    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE user_id = ? OR email = ?',
      [user_id, email]
    );

    if (existingUsers.length > 0) {
      console.log('\n❌ El usuario ya existe:');
      console.log(`   Usuario: "${existingUsers[0].user_id}"`);
      console.log(`   Email: ${existingUsers[0].email}`);
      console.log('\n💡 Usa otro user_id o email');
      await pool.end();
      return;
    }

    // Encriptar contraseña
    console.log('\n🔐 Encriptando contraseña...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    console.log('💾 Creando usuario en la base de datos...');
    await pool.execute(
      'INSERT INTO users (user_id, email, password_hash, subscription_type, ai_questions_used) VALUES (?, ?, ?, ?, ?)',
      [user_id, email, hashedPassword, subscription_type, 0]
    );

    console.log('\n✅ USUARIO CREADO EXITOSAMENTE:\n');
    console.log(`   Usuario: "${user_id}"`);
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`   Plan: ${subscription_type}`);
    console.log('\n📱 Ahora puedes iniciar sesión en la app móvil con:');
    console.log(`   Usuario: ${user_id}`);
    console.log(`   Contraseña: ${password}\n`);

    await pool.end();
  } catch (error) {
    console.error('\n❌ Error creando usuario:', error.message);
    if (pool) await pool.end();
    process.exit(1);
  }
}

createUser();

