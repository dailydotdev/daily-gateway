import { expect } from 'chai';
import knexCleaner from 'knex-cleaner';
import db, { migrate } from '../../../src/db';
import user from '../../../src/models/user';
import fixture from '../../fixtures/users';

describe('user model', () => {
  beforeEach(async () => {
    await knexCleaner.clean(db, { ignoreTables: ['knex_migrations', 'knex_migrations_lock'] });
    return migrate();
  });

  it('should add new user to db', async () => {
    const model = await user.add(
      fixture[0].id,
      fixture[0].name,
      fixture[0].email,
      fixture[0].image,
    );

    expect(model).to.deep.equal(fixture[0]);
  });

  it('should add new user to db with just an id', async () => {
    const model = await user.add(fixture[1].id);

    expect(model).to.deep.equal(fixture[1]);
  });

  it('should fetch user by id', async () => {
    await user.add(
      fixture[0].id,
      fixture[0].name,
      fixture[0].email,
      fixture[0].image,
    );
    const model = await user.getById(fixture[0].id);
    expect(model).to.deep.equal(Object.assign({}, fixture[0], {
      infoConfirmed: false,
      premium: false,
    }));
  });

  it('should update user', async () => {
    await user.add(fixture[2].id);
    await user.update(fixture[2].id, fixture[2]);
    const model = await user.getById(fixture[2].id);
    expect(model).to.deep.equal(Object.assign({}, fixture[2], {
      infoConfirmed: false,
      premium: false,
    }));
  });
});
