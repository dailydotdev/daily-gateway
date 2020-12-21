exports.up = (knex) => knex.schema.table('users', (table) => {
  table.string('hashnode', 39).unique().nullable();
});

exports.down = (knex) => knex.schema.table('users', (table) => {
  table.dropColumns(['hashnode']);
});
