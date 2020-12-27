import {
  createCipheriv, createDecipheriv, scryptSync, randomBytes,
} from 'crypto';
import config from '../config';
import db, { toCamelCase, toSnakeCase } from '../db';

const algorithm = 'aes-256-cbc';

const key = scryptSync(config.refreshToken.secret, config.refreshToken.salt, 32);
const iv = Buffer.alloc(16, 0); // Initialization crypto vector

const table = 'refresh_tokens';

const generate = () => randomBytes(40).toString('hex');

const encrypt = (token) => {
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encryptedToken) => {
  const decipher = createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const getByToken = (token) => db.select('user_id', 'token')
  .from(table)
  .where('token', '=', encrypt(token))
  .limit(1)
  .then((res) => res.map(toCamelCase))
  .then((res) => (res.length ? res[0] : null));

const add = async (userId, token) => {
  const encryptedToken = await encrypt(token);

  const obj = {
    userId,
    token: encryptedToken,
  };

  return db.insert(toSnakeCase({ createdAt: new Date(), ...obj })).into(table).then(() => obj);
};

export default {
  generate,
  encrypt,
  decrypt,
  getByToken,
  add,
};
