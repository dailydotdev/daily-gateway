import Router from 'koa-router';
import validator, { string, object } from 'koa-context-validator';
import querystring from 'querystring';
import config from '../config';
import { addSubdomainOpts } from '../cookies';

const router = Router();

const setReferral = (ctx) => {
  const { r: referral } = ctx.request.query;
  if (referral) {
    ctx.log.info({ referral }, 'redirecting by referral');
    ctx.cookies.set(
      config.cookies.referral.key, referral,
      addSubdomainOpts(ctx, config.cookies.referral.opts),
    );
  }
};

router.get(
  '/landing',
  validator({
    query: object().keys({
      r: string(),
    }).unknown(),
  }),
  async (ctx) => {
    ctx.status = 307;

    if (!ctx.userAgent.isBot) {
      setReferral(ctx);
    }
    ctx.redirect(`https://daily.dev?${ctx.request.querystring}`);
  },
);

router.get(
  '/ref',
  validator({
    query: object().keys({
      r: string(),
      u: string(),
    }).unknown(),
  }),
  async (ctx) => {
    ctx.status = 307;

    if (!ctx.userAgent.isBot) {
      setReferral(ctx);
    }
    const { query } = ctx.request;
    const { u } = query;
    delete query.u;
    const qs = querystring.stringify(query);
    ctx.redirect(`${u}?${qs}`);
  },
);

router.get(
  ['/download', '/get'],
  validator({
    query: object().keys({
      r: string(),
    }).unknown(),
  }),
  async (ctx) => {
    ctx.status = 307;

    if (ctx.userAgent.isBot) {
      ctx.redirect('https://daily.dev');
      return;
    }

    setReferral(ctx);

    if (ctx.userAgent.browser.toLowerCase() === 'firefox') {
      ctx.redirect(`https://addons.mozilla.org/en-US/firefox/addon/daily/?${ctx.request.querystring}`);
    } else if (ctx.userAgent.source.indexOf('Edg/') > -1) {
      ctx.redirect(`https://microsoftedge.microsoft.com/addons/detail/daily-20-source-for-bu/cbdhgldgiancdheindpekpcbkccpjaeb?${ctx.request.querystring}`);
    } else {
      ctx.redirect(`https://chrome.google.com/webstore/detail/daily-discover-web-techno/jlmpjdjjbgclbocgajdjefcidcncaied?${ctx.request.querystring}`);
    }
  },
);

router.get('/privacy', (ctx) => ctx.redirect('https://www.iubenda.com/privacy-policy/14695236'));
router.get('/tos', (ctx) => ctx.redirect('https://medium.com/daily-now/daily-terms-of-service-47bb9c9a4b99'));

export default router;
