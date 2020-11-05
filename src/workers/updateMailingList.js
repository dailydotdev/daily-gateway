import { messageToJson } from '../pubsub';
import { getContactIdByEmail, removeUserFromList, updateUserContact } from '../mailing';

const worker = {
  topic: 'user-updated',
  subscription: 'user-updated-mailing',
  handler: async (message, log) => {
    const data = messageToJson(message);
    if (!data.newProfile.email || !data.newProfile.email.length) {
      log.warn({ messageId: message.id, userId: data.user.id }, 'no email in user-updated message');
      return;
    }
    try {
      const lists = ['85a1951f-5f0c-459f-bf5e-e5c742986a50'];
      if (!data.newProfile.acceptedMarketing) {
        const contactId = await getContactIdByEmail(data.user.email);
        if (contactId) {
          await removeUserFromList('53d09271-fd3f-4e38-ac21-095bf4f52de6', contactId);
        }
      } else {
        lists.push('53d09271-fd3f-4e38-ac21-095bf4f52de6');
      }
      await updateUserContact(data.newProfile, data.user.email, lists);
    } catch (err) {
      log.error({ messageId: message.id, err, userId: data.user.id }, 'failed to update user to mailing list');
      throw err;
    }
  },
};

export default worker;
