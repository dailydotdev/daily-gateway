exports.up = knex =>
  knex.schema.table('users', (table) => {
    table.dropUnique('email');
  });

exports.down = knex =>
  knex.schema.table('users', (table) => {
    table.unique('email');
  });
