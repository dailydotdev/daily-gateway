exports.up = (knex) => knex.schema.table('users', (table) => {
  table.text('image').alter();
});

exports.down = (knex) => knex.schema.table('users', (table) => {
  table.string('image').alter();
});
