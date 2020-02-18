/* eslint-disable no-console */

import fs from 'fs';
import db, { toCamelCase } from '../db';
import { fetchGithubProfile, callGithubApi, fetchGoogleProfile, refreshGoogleToken } from '../profile';

const fetchGithub = async (accessToken) => {
  const profile = await fetchGithubProfile(accessToken);
  const emails = await callGithubApi('user/public_emails', accessToken);
  return [{
    name: profile.name,
    user: profile.login,
    followers: profile.followers,
    email: emails && emails.length && emails[0].email,
  }];
};

const fetchGoogle = async (providerId, refreshToken) => {
  const token = await refreshGoogleToken(providerId, refreshToken);
  const profile = await fetchGoogleProfile(token.access_token);
  if (profile.emailAddresses.length) {
    return [{
      name: profile.names[0].displayName,
      email: profile.emailAddresses[0].value,
    }];
  }

  return [];
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
      .then(([p]) => {
        if (p) {
          const res = {
            email: p.email,
            user_id: u.userId,
            followers: p.followers,
          };
          if (p.name) {
            const split = p.name.split(' ');
            [res.first_name] = split;
            res.last_name = split.slice(1).join(' ');
          }
          return [res];
        }
        return [];
      })
      .catch((e) => {
        console.error(e);
        return [];
      }))))
    .reduce((acc, val) => acc.concat(val), [])
    .filter(p => p.email && p.email.indexOf('users.noreply.github.com') < 0);
  console.log(`next batch, users left: ${users.length}`);
  return fetchInfos(users.slice(parallel), info.concat(newInfo));
};

const run = async () => {
  const users = await db.select('user_id', 'provider', 'provider_id', 'access_token', 'refresh_token', 'expires_in')
    .from('providers')
    .orderBy('created_at')
    .where('provider', '=', 'github')
    .map(toCamelCase);
  return fetchInfos(users, []);
};

run()
  .then(res => fs.writeFileSync('users.json', JSON.stringify(res), 'utf8'))
  .catch(console.error)
  .then(process.exit);

/* eslint-enable no-console */
