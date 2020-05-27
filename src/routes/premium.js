import Router from 'koa-router';
import rp from 'request-promise-native';
import config from '../config';
import userModel from '../models/user';
import { addUserToContacts, removeUserFromList, getContactIdByEmail } from '../mailing';

const router = Router({
  prefix: '/premium',
});

const encryptParamXml = param => `
<parameter>
<param-key>${param.key}</param-key>
<param-value>${param.value}</param-value>
</parameter>
`;

const encryptParamsXml = params => `
<param-encryption xmlns="http://ws.plimus.com">
  <parameters>
    ${params.map(encryptParamXml).join('')}
  </parameters>
</param-encryption>
`;

const encryptUserParams = (user) => {
  const names = (user.name || '').split(' ');
  return encryptParamsXml([
    { key: 'sku2596871', value: 1 },
    { key: 'firstname', value: names[0] },
    { key: 'lastname', value: names.slice(1).join(' ') },
    { key: 'email', value: user.email || '' },
    { key: 'merchanttransactionid', value: user.id },
  ]);
};

router.get(
  '/checkout',
  async (ctx) => {
    if (ctx.state.user) {
      const { userId } = ctx.state.user;
      const user = await userModel.getById(userId);
      const body = encryptUserParams(user);
      const res = await rp({
        url: `${config.bluesnap.apiUrl}/services/2/tools/param-encryption`,
        method: 'POST',
        headers: {
          authorization: config.bluesnap.apiKey,
          'content-type': 'application/xml',
          'bluesnap-version': '3.0',
        },
        body,
      });
      const [, enc] = res.match(new RegExp('<encrypted-token>(.*)</encrypted-token>'));
      ctx.status = 307;
      ctx.redirect(`${config.bluesnap.checkoutUrl}/buynow/checkout?storeId=${config.bluesnap.storeId}&enc=${enc}`);
    } else {
      ctx.status = 307;
      ctx.redirect('https://daily.dev');
    }
  },
);

router.post(
  '/ipn',
  async (ctx) => {
    if (config.bluesnap.ip.indexOf(ctx.request.ip) > -1) {
      const { body } = ctx.request;
      const userId = body.merchantTransactionId;
      const user = await userModel.getById(userId);
      if (!user) {
        ctx.log.warn('user not found in ipn');
      } else {
        const contactId = process.env.NODE_ENV === 'production' ? await getContactIdByEmail(user.email) : '';
        switch (body.transactionType) {
          case 'AUTH_ONLY':
          case 'CHARGE':
            ctx.log.info({ userId }, 'upgrading to premium');
            await userModel.update(userId, { premium: true });
            if (process.env.NODE_ENV === 'production') {
              await addUserToContacts(user, 'b5bfeeec-4faf-4e38-a2d8-884ce0ad2e57', contactId);
            }
            break;
          case 'CANCELLATION':
            ctx.log.info({ userId }, 'downgrading from premium');
            await userModel.update(userId, { premium: false });
            if (process.env.NODE_ENV === 'production') {
              await removeUserFromList('b5bfeeec-4faf-4e38-a2d8-884ce0ad2e57', contactId);
            }
            break;
          default:
            // Nothing to do
        }
      }
    } else {
      ctx.log.warn('unauthorized ipn request');
    }
    ctx.status = 200;
  },
);

export default router;
