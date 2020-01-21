import { expect } from 'chai';
import knexCleaner from 'knex-cleaner';
import db, { migrate } from '../../../src/db';
import visit from '../../../src/models/visit';

describe('visit model', () => {
  beforeEach(async () => {
    await knexCleaner.clean(db, { ignoreTables: ['knex_migrations', 'knex_migrations_lock'] });
    return migrate();
  });

  it('should add new visit to db and then update', async () => {
    const date1 = new Date('2020-01-21T21:44:16');
    await visit.upsert('1', 'app', date1);
    const expected1 = await visit.get('1', 'app');
    expect(expected1).to.deep.equal(date1);
    const date2 = new Date('2020-01-21T21:45:16');
    await visit.upsert('1', 'app', date2);
    const expected2 = await visit.get('1', 'app');
    expect(expected2).to.deep.equal(date2);
  });
});
