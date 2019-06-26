import { IncomingWebhook } from '@slack/client';

const webhook = process.env.SLACK_WEBHOOK ?
  new IncomingWebhook(process.env.SLACK_WEBHOOK) : { send: () => Promise.resolve() };

// eslint-disable-next-line import/prefer-default-export
export const notifyNewUser = (profile, provider) =>
  webhook.send({
    text: 'Daily just got a new user!',
    attachments: [{
      title: profile.name,
      author_name: provider.replace(/^\w/, c => c.toUpperCase()),
      thumb_url: profile.image,
      color: '#208BFF',
    }],
  });
