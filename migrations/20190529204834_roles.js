exports.up = (knex) => knex.schema.createTable('roles', (table) => {
  table.string('user_id').notNullable();
  table.string('role').notNullable();

  table.unique(['user_id', 'role']);
  table.index('user_id');
});

exports.down = (knex) => knex.schema.dropTableIfExists('roles');
