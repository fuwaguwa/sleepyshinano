import { getCurrentTimestamp } from "../../../shared/lib/utils";
import { UserVoteModel } from "../models/UserVote";

export async function checkVote(userId: string) {
  const user = await UserVoteModel.findOne({ userId });
  if (!user) return false;

  const currentTimestamp = getCurrentTimestamp();
  return currentTimestamp > user.voteExpiredTimestamp;
}
