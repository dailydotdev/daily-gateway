import { envBasedName, messageToJson, userUpdatedTopic } from '../pubsub';
import { getContactIdByEmail, removeUserContact, updateUserContact } from '../mailing';

const worker = {
  topic: userUpdatedTopic.name,
  subscription: envBasedName('user-updated-mailing'),
  handler: async (message, log) => {
    const data = messageToJson(message);
    try {
      if (!data.newProfile.acceptedMarketing) {
        const contactId = await getContactIdByEmail(data.user.email);
        if (contactId) {
          await removeUserContact(contactId);
        }
      } else {
        await updateUserContact(data.newProfile, data.user.email, '85a1951f-5f0c-459f-bf5e-e5c742986a50');
      }
      message.ack();
    } catch (err) {
      log.error({ messageId: message.id, err, userId: data.id }, 'failed to update user to mailing list');
      message.nack();
    }
  },
};

export default worker;
