import {pubsub} from '../pubsub';
import slackNotification from './slackNotification';
import addToMailingList from './addToMailingList';
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

export const startWorkers = async (log) => {
  await initializeWorker(slackNotification, log);
  await initializeWorker(addToMailingList, log);
  await initializeWorker(updateMailingList, log);
};
