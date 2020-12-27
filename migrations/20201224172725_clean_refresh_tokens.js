exports.up = (knex) => knex('refresh_tokens').del();

exports.down = () => {

};
