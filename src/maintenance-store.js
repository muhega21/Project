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

export function getRecord(planId, dateStr) {
  const records = loadRecords();
  const key = dateStr ? `${planId}_${dateStr}` : planId;
  return records[key] || {
    status: "Open",
    startedAt: null,
    doneAt: null,
    waitingReason: null,
    evidencePhotos: [],
    archivedAt: null,
    pic: null, // null means use default plan.pic
  };
}

export function updateRecord(planId, dateStr, patch) {
  const records = loadRecords();
  const key = dateStr ? `${planId}_${dateStr}` : planId;
  records[key] = { ...getRecord(planId, dateStr), ...patch };
  saveRecords(records);
  return records[key];
}

export function setStatus(planId, dateStr, newStatus, extraData) {
  const current = getRecord(planId, dateStr);
  const patch = Object.assign({ status: newStatus }, extraData || {});
  if (newStatus === "On Progress" && !current.startedAt) {
    patch.startedAt = new Date().toISOString();
  }
  if (newStatus === "Done") {
    patch.doneAt = new Date().toISOString();
    patch.archivedAt = new Date().toISOString();
  }
  return updateRecord(planId, dateStr, patch);
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

export function isScheduledOnDate(startDateStr, frequency, targetDateStr) {
  if (!startDateStr || !targetDateStr) return false;
  const start = new Date(startDateStr); start.setHours(0,0,0,0);
  const target = new Date(targetDateStr); target.setHours(0,0,0,0);
  if (target < start) return false;
  const diffDays = Math.round((target - start) / 86400000);
  switch (frequency) {
    case "Daily": return true;
    case "Weekly": return diffDays % 7 === 0;
    case "Monthly": return start.getDate() === target.getDate();
    case "Quarterly": { const md=(target.getFullYear()-start.getFullYear())*12+target.getMonth()-start.getMonth(); return start.getDate()===target.getDate()&&md%3===0; }
    case "Semester": { const md=(target.getFullYear()-start.getFullYear())*12+target.getMonth()-start.getMonth(); return start.getDate()===target.getDate()&&md%6===0; }
    case "Annual": return start.getDate()===target.getDate()&&start.getMonth()===target.getMonth();
    case "Trienial": return start.getDate()===target.getDate()&&start.getMonth()===target.getMonth()&&(target.getFullYear()-start.getFullYear())%3===0;
    case "Quinquenial": return start.getDate()===target.getDate()&&start.getMonth()===target.getMonth()&&(target.getFullYear()-start.getFullYear())%5===0;
    default: return false;
  }
}
