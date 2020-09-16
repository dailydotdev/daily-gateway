exports.up = knex =>
  knex.schema.table('users', (table) => {
    table.integer('reputation').default(0);
  });

exports.down = knex =>
  knex.schema.table('users', (table) => {
    table.dropColumns(['reputation']);
  });
