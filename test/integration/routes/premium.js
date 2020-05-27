import { expect } from 'chai';
import supertest from 'supertest';
import knexCleaner from 'knex-cleaner';
import db, { migrate } from '../../../src/db';
import app from '../../../src';
import userModel from '../../../src/models/user';

describe('premium ipn', () => {
  let request;
  let server;

  before(() => {
    server = app.listen();
    request = supertest(server);
  });

  beforeEach(async () => {
    await knexCleaner.clean(db, { ignoreTables: ['knex_migrations', 'knex_migrations_lock'] });
    await migrate();
    await userModel.add('1', 'John', 'john@acme.com');
  });

  after(() => {
    server.close();
  });

  it('should return 200 and upgrade user to premium', async () => {
    await request
      .post('/premium/ipn')
      .send('merchantTransactionId=1&transactionType=AUTH_ONLY')
      .set('x-forwarded-for', '123.1.1.1')
      .expect(200);

    const user = await userModel.getById('1');
    expect(user.premium).to.equal(true);
  });

  it('should return 200 and downgrade user from premium', async () => {
    await userModel.update('1', { premium: true });

    await request
      .post('/premium/ipn')
      .send('merchantTransactionId=1&transactionType=CANCELLATION')
      .set('x-forwarded-for', '123.1.1.1')
      .expect(200);

    const user = await userModel.getById('1');
    expect(user.premium).to.equal(false);
  });

  it('should return 200 and do nothing when not valid ip', async () => {
    await request
      .post('/premium/ipn')
      .send('merchantTransactionId=1&transactionType=AUTH_ONLY')
      .set('x-forwarded-for', '123.1.1.0')
      .expect(200);

    const user = await userModel.getById('1');
    expect(user.premium).to.equal(false);
  });

  it('should return 200 and even when user does not exist', async () => {
    await request
      .post('/premium/ipn')
      .send('merchantTransactionId=5&transactionType=AUTH_ONLY')
      .set('x-forwarded-for', '123.1.1.1')
      .expect(200);

    const user = await userModel.getById('1');
    expect(user.premium).to.equal(false);
  });
});
