import { envBasedName, messageToJson, userRegisteredTopic } from '../pubsub';
import { notifyNewUser } from '../slack';

const worker = {
  topic: userRegisteredTopic.name,
  subscription: envBasedName('user-registered-slack'),
  handler: async (message, log) => {
    const data = messageToJson(message);
    try {
      await notifyNewUser(data);
      message.ack();
    } catch (err) {
      log.error({ messageId: message.id, err }, 'failed to send slack notification');
      message.nack();
    }
  },
};

export default worker;
