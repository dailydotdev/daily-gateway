import { expect } from 'chai';
import knexCleaner from 'knex-cleaner';
import db, { migrate } from '../../../src/db';
import contest from '../../../src/models/contest';
import fixture from '../../fixtures/contests';

const boardFixture = [
  {
    id: '1',
    name: 'Ido',
    email: 'ido@acme.com',
    image: 'https://acme.com/ido.png',
    created_at: new Date('2020-07-01T00:00:00.000Z'),
  },
  {
    id: '2',
    name: 'Tsahi',
    email: 'tsahi@acme.com',
    image: 'https://acme.com/tsahi.png',
    created_at: new Date('2020-07-02T00:00:00.000Z'),
  },
  {
    id: '3',
    name: 'Nimrod',
    email: 'nimrod@acme.com',
    image: 'https://acme.com/nimrod.png',
    created_at: new Date('2020-07-03T00:00:00.000Z'),
  },
  {
    id: '4',
    name: 'Sophia',
    email: 'sophia@acme.com',
    image: 'https://acme.com/sophia.png',
    created_at: new Date('2020-07-11T00:00:00.000Z'),
    referral: '1',
  },
  {
    id: '5',
    name: 'Emma',
    email: 'emma@acme.com',
    image: 'https://acme.com/emma.png',
    created_at: new Date('2020-07-20T00:00:00.000Z'),
    referral: '1',
  },
  {
    id: '6',
    name: 'Isabella',
    email: 'isabella@acme.com',
    image: 'https://acme.com/isabella.png',
    created_at: new Date('2020-07-08T00:00:00.000Z'),
    referral: '1',
  },
  {
    id: '7',
    name: 'Olivia',
    email: 'olivia@acme.com',
    image: 'https://acme.com/olivia.png',
    created_at: new Date('2020-07-15T00:00:00.000Z'),
    referral: '2',
  },
  {
    id: '8',
    name: 'Ava',
    email: 'ava@acme.com',
    image: 'https://acme.com/ava.png',
    created_at: new Date('2020-07-21:00:00.000Z'),
    referral: '2',
  },
  {
    id: '9',
    name: 'Emily',
    email: 'emily@acme.com',
    image: 'https://acme.com/emily.png',
    created_at: new Date('2020-07-17T00:00:00.000Z'),
    referral: '3',
  },
];

const startAt = new Date('2020-07-11T00:00:00.000Z');
const endAt = new Date('2020-07-25T00:00:00.000Z');

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
    expect(model).to.deep.equal(fixture[0]);
  });

  it('should fetch upcoming contest', async () => {
    await Promise.all(fixture.map((f) => contest.add(
      f.startAt,
      f.endAt,
    )));
    const model = await contest.getUpcomingContest(fixture[0].startAt);
    expect(model).to.deep.equal(fixture[1]);
  });

  describe('contest leaderboard', () => {
    it('should return empty leaderboard', async () => {
      await db.insert([
        {
          id: '1',
          name: 'Ido',
          email: 'ido@acme.com',
          image: 'https://acme.com/ido.png',
          created_at: new Date('2020-07-01T00:00:00.000Z'),
        },
        {
          id: '2',
          name: 'Tsahi',
          email: 'tsahi@acme.com',
          image: 'https://acme.com/tsahi.png',
          created_at: new Date('2020-07-02T00:00:00.000Z'),
        },
        {
          id: '3',
          name: 'Nimrod',
          email: 'nimrod@acme.com',
          image: 'https://acme.com/nimrod.png',
          created_at: new Date('2020-07-03T00:00:00.000Z'),
        },
        {
          id: '4',
          name: 'Sophia',
          email: 'sophia@acme.com',
          image: 'https://acme.com/sophia.png',
          created_at: new Date('2020-07-08T00:00:00.000Z'),
        },
        {
          id: '5',
          name: 'Emma',
          email: 'emma@acme.com',
          image: 'https://acme.com/emma.png',
          created_at: new Date('2020-07-09T00:00:00.000Z'),
        },
        {
          id: '6',
          name: 'Isabella',
          email: 'isabella@acme.com',
          image: 'https://acme.com/isabella.png',
          created_at: new Date('2020-07-08T00:00:00.000Z'),
          referral: '1',
        },
        {
          id: '7',
          name: 'Olivia',
          email: 'olivia@acme.com',
          image: 'https://acme.com/olivia.png',
          created_at: new Date('2020-07-08T00:00:00.000Z'),
          referral: '2',
        },
      ]).into('users');
      const board = await contest.getContestLeaderboard(startAt, endAt);
      expect(board).to.deep.equal([]);
    });

    it('should return leaderboard', async () => {
      await db.insert(boardFixture).into('users');
      const board = await contest.getContestLeaderboard(startAt, endAt);
      expect(board).to.deep.equal([
        { name: 'Ido', image: 'https://acme.com/ido.png', points: 2 },
        { name: 'Tsahi', image: 'https://acme.com/tsahi.png', points: 2 },
        { name: 'Nimrod', image: 'https://acme.com/nimrod.png', points: 1 },
      ]);
    });
  });

  describe('user rank', () => {
    beforeEach(async () => {
      await db.insert(boardFixture).into('users');
    });

    it('should return null when no referrals', async () => {
      const rank = await contest.getUserRank(startAt, endAt, '4');
      expect(rank).to.deep.equal(null);
    });

    it('should return points and rank', async () => {
      const rank = await contest.getUserRank(startAt, endAt, '2');
      expect(rank).to.deep.equal({ points: 2, rank: 2 });
    });
  });
});
