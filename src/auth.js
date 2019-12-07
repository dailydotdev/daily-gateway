import crypto from 'crypto';

const base64URLEncode = str =>
  str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

const sha256 = buffer =>
  crypto.createHash('sha256').update(buffer).digest();

/* eslint-disable-next-line import/prefer-default-export */
export const generateChallenge = verifier => base64URLEncode(sha256(verifier));
