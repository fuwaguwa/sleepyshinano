export interface ShinanoUser {
  userId: string;
  blacklisted?: boolean;
  lastVoteTimestamp?: number; // seconds since epoch
}
