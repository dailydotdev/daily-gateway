const env = process.env.NODE_ENV || 'development';
const port = Number.parseInt(process.env.PORT, 10) || 3000;

const getMysqlConfig = () => {
  const base = {
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset: 'utf8mb4',
    pool: { min: 2, max: 100 },
    acquireConnectionTimeout: 10000,
  };

  if (process.env.MYSQL_INSTANCE && process.env.NODE_ENV === 'production') {
    return Object.assign({}, base, { socketPath: `/cloudsql/${process.env.MYSQL_INSTANCE}` });
  }

  if (process.env.MYSQL_HOST) {
    return Object.assign({}, base, { host: process.env.MYSQL_HOST });
  }

  return base;
};

const config = {
  env,
  port,
  mysql: getMysqlConfig(),
  cookies: {
    secret: process.env.COOKIES_KEY,
    tracking: {
      opts: {
        domain: process.env.COOKIES_DOMAIN,
        maxAge: 1000 * 60 * 60 * 24 * 365,
        overwrite: true,
        httpOnly: false,
        signed: false,
      },
      key: 'da2',
    },
    auth: {
      opts: {
        domain: process.env.COOKIES_DOMAIN,
        maxAge: 1000 * 60 * 60 * 24 * 30,
        overwrite: true,
        httpOnly: true,
        signed: true,
      },
      key: 'da3',
    },
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN : '*',
  },
  urlPrefix: process.env.URL_PREFIX,
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    authenticateUrl: 'https://github.com/login/oauth/access_token',
    scope: 'user:email',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    authenticateUrl: 'https://www.googleapis.com/oauth2/v4/token',
    scope: 'profile email',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
    expiresIn: 30 * 24 * 60 * 60 * 1000,
  },
  monetizationUrl: process.env.MONETIZATION_URL || 'http://localhost:9090',
  redirectorUrl: process.env.REDIRECTOR_URL || 'http://localhost:9090',
  besticonUrl: process.env.BESTICON_URL || 'http://localhost:8080',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  accessSecret: process.env.ACCESS_SECRET || 'topsecret',
  apiSecret: process.env.API_SECRET,
};

export default config;
