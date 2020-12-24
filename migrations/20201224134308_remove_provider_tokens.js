exports.up = (knex) => knex.schema.table('providers', (table) => {
  table.dropColumns(['access_token', 'updated_at', 'expires_in', 'refresh_token']);
});

exports.down = (knex) => knex.schema.table('providers', (table) => {
  table.string('access_token').nullable();
  table.timestamp('updated_at').defaultTo(knex.fn.now());
  table.timestamp('expires_in').nullable();
  table.string('refresh_token').nullable();
});
