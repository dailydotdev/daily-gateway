exports.up = (knex) => knex.schema.table('users', (table) => {
  table.boolean('accepted_marketing').default(0);
});

exports.down = (knex) => knex.schema.table('users', (table) => {
  table.dropColumns(['accepted_marketing']);
});
