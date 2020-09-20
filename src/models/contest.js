import db, { toCamelCase, toSnakeCase } from '../db';

const table = 'referral_contests';

const select = () => db.select('start_at', 'end_at').from(table);

const getOngoingContest = (now = new Date()) => select()
  .where('start_at', '<=', now)
  .orderBy('start_at', 'desc')
  .limit(1)
  .map(toCamelCase)
  .then((res) => (res.length ? res[0] : null));

const getUpcomingContest = (now = new Date()) => select()
  .where('start_at', '>', now)
  .andWhere('end_at', '>', now)
  .orderBy('start_at', 'asc')
  .limit(1)
  .map(toCamelCase)
  .then((res) => (res.length ? res[0] : null));

const referralCounts = (startAt, endAt) => db
  .select('referral as user_id', db.raw('count(*) as points'), db.raw('max(created_at) as last_referral'))
  .from('users')
  .groupBy('referral')
  .whereBetween('created_at', [startAt, endAt])
  .andWhereRaw('referral is not null')
  .as('rc');

const getContestLeaderboard = (startAt, endAt) => db
  .select('u.image', 'u.name', 'rc.points')
  .from(referralCounts(startAt, endAt))
  .join('users as u', 'u.id', '=', 'rc.user_id')
  .orderBy([{ column: 'rc.points', order: 'desc' }, 'rc.last_referral'])
  .limit(5)
  .map(toCamelCase);

const getUserRank = (startAt, endAt, userId) => db
  .select(
    'points',
    db.select(db.raw('1+count(*) as rank'))
      .from(referralCounts(startAt, endAt).as('inner'))
      .where('points', '>', db.raw('rc.points'))
      .orWhere(db.raw('points = rc.points and rc.last_referral > last_referral'))
      .as('rank'),
  )
  .from(referralCounts(startAt, endAt))
  .where('user_id', '=', userId)
  .andWhere('points', '>', 0)
  .map(toCamelCase)
  .then((res) => (res.length ? res[0] : null));

const add = (startAt, endAt) => {
  const obj = {
    startAt,
    endAt,
  };
  return db.insert(toSnakeCase(obj)).into(table).then(() => obj);
};

export default {
  getOngoingContest,
  getUpcomingContest,
  getContestLeaderboard,
  getUserRank,
  add,
};
