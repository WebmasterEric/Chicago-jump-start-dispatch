(() => {
  const CONFIG = {
    city: "Chicago, IL",
    vehicles: "Cars • SUVs • Trucks",
    price: "$75",
    checkoutUrl: "https://store.webmastereric.com/product/chicago-mobile-jump-start/",
    smsPhoneDigits: "17738084447"
  };

  // ✅ Edit this list whenever you add more spokes
  // "latest" is always the LAST item in this array.
  const RESOURCES = [
    {
      href: "dead-battery-help-chicago.html",
      title: "Dead Battery Help (Chicago)",
      desc: "Quick confirmation signs a jump start will solve it — and what it won’t solve."
    },
    {
      href: "winter-car-battery-chicago.html",
      title: "Winter Car Battery (Chicago)",
      desc: "Cold weather drain in Chicago: what’s normal, what’s not, and when to dispatch."
    }
  ];

  // DOM
  const jumpToConsole = document.getElementById("jumpToConsole");
  const jumpToResources = document.getElementById("jumpToResources");
  const backToConsole = document.getElementById("backToConsole");
  const toggleResources = document.getElementById("toggleResources");

  const metaPill = document.getElementById("metaPill");
  const resetBtn = document.getElementById("resetBtn");

  const progressFill = document.getElementById("progressFill");
  const stepsWrap = document.getElementById("steps");

  const qaLabel = document.getElementById("qaLabel");
  const qaQuestion = document.getElementById("qaQuestion");
  const qaHint = document.getElementById("qaHint");
  const choices = document.getElementById("choices");
  const answerLine = document.getElementById("answerLine");
  const miniResourcesBtn = document.getElementById("miniResourcesBtn");

  const result = document.getElementById("result");
  const resultBadge = document.getElementById("resultBadge");
  const resultTitle = document.getElementById("resultTitle");
  const resultBody = document.getElementById("resultBody");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const smsBtn = document.getElementById("smsBtn");
  const resourceBtn = document.getElementById("resourceBtn");

  const resources = document.getElementById("resources");
  const latestWrap = document.getElementById("latestWrap");
  const latestCard = document.getElementById("latestCard");
  const latestName = document.getElementById("latestName");
  const latestDesc = document.getElementById("latestDesc");
  const resourceGrid = document.getElementById("resourceGrid");

  const lastUpdatedEl = document.getElementById("lastUpdated");

  checkoutBtn.href = CONFIG.checkoutUrl;

  // State
  const S = {
    step: 1,
    answers: { inChicago:null, vehicle:null, symptom:null, towing:null, safe:null }
  };

  const FLOW = [
    null,
    {
      label: "Step 1 of 5",
      question: "Are you currently in Chicago?",
      hint: "Chicago-only dispatch hub.",
      key: "inChicago",
      options: [{ text: "Yes", value: "Yes" }, { text: "No", value: "No", danger: true }]
    },
    {
      label: "Step 2 of 5",
      question: "What are you driving?",
      hint: "Cars • SUVs • Trucks.",
      key: "vehicle",
      options: [{ text: "Car", value: "Car" }, { text: "SUV", value: "SUV" }, { text: "Truck", value: "Truck" }]
    },
    {
      label: "Step 3 of 5",
      question: "What happens when you try to start it?",
      hint: "Pick the closest match.",
      key: "symptom",
      options: [
        { text: "Clicks / no crank", value: "Clicks / no crank" },
        { text: "No lights / dead", value: "No lights / dead" },
        { text: "Starts then dies", value: "Starts then dies" },
        { text: "Not sure", value: "Not sure" }
      ]
    },
    {
      label: "Step 4 of 5",
      question: "Do you need towing?",
      hint: "Jump start only (no towing, no repairs).",
      key: "towing",
      options: [{ text: "No (jump start only)", value: "No" }, { text: "Yes", value: "Yes", danger: true }]
    },
    {
      label: "Step 5 of 5",
      question: "Are you in a safe place to wait?",
      hint: "If not safe, prioritize safety first.",
      key: "safe",
      options: [{ text: "Yes", value: "Yes" }, { text: "No", value: "No", danger: true }]
    }
  ];

  // Utils
  function scrollToEl(el){ el.scrollIntoView({ behavior:"smooth", block:"start" }); }
  function setMeta(t){ metaPill.textContent = t; }
  function clearChoices(){ choices.innerHTML = ""; }

  function progressPct() {
    const completed = Math.max(0, Math.min(S.step - 1, 5));
    return Math.round((completed / 5) * 100);
  }

  function renderSteps() {
    const btns = stepsWrap.querySelectorAll(".step");
    btns.forEach((b) => {
      const s = parseInt(b.getAttribute("data-step"), 10);
      b.classList.remove("active","done","locked");

      if (s < S.step) { b.classList.add("done"); b.style.cursor = "pointer"; }
      else if (s === S.step) { b.classList.add("active"); b.style.cursor = "default"; }
      else { b.classList.add("locked"); b.style.cursor = "not-allowed"; }

      b.onclick = () => { if (s < S.step && s <= 5) showStep(s, true); };
    });

    progressFill.style.width = progressPct() + "%";
  }

  function summary() {
    const a = S.answers;
    const parts = [];
    if (a.inChicago) parts.push(`City: ${a.inChicago}`);
    if (a.vehicle) parts.push(`Vehicle: ${a.vehicle}`);
    if (a.symptom) parts.push(`Symptom: ${a.symptom}`);
    if (a.towing) parts.push(`Towing: ${a.towing}`);
    if (a.safe) parts.push(`Safe: ${a.safe}`);
    return parts.length ? `Saved: ${parts.join(" • ")}` : "Saved: —";
  }

  function setAnswer(key, value) {
    S.answers[key] = value;
    answerLine.textContent = summary();
  }

  function qualifyVerdict() {
    const a = S.answers;
    if (a.inChicago === "No") return { ok:false, reason:"Chicago-only service." };
    if (a.towing === "Yes") return { ok:false, reason:"Jump start only — towing not included." };
    if (a.safe === "No") return { ok:false, reason:"If you’re not safe to wait, prioritize safety first." };
    return { ok:true, reason:"Qualified for jump start dispatch." };
  }

  function buildSMSLink() {
    const a = S.answers;
    const msg = [
      "CHICAGO JUMP START — REQUEST",
      `City: ${CONFIG.city}`,
      `Vehicle: ${a.vehicle || "-"}`,
      `Symptom: ${a.symptom || "-"}`,
      `Towing: ${a.towing || "-"}`,
      `Safe to wait: ${a.safe || "-"}`,
      "",
      "Proceeding to checkout now."
    ].join("\n");
    return `sms:${CONFIG.smsPhoneDigits}?&body=${encodeURIComponent(msg)}`;
  }

  function showResult() {
    const verdict = qualifyVerdict();
    result.style.display = "block";
    smsBtn.href = buildSMSLink();

    if (verdict.ok) {
      resultBadge.textContent = "Qualified";
      resultBadge.classList.remove("bad");
      resultTitle.textContent = "Dispatch unlocked.";
      resultBody.textContent =
        `Your answers match a standard Chicago mobile jump start request for ${CONFIG.vehicles}. ` +
        `Checkout is the dispatch trigger (collects location + contact). Optional SMS sends a summary.`;
      setMeta("Unlocked • Checkout to dispatch");
    } else {
      resultBadge.textContent = "Not qualified";
      resultBadge.classList.add("bad");
      resultTitle.textContent = "Not a match based on your answers.";
      resultBody.textContent =
        `${verdict.reason} Use Resources below to confirm symptoms or restart.`;
      setMeta("Not qualified • Use resources");
    }

    S.step = 6;
    renderSteps();
  }

  function showStep(stepNum, review=false) {
    S.step = stepNum;
    renderSteps();
    result.style.display = "none";

    const q = FLOW[stepNum];
    qaLabel.textContent = q.label + (review ? " (review)" : "");
    qaQuestion.textContent = q.question;
    qaHint.textContent = q.hint;

    clearChoices();
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choiceBtn" + (opt.danger ? " danger" : "");
      btn.textContent = opt.text;
      btn.onclick = () => {
        setAnswer(q.key, opt.value);
        if (stepNum < 5) showStep(stepNum + 1);
        else showResult();
        setMeta(progressPct() === 0 ? "Locked • Step 1" : `Progress: ${progressPct()}%`);
      };
      choices.appendChild(btn);
    });

    setMeta(progressPct() === 0 ? "Locked • Step 1" : `Progress: ${progressPct()}%`);
  }

  // Resources rendering (real CTAs)
  function renderResources() {
    resourceGrid.innerHTML = "";

    if (!RESOURCES.length) {
      latestName.textContent = "No resources yet";
      latestDesc.textContent = "Add a spoke to the RESOURCES list in app.js.";
      latestCard.href = "#resources";
      return;
    }

    const latest = RESOURCES[RESOURCES.length - 1];
    latestName.textContent = latest.title || latest.href;
    latestDesc.textContent = latest.desc || "Newest resource added to this hub.";
    latestCard.href = latest.href;

    RESOURCES.forEach((r) => {
      const a = document.createElement("a");
      a.className = "resourceCard";
      a.href = r.href;

      const t = document.createElement("div");
      t.className = "resourceTitle";
      t.textContent = r.title || r.href;

      const d = document.createElement("div");
      d.className = "resourceDesc";
      d.textContent = r.desc || "Open this resource to confirm symptoms and next steps.";

      const m = document.createElement("div");
      m.className = "resourceMeta";
      m.textContent = "Open resource →";

      a.appendChild(t);
      a.appendChild(d);
      a.appendChild(m);
      resourceGrid.appendChild(a);
    });
  }

  // Collapse resources
  let resourcesCollapsed = false;
  function setResourcesCollapsed(v) {
    resourcesCollapsed = v;
    const show = !v;
    latestWrap.style.display = show ? "block" : "none";
    resourceGrid.style.display = show ? "grid" : "none";
    toggleResources.textContent = v ? "Expand" : "Collapse";
  }

  // Last updated (simple + reliable, no build step)
  function setLastUpdated() {
    const d = new Date();
    lastUpdatedEl.textContent = d.toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });
  }

  // Bindings
  jumpToConsole.onclick = () => scrollToEl(document.getElementById("console"));
  jumpToResources.onclick = () => scrollToEl(resources);
  backToConsole.onclick = () => scrollToEl(document.getElementById("console"));
  miniResourcesBtn.onclick = () => scrollToEl(resources);
  resourceBtn.onclick = () => scrollToEl(resources);

  resetBtn.onclick = () => resetAll();
  toggleResources.onclick = () => setResourcesCollapsed(!resourcesCollapsed);

  function resetAll() {
    S.step = 1;
    S.answers = { inChicago:null, vehicle:null, symptom:null, towing:null, safe:null };
    answerLine.textContent = "Saved: —";
    result.style.display = "none";
    setMeta("Locked • Step 1");
    showStep(1);
    scrollToEl(document.getElementById("console"));
  }

  // Init
  answerLine.textContent = "Saved: —";
  renderResources();
  setLastUpdated();
  setResourcesCollapsed(false);
  showStep(1);
})();