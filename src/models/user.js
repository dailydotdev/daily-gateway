import _ from 'lodash';
import db, { toCamelCase, toSnakeCase } from '../db';

const table = 'users';

const select = () => db.select('id', 'name', 'email', 'image').from(table);

const getById = id =>
  select()
    .where('id', '=', id)
    .limit(1)
    .map(toCamelCase)
    .then(res => (res.length ? res[0] : null));

const add = (id, name, email, image) => {
  const obj = {
    id,
    name,
    email,
    image,
  };
  return db.insert(toSnakeCase(Object.assign({
    createdAt: new Date(),
    updatedAt: new Date(),
  }, obj))).into(table).then(() => obj);
};

const update = (id, user) =>
  db(table)
    .where('id', '=', id)
    .update(toSnakeCase(Object.assign({}, _.pick(user, ['name', 'email', 'image']), { updatedAt: new Date() })));

export default {
  getById,
  add,
  update,
};
