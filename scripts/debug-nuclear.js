const SQLite = require('expo-sqlite');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 12;

const EXPECTED_PASSWORDS = {
  'admin@tortilleria.com': 'admin123',
  'empleado@tortilleria.com': 'empleado123',
  'repartidor@tortilleria.com': 'repartidor123',
  'test@tortilleria.com': 'test123',
};

const isBcryptHash = (value) => typeof value === 'string' && value.startsWith('$2');

async function nuclearDebug() {
  console.log('== STARTING NUCLEAR AUDIT ==\n');

  console.log('1) Checking database...');
  try {
    const db = await SQLite.openDatabaseAsync('tortilleria.db');
    console.log('   Database reachable');

    const tables = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('   Tables:', tables.map(t => t.name).join(', '));

    const users = await db.getAllAsync('SELECT * FROM users');
    console.log(`   Users count: ${users.length}`);

    for (const user of users) {
      console.log(`\n   User: ${user.email}`);
      console.log(`      Password length: ${user.password?.length ?? 0}`);
      const hashed = isBcryptHash(user.password);
      console.log(`      Uses bcrypt: ${hashed ? 'yes' : 'no'}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Active: ${user.isActive ? 'yes' : 'no'}`);

      if (hashed && EXPECTED_PASSWORDS[user.email]) {
        const matches = await bcrypt.compare(EXPECTED_PASSWORDS[user.email], user.password);
        console.log(`      Hash matches expected password: ${matches ? 'yes' : 'no'}`);
      }
    }
  } catch (error) {
    console.log('   Error accessing DB:', error.message);
  }

  console.log('\n2) Expected password reference:');
  for (const [email, password] of Object.entries(EXPECTED_PASSWORDS)) {
    const sampleHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    console.log(`   ${email}:`);
    console.log(`      Plain: ${password}`);
    console.log(`      Sample bcrypt hash: ${sampleHash}`);
  }

  console.log('\n3) Executing nuclear reset...');
  try {
    const db = await SQLite.openDatabaseAsync('tortilleria.db');
    await db.runAsync('DELETE FROM users');
    console.log('   Users removed');

    const seedUsers = [
      { name: 'Administrador', email: 'admin@tortilleria.com', password: 'admin123', role: 'admin' },
      { name: 'Empleado', email: 'empleado@tortilleria.com', password: 'empleado123', role: 'empleado' },
      { name: 'Repartidor', email: 'repartidor@tortilleria.com', password: 'repartidor123', role: 'repartidor' },
      { name: 'Test', email: 'test@tortilleria.com', password: 'test123', role: 'empleado' },
    ];

    for (const user of seedUsers) {
      const hashedPassword = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
      await db.runAsync(
        `INSERT INTO users (name, email, password, role, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.name, user.email, hashedPassword, user.role, 1, new Date().toISOString(), new Date().toISOString()]
      );
      console.log(`   ${user.email} recreated`);
    }

    console.log('\nReset complete. Credentials ready to use:');
    console.log('   admin@tortilleria.com / admin123');
    console.log('   empleado@tortilleria.com / empleado123');
    console.log('   repartidor@tortilleria.com / repartidor123');
  } catch (error) {
    console.log('   Error running reset:', error.message);
  }
}

nuclearDebug().catch(console.error);
