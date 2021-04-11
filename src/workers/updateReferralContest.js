import { messageToJson, participantEligilbleTopic, publishEvent } from '../pubsub';
import userModel from '../models/user';
import contestModel from '../models/contest';

const worker = {
  topic: 'user-registered',
  subscription: 'user-registered-referral-contest',
  handler: async (message, log) => {
    const newUser = messageToJson(message);
    try {
      if (newUser.referral) {
        const [referredUser, contest] = await Promise.all([
          userModel.getByIdOrUsername(newUser.referral),
          contestModel.getOngoingContest(),
        ]);
        if (referredUser && contest) {
          log.info({ userId: referredUser.id, contestId: contest.id }, 'increasing referral count for contest');
          await contestModel.incrementParticipantCount(contest.id, referredUser.id);
          const participant = await contestModel.getParticipant(contest.id, referredUser.id);
          if (participant.referrals >= 5 && !participant.eligible) {
            await contestModel.setParticipantAsEligible(contest.id, referredUser.id);
            await publishEvent(participantEligilbleTopic, {
              userId: referredUser.id, contestId: contest.id,
            }, log);
          }
        }
      }
    } catch (err) {
      log.error({ messageId: message.id, err }, 'failed to update referral contest');
      throw err;
    }
  },
};

export default worker;
