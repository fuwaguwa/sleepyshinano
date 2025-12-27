export interface ShinanoUser {
  userId: string;
  blacklisted?: boolean;
  voteTimestamp?: number; // seconds since epoch
}
