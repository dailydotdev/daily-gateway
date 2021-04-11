import { expect } from 'chai';
import knexCleaner from 'knex-cleaner';
import db, { migrate, toCamelCase } from '../../../src/db';
import contest from '../../../src/models/contest';
import fixture from '../../fixtures/contests';

const usersFixture = [
  {
    id: '1',
    name: 'Ido',
    email: 'ido@acme.com',
    image: 'https://acme.com/ido.png',
    created_at: new Date('2020-07-01T00:00:00.000Z'),
  },
];

describe('contest model', () => {
  beforeEach(async () => {
    await knexCleaner.clean(db, { ignoreTables: ['knex_migrations', 'knex_migrations_lock'] });
    return migrate();
  });

  it('should add new contest to db', async () => {
    const model = await contest.add(
      fixture[0].startAt,
      fixture[0].endAt,
    );

    expect(model).to.deep.equal(fixture[0]);
  });

  it('should fetch ongoing contest', async () => {
    await Promise.all(fixture.map((f) => contest.add(
      f.startAt,
      f.endAt,
    )));
    const model = await contest.getOngoingContest(fixture[0].startAt);
    delete model.id;
    expect(model).to.deep.equal(fixture[0]);
  });

  it('should fetch upcoming contest', async () => {
    await Promise.all(fixture.map((f) => contest.add(
      f.startAt,
      f.endAt,
    )));
    const model = await contest.getUpcomingContest(fixture[0].startAt);
    delete model.id;
    expect(model).to.deep.equal(fixture[1]);
  });

  it('should add new a participant to the contest', async () => {
    await Promise.all(fixture.map((f) => contest.add(
      f.startAt,
      f.endAt,
    )));
    await db.insert(usersFixture).into('users');
    const contestObj = await contest.getOngoingContest(fixture[0].startAt);
    await contest.incrementParticipantCount(contestObj.id, '1');
    const participants = await db.select('*').from('referral_participants').then((res) => res.map(toCamelCase));
    expect(participants).to.deep.equal([{
      contestId: contestObj.id, userId: '1', referrals: 1, eligible: 0,
    }]);
  });

  it('should increment referrals count of an existing participant', async () => {
    await Promise.all(fixture.map((f) => contest.add(
      f.startAt,
      f.endAt,
    )));
    await db.insert(usersFixture).into('users');
    const contestObj = await contest.getOngoingContest(fixture[0].startAt);
    await contest.incrementParticipantCount(contestObj.id, '1');
    await contest.incrementParticipantCount(contestObj.id, '1');
    const participants = await db.select('*').from('referral_participants').then((res) => res.map(toCamelCase));
    expect(participants).to.deep.equal([{
      contestId: contestObj.id, userId: '1', referrals: 2, eligible: 0,
    }]);
  });

  it('should set participant as eligible for the contest', async () => {
    await Promise.all(fixture.map((f) => contest.add(
      f.startAt,
      f.endAt,
    )));
    await db.insert(usersFixture).into('users');
    const contestObj = await contest.getOngoingContest(fixture[0].startAt);
    await contest.incrementParticipantCount(contestObj.id, '1');
    await contest.setParticipantAsEligible(contestObj.id, '1');
    const participants = await db.select('*').from('referral_participants').then((res) => res.map(toCamelCase));
    expect(participants).to.deep.equal([{
      contestId: contestObj.id, userId: '1', referrals: 1, eligible: 1,
    }]);
  });

  it('should get an exisiting participant', async () => {
    await Promise.all(fixture.map((f) => contest.add(
      f.startAt,
      f.endAt,
    )));
    await db.insert(usersFixture).into('users');
    const contestObj = await contest.getOngoingContest(fixture[0].startAt);
    await contest.incrementParticipantCount(contestObj.id, '1');
    const participant = await contest.getParticipant(contestObj.id, '1');
    expect(participant).to.deep.equal({
      contestId: contestObj.id, userId: '1', referrals: 1, eligible: 0,
    });
  });
});
