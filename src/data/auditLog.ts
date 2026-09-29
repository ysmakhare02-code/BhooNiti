export interface AuditLogEntry {
  id: string;
  timestamp: string;
  projectId?: string;
  projectName?: string;
  officerName: string;
  officerRole: string;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  reason: string;
  prevHash: string;
  hash: string;
}

const STORAGE_KEY = 'bhumiraksha_append_only_audit_v1';
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Compute SHA-256 hexadecimal hash string using crypto.subtle (with deterministic fallback).
 */
export async function computeEntryHash(
  prevHash: string,
  entry: {
    timestamp: string;
    projectId?: string;
    officerName: string;
    officerRole: string;
    action: string;
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    reason: string;
  }
): Promise<string> {
  const payload = [
    prevHash,
    entry.timestamp,
    entry.projectId || '',
    entry.officerName,
    entry.officerRole,
    entry.action,
    entry.fieldChanged || '',
    entry.oldValue || '',
    entry.newValue || '',
    entry.reason,
  ].join('|');

  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.digest === 'function'
  ) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('crypto.subtle.digest failed, using fallback', e);
    }
  }

  // Fallback 64-char pseudo-hash for non-standard environments
  let hash1 = 0x811c9dc5;
  let hash2 = 0x55555555;
  for (let i = 0; i < payload.length; i++) {
    const code = payload.charCodeAt(i);
    hash1 ^= code;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= code;
    hash2 = Math.imul(hash2, 0x1000193);
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  const combined = (part1 + part2 + part1 + part2).padEnd(64, 'a');
  return combined.slice(0, 64);
}

/**
 * Read the current append-only audit log from browser localStorage.
 */
export function getStoredAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse audit log from storage', e);
    return [];
  }
}

/**
 * Persist audit entries into browser storage. (Private - only used by append)
 */
function saveAuditLogs(entries: AuditLogEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save audit logs', e);
  }
}

/**
 * Append a new statutory audit log entry to the chain.
 * Strictly append-only: no edit or delete methods are exposed.
 */
export async function appendAuditLog(
  entry: Omit<AuditLogEntry, 'prevHash' | 'hash'>
): Promise<AuditLogEntry> {
  const currentLogs = getStoredAuditLogs();
  const lastEntry = currentLogs.length > 0 ? currentLogs[currentLogs.length - 1] : null;
  const prevHash = lastEntry ? lastEntry.hash : GENESIS_HASH;

  const hash = await computeEntryHash(prevHash, entry);

  const newRecord: AuditLogEntry = {
    ...entry,
    prevHash,
    hash,
  };

  currentLogs.push(newRecord);
  saveAuditLogs(currentLogs);

  return newRecord;
}

export const appendAuditLogEntry = appendAuditLog;

/**
 * Initialize default audit logs if storage is empty, linking initial project records cryptographically.
 */
export async function initializeAuditLogIfEmpty(
  initialSeedItems: {
    id: string;
    timestamp: string;
    projectId?: string;
    projectName?: string;
    officerName: string;
    officerRole: string;
    action: string;
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    reason: string;
  }[]
): Promise<AuditLogEntry[]> {
  const existing = getStoredAuditLogs();
  if (existing.length > 0) return existing;

  const chain: AuditLogEntry[] = [];
  let prevHash = GENESIS_HASH;

  for (const item of initialSeedItems) {
    const hash = await computeEntryHash(prevHash, item);
    const entry: AuditLogEntry = {
      ...item,
      prevHash,
      hash,
    };
    chain.push(entry);
    prevHash = hash;
  }

  saveAuditLogs(chain);
  return chain;
}

/**
 * Cryptographically verify the integrity of the audit chain from genesis to head.
 * Checks that every entry's prevHash matches the previous entry's hash and that
 * the SHA-256 digest of the payload equals entry.hash.
 */
export async function verifyAuditChain(
  entries?: AuditLogEntry[]
): Promise<{ isValid: boolean; brokenAtIndex?: number; totalChecked: number }> {
  const list = entries || getStoredAuditLogs();
  if (list.length === 0) {
    return { isValid: true, totalChecked: 0 };
  }

  for (let i = 0; i < list.length; i++) {
    const current = list[i];
    const expectedPrevHash = i === 0 ? GENESIS_HASH : list[i - 1].hash;

    // Check pointer linkage
    if (current.prevHash !== expectedPrevHash) {
      return { isValid: false, brokenAtIndex: i, totalChecked: list.length };
    }

    // Recompute and verify payload hash
    const recomputed = await computeEntryHash(current.prevHash, current);
    if (recomputed !== current.hash) {
      return { isValid: false, brokenAtIndex: i, totalChecked: list.length };
    }
  }

  return { isValid: true, totalChecked: list.length };
}
