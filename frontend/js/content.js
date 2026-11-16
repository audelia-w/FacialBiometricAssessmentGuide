/*
 * Facial Biometric Assessment Guide
 * Model content: criteria, assessment areas, questions, Code rules, labels, tiers and outcomes.
 *
 * Author: Dee Williamson
 * November 2026
 */

"use strict";
/* ---------- Model content (from thesis Chapter 4 and Appendix A) ---------- */
const CRIT = {
  G1: { n: "Lawful and clearly defined purpose", h: "Clear and lawful purpose" },
  G2: { n: "Evidence of the problem and expected benefits", h: "Problem and expected benefits" },
  G3: { n: "Assessment of less intrusive alternatives", h: "Less intrusive alternatives" },
  G4: {
    n: "Evidence of effectiveness for the intended use",
    h: "Evidence the system works for the proposed use",
    note: "The effectiveness evidence here also supports the necessity assessment in G3.",
  },
  G5: { n: "Operating thresholds and error rates", h: "Thresholds and error rates" },
  G6: {
    n: "Demographic performance and local relevance",
    h: "Performance across groups and local relevance",
  },
  G7: { n: "Consequences of error and fallback arrangements", h: "What happens when the system is wrong" },
  G8: { n: "Cultural impacts and effects on Māori" },
  G9: { n: "Māori Data Sovereignty, authority and control" },
  G10: {
    n: "Overall proportionality: whether the expected benefits justify the privacy risks and cultural impacts, including effects on Māori",
    h: "Overall proportionality",
  },
  G11: {
    n: "Availability, choice and accessibility of non-biometric alternatives",
    h: "Choice and accessibility of non-biometric alternatives",
  },
  G12: { n: "Notification, transparency and communication", h: "Notification and communication" },
  G13: { n: "Enrolment and watchlist controls", h: "Enrolment and watchlists" },
  G14: { n: "Collection, privacy and security safeguards", h: "Privacy and security safeguards" },
  G15: {
    n: "Retention, verified deletion and controls on use, reuse and disclosure",
    h: "Retention, deletion, use and disclosure",
  },
  G16: {
    n: "Vendor evidence, evidence gaps, contractual controls and ongoing oversight",
    h: "Vendor evidence and assurance",
  },
  G17: { n: "Human oversight, access, correction and redress", h: "Human oversight and redress" },
  G18: {
    n: "Performance monitoring and analysis of complaints and incidents",
    h: "Monitoring performance, complaints and incidents",
  },
  G19: {
    n: "Change control, reassessment and suspension conditions",
    h: "Review, reassessment and suspension",
  },
};
const AREAS = [
  {
    id: 1,
    name: "Purpose, justification and alternatives",
    crit: ["G1", "G2", "G3", "G10"],
    checks:
      "Why facial biometrics are being proposed, what problem they are meant to solve, whether there are less intrusive options, and whether the expected benefits justify the privacy and cultural impacts.",
  },
  {
    id: 2,
    name: "Effectiveness and technical evidence",
    crit: ["G4", "G5"],
    checks:
      "Whether the system works well enough for the proposed use, what error rates are expected, how it was tested, and whether the evidence reflects real operating conditions.",
  },
  {
    id: 3,
    name: "Fairness, local relevance and error impact",
    crit: ["G6", "G7", "G13"],
    checks:
      "Whether the system works fairly for different groups, whether the evidence is relevant to the people and conditions where it will be used, what happens when errors occur, and how enrolment or watchlists are managed.",
  },
  {
    id: 4,
    name: "Privacy, security and data lifecycle",
    crit: ["G14", "G15"],
    checks:
      "What biometric information is collected, how it is protected, where it is processed, how it can be used, and when it is deleted.",
  },
  {
    id: 5,
    name: "Cultural impact and Māori Data Sovereignty",
    crit: ["G8", "G9"],
    checks:
      "Potential impacts on Māori, who has authority and control over the information, who benefits or carries the burden, how the information is protected, and where it is stored or reused.",
  },
  {
    id: 6,
    name: "Choice, transparency and accessibility",
    crit: ["G11", "G12"],
    checks:
      "Whether people understand how facial biometrics are used, have a practical non-biometric option, and can access that option without unreasonable difficulty.",
  },
  {
    id: 7,
    name: "Vendor and contract assurance",
    crit: ["G16"],
    checks:
      "What evidence the provider can supply, what the contract requires, where information is processed, and how provider risks and changes are managed.",
  },
  {
    id: 8,
    name: "Human oversight and redress",
    crit: ["G17"],
    checks:
      "Who reviews system results, whether they are trained and able to challenge them, and how people can question or correct a decision.",
  },
  {
    id: 9,
    name: "Monitoring, change and review",
    crit: ["G18", "G19"],
    checks:
      "How the system is monitored after use begins, when it is reviewed, what changes trigger reassessment, and when use should be paused or stopped.",
  },
];
const AREA_OF = {};
AREAS.forEach((a) => a.crit.forEach((g) => (AREA_OF[g] = a.id)));
/* Appendix A assessment items. g = criteria the item is tagged to. */
const PROMPTS = [
  {
    t: "Purpose",
    g: ["G1"],
    q: "What is the proposed use, and how does it support the organisation's functions or activities?",
  },
  { t: "Problem", g: ["G2"], q: "What evidence shows that the problem exists and how serious it is?" },
  {
    t: "Expected benefits",
    g: ["G2"],
    q: "What benefits are expected for individuals, Māori communities, the public or the organisation? What evidence supports these benefits?",
  },
  {
    t: "Alternatives",
    g: ["G3"],
    q: "What reasonable alternatives were considered? Compare their effectiveness, privacy risk, accessibility, cost and impact on people.",
  },
  {
    t: "Is facial biometrics necessary?",
    g: ["G3"],
    q: "Does the evidence show that facial biometrics can achieve the intended purpose? Could a less intrusive option achieve the same purpose just as effectively with less privacy risk? Confirm the final assessment at the Decide stage.",
  },
  {
    t: "System and model",
    g: ["G4"],
    q: "Identify the provider, model or algorithm, version and settings being assessed. Make sure the evidence relates to the version that will be used.",
  },
  {
    t: "Effectiveness",
    g: ["G4"],
    q: "What does success look like for this use? What evidence shows the system can achieve it? Note any differences between laboratory testing and real service performance. If the evidence comes from another deployment, note how similar the people, setting and system version are.",
  },
  {
    t: "Threshold and errors",
    g: ["G5"],
    q: "Record the matching threshold and the false-match and false-non-match rates at that setting. Include the testing conditions, sample size and any known uncertainty.<br>For verification, use measures that match a one-to-one task. For identification, use measures that match a one-to-many search. Do not rely only on a general accuracy figure.",
  },
  {
    t: "Testing conditions",
    g: ["G4", "G5", "G6"],
    once: true,
    q: "What devices, lighting, image quality and accessibility conditions were tested? How closely do they match the intended use?",
  },
  {
    t: "Performance across groups",
    g: ["G6"],
    q: "What evidence shows how the system performs for different demographic groups? Note any gaps in group coverage or sample size.",
  },
  {
    t: "Local relevance",
    g: ["G6"],
    q: "How relevant is the evidence to the New Zealand population and the conditions where the system will be used? Record any gaps or further testing needed. For an overseas case, consider whether the evidence reflects its own population and operating conditions.",
  },
  {
    t: "Errors and alternatives",
    g: ["G7"],
    q: "What happens after an incorrect match, missed match or failed verification? How could the person be affected? Can they still access the service without unreasonable delay or difficulty?",
  },
  {
    t: "Who is included and why?",
    g: ["G13"],
    q: "Who can be enrolled or added to a watchlist, and what evidence supports that decision? Record where watchlist images come from and how people qualify for inclusion.",
  },
  {
    t: "How is it managed?",
    g: ["G13"],
    q: "For watchlists, consider image quality, accuracy checks, retention, review and removal. For verification, consider how people are enrolled and how reference images are managed. Mark watchlist questions as not applicable where they do not apply.",
  },
  {
    t: "Liveness and attack protection",
    g: ["G14"],
    q: "For verification, what testing shows the system can detect spoofing or presentation attacks? Record the conditions and any limitations.",
  },
  {
    t: "What information is involved?",
    g: ["G14", "G15"],
    once: true,
    q: "Identify the biometric samples, templates, scores, logs, backups and other information collected or created.",
  },
  {
    t: "Collection",
    g: ["G14"],
    q: "Where does the information come from and how is it collected? Is the collection lawful, fair and no more intrusive than necessary? Check whether Rule 13 on unique identifiers applies.",
  },
  {
    t: "Security",
    g: ["G14"],
    q: "What safeguards protect the information? Consider access controls, encryption, monitoring, security testing and incident response.",
  },
  {
    t: "Retention and deletion",
    g: ["G15"],
    q: "How long is the information kept, and how is deletion confirmed? Include what happens when the service ends or the provider contract finishes.",
  },
  {
    t: "Overseas processing",
    g: ["G15", "G16"],
    q: "Is information processed or stored overseas? Record the countries involved, remote access and any subcontractors.",
    qs: {
      G16: "Where is information processed or stored? Record the countries involved, remote access and any subcontractors.",
    },
  },
  {
    t: "Use and disclosure",
    g: ["G15"],
    q: "What can the information be used for, and who can it be shared with? If it goes to an overseas provider, record whether the provider only handles it on the organisation's behalf or receives it for its own purposes. If it is for the provider's own purposes, treat this as a disclosure and check the additional requirements.",
  },
  {
    t: "Provider reuse",
    g: ["G15", "G16"],
    q: "Can the provider use the information for its own purposes, such as training or improving its products? What limits are in place?",
    qs: {
      G16: "Can the provider use the information for its own purposes, such as training or product improvement? What limits are in place?",
    },
  },
  {
    t: "End of service",
    g: ["G15", "G16"],
    q: "What happens to the information when the service ends? Consider return or verified deletion, transition support and service continuity.",
  },
  {
    t: "Cultural impact",
    g: ["G8"],
    q: "What impacts could this use have on Māori, including unfair or discriminatory outcomes? How will these impacts be addressed?",
  },
  {
    t: "Rangatiratanga",
    g: ["G9"],
    q: "Who has authority and control over Māori biometric information, including decisions about its purpose and use?",
  },
  {
    t: "Whakapapa",
    g: ["G9"],
    q: "Where does the information come from, why was it collected, and what connections does it have to people or communities?",
  },
  {
    t: "Whanaungatanga",
    g: ["G9"],
    q: "How are relationships and responsibilities to Māori individuals and communities considered?",
  },
  {
    t: "Kotahitanga and manaakitanga",
    g: ["G9"],
    q: "Who benefits, who may carry the burden, and how are dignity and collective interests respected?",
  },
  {
    t: "Kaitiakitanga",
    g: ["G9"],
    q: "How can Māori exercise guardianship over the information, including decisions about access, protection, retention, deletion and reuse?",
  },
  {
    t: "Data location and reuse",
    g: ["G9"],
    q: "Where is the information stored or processed? Can the provider reuse it for training, product improvement or another purpose? What risks or cultural impacts could this create?",
  },
  {
    t: "Advice or engagement",
    g: ["G8", "G9"],
    once: true,
    q: "Where significant cultural impacts are identified, record what Māori advice or engagement has taken place, who contributed, and any concerns raised. Do not treat participation as endorsement.",
  },
  {
    t: "Alternative option",
    g: ["G11"],
    q: "Is a non-biometric option available? Is it easy to find, available when needed, practical to use and available without penalty?",
  },
  {
    t: "Accessibility",
    g: ["G11"],
    q: "Consider barriers such as disability, device access, language or location.",
  },
  {
    t: "Notification",
    g: ["G12"],
    q: "What are people told about the biometric processing, and when are they told?",
  },
  {
    t: "How the information is collected",
    g: ["G12"],
    q: "If the information comes from another source rather than directly from the person, what additional notice is required?",
  },
  { t: "Accessibility", g: ["G12"], q: "Is the information clear and accessible to the people affected?" },
  {
    t: "Provider evidence",
    g: ["G16"],
    q: "What evidence shows how well the system works, its error rates and how it performs for different groups? Record the testing conditions, dataset, system version and any limitations. Note whether the evidence comes from the provider or from independent testing.",
  },
  {
    t: "Incident notification",
    g: ["G14", "G16"],
    q: "How and when must the provider notify the organisation about a security or privacy incident?",
    qs: { G16: "How and when must the provider notify the organisation about an incident?" },
  },
  {
    t: "Audit and assurance",
    g: ["G16"],
    q: "What independent testing, reports or audit access are available? Is more assurance needed for this level of risk?",
  },
  {
    t: "Changes to the service",
    g: ["G16", "G19"],
    q: "What changes must the provider tell the organisation about before they happen? Consider changes to the model, threshold, data flow, infrastructure or subcontractors.",
    ts: { G19: "Changes to the system" },
    qs: {
      G19: "What changes must be assessed before they are made? Consider changes to the model, threshold, data flow, infrastructure or subcontractors.",
    },
  },
  {
    t: "Missing evidence",
    g: ["G16"],
    q: "What information was requested but is unavailable or incomplete? Does the gap need further assurance before approval?",
  },
  {
    t: "Ongoing assurance",
    g: ["G16"],
    q: "Who monitors the provider's performance, incidents and major changes? Record reporting arrangements and review dates.",
  },
  {
    t: "Human review",
    g: ["G17"],
    q: "Who reviews the system result, what information can they see, and are they trained and authorised to challenge it?<br>For Tier 2, require human review before a biometric result is used to deny or restrict access to a service or otherwise negatively affect a person.<br>For Tier 3 identification, require trained staff to check alerts and decisions before action. For other Tier 3 uses, set an appropriate level of human review based on the consequences.",
  },
  {
    t: "Access, correction and complaints",
    g: ["G17"],
    q: "How can people access or correct their biometric information, challenge a decision or make a complaint? Record who is responsible and how responses are handled.",
  },
  {
    t: "Monitoring",
    g: ["G18"],
    q: "Who monitors the system, and what measures are tracked? Consider performance, failures, repeat attempts, people who stop before completion, use of the alternative, complaints, incidents and differences between groups.<br>For identification, also track alerts, confirmed and rejected matches, misidentifications, watchlist size and any disproportionate impact on particular groups.",
  },
  {
    t: "Review schedule",
    g: ["G19"],
    q: "When will the use be reviewed? Set the frequency based on the use, potential consequences and any unresolved evidence gaps. Keep watchlist review separate from review of the overall deployment.",
  },
  {
    t: "Reassessment and suspension",
    g: ["G19"],
    q: "What events trigger a new assessment? Consider major changes, significant incidents or unexpected risks. Record when the use should be paused or stopped, who can make that decision and what is required before restarting.",
  },
];
const ORDER = {
  G9: [
    "Whakapapa",
    "Rangatiratanga",
    "Whanaungatanga",
    "Kotahitanga and manaakitanga",
    "Kaitiakitanga",
    "Data location and reuse",
  ],
  G14: [
    "What information is involved?",
    "Collection",
    "Security",
    "Liveness and attack protection",
    "Incident notification",
  ],
  G15: [
    "Retention and deletion",
    "Use and disclosure",
    "Provider reuse",
    "Overseas processing",
    "End of service",
  ],
  G16: [
    "Provider evidence",
    "Missing evidence",
    "Overseas processing",
    "Provider reuse",
    "Incident notification",
    "Audit and assurance",
    "Changes to the service",
    "End of service",
    "Ongoing assurance",
  ],
};
const RULES = [
  [
    "Rule 1",
    "Purpose of collection. Requires a lawful purpose, necessity, reasonable privacy safeguards and proportionate processing. Rule 1(4): where the justification relies on private benefit to the organisation, that benefit must outweigh the privacy risk to a substantial degree.",
  ],
  ["Rule 2", "Source of biometric information. Collecting directly from the person concerned."],
  ["Rule 3", "Notification. Telling people about the collection, its purpose and any alternatives."],
  ["Rule 3A", "Notification when biometric information is collected from another person or organisation."],
  ["Rule 4", "Manner of collection. Collection must be lawful, fair and not unreasonably intrusive."],
  ["Rule 5", "Storage and security of biometric information."],
  ["Rule 6", "Access. A person's right to access their biometric information."],
  ["Rule 7", "Correction. A person's right to ask for their biometric information to be corrected."],
  ["Rule 8", "Accuracy. Checking that information is accurate before it is used or disclosed."],
  ["Rule 9", "Retention. Not keeping biometric information for longer than needed."],
  ["Rule 10", "Limits on use of biometric information."],
  ["Rule 11", "Limits on disclosure of biometric information."],
  ["Rule 12", "Disclosure of biometric information outside New Zealand."],
  ["Rule 13", "Unique identifiers. Limits on assigning and using unique identifiers for individuals."],
];
const RULE_OF = {};
RULES.forEach((x) => (RULE_OF[x[0]] = x[1]));
/* Name shown to users: the plain page heading where one exists. */
function cname(g) {
  return CRIT[g].h || CRIT[g].n;
}
function gL(g) {
  return `<button class="lnk inl" data-act="gocrit" data-g="${g}" title="${esc(g + ": " + cname(g))}">${g}</button>`;
}
function aL(n) {
  return `<button class="lnk inl" data-go="a${n}" title="${esc("Area " + n + ": " + AREAS[n - 1].name)}">Area ${n}</button>`;
}
function sL(v, t) {
  return `<button class="lnk inl" data-go="${v}">${t}</button>`;
}
function ruleLinks(s) {
  return s.replace(/Rule (1\(4\)|\d+A?)/g, (m, n) => {
    const k = "Rule " + n.replace("(4)", "");
    return `<button class="lnk rref" data-act="rules" title="${esc(RULE_OF[k] || "")}">${m}</button>`;
  });
}
const LABELS = {
  suf: "Sufficient information",
  par: "Partial information",
  ins: "Insufficient information",
  na: "Not applicable",
};
const LABEL_MEANING = {
  suf: "Enough information is available to assess the criterion.",
  par: "Some aspects can be assessed, but important questions remain unanswered.",
  ins: "The available information does not provide an adequate basis for assessment.",
  na: "The criterion does not apply to the proposed use, with reasons recorded.",
};
const TIERS = {
  0: {
    name: "Tier 0",
    desc: "No biometric processing within the scope of the Code.",
    req: "Record the screening rationale and reassess if the purpose, technology or data use changes. Other privacy obligations may still apply.",
  },
  1: {
    name: "Tier 1",
    desc: "Optional one-to-one verification with a genuine non-biometric alternative and limited consequences.",
    req: "Assess all nine areas, provide clear notice and an accessible non-biometric alternative. Obtain approval from the manager responsible for the proposed use, informed by advice from someone with appropriate privacy expertise. Document a review date and justify the review frequency.",
    approve:
      "The manager responsible for the proposed use, informed by advice from someone with appropriate privacy expertise.",
    review: "Assessed under area 8. The model sets no additional tier requirement.",
  },
  2: {
    name: "Tier 2",
    desc: "One-to-one verification that restricts access to a service, is difficult to avoid, has material consequences, or relies heavily on a vendor with limited organisational control.",
    req: "Assess all nine areas, including detailed evidence of effectiveness, matching errors and provider safeguards. Provide human review before an adverse decision based on a biometric result. Obtain approval involving the relevant operational, privacy and technical decision-makers. Document a review date, with the frequency justified by the potential consequences and unresolved evidence gaps.",
    approve: "The relevant operational, privacy and technical decision-makers.",
    review:
      "Human review before a biometric result is used to deny or restrict access to a service or otherwise negatively affect a person.",
  },
  3: {
    name: "Tier 3",
    desc: "One-to-many identification, or one-to-one verification with little meaningful choice and potentially serious consequences.",
    req: "Assess all nine areas, including detailed evidence of effectiveness, matching errors and provider safeguards. Document how the evidence and safeguards address the potential harm. Obtain approval from the organisation's designated senior decision-maker. For one-to-many identification, require trained personnel to check alerts before action is taken and record the checks and resulting decisions. For other Tier 3 uses, specify human review appropriate to the potential consequences. Set and justify a review schedule.",
    approve: "The organisation's designated senior decision-maker.",
    review:
      "For one-to-many identification, trained personnel check alerts before action is taken and record their checks and resulting decisions. For other Tier 3 uses, human review appropriate to the potential consequences.",
  },
  out: {
    name: "Not covered by this guide",
    desc: "Facial biometric categorisation, or another biometric use this model does not cover.",
    req: "Refer the proposal for separate assessment. Tiers 1-3 apply to facial verification and identification only.",
  },
};
const OUTCOMES = {
  proceed: {
    n: "Proceed",
    d: "The evidence supports approval and the proposal satisfies applicable legal and governance requirements.",
    next: "Continue to Implement.",
  },
  conditions: {
    n: "Proceed with conditions",
    d: "Specific actions can address remaining matters. Conditions cannot replace evidence needed to establish applicable legal requirements.",
    next: "Continue to Implement.",
  },
  return: {
    n: "Return for evidence",
    d: "A decision cannot yet be supported because material evidence is missing. Identify what further information is needed.",
    next: "Return to Assess.",
  },
  decline: {
    n: "Decline",
    d: "The proposed use cannot meet an applicable legal requirement, or material cultural, technical or governance concerns cannot be adequately addressed.",
    next: "Do not proceed.",
  },
};
const IMPL = [
  ["thresholds", "Thresholds and safeguards configured and confirmed"],
  ["training", "Relevant staff trained"],
  ["notices", "Required notices and communication published"],
  ["alternatives", "Alternative pathways tested"],
  ["complaints", "Complaint process tested"],
  ["conditions", "Decision conditions completed or in place"],
];
const MON = [
  ["performance", "System performance"],
  ["provider", "Provider performance"],
  ["failures", "Failures"],
  ["repeats", "Repeat attempts"],
  ["abandonment", "People who stop before completion"],
  ["alternatives", "Use of the non-biometric alternative"],
  ["complaints", "Complaints"],
  ["incidents", "Incidents"],
  ["demographic", "Demographic differences"],
  ["changes", "System or provider changes"],
];
const MON_ID = [
  ["alerts", "Alerts"],
  ["matches", "Confirmed and rejected matches"],
  ["misid", "Misidentifications"],
  ["wlsize", "Watchlist size"],
  ["eligibility", "Whether enrolled people meet the enrolment criteria"],
  ["represent", "Disproportionate representation of particular groups"],
];
const VIEWS = [
  "map",
  "screen",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "a7",
  "a8",
  "a9",
  "decide",
  "implement",
  "monitor",
  "reassess",
  "record",
];
