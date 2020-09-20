exports.up = (knex) => knex.schema.table('users', (table) => {
  table.text('company');
  table.text('title');
  table.boolean('info_confirmed').default(0);
});

exports.down = (knex) => knex.schema.table('users', (table) => {
  table.dropColumns(['company', 'title', 'info_confirmed']);
});
