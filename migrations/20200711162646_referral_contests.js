exports.up = (knex) => knex.schema.createTable('referral_contests', (table) => {
  table.timestamp('start_at').primary().defaultTo(knex.fn.now());
  table.timestamp('end_at').defaultTo(knex.fn.now());

  table.index('end_at');
});

exports.down = (knex) => knex.schema.dropTableIfExists('referral_contests');
