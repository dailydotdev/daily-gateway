/* eslint-disable no-console */

import db, { toCamelCase } from '../db';
import userModel from '../models/user';
import { fetchGithubProfile, callGithubApi, fetchGoogleProfile, refreshGoogleToken } from '../profile';

const fetchGithub = async (accessToken) => {
  const [profile, emails] = await Promise.all([
    fetchGithubProfile(accessToken),
    callGithubApi('user/public_emails', accessToken),
  ]);
  return {
    name: profile.name,
    image: profile.avatar_url,
    email: emails && emails.length && emails[0].email.indexOf('users.noreply.github.com') < 0 && emails[0].email,
  };
};

const fetchGoogle = async (providerId, refreshToken) => {
  const token = await refreshGoogleToken(providerId, refreshToken);
  const profile = await fetchGoogleProfile(token.access_token);
  return {
    name: profile.names.length ? profile.names[0].displayName : null,
    image: profile.photos.length ? profile.photos[0].url : null,
    email: profile.emailAddresses.length > 0 ? profile.emailAddresses[0].value : undefined,
  };
};

const fetchInfo = async (user) => {
  if (user.provider === 'google') {
    return fetchGoogle(user.providerId, user.refreshToken);
  }
  return fetchGithub(user.accessToken);
};

const fetchInfos = async (users, info) => {
  if (!users.length) {
    return info;
  }

  const parallel = 50;
  const runUsers = users.slice(0, parallel);
  const newInfo = (await Promise.all(runUsers.map(u =>
    fetchInfo(u)
      .then((p) => {
        if (p) {
          return userModel.update(u.userId, p);
        }
        return Promise.resolve();
      })
      .catch((e) => {
        if (e.statusCode !== 400 && e.statusCode !== 401) {
          console.error(e);
        }
      }))));
  console.log(`next batch, users left: ${users.length}`);
  return fetchInfos(users.slice(parallel), info.concat(newInfo));
};

const run = async () => {
  const page = 12;
  const users = await db.select('user_id', 'provider', 'provider_id', 'access_token', 'refresh_token', 'expires_in')
    .from('providers')
    .orderBy('created_at')
    .offset(page * 1000)
    .limit(1000)
    .map(toCamelCase);
  return fetchInfos(users, []);
};

run()
  .then(() => console.log('done'))
  .catch(console.error)
  .then(process.exit);

/* eslint-enable no-console */
