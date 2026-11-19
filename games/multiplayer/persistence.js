let mongooseRef = null;
let MultiplayerState = null;
async function getModel() {
  if (!mongooseRef) {
    const module = await import('mongoose');
    mongooseRef = module.default;
    const schema = new mongooseRef.Schema({
      key: { type: String, unique: true, default: 'global' },
      groupSessions: { type: mongooseRef.Schema.Types.Mixed, default: {} },
      duelChallenges: { type: mongooseRef.Schema.Types.Mixed, default: {} },
      duelMatches: { type: mongooseRef.Schema.Types.Mixed, default: {} },
      savedAt: { type: Date, default: Date.now },
    }, { timestamps: true, minimize: false });
    MultiplayerState = mongooseRef.models.MultiplayerState || mongooseRef.model('MultiplayerState', schema);
  }
  return MultiplayerState;
}
let maps = null;
let timer = null;
let restoring = false;
let saveChain = Promise.resolve();

const serialize = map => Object.fromEntries([...map.entries()]);
export function attachMultiplayerPersistence(stateMaps) { maps = stateMaps; }

export function scheduleMultiplayerSave() {
  if (restoring || !maps) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const snapshot = {
      key: 'global',
      groupSessions: serialize(maps.groupSessions),
      duelChallenges: serialize(maps.duelChallenges),
      duelMatches: serialize(maps.duelMatches),
      savedAt: new Date(),
    };
    saveChain = saveChain.then(async () => { const Model = await getModel(); if (mongooseRef.connection.readyState !== 1) return; return Model.findOneAndUpdate({ key: 'global' }, snapshot, { upsert: true, new: true }).exec(); }).catch(error => {
      console.error('[MULTIPLAYER PERSISTENCE]', error.message);
    });
  }, 150);
  timer.unref?.();
}

export async function restoreMultiplayerPersistence() {
  if (!maps) return { restored: false, reason: 'state-unavailable' };
  const Model = await getModel();
  if (mongooseRef.connection.readyState !== 1) return { restored: false, reason: 'database-unavailable' };
  restoring = true;
  try {
    const doc = await Model.findOne({ key: 'global' }).lean();
    if (!doc) return { restored: true, rooms: 0, challenges: 0, duels: 0 };
    const now = Date.now();
    const restoreMap = (target, source, maxAge) => {
      target.clear();
      for (const [key, value] of Object.entries(source || {})) {
        const createdAt = Number(value?.createdAt || value?.createdAtMs || 0);
        if (maxAge && createdAt && now - createdAt > maxAge) continue;
        target.set(key, value);
      }
    };
    restoreMap(maps.groupSessions, doc.groupSessions, 24 * 60 * 60 * 1000);
    restoreMap(maps.duelChallenges, doc.duelChallenges, 5 * 60 * 1000);
    restoreMap(maps.duelMatches, doc.duelMatches, 60 * 60 * 1000);
    return { restored: true, rooms: maps.groupSessions.size, challenges: maps.duelChallenges.size, duels: maps.duelMatches.size };
  } finally { restoring = false; }
}

export async function flushMultiplayerPersistence() {
  if (timer) { clearTimeout(timer); timer = null; scheduleMultiplayerSave(); }
  await saveChain;
}
