import Router from 'koa-router';
import validator, { string } from 'koa-context-validator';
import config from '../config';
import { addSubdomainOpts } from '../cookies';

const router = Router();

router.get(
  '/download',
  validator({
    query: {
      referral: string(),
    },
  }, {
    stripUnknown: true,
  }),
  async (ctx) => {
    ctx.status = 307;

    if (ctx.userAgent.isBot) {
      ctx.redirect('https://www.dailynow.co');
      return;
    }

    const { referral } = ctx.request.query;
    if (referral) {
      ctx.log.info({ referral }, 'redirecting to download by referral');
      ctx.cookies.set(
        config.cookies.referral.key, referral,
        addSubdomainOpts(ctx, config.cookies.referral.opts),
      );
    }

    if (ctx.userAgent.browser.toLowerCase() === 'firefox') {
      ctx.redirect('https://addons.mozilla.org/en-US/firefox/addon/daily/');
    } else if (ctx.userAgent.source.indexOf('Edg/') > -1) {
      ctx.redirect('https://microsoftedge.microsoft.com/addons/detail/daily-20-source-for-bu/cbdhgldgiancdheindpekpcbkccpjaeb');
    } else {
      ctx.redirect('https://chrome.google.com/webstore/detail/daily-discover-web-techno/jlmpjdjjbgclbocgajdjefcidcncaied');
    }
  },
);

router.get('/privacy', ctx => ctx.redirect('https://www.iubenda.com/privacy-policy/14695236'));
router.get('/tos', ctx => ctx.redirect('https://medium.com/daily-now/daily-terms-of-service-47bb9c9a4b99'));

export default router;
