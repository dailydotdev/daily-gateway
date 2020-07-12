import Router from 'koa-router';
import sgMail from '@sendgrid/mail';
import validator, { object, string } from 'koa-context-validator';

import contest from '../models/contest';
import { getTrackingId } from '../tracking';
import userModel from '../models/user';
import { ForbiddenError } from '../errors';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const router = Router({
  prefix: '/referrals',
});

const getReferralLink = (ctx) => {
  const base = 'https://app.dailynow.co/get?r=';
  if (ctx.state.user) {
    return `${base}${ctx.state.user.userId}`;
  }

  const trackingId = getTrackingId(ctx);
  if (trackingId) {
    return `${base}${trackingId}`;
  }
  return `${base}share`;
};

router.get(
  '/link',
  (ctx) => {
    ctx.status = 200;
    ctx.body = {
      link: getReferralLink(ctx),
      cover: 'https://res.cloudinary.com/daily-now/image/upload/v1594561638/referrals/cover1.jpg',
    };
  },
);

router.post(
  '/invite',
  validator({
    body: object().keys({
      email: string().required(),
    }),
  }, {
    stripUnknown: true,
  }),
  async (ctx) => {
    if (ctx.state.user) {
      const { userId } = ctx.state.user;
      const user = await userModel.getById(userId);
      if (!user) {
        throw new ForbiddenError();
      }

      const firstName = user.name.split(' ')[0];
      await sgMail.send({
        to: ctx.request.body.email,
        from: {
          email: 'hi@daily.dev',
          name: user.name,
        },
        reply_to: {
          email: 'hi@daily.dev',
          name: 'daily.dev',
        },
        template_id: 'd-7552e5cd152c4faeb9e5a83f365a5c34',
        dynamic_template_data: {
          full_name: user.name,
          first_name: firstName,
          profile_image: user.image,
          referral_link: getReferralLink(ctx),
        },
        tracking_settings: {
          open_tracking: { enable: true },
        },
        asm: {
          group_id: 14752,
        },
      });
      ctx.log.info({ userId }, 'sent referral email');
      ctx.status = 204;
    } else {
      throw new ForbiddenError();
    }
  },
);

router.get(
  '/contests',
  async (ctx) => {
    const now = new Date();
    const prizes = ['$512', '$256', '$128'];
    const [ongoing, upcoming] = await Promise.all([
      contest.getOngoingContest(now),
      contest.getUpcomingContest(now),
    ]);
    if (ongoing) {
      const { userId } = ctx.state.user || { userId: null };
      const [board, me] = await Promise.all([
        contest.getContestLeaderboard(ongoing.startAt, ongoing.endAt),
        ctx.state.user ?
          contest.getUserRank(ongoing.startAt, ongoing.endAt, userId) :
          Promise.resolve(null),
      ]);
      ctx.status = 200;
      ctx.body = {
        ongoing,
        upcoming,
        board: board.map((b, i) => Object.assign({}, b, { prize: prizes[i] })),
        me,
        referralLink: getReferralLink(ctx),
      };
    } else {
      ctx.status = 200;
      ctx.body = {
        ongoing,
        upcoming,
        board: [],
      };
    }
  },
);

export default router;
