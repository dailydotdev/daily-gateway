import { messageToJson } from '../pubsub';
import user from '../models/user';

const worker = {
  topic: 'user-reputation-updated',
  subscription: 'update-reputation',
  handler: async (message, log) => {
    const data = messageToJson(message);
    try {
      await user.updateReputation(data.userId, data.reputation);
    } catch (err) {
      log.error({ messageId: message.id, err, data }, 'failed to update reputation');
      throw err;
    }
  },
};

export default worker;
