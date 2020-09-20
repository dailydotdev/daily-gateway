exports.up = (knex) => knex.schema.table('users', (table) => {
  table.boolean('premium').default(0);
});

exports.down = (knex) => knex.schema.table('users', (table) => {
  table.dropColumn('premium');
});
