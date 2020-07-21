import { envBasedName, messageToJson, userUpdatedTopic } from '../pubsub';
import { updateUserContact } from '../mailing';

const worker = {
  topic: userUpdatedTopic.name,
  subscription: envBasedName('user-updated-mailing'),
  handler: async (message, log) => {
    const data = messageToJson(message);
    try {
      await updateUserContact(data.newProfile, data.user.email);
      message.ack();
    } catch (err) {
      log.error({ messageId: message.id, err, userId: data.id }, 'failed to update user to mailing list');
      message.nack();
    }
  },
};

export default worker;
