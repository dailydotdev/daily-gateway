exports.up = (knex) => knex.schema.table('visits', (table) => {
  table.timestamp('first_visit').defaultTo(knex.fn.now());
  table.string('referral').nullable();
  table.index('referral');
});

exports.down = (knex) => knex.schema.table('visits', (table) => {
  table.dropIndex('referral');
  table.dropColumn('referral');
  table.dropColumn('first_visit');
});
