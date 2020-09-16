import { envBasedName, messageToJson, userReputationUpdatedTopic } from '../pubsub';
import user from '../models/user';

const worker = {
  topic: userReputationUpdatedTopic.name,
  subscription: envBasedName('update-reputation'),
  handler: async (message, log) => {
    const data = messageToJson(message);
    try {
      await user.updateReputation(data.userId, data.reputation);
      message.ack();
    } catch (err) {
      log.error({ messageId: message.id, err, data }, 'failed to update reputation');
      message.nack();
    }
  },
};

export default worker;
