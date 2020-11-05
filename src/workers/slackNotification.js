import { messageToJson } from '../pubsub';
import { notifyNewUser } from '../slack';

const worker = {
  topic: 'user-registered',
  subscription: 'user-registered-slack',
  handler: async (message, log) => {
    const data = messageToJson(message);
    try {
      await notifyNewUser(data);
    } catch (err) {
      log.error({ messageId: message.id, err }, 'failed to send slack notification');
      throw err;
    }
  },
};

export default worker;
