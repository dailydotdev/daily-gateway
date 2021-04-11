import db, { toCamelCase, toSnakeCase } from '../db';

const table = 'referral_contests';
const participantsTable = 'referral_participants';

const select = () => db.select('id', 'start_at', 'end_at').from(table);

const getOngoingContest = (now = new Date()) => select()
  .where('start_at', '<=', now)
  .orderBy('start_at', 'desc')
  .limit(1)
  .then((res) => res.map(toCamelCase))
  .then((res) => (res.length ? res[0] : null));

const getUpcomingContest = (now = new Date()) => select()
  .where('start_at', '>', now)
  .andWhere('end_at', '>', now)
  .orderBy('start_at', 'asc')
  .limit(1)
  .then((res) => res.map(toCamelCase))
  .then((res) => (res.length ? res[0] : null));

const add = (startAt, endAt) => {
  const obj = {
    startAt,
    endAt,
  };
  return db.insert(toSnakeCase(obj)).into(table).then(() => obj);
};

const incrementParticipantCount = (contestId, userId) => {
  const obj = {
    contestId,
    userId,
    referrals: 1,
    eligible: false,
  };
  const query = db.insert(toSnakeCase(obj)).into(participantsTable).toString();
  return db.raw(`${query} on duplicate key update referrals = referrals + 1`);
};

const setParticipantAsEligible = (contestId, userId) => db(participantsTable)
  .where('contest_id', '=', contestId)
  .andWhere('user_id', '=', userId)
  .update(toSnakeCase({
    eligible: true,
  }));

const getParticipant = (contestId, userId) => db.select('*')
  .from(participantsTable)
  .where('contest_id', '=', contestId)
  .andWhere('user_id', '=', userId)
  .limit(1)
  .then((res) => res.map(toCamelCase))
  .then((res) => (res.length ? res[0] : null));

export default {
  getOngoingContest,
  getUpcomingContest,
  add,
  incrementParticipantCount,
  setParticipantAsEligible,
  getParticipant,
};
