import { envBasedName, messageToJson, userRegisteredTopic } from '../pubsub';
import { addUserToContacts } from '../mailing';

const worker = {
  topic: userRegisteredTopic.name,
  subscription: envBasedName('user-registered-mailing'),
  handler: async (message, log) => {
    const data = messageToJson(message);
    try {
      if (data.email) {
        await addUserToContacts(Object.assign({}, data, { id: data.id }), '85a1951f-5f0c-459f-bf5e-e5c742986a50');
      }
      message.ack();
    } catch (err) {
      log.error({ messageId: message.id, err, userId: data.id }, 'failed to add user to mailing list');
      message.nack();
    }
  },
};

export default worker;
