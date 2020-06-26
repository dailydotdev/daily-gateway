exports.up = knex =>
  knex.schema.table('users', (table) => {
    table.string('referral').nullable();
    table.index('referral');
  });

exports.down = knex =>
  knex.schema.table('users', (table) => {
    table.dropIndex('referral');
    table.dropColumn('referral');
  });
