import { messageToJson } from '../pubsub';
import userModel from '../models/user';
import { sendEmail } from '../mailing';

const worker = {
  topic: 'new-eligible-participant',
  subscription: 'new-eligible-participant-boost-chances',
  handler: async (message, log) => {
    const data = messageToJson(message);
    try {
      const user = await userModel.getByIdOrUsername(data.userId);
      const firstName = user.name && user.name.split(' ')[0];
      await sendEmail({
        to: user.email,
        from: {
          email: 'informer@daily.dev',
          name: 'daily.dev',
        },
        replyTo: {
          email: 'hi@daily.dev',
          name: 'daily.dev',
        },
        template_id: 'd-158b83005c3c4511b51c6ce04e5d4555',
        send_at: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60,
        dynamic_template_data: {
          first_name: firstName,
          profile_link: `https://app.daily.dev/${user.username || user.id}`,
        },
        tracking_settings: {
          open_tracking: { enable: true },
        },
        asm: {
          group_id: 13416,
        },
      });
    } catch (err) {
      log.error({ messageId: message.id, err }, 'failed to send eligibility email');
      throw err;
    }
  },
};

export default worker;
