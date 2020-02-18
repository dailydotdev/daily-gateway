/* eslint-disable no-console */

import { fetchProfile } from '../profile';
import provider from '../models/provider';

const run = async (userId) => {
  const userProvider = await provider.getByUserId(userId);
  return fetchProfile(userProvider.provider, userProvider.accessToken);
};

run(process.argv[process.argv.length - 1])
  .then(console.log)
  .then(() => process.exit())
  .catch(console.error);

/* eslint-enable no-console */
