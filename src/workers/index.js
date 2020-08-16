import { pubsub } from '../pubsub';
import slackNotification from './slackNotification';
import updateMailingList from './updateMailingList';

const initializeWorker = async (worker, log) => {
  const topic = pubsub.topic(worker.topic);
  const subscription = topic.subscription(worker.subscription);
  if (subscription.get) {
    await subscription.get({ autoCreate: true });
  }
  log.info(`waiting for messages in ${topic.name}`);
  subscription.on('message', message => worker.handler(message, log));
};

// eslint-disable-next-line import/prefer-default-export
export const startWorkers = async (log) => {
  await initializeWorker(slackNotification, log);
  await initializeWorker(updateMailingList, log);
};
