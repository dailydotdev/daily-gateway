import _ from 'lodash';
import db, { toCamelCase, toSnakeCase } from '../db';
import { getReferralLink } from '../referrals';

const table = 'users';

const select = () => db.select('id', 'name', 'email', 'image', 'company', 'title', 'info_confirmed', 'premium', 'accepted_marketing', 'username', 'bio', 'twitter', 'github', 'portfolio', 'reputation', 'created_at').from(table);

const mapUser = (user) => {
  const obj = _.omitBy(toCamelCase(user), _.isNull);
  return {
    ...obj,
    infoConfirmed: obj.infoConfirmed === 1,
    premium: obj.premium === 1,
    acceptedMarketing: obj.acceptedMarketing === 1,
    referralLink: getReferralLink(null, obj),
  };
};

const getById = (id) => select()
  .where('id', '=', id)
  .limit(1)
  .then((res) => res.map(mapUser))
  .then((res) => (res.length ? res[0] : null));

const getByIdOrUsername = (id) => select()
  .where('id', '=', id)
  .orWhere('username', '=', id)
  .limit(1)
  .then((res) => res.map(mapUser))
  .then((res) => (res.length ? res[0] : null));

const checkDuplicateEmail = (id, email) => db
  .select('id')
  .from(table)
  .where('email', '=', email)
  .then((res) => {
    // Workaround for existing accounts with duplicate emails
    if (!res.length) {
      return false;
    }
    return res.findIndex((u) => u.id === id) < 0;
  });

const add = (id, name, email, image, referral = null) => {
  const obj = {
    id,
    name,
    email,
    image,
    referral,
  };
  return db.insert(toSnakeCase({
    createdAt: new Date(),
    updatedAt: new Date(),
    ...obj,
  })).into(table).then(() => obj);
};

const update = (id, user) => db(table)
  .where('id', '=', id)
  .update(toSnakeCase({ ..._.pick(user, ['name', 'email', 'image', 'company', 'title', 'infoConfirmed', 'premium', 'acceptedMarketing', 'username', 'bio', 'twitter', 'github', 'portfolio']), updatedAt: new Date() }));

const updateReputation = (id, reputation) => db(table)
  .where('id', '=', id)
  .update({ reputation });

export default {
  getById,
  getByIdOrUsername,
  checkDuplicateEmail,
  add,
  update,
  updateReputation,
};
