import { getTrackingId } from './tracking';

// eslint-disable-next-line import/prefer-default-export
export const getReferralLink = (ctx, user) => {
  const base = 'https://api.daily.dev/get?r=';
  if (user) {
    return `${base}${user.username || user.id}`;
  }

  const trackingId = getTrackingId(ctx);
  if (trackingId) {
    return `${base}${trackingId}`;
  }
  return `${base}share`;
};
