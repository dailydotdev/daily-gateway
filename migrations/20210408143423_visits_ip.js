exports.up = (knex) => knex.schema.table('visits', (table) => {
  table.string('ip').nullable();
  table.index('ip');
});

exports.down = (knex) => knex.schema.table('visits', (table) => {
  table.dropIndex('ip');
  table.dropColumn('ip');
});
