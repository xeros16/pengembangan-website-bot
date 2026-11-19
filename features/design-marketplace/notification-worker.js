import crypto from 'node:crypto';

const PRIVATE_JID_SUFFIXES = ['@s.whatsapp.net', '@lid'];
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];

export function isPrivateWhatsAppJid(value) {
  const jid = String(value || '').trim();
  return PRIVATE_JID_SUFFIXES.some(suffix => jid.endsWith(suffix)) && !jid.endsWith('@g.us');
}

function localClockMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find(part => part.type === 'hour')?.value);
  const minute = Number(parts.find(part => part.type === 'minute')?.value);
  return hour * 60 + minute;
}

function parseClock(value) {
  const match = String(value || '').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function getQuietHoursResumeAt(now, start = '22:00', end = '08:00', timeZone = 'Asia/Jakarta') {
  const startMinutes = parseClock(start);
  const endMinutes = parseClock(end);
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) return null;
  const current = localClockMinutes(now, timeZone);
  const quiet = startMinutes > endMinutes
    ? current >= startMinutes || current < endMinutes
    : current >= startMinutes && current < endMinutes;
  if (!quiet) return null;
  const minutesUntilEnd = (endMinutes - current + 1440) % 1440 || 1440;
  return new Date(now.getTime() + minutesUntilEnd * 60_000);
}

function safeError(error) {
  return String(error?.message || error || 'Unknown delivery error')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\d{8,15}@(s\.whatsapp\.net|lid|g\.us)\b/gi, '[private-destination]')
    .slice(0, 220);
}

export function createDesignerNotificationWorker({
  DesignerProfile,
  DesignerNotification,
  sendMessage,
  isDestinationAllowed = () => true,
  logger = console,
  now = () => new Date(),
  intervalMs = 15_000,
  leaseMs = 120_000,
  maxBatch = 3,
  timeZone = 'Asia/Jakarta',
  isDatabaseReady = () => true,
} = {}) {
  if (!DesignerProfile || !DesignerNotification || typeof sendMessage !== 'function') {
    throw new TypeError('Notification worker requires profile/notification models and sendMessage.');
  }
  let timer = null;
  let running = false;

  async function updateClaim(notification, update) {
    return DesignerNotification.updateOne(
      { notificationId: notification.notificationId, whatsappLeaseToken: notification.whatsappLeaseToken },
      { $set: { ...update, whatsappLeaseToken: '', whatsappLeaseUntil: null } },
    );
  }

  async function processOne() {
    const currentTime = now();
    const leaseToken = crypto.randomUUID();
    const notification = await DesignerNotification.findOneAndUpdate(
      {
        $or: [
          { whatsappDeliveryStatus: 'pending', whatsappNextAttemptAt: { $lte: currentTime } },
          { whatsappDeliveryStatus: 'processing', whatsappLeaseUntil: { $lte: currentTime } },
        ],
      },
      {
        $set: {
          whatsappDeliveryStatus: 'processing',
          whatsappLeaseUntil: new Date(currentTime.getTime() + leaseMs),
          whatsappLeaseToken: leaseToken,
        },
        $inc: { whatsappAttempts: 1 },
      },
      { sort: { createdAt: 1 }, new: true },
    ).lean();

    if (!notification) return false;
    const claim = { ...notification, whatsappLeaseToken: leaseToken };
    try {
      const profile = await DesignerProfile.findOne({ designerId: notification.designerId })
        .select('displayName ownerJid whatsappPushEnabled whatsappPushJid whatsappPushEnabledAt whatsappPushQuietHoursEnabled whatsappPushQuietHoursStart whatsappPushQuietHoursEnd')
        .lean();

      if (!profile?.whatsappPushEnabled || !profile.whatsappPushEnabledAt ||
          new Date(notification.createdAt || 0).getTime() <= new Date(profile.whatsappPushEnabledAt).getTime()) {
        await updateClaim(claim, { whatsappDeliveryStatus: 'skipped', whatsappLastError: 'Notification predates explicit opt-in or owner has not opted in.' });
        return true;
      }

      const destination = String(profile.whatsappPushJid || '').trim();
      if (!isPrivateWhatsAppJid(destination) || !isDestinationAllowed(destination)) {
        await updateClaim(claim, { whatsappDeliveryStatus: 'skipped', whatsappLastError: 'Private destination is not allowlisted.' });
        return true;
      }

      if (profile.whatsappPushQuietHoursEnabled !== false) {
        const resumeAt = getQuietHoursResumeAt(
          currentTime,
          profile.whatsappPushQuietHoursStart || '22:00',
          profile.whatsappPushQuietHoursEnd || '08:00',
          timeZone,
        );
        if (resumeAt) {
          await updateClaim(claim, {
            whatsappDeliveryStatus: 'pending',
            whatsappNextAttemptAt: resumeAt,
            whatsappLastError: '',
          });
          return true;
        }
      }

      const latestConsent = await DesignerProfile.findOne({
        designerId: notification.designerId,
        whatsappPushEnabled: true,
        whatsappPushJid: destination,
      }).select('whatsappPushEnabled whatsappPushJid').lean();
      if (!latestConsent?.whatsappPushEnabled || latestConsent.whatsappPushJid !== destination) {
        await updateClaim(claim, { whatsappDeliveryStatus: 'skipped', whatsappLastError: 'Push consent was revoked before delivery.' });
        return true;
      }

      const title = String(notification.title || 'Aktivitas Designer Studio').replace(/[\r\n]+/g, ' ').slice(0, 120);
      const message = String(notification.message || '').replace(/[\r\n]+/g, ' ').slice(0, 320);
      const text = `🔔 *PIR VISUALS · DESIGNER STUDIO*\n${title}${message ? `\n${message}` : ''}\n\nBuka chat bot dan kirim .portfolio notifikasi untuk melihat inbox. Atur pesan otomatis: .portfolio notifikasi push status`;
      const result = await sendMessage(destination, { text });
      if (!result) throw new Error('WhatsApp outbound gate did not accept this private destination.');

      await updateClaim(claim, {
        whatsappDeliveryStatus: 'sent',
        whatsappDeliveredAt: now(),
        whatsappLastError: '',
      });
      return true;
    } catch (error) {
      const attempts = Math.max(1, Number(notification.whatsappAttempts || 1));
      const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
      const exhausted = attempts > RETRY_DELAYS_MS.length;
      await updateClaim(claim, {
        whatsappDeliveryStatus: exhausted ? 'failed' : 'pending',
        whatsappNextAttemptAt: new Date(now().getTime() + delay),
        whatsappLastError: safeError(error),
      }).catch(updateError => logger.error?.('[DESIGNER PUSH STATE]', updateError.message));
      logger.warn?.('[DESIGNER PUSH DELIVERY]', safeError(error));
      return true;
    }
  }

  async function tick() {
    if (running || !isDatabaseReady()) return 0;
    running = true;
    let processed = 0;
    try {
      for (let index = 0; index < maxBatch; index += 1) {
        const didProcess = await processOne();
        if (!didProcess) break;
        processed += 1;
        if (index + 1 < maxBatch) await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error?.('[DESIGNER PUSH WORKER]', safeError(error));
    } finally {
      running = false;
    }
    return processed;
  }

  function start() {
    if (timer) return false;
    void tick();
    timer = setInterval(() => { void tick(); }, intervalMs);
    timer.unref?.();
    return true;
  }

  function stop() {
    if (!timer) return false;
    clearInterval(timer);
    timer = null;
    return true;
  }

  return { start, stop, tick, get running() { return running; } };
}
