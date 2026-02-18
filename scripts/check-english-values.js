'use strict';
const { getDb } = require('../server/db');
const db = getDb();

const fields = ['care_level','care_level_tr','temperament','temperament_tr','reef_compatible','reef_compatible_tr','diet','diet_tr'];
fields.forEach(f => {
  const rows = db.prepare('SELECT DISTINCT ' + f + ' as v, COUNT(*) as c FROM species WHERE ' + f + ' IS NOT NULL AND ' + f + " != '' GROUP BY " + f + ' ORDER BY c DESC').all();
  console.log('\n=== ' + f + ' ===');
  rows.forEach(r => console.log('  ' + r.c + 'x [' + r.v + ']'));
});
