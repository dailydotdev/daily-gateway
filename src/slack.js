import { IncomingWebhook } from '@slack/client';

const webhook = (process.env.SLACK_WEBHOOK && process.env.NODE_ENV === 'production')
  ? new IncomingWebhook(process.env.SLACK_WEBHOOK) : { send: () => Promise.resolve() };

// eslint-disable-next-line import/prefer-default-export
export const notifyNewUser = (user) => webhook.send({
  text: 'Daily just got a new user!',
  attachments: [
    {
      title: user.name,
      thumb_url: user.image,
      fields: [
        {
          title: 'User ID',
          value: user.id,
        },
      ],
      color: '#208BFF',
    },
  ],
});
