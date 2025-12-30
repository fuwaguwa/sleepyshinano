export interface ShinanoUser {
  userId: string;
  blacklisted?: boolean;
  voteCreatedTimestamp?: number;
  voteExpiredTimestamp?: number;
}
