exports.up = (knex) => knex.schema.table('users', (table) => {
  table.boolean('accepted_marketing').default(1).alter();
});

exports.down = (knex) => knex.schema.table('users', (table) => {
  table.boolean('accepted_marketing').default(0).alter();
});
