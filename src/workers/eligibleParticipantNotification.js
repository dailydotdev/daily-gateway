import { messageToJson } from '../pubsub';
import userModel from '../models/user';
import { sendEmail } from '../mailing';

const worker = {
  topic: 'new-eligible-participant',
  subscription: 'new-eligible-participant-notification',
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
        template_id: 'd-0e4818fdc34d466bb0ce3dd6391829d1',
        dynamic_template_data: {
          first_name: firstName,
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
