import db, { toSnakeCase } from '../db';

const table = 'roles';

const getByUserId = (userId) => db.select('role').from(table)
  .where('user_id', '=', userId)
  .orderBy('role')
  .then((res) => res.map((x) => x.role));

const add = (userId, role) => {
  const obj = {
    userId,
    role,
  };

  return db.insert(toSnakeCase(obj)).into(table).then(() => obj);
};

export default {
  getByUserId,
  add,
};
