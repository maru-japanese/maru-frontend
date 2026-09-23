import { normalizeSnapshot, mergeSnapshots } from "/shared/progress.js";
import { getProgress, saveProgress, getAccount, setApiAccount, signOut } from "../api.js";

const GUEST_KEY = "maru-learning-v2";
const identityKey = "maru-active-account";
const keyFor = id => id ? "maru-account-" + id + "-v2" : GUEST_KEY;
function readLocal(key = GUEST_KEY) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) return normalizeSnapshot(saved);
    if (key !== GUEST_KEY) return normalizeSnapshot();
    const legacy = {}, keys = { progress: "progress", streak: "streak", xp: "xp", stats: "stats", kanaStats: "kana" };
    for (const [field, suffix] of Object.entries(keys)) legacy[field] = JSON.parse(localStorage.getItem("maru-" + suffix + "-v1") || localStorage.getItem("nihongo-dojo-" + suffix + "-v1") || "null");
    return normalizeSnapshot(legacy);
  } catch { return normalizeSnapshot(); }
}
const readIdentity = () => { try { return JSON.parse(localStorage.getItem(identityKey)) || null; } catch { return null; } };
export async function createStore(onStatus) {
  let user = readIdentity(), verified = false, googleEnabled = false, emailEnabled = false;
  try { const state = await getAccount(); user = state.user; googleEnabled = state.googleEnabled; emailEnabled = state.emailEnabled; verified = true; } catch {}
  // Never mix an offline account cache with the anonymous profile.
  if (!user || typeof user.id !== "string" || !/^[a-f0-9-]{36}$/.test(user.id)) user = null;
  let key = keyFor(user?.id), snapshot = readLocal(key);
  setApiAccount(user?.id);
  try { if (user) localStorage.setItem(identityKey, JSON.stringify(user)); else if (verified) localStorage.removeItem(identityKey); } catch {}
  let localAvailable = true, remoteAvailable = false, timer, dirty = false, saving = null, stopped = false, changedAccount = false;
  const persistLocal = () => { try { localStorage.setItem(key, JSON.stringify(snapshot)); localAvailable = true; } catch { localAvailable = false; } };
  // Account creation imports the browser's work once, without exposing another account's cache.
  const importKey = user ? "maru-imported-guest-" + user.id : "";
  let importPending = false;
  try { importPending = Boolean(user && verified && !localStorage.getItem(importKey)); } catch {}
  if (importPending) snapshot = mergeSnapshots(readLocal(), snapshot);
  if (verified) {
    try { snapshot = mergeSnapshots(snapshot, await getProgress()); remoteAvailable = true; dirty = true; } catch {}
  }
  persistLocal();
  const report = status => onStatus(status || (remoteAvailable ? "saved" : localAvailable ? "local" : "unsaved"));
  const flush = async () => {
    clearTimeout(timer);
    if (stopped) return;
    if (saving) { await saving; if (dirty && remoteAvailable) return flush(); return; }
    if (!dirty) return;
    saving = (async () => {
      dirty = false;
      try {
        // Check identity before every batch, including reconnects and expired cookies.
        const state = await getAccount();
        if ((state.user?.id || "") !== (user?.id || "")) {
          remoteAvailable = false; dirty = true; changedAccount = true;
          report("account-changed");
          return;
        }
        verified = true;
        const sent = structuredClone(snapshot);
        const merged = await saveProgress(sent);
        Object.assign(snapshot, mergeSnapshots(snapshot, merged));
        persistLocal();
        if (importPending) {
          try { localStorage.setItem(importKey, "1"); } catch {}
          importPending = false;
        }
        remoteAvailable = true;
      } catch { remoteAvailable = false; dirty = true; }
      finally { if (remoteAvailable) report(); else if (!verified) report(); }
    })();
    await saving; saving = null;
    if (dirty && remoteAvailable) return flush();
    if (!remoteAvailable) report(changedAccount ? "account-changed" : localAvailable ? "local" : "unsaved");
  };
  window.addEventListener("online", () => { dirty = true; void flush(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) void flush(); });
  window.addEventListener("storage", event => {
    if (event.key === identityKey && (readIdentity()?.id || "") !== (user?.id || "")) {
      stopped = true; clearTimeout(timer); report("account-changed");
    }
  });
  report();
  if (dirty) timer = setTimeout(flush, 250);
  return {
    get snapshot() { return snapshot; },
    get account() { return { user, googleEnabled, emailEnabled, verified }; },
    save() {
      snapshot.updatedAt = Date.now(); persistLocal(); dirty = true;
      if (stopped) { report("account-changed"); return; }
      report("saving"); clearTimeout(timer); timer = setTimeout(flush, 250);
    },
    flush,
    async logout() {
      await flush();
      await signOut();
      stopped = true; clearTimeout(timer); setApiAccount("");
      try { localStorage.removeItem(identityKey); } catch {}
      location.assign("/#/settings"); location.reload();
    }
  };
}
