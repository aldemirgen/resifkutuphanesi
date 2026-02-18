'use strict';

const bcrypt = require('bcrypt');
const { getDb } = require('../server/db');

const [,, username, password] = process.argv;

if (!username || !password) {
  console.error('Kullanım: node scripts/create-admin.js <kullanici_adi> <sifre>');
  process.exit(1);
}

const db = getDb();
const hash = bcrypt.hashSync(password, 10);

try {
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`✓ Admin kullanıcısı oluşturuldu: ${username}`);
} catch (err) {
  if (err.message && err.message.includes('UNIQUE')) {
    // Update existing
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?').run(hash, username);
    console.log(`✓ Admin şifresi güncellendi: ${username}`);
  } else {
    console.error('Hata:', err.message);
    process.exit(1);
  }
}
