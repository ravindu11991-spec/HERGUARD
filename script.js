/* HERGUARD — vanilla JavaScript, no frameworks or external APIs. */
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const checkerForm = $("#checkerForm");
const messageInput = $("#messageInput");
const charCount = $("#charCount");
const checkerResult = $("#checkerResult");

// Dashboard stores aggregate counters only; message text is never persisted.
const DASHBOARD_KEY = "herguard-dashboard-v1";
let dashboardStats = { scans: 0, bestQuiz: null };
try {
  const storedStats = JSON.parse(localStorage.getItem(DASHBOARD_KEY) || "null");
  if (storedStats && typeof storedStats === "object") {
    dashboardStats.scans = Number.isFinite(storedStats.scans) ? Math.max(0, storedStats.scans) : 0;
    dashboardStats.bestQuiz = Number.isInteger(storedStats.bestQuiz) ? Math.min(5, Math.max(0, storedStats.bestQuiz)) : null;
  }
} catch { /* dashboard remains usable if storage is unavailable */ }
function saveDashboardStats() {
  try { localStorage.setItem(DASHBOARD_KEY, JSON.stringify(dashboardStats)); } catch { /* optional persistence */ }
  renderDashboard();
}
function renderDashboard() {
  const scans = $("#dashboardScans");
  const best = $("#dashboardBest");
  if (scans) scans.textContent = String(dashboardStats.scans);
  if (best) best.textContent = dashboardStats.bestQuiz === null ? "—" : String(dashboardStats.bestQuiz);
  const hint = $("#dashboardQuizHint");
  if (hint) hint.textContent = dashboardStats.bestQuiz === null ? "Complete the cyber challenge to set a best score." : dashboardStats.bestQuiz === 5 ? "Perfect score — excellent safety habits." : "Keep practising to improve your best score.";
  updateDashboardChecklist();
}
function updateDashboardChecklist() {
  const boxes = $$(".checklist input[type='checkbox']");
  const total = boxes.length;
  const checked = boxes.filter((box) => box.checked).length;
  const count = $("#dashboardChecks");
  const totalNode = $("#dashboardChecksTotal");
  const hint = $("#dashboardChecklistHint");
  const bar = $("#dashboardChecklistBar");
  const fill = $("#dashboardChecklistFill");
  if (count) count.textContent = String(checked);
  if (totalNode) totalNode.textContent = String(total);
  if (hint) hint.textContent = checked === total ? "All safety actions completed — great work." : "Checklist actions completed";
  if (bar) { bar.setAttribute("aria-valuemax", String(total)); bar.setAttribute("aria-valuenow", String(checked)); }
  if (fill) fill.style.width = `${total ? checked / total * 100 : 0}%`;
}


messageInput.addEventListener("input", () => {
  charCount.textContent = `${messageInput.value.length} / 5000`;
});

$("#sampleButton").addEventListener("click", () => {
  messageInput.value =
    "URGENT: Your account will be suspended today. Verify your password immediately using this link: http://example.invalid/account. Do not delay!";
  messageInput.dispatchEvent(new Event("input"));
  messageInput.focus();
});
$("#clearButton").addEventListener("click", () => {
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  delete checkerResult.dataset.reportText;
  checkerResult.innerHTML = `<div class="result-placeholder"><div class="placeholder-icon">⌕</div><h3>Your review will appear here</h3><p>We’ll explain any patterns found and suggest safe verification steps.</p></div>`;
  messageInput.focus();
});

const patterns = [
  {
    title: "Urgent or pressuring language",
    regex:
      /\b(urgent|immediately|act now|right now|within \d+ hours?|today|final warning|do not delay|expires? soon|suspended today|locked today)\b/i,
    explanation:
      "Pressure to act quickly can discourage careful checking. Pause and verify the request through a separate, trusted channel.",
  },
  {
    title: "Requests for sensitive information",
    regex:
      /\b(password|passcode|one[- ]time code|security code|verification code|pin number|bank details|card number|social security number)\b/i,
    explanation:
      "The message mentions credentials or financial information. Do not share passwords or one-time security codes in response to an unsolicited message.",
  },
  {
    title: "Link or web address present",
    regex:
      /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|co\.uk|uk|io|info|xyz|top|site|online)\b/i,
    explanation:
      "A link is not proof of a scam, but unexpected links deserve checking. Avoid opening it; navigate to the organisation's official site or app yourself.",
  },
  {
    title: "Threats or negative consequences",
    regex:
      /\b(account will be closed|account suspended|you will be arrested|legal action|penalty|fine will|lose access|blocked permanently|unauthori[sz]ed activity)\b/i,
    explanation:
      "Threats about account access or legal consequences can be used to frighten recipients. Confirm the claim independently before taking action.",
  },
  {
    title: "Unusual payment or money request",
    regex:
      /\b(gift card|crypto(?:currency)?|bitcoin|wire transfer|send money|payment required|pay a fee|refund fee|payment failed|bank transfer)\b/i,
    explanation:
      "Unexpected payment instructions, especially unusual payment methods, should be independently verified before you send money.",
  },
  {
    title: "Unexpected prize or reward",
    regex:
      /\b(you have won|winner|claim your prize|free gift|cash reward|lottery|giveaway winner)\b/i,
    explanation:
      "Unexpected prizes can be used to collect personal details or fees. Verify the promotion through the organisation's official channels.",
  },
  {
    title: "Request to keep it secret",
    regex:
      /\b(keep this secret|don't tell anyone|do not tell anyone|keep it confidential|tell no one)\b/i,
    explanation:
      "Requests for secrecy can be a manipulation tactic, particularly in impersonation scams. Check with the person or organisation independently.",
  },
  {
    title: "Unexpected attachment or download",
    regex: /\b(open the attachment|download the file|enable macros|attached invoice|view attached|install this app)\b/i,
    explanation: "Unexpected attachments and downloads can carry malware or lead to fake sign-in pages. Confirm the sender and reason for the file before opening it.",
  },
  {
    title: "Impersonation or authority claim",
    regex: /\b(tax refund|hm revenue and customs|support team here|verify your identity|police officer|your ceo|your manager)\b/i,
    explanation: "Scammers may impersonate trusted organisations, employers or officials. Contact the organisation through details you find independently.",
  },
  {
    title: "Remote access or device-control request",
    regex: /\b(remote access|install anydesk|install teamviewer|screen sharing|let me control your computer)\b/i,
    explanation: "Unsolicited requests to install remote-access tools or share your screen can expose accounts and personal information. Do not grant access unless you initiated and verified the support session.",
  },
  {
    title: "Verification-code or MFA pressure",
    regex: /\b(read me the code|tell me the code|send me the code|approve the login|approve the sign in|authenticator code)\b/i,
    explanation: "A genuine security code or login approval can let someone access your account. Never share a code or approve a sign-in you did not initiate.",
  },
  {
    title: "Delivery or parcel fee request",
    regex: /\b(missed delivery|parcel is on hold|delivery fee|redelivery fee|customs fee|package cannot be delivered)\b/i,
    explanation: "Unexpected parcel messages may imitate delivery companies and request small payments or card details. Check tracking through the courier's official app or website.",
  },
];

function escapeHTML(value) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function inspectUrls(text) {
  const candidates = text.match(/(?:https?:\/\/|www\.)[^\s<>"']+|(?:\b[a-z0-9-]+\.)+(?:com|net|org|co\.uk|uk|io|info|xyz|top|site|online|app|dev|gov|edu|click|work|zip|mov|quest)\b(?:\/[^\s<>"']*)?/gi) || [];
  const urls = [...new Set(candidates.map((item) => item.replace(/[),.!?;:]+$/g, "")))].slice(0, 10);
  const signals = [];
  const shorteners = new Set(["bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "ow.ly", "rebrand.ly"]);
  const lessCommonTlds = [".xyz", ".top", ".click", ".work", ".zip", ".mov", ".quest"];
  for (const raw of urls) {
    let parsed;
    try { parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); }
    catch { signals.push({ title: "Unusual or malformed web address", detail: `The address “${raw}” could not be parsed cleanly. Avoid opening it and verify the destination independently.` }); continue; }
    const host = parsed.hostname.toLowerCase();
    if (parsed.protocol !== "https:") signals.push({ title: "No HTTPS shown", detail: `${host} does not show HTTPS in the supplied address. This alone does not prove fraud, but do not enter sensitive information unless you have verified the site.` });
    if (host.includes("xn--")) signals.push({ title: "Internationalised / punycode domain", detail: `${host} contains a punycode label. Some legitimate sites use these, but lookalike domains can use similar-looking characters; verify the exact domain carefully.` });
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) signals.push({ title: "IP address used as website host", detail: `${host} is an IP address rather than a familiar domain. Treat unexpected links to raw IP addresses with caution.` });
    if (parsed.username || parsed.password || raw.includes("@")) signals.push({ title: "Address contains an @ sign or embedded credentials", detail: "An @ sign can make a URL look as though it belongs to one site while sending the browser to another host. Do not open it; verify the actual domain through a trusted route." });
    if (shorteners.has(host)) signals.push({ title: "Shortened link", detail: `${host} hides the final destination. Verify who sent it and use an independently found official website.` });
    if (lessCommonTlds.some((tld) => host.endsWith(tld))) signals.push({ title: "Less common top-level domain", detail: `${host} uses a less common top-level domain. This is not proof of a scam, but check the exact domain and context.` });
    if (host.split(".").length >= 5) signals.push({ title: "Unusually long subdomain", detail: `${host} has several domain labels. Check which registered domain the address actually belongs to, rather than trusting words at the beginning.` });
  }
  return { urls, signals };
}

function buildReportText() {
  return checkerResult.dataset.reportText || "";
}

function reviewMessage(text) {
  const found = patterns.filter((pattern) => pattern.regex.test(text));
  const urlReview = inspectUrls(text);
  const signalCount = urlReview.signals.length;
  const totalSignals = found.length + signalCount;
  let heading, subheading, symbol, summary, severity;
  if (totalSignals >= 5) {
    heading = "Multiple warning signs found"; subheading = "Pause and verify independently before acting."; symbol = "!"; severity = "High caution";
    summary = "Several message patterns and/or URL characteristics deserve closer review. This is not proof of a scam, but do not click links, share information or send money until you verify the request independently.";
  } else if (totalSignals >= 1) {
    heading = "Some warning signs found"; subheading = "Take a moment to verify the message."; symbol = "!"; severity = "Use caution";
    summary = "The text matches one or more patterns that can appear in scams. Context matters: legitimate messages can contain these patterns too. Verify the sender and request through a separate trusted channel.";
  } else {
    heading = "No listed warning signs detected"; subheading = "This is not a guarantee that the message is safe."; symbol = "i"; severity = "Keep verifying";
    summary = "The checks did not find any listed warning signs. Scams can be convincing and may not match these rules, so continue to verify unexpected requests.";
  }
  const flagsHTML = found.length
    ? `<ul class="flag-list">${found.map((item) => `<li><b>${escapeHTML(item.title)}</b><p>${escapeHTML(item.explanation)}</p></li>`).join("")}</ul>`
    : `<div class="no-flags">No message-pattern rules were matched. Keep checking the sender, context and request.</div>`;
  const urlSignalsHTML = signalCount
    ? `<div class="advanced-result-block"><h4>URL inspection signals</h4><ul class="flag-list">${urlReview.signals.map((item) => `<li><b>${escapeHTML(item.title)}</b><p>${escapeHTML(item.detail)}</p></li>`).join("")}</ul></div>`
    : `<div class="advanced-result-block"><h4>URL inspection</h4><p>${urlReview.urls.length ? "No URL-specific heuristics were triggered. This does not establish that the destination is safe." : "No web address was detected in the supplied text."}</p></div>`;
  const urlsHTML = urlReview.urls.length ? `<div class="detected-urls"><strong>Detected address${urlReview.urls.length > 1 ? "es" : ""}</strong><ul>${urlReview.urls.map((url) => `<li><code>${escapeHTML(url)}</code></li>`).join("")}</ul></div>` : "";
  const reportText = [
    "HERGUARD ScamSense — Educational Review", `Caution level: ${severity}`,
    `Message-pattern categories matched: ${found.length} of ${patterns.length}`, `URL inspection signals: ${signalCount}`,
    `Detected URLs: ${urlReview.urls.length ? urlReview.urls.join(", ") : "None"}`, "", "Message patterns:",
    ...(found.length ? found.map((item) => `- ${item.title}: ${item.explanation}`) : ["- None matched"]), "", "URL inspection signals:",
    ...(urlReview.signals.length ? urlReview.signals.map((item) => `- ${item.title}: ${item.detail}`) : ["- None triggered"]), "",
    "Recommended action: Do not use links or contact details in an unexpected message. Verify through the organisation's official app, website or a phone number you already trust.",
    "Limitations: Rule-based educational aid only. No live reputation checks are performed, and a low-signal result does not mean a message is safe."
  ].join("\n");
  dashboardStats.scans += 1;
  saveDashboardStats();
  const riskPercent = Math.min(100, Math.round((totalSignals / (patterns.length + 5)) * 100));
  checkerResult.dataset.reportText = reportText;
  checkerResult.innerHTML = `
    <div class="result-head"><div class="result-symbol" aria-hidden="true">${symbol}</div><div><h3>${heading}</h3><p>${subheading}</p></div><div class="result-count" aria-label="${totalSignals} warning signals">${totalSignals}</div></div>
    <p class="severity-label">${severity}</p><p class="result-summary">${summary}</p>
    <div class="risk-meter" role="img" aria-label="${totalSignals} warning signals identified"><span style="width:${riskPercent}%"></span></div>
    <p class="risk-caption">${found.length} message-pattern categories matched and ${signalCount} URL-specific signals. This is a heuristic count, not a probability of fraud.</p>
    <h4 class="result-subheading">Message patterns</h4>${flagsHTML}${urlSignalsHTML}${urlsHTML}
    <div class="safe-next"><strong>Safer next step:</strong> Do not use contact details or links in the message to verify it. Open the official app or type a known website address yourself, or contact the person using a number you already trust.</div>
    <div class="report-actions"><button type="button" class="button button-secondary" id="copyReportButton">Copy review summary</button><button type="button" class="button button-secondary" id="downloadReportButton">Download report</button></div>
    <p class="fine-print">Rule-based educational review only. No sender reputation, live domain reputation or threat-intelligence checks are performed. The supplied message is not saved.</p>`;
  $("#copyReportButton").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(buildReportText()); $("#copyReportButton").textContent = "Copied ✓"; }
    catch {
      const temporary = document.createElement("textarea"); temporary.value = buildReportText(); temporary.setAttribute("readonly", "");
      temporary.style.position = "absolute"; temporary.style.left = "-9999px"; document.body.append(temporary); temporary.select();
      const copied = document.execCommand("copy"); temporary.remove(); $("#copyReportButton").textContent = copied ? "Copied ✓" : "Copy unavailable";
    }
  });
  $("#downloadReportButton").addEventListener("click", () => {
    const blob = new Blob([buildReportText()], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "herguard-scamsense-review.txt"; document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  });
}
checkerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) {
    messageInput.setAttribute("aria-invalid", "true");
    messageInput.focus();
    return;
  }
  messageInput.removeAttribute("aria-invalid");
  reviewMessage(text);
});

// Quiz content is intentionally static, reviewed educational material.
const questions = [
  {
    prompt:
      "A message says your bank account will be locked unless you click a link immediately. What is the safest response?",
    options: [
      "Click the link quickly so the account is not locked.",
      "Reply with your account details to confirm your identity.",
      "Open the bank's official app or use a trusted number to check.",
      "Forward the message to friends to see if they got it.",
    ],
    correct: 2,
    explanation:
      "Correct. Verify through a separate trusted route, such as the official app or a number on your bank card. Do not use the link or contact details in the unexpected message.",
  },
  {
    prompt:
      "Someone claiming to be your friend messages from a new account and urgently asks you to send money. What should you do first?",
    options: [
      "Send a small amount to help them quickly.",
      "Verify their identity through a known phone number or another trusted channel.",
      "Ask them to send a photo of their bank card.",
      "Share the request publicly with their personal details.",
    ],
    correct: 1,
    explanation:
      "Correct. Accounts can be impersonated or compromised. Contact your friend through a channel you already trust, and do not disclose or post their private information.",
  },
  {
    prompt: "Which is the strongest password practice for important accounts?",
    options: [
      "Use the same memorable password everywhere.",
      "Use your birthday with an exclamation mark.",
      "Use a long, unique password or passphrase for each account, ideally managed by a reputable password manager.",
      "Change one character in the same password for every site.",
    ],
    correct: 2,
    explanation:
      "Correct. Unique passwords reduce the chance that one breached service exposes other accounts. A reputable password manager can help create and store them; enable multi-factor authentication where possible.",
  },
  {
    prompt:
      "A stranger threatens to publish private images unless you comply with their demands. What is a safer response?",
    options: [
      "Send more images to prove you trust them.",
      "Pay immediately because payment guarantees they will stop.",
      "Preserve evidence if safe, avoid sending more material, report the account, and seek trusted support.",
      "Post the stranger's personal information online.",
    ],
    correct: 2,
    explanation:
      "Correct. Paying or complying does not guarantee the threats will stop. If safe, preserve messages and account details, report the account, and seek support. Do not retaliate by sharing private information. If there is immediate danger in the UK, call 999.",
  },
  {
    prompt:
      "A job offer promises unusually high pay, asks for an upfront fee, and wants identity documents over an unfamiliar messaging account. What should you do?",
    options: [
      "Pay the fee so the job is secured.",
      "Send documents because the offer looks professional.",
      "Verify the employer through independently found official contact details and do not pay or share documents until satisfied.",
      "Click every link in the message to investigate.",
    ],
    correct: 2,
    explanation:
      "Correct. Upfront fees, unusual document requests and unverifiable recruiters are warning signs. Independently check the company and vacancy, and protect identity documents. A professional-looking message is not proof of legitimacy.",
  },
];

let currentQuestion = 0;
let score = 0;
let answered = false;
const questionText = $("#questionText");
const answerOptions = $("#answerOptions");
const quizFeedback = $("#quizFeedback");
const nextQuestion = $("#nextQuestion");

function renderQuestion() {
  answered = false;
  const q = questions[currentQuestion];
  $("#questionTag").textContent =
    `SCENARIO ${String(currentQuestion + 1).padStart(2, "0")}`;
  questionText.textContent = q.prompt;
  answerOptions.innerHTML = "";
  quizFeedback.hidden = true;
  quizFeedback.className = "quiz-feedback";
  q.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-option";
    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.textContent = String.fromCharCode(65 + index);
    const text = document.createElement("span");
    text.textContent = option;
    button.append(letter, text);
    button.addEventListener("click", () => chooseAnswer(index));
    answerOptions.append(button);
  });
  nextQuestion.disabled = true;
  nextQuestion.textContent =
    currentQuestion === questions.length - 1
      ? "See results →"
      : "Next question →";
  $("#answeredStatus").textContent = "Select the safest response.";
  updateQuizProgress();
}

function chooseAnswer(selectedIndex) {
  if (answered) return;
  answered = true;
  const q = questions[currentQuestion];
  const buttons = $$(".answer-option", answerOptions);
  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === q.correct) button.classList.add("correct");
    if (index === selectedIndex && index !== q.correct)
      button.classList.add("incorrect");
  });
  const isCorrect = selectedIndex === q.correct;
  if (isCorrect) score++;
  $("#scoreNumber").textContent = score;
  quizFeedback.hidden = false;
  quizFeedback.classList.add(isCorrect ? "good" : "bad");
  quizFeedback.textContent = `${isCorrect ? "That's right. " : "Not quite. "} ${q.explanation}`;
  $("#answeredStatus").textContent = isCorrect
    ? "Correct answer"
    : "Review the explanation";
  nextQuestion.disabled = false;
  updateQuizProgress();
}

function updateQuizProgress() {
  const completed = currentQuestion + (answered ? 1 : 0);
  $("#questionProgress").textContent =
    currentQuestion >= questions.length
      ? "Quiz complete"
      : `Question ${currentQuestion + 1} of ${questions.length}`;
  $("#progressPercent").textContent =
    `${Math.round((completed / questions.length) * 100)}%`;
  $("#quizProgressBar").style.width =
    `${(completed / questions.length) * 100}%`;
}

function renderResults() {
  if (dashboardStats.bestQuiz === null || score > dashboardStats.bestQuiz) {
    dashboardStats.bestQuiz = score;
    saveDashboardStats();
  }
  questionText.textContent = "Your cyber-safety practice results";
  answerOptions.innerHTML = "";
  quizFeedback.hidden = false;
  quizFeedback.className = "quiz-feedback good";
  const message =
    score === questions.length
      ? "Excellent work — you identified every safest response."
      : score >= 3
        ? "Good progress. Review the explanations for any questions you missed, then try again."
        : "This is a learning exercise, not a test of your worth. Review the guidance and try again to build confidence.";
  quizFeedback.textContent = `${message} Final score: ${score} out of ${questions.length}.`;
  $("#questionTag").textContent = "YOUR RESULTS";
  $(".question-type", $("#quizPanel")).textContent = "Learning summary";
  $("#answeredStatus").textContent = "You completed all scenarios.";
  nextQuestion.disabled = false;
  nextQuestion.textContent = "Try again ↻";
  $("#questionProgress").textContent = "Quiz complete";
  $("#progressPercent").textContent = "100%";
  $("#quizProgressBar").style.width = "100%";
}

nextQuestion.addEventListener("click", () => {
  if (currentQuestion === questions.length - 1 && answered) {
    currentQuestion = questions.length;
    renderResults();
    return;
  }
  if (currentQuestion >= questions.length) {
    resetQuiz();
    return;
  }
  if (!answered) return;
  currentQuestion++;
  if (currentQuestion >= questions.length) renderResults();
  else renderQuestion();
});

function resetQuiz() {
  currentQuestion = 0;
  score = 0;
  $("#scoreNumber").textContent = "0";
  $(".question-type", $("#quizPanel")).textContent = "Choose one answer";
  renderQuestion();
}
$("#restartQuiz").addEventListener("click", resetQuiz);
renderQuestion();

// Checklist progress is stored locally only. If storage is unavailable, the checklist still works.
const STORAGE_KEY = "herguard-checklist-v1";
let savedChecks = {};
try {
  savedChecks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
} catch {
  savedChecks = {};
}

function updateChecklistProgress(group) {
  const list = $(`[data-checklist="${group}"]`);
  if (!list) return;
  const boxes = $$('input[type="checkbox"]', list);
  const checked = boxes.filter((box) => box.checked).length;
  const bar = $(`[data-progress="${group}"]`);
  if (bar)
    bar.style.width = `${boxes.length ? (checked / boxes.length) * 100 : 0}%`;
}
$$(".checklist input[type='checkbox']").forEach((box) => {
  box.checked = savedChecks[box.dataset.key] === true;
  const group = box.closest("[data-checklist]").dataset.checklist;
  box.addEventListener("change", () => {
    savedChecks[box.dataset.key] = box.checked;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedChecks));
    } catch {
      /* storage may be disabled */
    }
    updateChecklistProgress(group);
    updateDashboardChecklist();
  });
});
["accounts", "messages", "abuse"].forEach(updateChecklistProgress);
renderDashboard();

// Responsive navigation
const menuToggle = $("#menuToggle");
const primaryNav = $("#primaryNav");
menuToggle.addEventListener("click", () => {
  const isOpen = primaryNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
$$(".nav a").forEach((link) =>
  link.addEventListener("click", () => {
    primaryNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }),
);


// Accessible mobile menu behaviour.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && primaryNav.classList.contains("open")) {
    primaryNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.focus();
  }
});
