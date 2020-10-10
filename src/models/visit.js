import db, { toCamelCase, toSnakeCase } from '../db';

const table = 'visits';

const get = (userId, app) => db.select('visited_at', 'first_visit', 'referral').from(table)
  .where('user_id', '=', userId)
  .andWhere('app', '=', app)
  .then((res) => res.map(toCamelCase))
  .then((rows) => (rows.length ? rows[0] : null));

const upsert = (userId, app, visitedAt, firstVisit, referral) => {
  const obj = {
    userId,
    app,
    visitedAt,
    firstVisit,
    referral,
  };

  const insert = db(table).insert(toSnakeCase(obj)).toString();
  return db.raw(`${insert} on duplicate key update visited_at = VALUES(visited_at)`)
    .then(() => obj);
};

export default {
  get,
  upsert,
};
