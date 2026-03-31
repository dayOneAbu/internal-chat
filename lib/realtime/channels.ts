export const WORKSPACE_PRESENCE_CHANNEL = "presence:workspace";

export function getSessionChannelName(sessionId: string) {
  return `chat:session:${sessionId}`;
}

export function getUserInboxChannelName(userId: string) {
  return `chat:user:${userId}`;
}

export function getTypingChannelName(sessionId: string) {
  return `typing:session:${sessionId}`;
}
