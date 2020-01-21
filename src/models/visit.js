import db, { toSnakeCase } from '../db';

const table = 'visits';

const get = (userId, app) =>
  db.select('visited_at').from(table)
    .where('user_id', '=', userId)
    .andWhere('app', '=', app)
    .then(rows => (rows.length ? rows[0].visited_at : null));

const upsert = (userId, app, visitedAt) => {
  const obj = {
    userId,
    app,
    visitedAt,
  };

  const insert = db(table).insert(toSnakeCase(obj)).toString();
  return db.raw(`${insert} on duplicate key update visited_at = VALUES(visited_at)`)
    .then(() => obj);
};

export default {
  get,
  upsert,
};
