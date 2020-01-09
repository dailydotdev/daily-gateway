exports.up = knex =>
  knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('name');
    table.string('email').unique();
    table.string('image');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('email');
  });

exports.down = knex => knex.schema.dropTableIfExists('users');
