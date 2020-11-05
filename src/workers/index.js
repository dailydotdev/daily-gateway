import slackNotification from './slackNotification';
import updateMailingList from './updateMailingList';
import updateReputation from './updateReputation';

const workers = [
  slackNotification,
  updateMailingList,
  updateReputation,
];

export default workers;
