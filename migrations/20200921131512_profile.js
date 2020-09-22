exports.up = (knex) => knex.schema.table('users', (table) => {
  table.string('username', 15).unique().nullable();
  table.text('bio').nullable();
  table.string('twitter', 15).unique().nullable();
  table.string('github', 39).unique().nullable();
  table.text('portfolio').nullable();

  table.index('username');
  table.index('twitter');
});

exports.down = (knex) => knex.schema.table('users', (table) => {
  table.dropColumns(['username', 'bio', 'twitter', 'github', 'portfolio']);
});
