exports.up = (knex) => knex.schema.table('visits', (table) => {
  table.index('first_visit');
});

exports.down = (knex) => knex.schema.table('visits', (table) => {
  table.dropIndex('first_visit');
});
