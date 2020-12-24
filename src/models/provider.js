import db, { toCamelCase, toSnakeCase } from '../db';

const table = 'providers';

const select = () => db.select('user_id', 'provider', 'provider_id').from(table);

const getByProviderId = (providerId, provider) => select()
  .where('provider_id', '=', providerId).andWhere('provider', '=', provider)
  .limit(1)
  .then((res) => res.map(toCamelCase))
  .then((res) => (res.length ? res[0] : null));

const getByUserId = (userId) => select()
  .where('user_id', '=', userId)
  .orderBy('created_at', 'asc')
  .limit(1)
  .then((res) => res.map(toCamelCase))
  .then((res) => (res.length ? res[0] : null));

const add = (userId, provider, providerId) => {
  const obj = {
    userId,
    provider,
    providerId,
  };
  return db.insert(toSnakeCase({
    createdAt: new Date(),
    ...obj,
  })).into(table).then(() => obj);
};

export default {
  getByProviderId,
  getByUserId,
  add,
};
