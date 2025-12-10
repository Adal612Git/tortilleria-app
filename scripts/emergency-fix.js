const SQLite = require('expo-sqlite');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 12;

async function emergencyFix() {
  console.log('== EMERGENCY MODE ==');
  const db = await SQLite.openDatabaseAsync('tortilleria.db');

  console.log('1) Clearing users...');
  await db.runAsync('DELETE FROM users');
  console.log('   Users removed');

  console.log('\n2) Creating emergency users...');
  const emergencyUsers = [
    {
      email: 'emergency@tortilleria.com',
      password: 'emergency123',
      name: 'Usuario Emergencia',
      role: 'admin',
    },
    {
      email: 'admin@tortilleria.com',
      password: 'admin123',
      name: 'Admin',
      role: 'admin',
    },
  ];

  for (const user of emergencyUsers) {
    const hashedPassword = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    await db.runAsync(
      `INSERT INTO users (name, email, password, role, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.name, user.email, hashedPassword, user.role, 1, new Date().toISOString(), new Date().toISOString()]
    );
    console.log(`   ${user.email} / ${user.password}`);
  }

  console.log('\nEmergency users ready. Use the credentials above and change them ASAP.');
}

emergencyFix().catch(console.error);
