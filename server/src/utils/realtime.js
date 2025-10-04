// Simple in-memory realtime pub/sub for SSE
// Owners: keyed by ownerId -> Set(res)
// Admins: single channel for all admins

const ownerSubscribers = new Map();
let adminSubscribers = new Set();

function addOwnerSubscriber(ownerId, res) {
  if (!ownerSubscribers.has(ownerId)) ownerSubscribers.set(ownerId, new Set());
  ownerSubscribers.get(ownerId).add(res);
}

function removeOwnerSubscriber(ownerId, res) {
  const set = ownerSubscribers.get(ownerId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) ownerSubscribers.delete(ownerId);
}

function publishToOwner(ownerId, event) {
  const set = ownerSubscribers.get(ownerId);
  if (!set || set.size === 0) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of set) {
    try { res.write(payload); } catch {}
  }
}

function addAdminSubscriber(res) {
  adminSubscribers.add(res);
}

function removeAdminSubscriber(res) {
  adminSubscribers.delete(res);
}

function publishToAdmins(event) {
  if (!adminSubscribers || adminSubscribers.size === 0) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of Array.from(adminSubscribers)) {
    try { res.write(payload); } catch {}
  }
}

module.exports = {
  addOwnerSubscriber,
  removeOwnerSubscriber,
  publishToOwner,
  addAdminSubscriber,
  removeAdminSubscriber,
  publishToAdmins,
};
