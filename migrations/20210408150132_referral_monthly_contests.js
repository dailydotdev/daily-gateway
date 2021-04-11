exports.up = async (knex) => {
  await knex.schema.dropTableIfExists('referral_contests');
  await knex.schema.createTable('referral_contests', (table) => {
    table.increments('id').primary();
    table.timestamp('start_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('end_at').notNullable().defaultTo(knex.fn.now());

    table.index('start_at');
    table.index('end_at');
  });
  await knex.schema.createTable('referral_participants', (table) => {
    table.integer('contest_id').unsigned();
    table.string('user_id');
    table.integer('referrals').defaultTo(0).notNullable();
    table.boolean('eligible').defaultTo(false).notNullable();

    table.foreign('contest_id').references('id').inTable('referral_contests');
    table.foreign('user_id').references('id').inTable('users');
    table.primary(['contest_id', 'user_id']);
    table.index(['contest_id', 'user_id', 'referrals']);
    table.index(['contest_id', 'user_id', 'eligible']);
  });
  return knex.schema.table('visits', (table) => {
    table.index('visited_at');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('referral_participants');
  await knex.schema.dropTableIfExists('referral_contests');
  return knex.schema.table('visits', (table) => {
    table.dropIndex('visited_at');
  });
};
