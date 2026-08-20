/**
 * maintenance-store.js
 * Shared localStorage helpers for the integrated maintenance workflow.
 */

const TASK_RECORDS_KEY = "mx_task_records";
const PLANS_KEY = "mx_maintenance_plans";

export function loadPlans() {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY)) || []; }
  catch(e) { return []; }
}

export function savePlans(plans) {
  try { localStorage.setItem(PLANS_KEY, JSON.stringify(plans)); } catch(e) {}
}

export function loadRecords() {
  try { return JSON.parse(localStorage.getItem(TASK_RECORDS_KEY)) || {}; }
  catch(e) { return {}; }
}

export function saveRecords(records) {
  try { localStorage.setItem(TASK_RECORDS_KEY, JSON.stringify(records)); } catch(e) {}
}

export function getRecord(planId) {
  const records = loadRecords();
  return records[planId] || {
    status: "Open",
    startedAt: null,
    doneAt: null,
    waitingReason: null,
    evidencePhotos: [],
    archivedAt: null,
  };
}

export function updateRecord(planId, patch) {
  const records = loadRecords();
  records[planId] = { ...getRecord(planId), ...patch };
  saveRecords(records);
  return records[planId];
}

export function setStatus(planId, newStatus, extraData) {
  const current = getRecord(planId);
  const patch = Object.assign({ status: newStatus }, extraData || {});
  if (newStatus === "On Progress" && !current.startedAt) {
    patch.startedAt = new Date().toISOString();
  }
  if (newStatus === "Done") {
    patch.doneAt = new Date().toISOString();
    patch.archivedAt = new Date().toISOString();
  }
  return updateRecord(planId, patch);
}

export function getElapsedDays(record) {
  if (!record || !record.startedAt) return null;
  const start = new Date(record.startedAt);
  const end = record.doneAt ? new Date(record.doneAt) : new Date();
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

export function normalizePic(pic) {
  if (!pic) return [];
  if (Array.isArray(pic)) return pic;
  return [pic];
}
