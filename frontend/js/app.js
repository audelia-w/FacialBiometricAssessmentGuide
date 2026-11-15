/*
 * Facial Biometric Assessment Guide
 * Application logic: state, tier logic, page views, record export and events.
 *
 * Author: Dee Williamson
 * November 2026
 */

/* ---------- State ---------- */
const KEY = "fbag-v1";
function fresh() {
  const crit = {};
  Object.keys(CRIT).forEach(
    (g) =>
      (crit[g] = { label: "", findings: "", sources: "", version: "", limits: "", verified: "", files: [] }),
  );
  return {
    meta: { service: "", manager: "", decisionMaker: "", assessor: "", date: "" },
    screen: {
      purpose: "",
      inScope: "",
      scopeNote: "",
      mode: "",
      choice: "",
      consequences: "",
      restricts: "",
      vendorDep: "",
      children: false,
      overseas: false,
      enrolment: "",
      scale: "",
      consequencesText: "",
      vendorText: "",
      tierOverride: "",
      tierReason: "",
    },
    crit,
    decide: {
      outcome: "",
      reasons: "",
      gaps: "",
      trial: "",
      maori: "",
      approver: "",
      approvalDate: "",
      conditions: [],
    },
    impl: { checks: {}, notes: "" },
    monitor: { checks: {}, who: {}, report: {}, custom: [], notes: "" },
    reassess: {
      reviewDate: "",
      reviewWhy: "",
      watchlist: "",
      reTriggers: "",
      triggers: "",
      whoActs: "",
      restart: "",
    },
  };
}
function merge(base, extra) {
  if (!extra || typeof extra !== "object") return base;
  Object.keys(extra).forEach((k) => {
    if (Array.isArray(extra[k])) base[k] = extra[k];
    else if (
      extra[k] &&
      typeof extra[k] === "object" &&
      base[k] &&
      typeof base[k] === "object" &&
      !Array.isArray(base[k])
    )
      merge(base[k], extra[k]);
    else base[k] = extra[k];
  });
  return base;
}
let S = fresh(),
  view = "map",
  stored = true;
try {
  const raw = localStorage.getItem(KEY);
  if (raw) S = merge(fresh(), JSON.parse(raw));
} catch (e) {
  stored = false;
}
let T = { changed: 0, exported: 0 };
try {
  T = Object.assign(T, JSON.parse(localStorage.getItem(KEY + "-t") || "{}"));
} catch (e) {}
function saveT() {
  try {
    localStorage.setItem(KEY + "-t", JSON.stringify(T));
  } catch (e) {}
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
    stored = true;
  } catch (e) {
    stored = false;
  }
  T.changed = Date.now();
  saveT();
  stat();
  Remote.queueSave(S, T.changed);
}
function stat() {
  const el = document.getElementById("savestat");
  if (!el) return;
  if (!T.changed) {
    el.textContent = "";
    return;
  }
  if (!stored) {
    el.textContent = "Not saved in this browser. Use Save record to keep your work.";
    return;
  }
  el.textContent = "";
}
function get(p) {
  return p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), S);
}
function set(p, v) {
  const k = p.split(".");
  let o = S;
  for (let i = 0; i < k.length - 1; i++) {
    if (o[k[i]] == null) o[k[i]] = {};
    o = o[k[i]];
  }
  o[k[k.length - 1]] = v;
}
const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

/* ---------- Tier logic (reading of thesis Table 4.1; highest fitting tier applies) ---------- */
function suggestTier() {
  const s = S.screen,
    why = [];
  if (s.mode === "none")
    return { tier: "0", why: ["The proposal does not match faces to identity records."] };
  if (s.mode === "cat")
    return { tier: "out", why: ["Facial biometric categorisation is outside this model."] };
  if (s.mode === "id") return { tier: "3", why: ["One-to-many identification is Tier 3."] };
  if (s.mode !== "ver") return null;
  if (!s.choice || !s.consequences) return null;
  if (s.choice === "little" && s.consequences === "serious")
    return {
      tier: "3",
      why: ["Verification with little meaningful choice and potentially serious consequences."],
    };
  if (s.restricts === "yes") why.push("Verification restricts access to a service.");
  if (s.choice === "difficult" || s.choice === "little") why.push("Verification is difficult to avoid.");
  if (s.consequences === "material" || s.consequences === "serious")
    why.push("Consequences are moderate or serious.");
  if (s.vendorDep === "yes")
    why.push("The organisation relies heavily on a vendor with limited visibility or control.");
  if (why.length) return { tier: "2", why };
  return {
    tier: "1",
    why: ["Optional verification with a genuine non-biometric alternative and limited consequences."],
  };
}
function tier() {
  const sg = suggestTier();
  return S.screen.tierOverride || (sg ? sg.tier : "");
}
function screenStarted() {
  const m = S.meta,
    c = S.screen;
  return !!(Object.values(m).some((v) => v) || Object.keys(c).some((k) => c[k] && c[k] !== false));
}
function tierName() {
  const t = tier();
  return t ? TIERS[t].name : "Not yet set";
}
const isId = () => S.screen.mode === "id";

/* ---------- Progress helpers ---------- */
function areaDone(a) {
  return a.crit.filter((g) => S.crit[g].label).length;
}
function gaps() {
  return Object.keys(CRIT).filter((g) => ["par", "ins"].includes(S.crit[g].label));
}
function unset() {
  return Object.keys(CRIT).filter((g) => !S.crit[g].label);
}

/* ---------- Field builders ---------- */
function ta(p, label, hint) {
  return `<label class="f"><span>${label}</span>${hint ? `<small>${hint}</small>` : ""}<textarea data-p="${p}">${esc(get(p))}</textarea></label>`;
}
function tx(p, label, type) {
  return `<label class="f"><span>${label}</span><input type="${type || "text"}" data-p="${p}" value="${esc(get(p))}"></label>`;
}
function radios(p, label, opts, cls) {
  const v = get(p);
  return `<div class="lab">${label}</div><div class="opts ${cls || ""}" role="radiogroup" aria-label="${esc(label)}">${opts.map((o) => `<label class="${o[2] || ""}"><input type="radio" name="${p}" data-p="${p}" value="${o[0]}" ${v === o[0] ? "checked" : ""}>${o[1]}</label>`).join("")}</div>`;
}
function chk(p, label) {
  return `<label class="chk"><input type="checkbox" data-p="${p}" ${get(p) ? "checked" : ""}><span>${label}</span></label>`;
}
function navrow() {
  const i = VIEWS.indexOf(view);
  return `<div class="navrow">${i > 0 ? `<button class="btn ghost" data-go="${VIEWS[i - 1]}">Back</button>` : "<span></span>"}${i < VIEWS.length - 1 ? `<button class="btn" data-go="${VIEWS[i + 1]}">Next</button>` : ""}</div>`;
}

/* ---------- Sidebar ---------- */
function side() {
  const b = (v, html, cls) =>
    `<button class="${cls || ""} ${view === v ? "on" : ""}" data-go="${v}">${html}</button>`;
  const d = S.decide.outcome ? OUTCOMES[S.decide.outcome].n : "";
  return (
    b("map", "Overview map", "stage") +
    b("screen", `Screen<span class="r">${esc(tier() ? tierName() : "")}</span>`, "stage") +
    `<button class="stage" data-go="a1">Assess<span class="r">${19 - unset().length}/19</span></button>` +
    AREAS.map((a) =>
      b(
        "a" + a.id,
        `<span class="num">${a.id}.</span>${a.name}<span class="r">${areaDone(a)}/${a.crit.length}</span>`,
        "sub",
      ),
    ).join("") +
    b("decide", `Decide<span class="r">${esc(d)}</span>`, "stage") +
    b("implement", `Implement`, "stage") +
    b("monitor", `Monitor`, "stage") +
    b("reassess", `Reassess`, "stage") +
    b("record", "Assessment record", "stage") +
    `<div class="sidehead">References</div><button class="sub" data-act="crits">Criteria list</button><button class="sub" data-act="rules">Code rules</button>`
  );
}

/* ---------- Dynamic blocks ---------- */
const DYN = {
  tierBox() {
    const sg = suggestTier(),
      t = tier();
    if (!t)
      return `<div class="tier"><div class="big">Provisional tier: not yet set</div><p class="hint">Complete the questions above to see the suggested tier.</p></div>`;
    const T = TIERS[t],
      s = S.screen,
      esc8 = [];
    if (s.children) esc8.push("children or other potentially vulnerable groups");
    if (s.vendorDep === "yes") esc8.push("limited organisational control over a vendor");
    if (s.overseas) esc8.push("overseas processing");
    return `<div class="tier"><div class="big">Provisional tier: ${T.name}</div><p>${T.desc}</p>
   ${S.screen.tierOverride && sg && sg.tier !== t ? `<p class="hint">You set this tier. The screening answers suggest ${TIERS[sg.tier].name}.</p>` : sg ? `<p class="hint">Why: ${sg.why.join(" ")}</p>` : ""}
   <p><b>What the model requires:</b> ${T.req}</p>
   ${esc8.length && (t === "1" || t === "2") ? `<p class="hint">You recorded ${esc8.join(", ")}. These circumstances may justify a higher tier. If you raise the tier, record the reasons below.</p>` : ""}
   <p class="hint">Where a proposed use fits more than one tier, the highest applies. Human review is a safeguard and does not lower the tier. Evidence gaps are recorded in the assessment, not in the tier. Revisit the tier as information becomes available.</p></div>`;
  },
  gapBox() {
    const g = gaps(),
      u = unset(),
      t = tier();
    let h = "";
    if (u.length)
      h += `<div class="note"><b>${u.length} of 19 criteria still ${u.length === 1 ? "needs" : "need"} an evidence label:</b> ${u.join(", ")}.</div>`;
    if (g.length)
      h += `<div class="note"><b>Evidence gaps recorded:</b><ul class="links">${g.map((x) => `<li>${x} ${esc(cname(x).split(":")[0])}: ${LABELS[S.crit[x].label]}</li>`).join("")}</ul>Consider whether these gaps prevent a justified decision. Partial or insufficient information does not, by itself, establish that a safeguard is absent.</div>`;
    if (!u.length && !g.length)
      h += `<div class="note q">All 19 criteria are labelled and none is recorded as partial or insufficient. The labels describe the information available, not whether a requirement is met. Sufficient information may still reveal a problem.</div>`;
    if (t === "3")
      h += `<div class="note">Tier 3: document Māori advice or engagement before approval.</div>`;
    if (t === "2")
      h += `<div class="note">Tier 2: document Māori advice or engagement before approval where potentially significant cultural impacts have been identified.</div>`;
    return h;
  },
  outcomeBox() {
    const o = S.decide.outcome;
    if (!o) return "";
    const O = OUTCOMES[o];
    let h = `<div class="note q"><b>${O.n}.</b> ${O.d} <b>${O.next}</b></div>`;
    if ((o === "proceed" || o === "conditions") && gaps().some((g) => S.crit[g].label === "ins"))
      h += `<div class="note">At least one criterion is recorded as having insufficient information. Where further evidence is needed to establish compliance with a legal requirement, approval conditions cannot replace that evidence.</div>`;
    if (o === "return")
      h += `<div class="note q">Where further evidence of effectiveness is required, consider whether a trial under Rule 1 of the Code is permitted. An eligible trial defers the necessity requirement only until the trial ends. All other requirements of the Code still apply.</div>`;
    return h;
  },
  approveBox() {
    const t = tier();
    return t && TIERS[t].approve
      ? `<p class="hint">Approval responsibility for ${TIERS[t].name}: ${TIERS[t].approve}</p>`
      : `<p class="hint">The required approver is based on the risk tier set at Screening.</p>`;
  },
};
function dyn(name) {
  return `<div data-dyn="${name}">${DYN[name]()}</div>`;
}

/* ---------- Supporting files (kept in this browser's own storage) ---------- */
let dbp = null,
  attG = "";
function db() {
  if (!dbp)
    dbp = new Promise((res, rej) => {
      try {
        const q = indexedDB.open("fbag-files", 1);
        q.onupgradeneeded = () => q.result.createObjectStore("files");
        q.onsuccess = () => res(q.result);
        q.onerror = () => rej(q.error);
      } catch (e) {
        rej(e);
      }
    });
  return dbp;
}
function idb(mode, fn) {
  return db().then(
    (d) =>
      new Promise((res, rej) => {
        const tx = d.transaction("files", mode);
        const rq = fn(tx.objectStore("files"));
        tx.oncomplete = () => res(rq && rq.result);
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error);
      }),
  );
}
const putFile = (id, blob) => idb("readwrite", (s) => s.put(blob, id));
const getFile = (id) => idb("readonly", (s) => s.get(id));
const delFile = (id) => idb("readwrite", (s) => s.delete(id));
const clearFiles = () => idb("readwrite", (s) => s.clear());
const MAXFILE = 10 * 1048576;
function fsize(n) {
  return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
}
function toDataURL(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(blob);
  });
}
function fromDataURL(u) {
  const i = u.indexOf(","),
    type = (u.slice(0, i).match(/data:([^;]*)/) || [])[1] || "";
  const bin = atob(u.slice(i + 1)),
    a = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k);
  return new Blob([a], { type });
}
function allFiles() {
  const out = [];
  Object.keys(S.crit).forEach((g) => (S.crit[g].files || []).forEach((f) => out.push(f)));
  return out;
}
function files(g) {
  const fl = S.crit[g].files || [];
  return `<div class="files"><div class="lab">Supporting files</div><small class="hint">Attach supporting documents if needed.</small>
  ${fl.length ? `<ul class="flist">${fl.map((f, i) => `<li><span>${esc(f.name)} <small>(${fsize(f.size)}${f.stored ? "" : ", name recorded only"})</small></span><span>${f.stored ? `<button class="lnk" data-act="openfile" data-g="${g}" data-i="${i}">Open</button>` : ""}${f.stored && /\.(txt|md|csv)$/i.test(f.name) ? `<button class="lnk" data-act="instext" data-g="${g}" data-i="${i}">Insert text</button>` : ""}<button class="lnk" data-act="delfile" data-g="${g}" data-i="${i}">Remove</button></span></li>`).join("")}</ul>` : ""}
  <button class="btn ghost" data-act="addfile" data-g="${g}">Attach files</button></div>`;
}

/* ---------- Views ---------- */
function critCard(g) {
  const c = CRIT[g],
    ps = PROMPTS.filter((p) => (p.once ? p.g[0] === g : p.g.includes(g))).sort((x, y) =>
      ORDER[g] ? ORDER[g].indexOf(x.t) - ORDER[g].indexOf(y.t) : 0,
    ),
    P = "crit." + g;
  return `<section class="card" id="c-${g}"><h3><span class="gid">${g}</span>${esc(c.h || c.n)}</h3>
  <ul class="prompts">${ps.map((p) => `<li><b>${(p.ts && p.ts[g]) || p.t}</b>${ruleLinks((p.qs && p.qs[g]) || p.q)}</li>`).join("")}</ul>
  ${c.note ? `<p class="hint" style="margin:8px 0 12px">${esc(c.note).replace(/G\d+/g, (m) => gL(m))}</p>` : ""}
  ${ta(P + ".findings", "Record what the evidence shows")}
  ${files(g)}
  ${radios(
    P + ".label",
    "Information available for assessment",
    Object.keys(LABELS).map((k) => [k, LABELS[k], k]),
    "lbl",
  )}
  <details ${S.crit[g].sources || S.crit[g].limits || S.crit[g].version || S.crit[g].verified ? "open" : ""}><summary>Evidence details: sources, dates, versions and limitations</summary>
  ${ta(P + ".sources", "Sources and dates")}
  <div class="grid2">${tx(P + ".version", "System version assessed, where known")}
  <label class="f"><span>Independently verified?</span><select data-p="${P}.verified">${[
    ["", "Not recorded"],
    ["yes", "Yes"],
    ["partly", "Partly"],
    ["no", "No"],
  ]
    .map((o) => `<option value="${o[0]}" ${S.crit[g].verified === o[0] ? "selected" : ""}>${o[1]}</option>`)
    .join("")}</select></label></div>
  ${ta(P + ".limits", "Limitations, or reasons if not applicable")}</details></section>`;
}
function vArea(a) {
  const t = tier();
  let h = `<h2>Area ${a.id}: ${a.name}</h2><p class="lede"><b>What this area checks:</b> ${a.checks[0].toLowerCase() + a.checks.slice(1)}</p>`;
  if (t === "0" || t === "out")
    h += `<div class="note">Screening recorded ${TIERS[t].name}. The nine areas apply to Tiers 1-3.</div>`;
  if (a.id === 5) {
    h += `<div class="note q">This guide uses published Māori Data Sovereignty principles and regulatory guidance to support the assessment. It does not define tikanga or decide what is culturally acceptable on behalf of Māori. Where needed, Māori advice or engagement should form part of the decision.</div>`;
    if (t === "3")
      h += `<div class="note">Tier 3: document Māori advice or engagement before approval.</div>`;
  }
  if (a.id === 7)
    h += `<div class="note q">The organisation remains responsible for biometric information processed by a provider. If the provider cannot supply important evidence, record the gap and how it affects the assessment.</div>`;
  if (a.id === 8 && t && TIERS[t].review)
    h += `<div class="note q"><b>${TIERS[t].name} human review:</b> ${TIERS[t].review}</div>`;
  a.crit.forEach((g) => {
    if (g === "G10")
      h += `<section class="card"><h3><span class="gid">G10</span>Overall proportionality</h3><p><b>Completed at the Decide stage.</b> This criterion is part of Area 1 because it supports the Rule 1 justification, but it draws on findings from all nine assessment areas.</p><button class="btn ghost" data-go="decide">Go to Decide</button></section>`;
    else h += critCard(g);
  });
  return h + navrow();
}
function vScreen() {
  return (
    `<h2>Stage 1: Screen</h2><p class="lede">Describe the proposed use and set an initial risk tier. The tier determines how much evidence and review are needed, who approves the decision and what human review applies. It does not mean the use is approved or lawful.</p>
  <section class="card"><h3>Use case and responsibility</h3><br>
  <div class="grid2">${tx("meta.service", "Service or proposed use")}${tx("meta.manager", "Manager responsible")}
  ${tx("meta.decisionMaker", "Accountable decision-maker")}${tx("meta.assessor", "Assessment completed by")}</div>
  ${tx("meta.date", "Assessment date", "date")}</section>
  <section class="card"><h3>What the system does</h3><br>
  <div class="note q">This guide covers facial verification and facial identification. Verification compares a face with a known reference to confirm a claimed identity. Identification compares a face against a watchlist or database to find a possible match. Other biometric uses are outside this assessment.</div>
  ${radios("screen.mode", "What does the system do?", [
    ["ver", "Verification (one-to-one)"],
    ["id", "Identification (one-to-many)"],
  ])}</section>
  <section class="card"><h3>Choice, consequences and control</h3><br>
  ${radios("screen.choice", "Can people genuinely choose whether to take part?", [
    ["genuine", "Yes, a non-biometric option is available"],
    ["difficult", "Hard to avoid"],
    ["little", "No real choice, for example scanned on entry"],
  ])}
  ${radios("screen.consequences", "What could happen if there is a match or error?", [
    ["limited", "Limited"],
    ["material", "Moderate"],
    ["serious", "Serious"],
  ])}
  ${radios("screen.restricts", "Does the biometric check restrict access to a service?", [
    ["yes", "Yes"],
    ["no", "No"],
  ])}
  ${radios(
    "screen.vendorDep",
    "Does the organisation rely heavily on a vendor with limited visibility or control?",
    [
      ["yes", "Yes"],
      ["no", "No"],
    ],
  )}
  ${chk("screen.children", "Children or other potentially vulnerable groups are involved")}
  ${chk("screen.overseas", "Information is processed or stored overseas")}</section>
  <section class="card"><h3>Screening record</h3><br>
  ${ta("screen.enrolment", "Choice and enrolment", "Describe how facial images are collected and compared, and whether people are added to an enrolled database. How is enrolment decided?")}
  ${ta("screen.scale", "Scale and population", "How many people are affected, how widely is the system used, and are children or other potentially vulnerable groups involved?")}
  ${ta("screen.consequencesText", "Consequences", "What happens after a match or error? Consider access to services, how the person may be affected and any adverse action.")}
  ${ta("screen.vendorText", "Vendor and location", "Identify the provider, any subcontractors, where the information is processed or stored, and how much visibility and control the organisation has.")}</section>
  ${dyn("tierBox")}
  <section class="card"><h3>Confirm or change the tier</h3><p class="hint">The suggested tier is based on your answers. The assessor can confirm or change it.</p>
  <table style="margin-bottom:14px"><tr><th style="width:70px">Tier</th><th>Description of proposed use</th></tr>${["1", "2", "3"].map((k) => `<tr><td><b>${TIERS[k].name}</b></td><td>${TIERS[k].desc}</td></tr>`).join("")}</table>
  <label class="f"><span>Confirm or select a tier</span><select data-p="screen.tierOverride">${[
    ["", "Use the suggested tier"],
    ["1", "Tier 1"],
    ["2", "Tier 2"],
    ["3", "Tier 3"],
  ]
    .map(
      (o) => `<option value="${o[0]}" ${S.screen.tierOverride === o[0] ? "selected" : ""}>${o[1]}</option>`,
    )
    .join("")}</select></label>
  ${ta("screen.tierReason", "Reasons for the tier", "Explain why this tier was selected, including any reasons for increasing the tier.")}</section>` +
    navrow()
  );
}
function vDecide() {
  const conds = S.decide.conditions;
  return (
    `<h2>Stage 3: Decide</h2><p class="lede">Review the overall assessment, record the decision and explain why. The risk tier sets the level of evidence and approval needed, but the decision depends on what the evidence shows and whether any important gaps remain.</p>
  ${dyn("gapBox")}
  <section class="card" id="c-G10"><h3><span class="gid">G10</span>Overall proportionality</h3>
  <ul class="prompts"><li>${ruleLinks(`After reviewing all nine areas, weigh the expected benefits against the privacy and cultural impacts, including effects on Māori. Consider who receives the benefits and who may carry the risks. If the main benefit is to the organisation itself, check that it outweighs the privacy risk by a substantial margin (Rule 1(4)). If the justification depends on a trial, record what evidence the trial must provide. Record the conclusion, remaining risks and reasons.`)}</li></ul>
  ${ta("crit.G10.findings", "Overall proportionality conclusion and reasons")}
  ${files("G10")}
  ${radios(
    "crit.G10.label",
    "Information available for assessment",
    Object.keys(LABELS).map((k) => [k, LABELS[k], k]),
    "lbl",
  )}</section>
  <section class="card"><h3>Decision outcome</h3><br>
  ${radios(
    "decide.outcome",
    "Outcome",
    Object.keys(OUTCOMES).map((k) => [k, OUTCOMES[k].n]),
  )}
  ${dyn("outcomeBox")}
  ${ta("decide.reasons", "Reasons for the decision")}
  ${ta("decide.gaps", "Missing requirements or important evidence gaps", "If more evidence is needed, record what is missing.")}
  ${ta("decide.maori", "Māori advice or engagement", "Record who contributed, their role, the advice or concerns raised, and how these informed the decision. Participation does not mean endorsement.")}
  ${ta("decide.trial", "Trial to gather evidence, if needed", "Where necessity cannot yet be established, Rule 1 allows a time-limited trial to gather evidence about effectiveness. Record what the trial will test, how long it will run and what evidence is needed before a final decision. Other Code requirements still apply.")}</section>
  <section class="card"><h3>Conditions</h3><p class="hint">For each condition, record who is responsible, what must be done, the due date and what happens if it is not completed.</p>
  ${conds.length ? `<table><tr><th>Responsible</th><th>Action or evidence required</th><th>Due date</th><th>Consequence if unmet</th><th class="noprint"></th></tr>${conds.map((c, i) => `<tr><td><input type="text" aria-label="Responsible" data-p="decide.conditions.${i}.who" value="${esc(c.who)}"></td><td><input type="text" aria-label="Action or evidence" data-p="decide.conditions.${i}.what" value="${esc(c.what)}"></td><td><input type="date" aria-label="Due date" data-p="decide.conditions.${i}.due" value="${esc(c.due)}"></td><td><input type="text" aria-label="Consequence" data-p="decide.conditions.${i}.consequence" value="${esc(c.consequence)}"></td><td class="noprint"><button class="btn ghost" data-act="delcond" data-i="${i}" aria-label="Remove condition">Remove</button></td></tr>`).join("")}</table><br>` : ""}
  <button class="btn ghost" data-act="addcond">Add a condition</button></section>
  <section class="card"><h3>Approval</h3>${dyn("approveBox")}
  <div class="grid2">${tx("decide.approver", "Approved by (name and role)")}${tx("decide.approvalDate", "Date", "date")}</div></section>` +
    navrow()
  );
}
function vImplement() {
  return (
    `<h2>Stage 4: Implement</h2><p class="lede">Put the approved safeguards in place before the system is used. This stage follows a decision to Proceed or Proceed with conditions.</p>
  <section class="card">${IMPL.map((x) => chk("impl.checks." + x[0], x[1])).join("")}<br>${ta("impl.notes", "Implementation notes", "Record any important implementation details, outstanding conditions or changes made before use begins.")}</section>` +
    navrow()
  );
}
function monRow(k, label) {
  return `<tr><td style="text-align:center"><input type="checkbox" aria-label="Assigned: ${label}" data-p="monitor.checks.${k}" ${get("monitor.checks." + k) ? "checked" : ""}></td><td>${label}</td><td><input type="text" placeholder="Person, team or role" aria-label="Responsible: ${label}" data-p="monitor.who.${k}" value="${esc(get("monitor.who." + k))}"></td><td><input type="text" placeholder="Who receives it and how often" aria-label="Reporting: ${label}" data-p="monitor.report.${k}" value="${esc(get("monitor.report." + k))}"></td><td></td></tr>`;
}
function vMonitor() {
  const head = `<tr><th style="width:70px">Assigned</th><th style="width:26%">Measure</th><th>Responsible</th><th>Reporting</th><th style="width:80px"></th></tr>`;
  const cu = S.monitor.custom || [];
  return (
    `<h2>Stage 5: Monitor</h2><p class="lede">Assign responsibility for monitoring and decide what will be measured. Monitoring should show whether the system is still effective, whether safeguards are working and whether new issues are emerging.</p>
  <section class="card"><h3>Measures</h3><br><table>${head}${MON.map((x) => monRow(x[0], x[1])).join("")}
  ${isId() ? `<tr><th colspan="5">Identification systems</th></tr>${MON_ID.map((x) => monRow(x[0], x[1])).join("")}` : ""}
  ${cu.length ? `<tr><th colspan="5">Your own measures</th></tr>${cu.map((c, i) => `<tr><td></td><td><input type="text" placeholder="Measure" aria-label="Measure" data-p="monitor.custom.${i}.name" value="${esc(c.name)}"></td><td><input type="text" placeholder="Person, team or role" aria-label="Responsible" data-p="monitor.custom.${i}.who" value="${esc(c.who)}"></td><td><input type="text" placeholder="Who receives it and how often" aria-label="Reporting" data-p="monitor.custom.${i}.report" value="${esc(c.report)}"></td><td><button class="lnk" data-act="delmon" data-i="${i}">Remove</button></td></tr>`).join("")}` : ""}</table>
  ${isId() ? "" : `<p class="hint" style="margin-top:10px">For identification systems, also monitor alerts, confirmed and rejected matches, misidentifications, watchlist size and eligibility, and any disproportionate impact on particular groups.</p>`}
  <br><button class="btn ghost" data-act="addmon">Add a measure</button><br><br>${ta("monitor.notes", "Notes")}</section>
  <p class="hint">Monitoring findings inform G18 in Area 9. Provider monitoring also supports G16 in Area 7.</p>` +
    navrow()
  );
}
function vReassess() {
  return (
    `<h2>Stage 6: Reassess</h2><p class="lede">Review the use at the scheduled date, before major planned changes, or sooner if an incident or unexpected change affects the risk. Decide whether the use can continue, needs changes or should be suspended.</p>
  <section class="card"><h3>Review schedule</h3><br>
  ${tx("reassess.reviewDate", "Next review date", "date")}
  ${ta("reassess.reviewWhy", "Why this frequency?", "Explain why this review frequency is appropriate for the use, its potential consequences and any unresolved evidence gaps. Higher-risk uses may need more frequent review.")}
  ${isId() ? ta("reassess.watchlist", "Watchlist entry checks", "Review individual watchlist entries separately from reviewing the deployment as a whole.") : `<p class="hint">For identification systems, review individual watchlist entries separately from reviewing the deployment as a whole.</p>`}</section>
  <section class="card"><h3>Reassessment and suspension</h3><br>
  ${ta("reassess.reTriggers", "What should trigger reassessment?", "Consider serious errors, discriminatory outcomes, repeated complaints, security incidents, an expanded purpose, or changes to the provider, system, population or data location.")}
  ${ta("reassess.triggers", "Suspension triggers", "Record when the use should be paused or stopped.")}${ta("reassess.whoActs", "Who can suspend the use?")}${ta("reassess.restart", "Requirements for restarting", "Record what must be addressed or demonstrated before the use can restart.")}</section>` +
    navrow()
  );
}
function vMap() {
  const t = tier(),
    o = S.decide.outcome;
  const chip = (g) =>
    `<span class="chip ${S.crit[g].label}" title="${g}: ${esc(cname(g))}${S.crit[g].label ? " (" + LABELS[S.crit[g].label] + ")" : ""}">${g}</span>`;
  return (
    `<h2>How the Assessment Works</h2>
  <p class="lede">The risk tier sets how much evidence and review is needed. The nine areas bring together 19 criteria and lead to an overall decision. Select any box to continue.</p>
  ${!stored ? `<div class="note">This browser is not keeping your entries between visits. Use "Save record" before you close the page.</div>` : ""}
  <div class="loop">Reassessment revisits the proposed use and decision</div>
  <div class="flow">
   <button data-go="screen"><b>1. SCREEN</b>Define the use and set the risk tier</button>
   <button data-go="a1"><b>2. ASSESS</b>Review evidence across nine areas</button>
   <button data-go="decide"><b>3. DECIDE</b>Record the decision and reasons</button>
   <button class="post" data-go="implement"><b>4. IMPLEMENT</b>Put approved safeguards in place</button>
   <button class="post" data-go="monitor"><b>5. MONITOR</b>Track performance, complaints and incidents</button>
   <button class="post" data-go="reassess"><b>6. REASSESS</b>Review the use and risks</button>
  </div>
  <div class="cols">
   <div><h3>Risk tier</h3>
    <div class="card"><b>Case:</b> ${esc(S.meta.service || "not named yet")}<span class="tierval ${t ? "" : "unset"}">${esc(tierName())}</span>
    ${t ? `<p class="hint">${TIERS[t].desc}</p>` : `<p class="hint">Set during Screening based on how the biometric is used, whether people have a choice, who is enrolled, the scale and possible consequences.</p>`}
    ${t && TIERS[t].approve ? `<p class="hint" style="margin-top:10px"><b>Approval:</b> ${TIERS[t].approve}</p><p class="hint" style="margin-top:10px;margin-bottom:10px"><b>Human review:</b> ${TIERS[t].review}</p>` : ""}
    <button class="btn ghost" data-go="screen">${t ? "Review Screening" : screenStarted() ? "Continue Screening" : "Start Screening"}</button></div>
   </div>
   <div><h3>Nine assessment areas, nineteen criteria</h3>
    <div class="areas">${AREAS.map((a) => `<button class="area" data-go="a${a.id}"><span class="n">${a.id}.</span><span class="nm">${a.name}</span><div class="chips">${a.crit.map(chip).join("")}</div></button>`).join("")}</div>
   </div>
   <div><h3>Decision</h3>
    <div class="out" style="border-style:dashed"><b>Overall assessment</b>Brings together findings from all nine areas.</div>
    ${Object.keys(OUTCOMES)
      .map((k) => `<div class="out ${o === k ? "sel" : ""}"><b>${OUTCOMES[k].n}</b>${OUTCOMES[k].next}</div>`)
      .join("")}
    <div style="text-align:right"><button class="btn ghost" data-go="decide">Go to Decide</button></div>
   </div>
  </div>
  <div class="legend"><span><span class="chip">G</span> No label yet</span><span><span class="chip suf">G</span> Sufficient information</span><span><span class="chip par">G</span> Partial information</span><span><span class="chip ins">G</span> Insufficient information</span><span><span class="chip na">G</span> Not applicable</span><span class="lnote">Labels describe the information available for assessment. They do not show whether a requirement has been met or approval is justified.</span></div>
  <section class="card" style="margin-top:16px"><h3>How the parts connect:</h3>
   <p class="hint" style="margin:6px 0 12px">Select an underlined stage or area to open it.</p>
   <ul class="links">
    <li><b>The risk tier sets the level of assessment.</b> Higher-risk uses need stronger evidence, more oversight and more frequent review (${sL("screen", "Screen")}).</li>
    <li><b>Risk and evidence are shown separately.</b> The tier shows the level of risk. The evidence labels show how much information is available.</li>
    <li><b>The nine areas build the overall decision.</b> Together, they help decide whether the proposed use should proceed, proceed with conditions, return for more evidence or be declined (${sL("decide", "Decide")}).</li>
    <li><b>Missing evidence affects the outcome.</b> If important information is missing, the assessment can be sent back for more evidence (${sL("decide", "Decide")}).</li>
    <li><b>The assessment looks at technical, vendor and cultural evidence.</b> It considers how well the system works (${aL(2)}), how it performs for different groups (${aL(3)}), what the provider can support (${aL(7)}), and impacts on Māori and Māori Data Sovereignty (${aL(5)}).</li>
    <li><b>The process continues after approval.</b> Conditions are carried into implementation (${sL("implement", "Implement")}), while monitoring (${sL("monitor", "Monitor")}) and major changes can trigger reassessment (${sL("reassess", "Reassess")}).</li>
   </ul></section>
   <p class="foot">The risk tiers, approval arrangements and review schedules come from the governance model. The questions support assessment. This is not legal advice.</p>` +
    `<div class="navrow"><span></span><button class="btn" data-go="screen">${screenStarted() ? "Continue Screening" : "Start with Screening"}</button></div>`
  );
}
function vRecord(x) {
  const v = (x) => (x ? esc(x) : `<span class="empty">Not recorded</span>`);
  const row = (k, x) => `<dt>${k}</dt><dd>${v(x)}</dd>`;
  const s = S.screen,
    t = tier(),
    sg = suggestTier();
  const pick = (m, k) => (k ? m[k] : "");
  let h = `<h2>Assessment record</h2>${x ? "" : `<p class="lede noprint">Everything recorded so far, in one document. "Save record" downloads it as a file you can read, share and reopen here later. "Print record" prints it or saves it as a PDF.</p>`}
  <div class="rec">
  <h3>Use case</h3><dl>${row("Service or proposed use", S.meta.service)}${row("Manager responsible", S.meta.manager)}${row("Accountable decision-maker", S.meta.decisionMaker)}${row("Assessment completed by", S.meta.assessor)}${row("Assessment date", S.meta.date)}</dl>
  <h3>Stage 1: Screening and risk tier</h3><dl>
  ${row("What the system does", pick({ ver: "Verification (one-to-one)", id: "Identification (one-to-many)", cat: "Another facial or biometric use", none: "No facial matching" }, s.mode))}
  ${row("Choice", pick({ genuine: "A non-biometric option is available", difficult: "Hard to avoid", little: "No real choice" }, s.choice))}
  ${row("Consequences", pick({ limited: "Limited", material: "Moderate", serious: "Serious" }, s.consequences))}
  ${row("Restricts access to a service", pick({ yes: "Yes", no: "No" }, s.restricts))}${row("Significant vendor dependency with limited control", pick({ yes: "Yes", no: "No" }, s.vendorDep))}
  ${row("Children or other potentially vulnerable groups", s.children ? "Yes" : "Not recorded as involved")}${row("Overseas processing", s.overseas ? "Yes" : "Not recorded")}
  ${row("Choice and enrolment", s.enrolment)}${row("Scale and population", s.scale)}${row("Consequences, described", s.consequencesText)}${row("Vendor and location", s.vendorText)}
  ${row("Provisional tier", t ? TIERS[t].name + (s.tierOverride && sg && sg.tier !== t ? " (set by the assessor; screening answers suggest " + TIERS[sg.tier].name + ")" : "") : "")}${row("Reasons for the tier", s.tierReason)}</dl>
  <h3>Stage 2: Assessment across nine areas</h3>`;
  AREAS.forEach((a) => {
    h += `<h4 style="margin:14px 0 4px">Area ${a.id}: ${a.name}</h4><table><tr><th style="width:24%">Criterion</th><th style="width:15%">Information available</th><th>What the evidence shows</th><th style="width:26%">Sources, version, limitations</th></tr>`;
    a.crit.forEach((g) => {
      const c = S.crit[g];
      const ev = [
        c.sources && "Sources: " + c.sources,
        c.version && "Version: " + c.version,
        c.limits && "Limitations: " + c.limits,
        c.verified && "Independently verified: " + c.verified,
        (c.files || []).length && "Files: " + c.files.map((f) => f.name).join(", "),
      ]
        .filter(Boolean)
        .join("\n");
      h += `<tr><td><b>${g}</b> ${esc(cname(g).split(":")[0])}</td><td>${c.label ? LABELS[c.label] : `<span class="empty">No label</span>`}</td><td style="white-space:pre-wrap">${v(c.findings)}</td><td style="white-space:pre-wrap">${v(ev)}</td></tr>`;
    });
    h += `</table>`;
  });
  const d = S.decide;
  h += `<h3>Stage 3: Decision</h3><dl>${row("Outcome", d.outcome ? OUTCOMES[d.outcome].n : "")}${row("Reasons", d.reasons)}${row("Missing requirements or important evidence gaps", d.gaps)}${row("Māori advice or engagement", d.maori)}${row("Trial to gather evidence", d.trial)}${row("Approved by", d.approver)}${row("Approval date", d.approvalDate)}</dl>`;
  if (d.conditions.length)
    h += `<table><tr><th>Responsible</th><th>Action or evidence required</th><th>Due date</th><th>Consequence if unmet</th></tr>${d.conditions.map((c) => `<tr><td>${v(c.who)}</td><td>${v(c.what)}</td><td>${v(c.due)}</td><td>${v(c.consequence)}</td></tr>`).join("")}</table>`;
  const ticks = (list, obj) => list.map((x) => `${obj[x[0]] ? "Done" : "Open"}: ${x[1]}`).join("\n");
  h += `<h3>Stage 4: Implementation</h3><dl>${row("Checks", ticks(IMPL, S.impl.checks))}${row("Notes", S.impl.notes)}</dl>
  <h3>Stage 5: Monitoring</h3><table><tr><th>Measure</th><th>Assigned</th><th>Responsible</th><th>Reporting</th></tr>${(isId() ? MON.concat(MON_ID) : MON).map((x) => `<tr><td>${x[1]}</td><td>${S.monitor.checks[x[0]] ? "Yes" : "No"}</td><td>${v((S.monitor.who || {})[x[0]])}</td><td>${v((S.monitor.report || {})[x[0]])}</td></tr>`).join("")}${(S.monitor.custom || []).map((c) => `<tr><td>${v(c.name)}</td><td>Yes</td><td>${v(c.who)}</td><td>${v(c.report)}</td></tr>`).join("")}</table><dl>${row("Notes", S.monitor.notes)}</dl>
  <h3>Stage 6: Reassessment</h3><dl>${row("Next review date", S.reassess.reviewDate)}${row("Why this frequency", S.reassess.reviewWhy)}${isId() ? row("Watchlist entry checks", S.reassess.watchlist) : ""}${row("Reassessment triggers", S.reassess.reTriggers)}${row("Suspension triggers", S.reassess.triggers)}${row("Who can suspend", S.reassess.whoActs)}${row("Requirements for restarting", S.reassess.restart)}</dl>
  </div>
  <p class="foot">Labels describe the information available for assessment, not whether a requirement has been met. Missing information does not establish that a safeguard is absent. This record supports an organisational assessment and does not demonstrate compliance by itself.</p>`;
  return h + (x ? "" : navrow());
}
function parseSaved(text) {
  const m = text.match(/<script type="application\/json" id="fbag-data">([\s\S]*?)<\/script>/);
  return JSON.parse(m ? m[1] : text);
}
function isRecord(d) {
  return !!(
    d &&
    typeof d === "object" &&
    !Array.isArray(d) &&
    d.meta &&
    d.screen &&
    d.crit &&
    typeof d.crit === "object" &&
    d.crit.G1 &&
    d.crit.G19
  );
}
function buildExport(fileMap) {
  const out = JSON.parse(JSON.stringify(S));
  out._files = fileMap || {};
  const css = (document.querySelector("style") || {}).textContent || "";
  const title = esc((S.meta.service || "Facial biometric") + " assessment record");
  return `<!doctype html><html lang="en-NZ"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}main{margin:0 auto}</style></head><body><main>${vRecord(true)}</main><script type="application/json" id="fbag-data">${JSON.stringify(out).replace(/</g, "\\u003c")}<\/script></body></html>`;
}

/* ---------- Render and events ---------- */
function render() {
  const m = document.getElementById("main");
  if (view === "map") m.innerHTML = vMap();
  else if (view === "screen") m.innerHTML = vScreen();
  else if (view[0] === "a" && view.length === 2) m.innerHTML = vArea(AREAS[+view[1] - 1]);
  else if (view === "decide") m.innerHTML = vDecide();
  else if (view === "implement") m.innerHTML = vImplement();
  else if (view === "monitor") m.innerHTML = vMonitor();
  else if (view === "reassess") m.innerHTML = vReassess();
  else m.innerHTML = vRecord();
  document.getElementById("side").innerHTML = side();
  stat();
}
function refresh() {
  document.getElementById("side").innerHTML = side();
  document.querySelectorAll("[data-dyn]").forEach((el) => {
    el.innerHTML = DYN[el.dataset.dyn]();
  });
}
function go(v) {
  view = v;
  render();
  window.scrollTo(0, 0);
}
document.addEventListener("input", (e) => {
  const el = e.target,
    p = el.dataset && el.dataset.p;
  if (!p) return;
  set(p, el.type === "checkbox" ? el.checked : el.value);
  save();
  refresh();
});
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-go]");
  if (g) {
    go(g.dataset.go);
    return;
  }
  const a = e.target.closest("[data-act]");
  if (!a) return;
  const act = a.dataset.act;
  if (act === "addmon") {
    if (!S.monitor.custom) S.monitor.custom = [];
    S.monitor.custom.push({ name: "", who: "", report: "" });
    save();
    render();
  } else if (act === "delmon") {
    S.monitor.custom.splice(+a.dataset.i, 1);
    save();
    render();
  } else if (act === "addcond") {
    S.decide.conditions.push({ who: "", what: "", due: "", consequence: "" });
    save();
    render();
  } else if (act === "delcond") {
    S.decide.conditions.splice(+a.dataset.i, 1);
    save();
    render();
  } else if (act === "print") {
    go("record");
    setTimeout(() => window.print(), 50);
  } else if (act === "reset") {
    if (
      confirm(
        "Clear everything recorded in this assessment, including attached files? This cannot be undone.",
      )
    ) {
      Remote.newRecord();
      S = fresh();
      save();
      T = { changed: 0, exported: 0 };
      saveT();
      clearFiles().catch(() => {});
      go("map");
    }
  } else if (act === "rules") {
    document.getElementById("dlgtitle").textContent = "Rules of the Biometric Processing Privacy Code 2025";
    document.getElementById("critbody").innerHTML =
      `<table><tr><th style="width:80px">Rule</th><th>What it covers</th></tr>${RULES.map((x) => `<tr><td><b>${x[0]}</b></td><td>${x[1]}</td></tr>`).join("")}</table><p class="hint" style="margin-top:10px">These are short plain-language summaries to help you find the right rule. They are not the legal text. For the full wording, please refer to the Code published by the Office of the Privacy Commissioner.</p>`;
    const d = document.getElementById("critdlg");
    if (d.showModal) d.showModal();
    else d.setAttribute("open", "");
  } else if (act === "crits") {
    document.getElementById("dlgtitle").textContent = "Governance criteria G1 to G19";
    document.getElementById("critbody").innerHTML =
      `<table><tr><th>ID</th><th>Criterion</th><th>Assessment area</th><th></th></tr>${Object.keys(CRIT)
        .map(
          (g) =>
            `<tr><td><b>${g}</b></td><td>${esc(cname(g))}</td><td>${AREA_OF[g]}. ${AREAS[AREA_OF[g] - 1].name}</td><td><button class="lnk" data-act="gocrit" data-g="${g}">Go</button></td></tr>`,
        )
        .join("")}</table>`;
    const d = document.getElementById("critdlg");
    if (d.showModal) d.showModal();
    else d.setAttribute("open", "");
  } else if (act === "closecrits" || act === "gocrit") {
    const d = document.getElementById("critdlg");
    if (d.close) d.close();
    else d.removeAttribute("open");
    if (act === "gocrit") {
      const g = a.dataset.g;
      go(g === "G10" ? "decide" : "a" + AREA_OF[g]);
      const el = document.getElementById("c-" + g);
      if (el && el.scrollIntoView) el.scrollIntoView();
    }
  } else if (act === "addfile") {
    attG = a.dataset.g;
    document.getElementById("att").click();
  } else if (act === "openfile" || act === "instext" || act === "delfile") {
    const g = a.dataset.g,
      i = +a.dataset.i,
      f = (S.crit[g].files || [])[i];
    if (!f) return;
    if (act === "delfile") {
      S.crit[g].files.splice(i, 1);
      save();
      delFile(f.id).catch(() => {});
      render();
    } else
      getFile(f.id)
        .then((b) => {
          if (!b) {
            alert("That file is no longer stored in this browser. Please attach it again.");
            return;
          }
          if (act === "openfile") {
            const u = URL.createObjectURL(b);
            window.open(u, "_blank");
            setTimeout(() => URL.revokeObjectURL(u), 60000);
          } else
            b.text().then((t) => {
              const c = S.crit[g];
              c.findings = (c.findings ? c.findings + "\n\n" : "") + t.trim();
              save();
              render();
            });
        })
        .catch(() => alert("That file could not be opened."));
  } else if (act === "import") {
    document.getElementById("imp").click();
  } else if (act === "export") {
    const fl = allFiles().filter((f) => f.stored);
    Promise.all(
      fl.map((f) =>
        getFile(f.id)
          .then((b) => (b ? toDataURL(b).then((u) => [f.id, u]) : null))
          .catch(() => null),
      ),
    ).then((pairs) => {
      const map = {};
      pairs.forEach((x) => {
        if (x) map[x[0]] = x[1];
      });
      const blob = new Blob([buildExport(map)], { type: "text/html" });
      const u = URL.createObjectURL(blob),
        l = document.createElement("a");
      l.href = u;
      l.download =
        (S.meta.service || "facial-biometric").replace(/[^\w-]+/g, "-").slice(0, 40) +
        "-assessment-record.html";
      document.body.appendChild(l);
      l.click();
      l.remove();
      setTimeout(() => URL.revokeObjectURL(u), 500);
      T.exported = Date.now();
      saveT();
      stat();
    });
  }
});
document.getElementById("imp").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = parseSaved(r.result);
      if (!isRecord(data)) {
        alert("This file is not an assessment record saved from this guide. Nothing has been changed.");
        return;
      }
      if (!confirm("Opening this record replaces what is currently in the guide. Continue?")) return;
      const fs = data._files || {};
      delete data._files;
      S = merge(fresh(), data);
      const jobs = allFiles().map((f) =>
        fs[f.id]
          ? putFile(f.id, fromDataURL(fs[f.id]))
              .then(() => {
                f.stored = true;
              })
              .catch(() => {
                f.stored = false;
              })
          : Promise.resolve((f.stored = false)),
      );
      Promise.all(jobs).then(() => {
        save();
        T.exported = T.changed;
        saveT();
        go("map");
      });
    } catch (err) {
      alert("This file is not an assessment record saved from this guide. Nothing has been changed.");
    }
  };
  r.readAsText(f);
  e.target.value = "";
});
document.getElementById("att").addEventListener("change", (e) => {
  const list = Array.from(e.target.files || []),
    g = attG;
  e.target.value = "";
  if (!g || !S.crit[g]) return;
  const jobs = list.map((f) => {
    if (f.size > MAXFILE) {
      alert(f.name + " is larger than 10 MB and was not attached.");
      return Promise.resolve();
    }
    const rec = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: f.name,
      size: f.size,
      stored: true,
    };
    return putFile(rec.id, f)
      .catch(() => {
        rec.stored = false;
      })
      .then(() => {
        S.crit[g].files.push(rec);
      });
  });
  Promise.all(jobs).then(() => {
    save();
    render();
  });
});
render();

/* ---------- Optional backend ---------- */
/* When the page is served by the backend, load the saved copy if it is newer than the one in this browser. */
Remote.load().then((remote) => {
  if (remote && remote.record && remote.updatedAt > T.changed) {
    S = merge(fresh(), remote.record);
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {}
    T.changed = remote.updatedAt;
    saveT();
    render();
  }
});
