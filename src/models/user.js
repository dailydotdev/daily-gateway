import _ from 'lodash';
import db, { toCamelCase, toSnakeCase } from '../db';

const table = 'users';

const select = () => db.select('id', 'name', 'email', 'image', 'company', 'title', 'info_confirmed').from(table);

const mapUser = (user) => {
  const obj = _.omitBy(toCamelCase(user), _.isNull);
  return Object.assign({}, obj, { infoConfirmed: obj.infoConfirmed === 1 });
};

const getById = id =>
  select()
    .where('id', '=', id)
    .limit(1)
    .map(mapUser)
    .then(res => (res.length ? res[0] : null));

const checkDuplicateEmail = (id, email) =>
  db
    .select('id')
    .from(table)
    .where('email', '=', email)
    .then((res) => {
      // Workaround for existing accounts with duplicate emails
      if (!res.length) {
        return false;
      }
      return res.findIndex(u => u.id === id) < 0;
    });

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
    .update(toSnakeCase(Object.assign({}, _.pick(user, ['name', 'email', 'image', 'company', 'title', 'infoConfirmed']), { updatedAt: new Date() })));

export default {
  getById,
  checkDuplicateEmail,
  add,
  update,
};
