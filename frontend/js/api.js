/*
 * Facial Biometric Assessment Guide
 * Optional link to the backend. Does nothing unless FBAG_CONFIG.apiBase is set.
 * Attached files are never sent. They stay in the browser.
 *
 * Author: Dee Williamson
 * November 2026
 */

const Remote = (() => {
  const base = (window.FBAG_CONFIG && window.FBAG_CONFIG.apiBase) || "";
  const enabled = !!base;
  const ID_KEY = "fbag-v1-id";
  let timer = null;

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function recordId() {
    let id = null;
    try {
      id = localStorage.getItem(ID_KEY);
      if (!id) {
        id = newId();
        localStorage.setItem(ID_KEY, id);
      }
    } catch (e) {
      id = id || newId();
    }
    return id;
  }

  /* Start a new record on the backend, leaving the previous one in place. */
  function newRecord() {
    try {
      localStorage.removeItem(ID_KEY);
    } catch (e) {}
  }

  /* Fetch the saved record. Resolves to null when there is none or the backend is off. */
  function load() {
    if (!enabled) return Promise.resolve(null);
    return fetch(base + "/assessments/" + recordId())
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }

  /* Send the record shortly after the last change, so typing does not flood the backend. */
  function queueSave(record, updatedAt) {
    if (!enabled) return;
    clearTimeout(timer);
    const body = JSON.stringify({ record: record, updatedAt: updatedAt });
    timer = setTimeout(() => {
      fetch(base + "/assessments/" + recordId(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: body,
      }).catch(() => {});
    }, 800);
  }

  return { enabled, load, queueSave, newRecord };
})();
