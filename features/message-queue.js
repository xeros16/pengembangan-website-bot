// Stability layer: avoid processing the same Baileys message twice and serialize
// concurrent commands from the same sender inside this Node.js process.
export const processedMessageIds = new Map();
export const senderQueues = new Map();
export const MESSAGE_DEDUPE_TTL_MS = 10 * 60 * 1000;
export const MESSAGE_DEDUPE_MAX = 5000;
export function rememberMessageId(id) {
  if (!id) return true; // Some synthetic events do not carry an ID.
  const now = Date.now();
  for (const [key, timestamp] of processedMessageIds) {
    if (now - timestamp > MESSAGE_DEDUPE_TTL_MS) processedMessageIds.delete(key);
    else break;
  }
  if (processedMessageIds.has(id)) return false;
  processedMessageIds.set(id, now);
  while (processedMessageIds.size > MESSAGE_DEDUPE_MAX) {
    processedMessageIds.delete(processedMessageIds.keys().next().value);
  }
  return true;
}
export async function serializeBySender(senderKey, task) {
  const previous = senderQueues.get(senderKey) || Promise.resolve();
  const current = previous.catch(() => {}).then(task);
  senderQueues.set(senderKey, current);
  try { return await current; }
  finally { if (senderQueues.get(senderKey) === current) senderQueues.delete(senderKey); }
}

