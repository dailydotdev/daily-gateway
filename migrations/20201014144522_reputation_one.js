exports.up = async (knex) => {
  await knex('users').increment('reputation', 1);
  return knex.schema.table('users', (table) => {
    table.integer('reputation').default(1).alter();
  });
};

exports.down = async (knex) => {
  await knex.schema.table('users', (table) => {
    table.integer('reputation').default(0).alter();
  });
  return knex('users').increment('reputation', -1);
};
