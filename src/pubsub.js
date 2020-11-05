import { PubSub } from '@google-cloud/pubsub';
import config from './config';

export const pubsub = new PubSub();
export const userRegisteredTopic = pubsub.topic('user-registered');
export const userUpdatedTopic = pubsub.topic('user-updated');

export const messageToJson = (message) => JSON.parse(Buffer.from(message.data, 'base64').toString('utf-8').trim());

export const publishEvent = async (topic, payload, log) => {
  if (config.env === 'production') {
    try {
      await topic.publishJSON(payload);
    } catch (err) {
      log.error({ payload, topic: topic.name, err }, 'failed to publish message');
    }
  }
};
