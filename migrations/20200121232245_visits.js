exports.up = knex =>
  knex.schema.createTable('visits', (table) => {
    table.string('user_id');
    table.string('app');
    table.timestamp('visited_at').defaultTo(knex.fn.now());

    table.primary(['user_id', 'app']);
  });

exports.down = knex => knex.schema.dropTableIfExists('visits');
