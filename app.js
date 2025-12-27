/* app.js (V2.2) */
(() => {
  const CONFIG = {
    checkoutUrl: "https://store.webmastereric.com/product/chicago-mobile-jump-start/",
    smsPhoneDigits: "17738084447",
    cityLabel: "Chicago, IL",
    priceLabel: "$75"
  };

  // ✅ Spokes (keep original file names; title/desc are optional)
  const RESOURCES = [
    {
      href: "dead-battery-help-chicago.html",
      title: "Dead Battery Help (Chicago)",
      desc: "Fast signs a jump start will solve it — and what it won’t solve."
    },
    {
      href: "winter-car-battery-chicago.html",
      title: "Winter Car Battery (Chicago)",
      desc: "Cold-weather battery drain in Chicago: what to expect and when to dispatch."
    }
  ];

  // DOM
  const goDispatch = document.getElementById("goDispatch");
  const goResources = document.getElementById("goResources");

  const resetBtn = document.getElementById("reset");

  const progressFill = document.getElementById("progressFill");
  const dotSteps = Array.from(document.querySelectorAll(".dotStep"));

  const stepText = document.getElementById("stepText");
  const questionEl = document.getElementById("question");
  const hintEl = document.getElementById("hint");
  const choicesEl = document.getElementById("choices");
  const savedLine = document.getElementById("savedLine");
  const jumpResources = document.getElementById("jumpResources");

  const result = document.getElementById("result");
  const badge = document.getElementById("badge");
  const resultTitle = document.getElementById("resultTitle");
  const resultBody = document.getElementById("resultBody");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const smsBtn = document.getElementById("smsBtn");
  const viewResourcesBtn = document.getElementById("viewResourcesBtn");

  const backToDispatch = document.getElementById("backToDispatch");
  const resourceGrid = document.getElementById("resourceGrid");
  const lastUpdated = document.getElementById("lastUpdated");

  // NEW: last 3 file links container
  const fileLinks = document.getElementById("fileLinks");

  checkoutBtn.href = CONFIG.checkoutUrl;

  // Flow state
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
      options: [
        { text: "Yes", value: "Yes" },
        { text: "No", value: "No", danger: true }
      ]
    },
    {
      label: "Step 2 of 5",
      question: "What are you driving?",
      hint: "Cars • SUVs • trucks.",
      key: "vehicle",
      options: [
        { text: "Car", value: "Car" },
        { text: "SUV", value: "SUV" },
        { text: "Truck", value: "Truck" }
      ]
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
      options: [
        { text: "No (jump start only)", value: "No" },
        { text: "Yes", value: "Yes", danger: true }
      ]
    },
    {
      label: "Step 5 of 5",
      question: "Are you in a safe place to wait?",
      hint: "If not safe, prioritize safety first.",
      key: "safe",
      options: [
        { text: "Yes", value: "Yes" },
        { text: "No", value: "No", danger: true }
      ]
    }
  ];

  function scrollToId(id){
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function pct(){
    const completed = Math.max(0, Math.min(S.step - 1, 5));
    return Math.round((completed / 5) * 100);
  }

  function updateProgressUI(){
    progressFill.style.width = pct() + "%";

    dotSteps.forEach((node) => {
      const n = parseInt(node.getAttribute("data-dot"), 10);
      node.classList.remove("active","done");
      if (n < S.step) node.classList.add("done");
      else if (n === S.step) node.classList.add("active");
    });

    const bar = document.querySelector(".progressBar");
    if (bar) bar.setAttribute("aria-valuenow", String(Math.max(0, Math.min(S.step - 1, 5))));
  }

  function summary(){
    const a = S.answers;
    const parts = [];
    if (a.inChicago) parts.push(`City: ${a.inChicago}`);
    if (a.vehicle) parts.push(`Vehicle: ${a.vehicle}`);
    if (a.symptom) parts.push(`Symptom: ${a.symptom}`);
    if (a.towing) parts.push(`Towing: ${a.towing}`);
    if (a.safe) parts.push(`Safe: ${a.safe}`);
    return parts.length ? `Saved: ${parts.join(" • ")}` : "Saved: —";
  }

  function setAnswer(key, value){
    S.answers[key] = value;
    savedLine.textContent = summary();
  }

  function verdict(){
    const a = S.answers;
    if (a.inChicago === "No") return { ok:false, reason:"Chicago-only service." };
    if (a.towing === "Yes") return { ok:false, reason:"Jump start only — towing not included." };
    if (a.safe === "No") return { ok:false, reason:"If you’re not safe to wait, prioritize safety first." };
    return { ok:true, reason:"Qualified for dispatch." };
  }

  function buildSMSLink(){
    const a = S.answers;
    const msg = [
      "CHICAGO JUMP START — REQUEST",
      `City: ${CONFIG.cityLabel}`,
      `Vehicle: ${a.vehicle || "-"}`,
      `Symptom: ${a.symptom || "-"}`,
      `Towing: ${a.towing || "-"}`,
      `Safe to wait: ${a.safe || "-"}`,
      "",
      `Checkout: ${CONFIG.checkoutUrl}`
    ].join("\n");
    return `sms:${CONFIG.smsPhoneDigits}?&body=${encodeURIComponent(msg)}`;
  }

  function showStep(stepNum){
    S.step = stepNum;
    updateProgressUI();
    result.hidden = true;

    const q = FLOW[stepNum];
    stepText.textContent = q.label;
    questionEl.textContent = q.question;
    hintEl.textContent = q.hint;

    choicesEl.innerHTML = "";
    q.options.forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choiceBtn" + (opt.danger ? " danger" : "");
      b.textContent = opt.text;
      b.onclick = () => {
        setAnswer(q.key, opt.value);
        if (stepNum < 5) showStep(stepNum + 1);
        else showResult();
      };
      choicesEl.appendChild(b);
    });
  }

  function showResult(){
    const v = verdict();
    result.hidden = false;
    smsBtn.href = buildSMSLink();

    if (v.ok){
      badge.textContent = "Qualified";
      badge.classList.remove("bad");
      resultTitle.textContent = "Dispatch unlocked.";
      resultBody.textContent =
        `Your answers match a standard Chicago mobile jump start request. ` +
        `Proceed to checkout (${CONFIG.priceLabel}) to trigger dispatch.`;
      checkoutBtn.style.display = "inline-flex";
    } else {
      badge.textContent = "Not qualified";
      badge.classList.add("bad");
      resultTitle.textContent = "Not a match based on your answers.";
      resultBody.textContent = `${v.reason} Use Resources to confirm next steps.`;
      checkoutBtn.style.display = "none";
    }
    updateProgressUI();
  }

  // Resources: cards + separate last-3 filename links (plain)
  function renderResources(){
    resourceGrid.innerHTML = "";
    if (fileLinks) fileLinks.innerHTML = "";

    if (!RESOURCES || RESOURCES.length === 0){
      if (fileLinks){
        fileLinks.textContent = "No files yet.";
      }
      return;
    }

    // last 3 (max)
    const last3 = RESOURCES.slice(-3).reverse();
    if (fileLinks){
      last3.forEach((r, idx) => {
        const a = document.createElement("a");
        a.href = r.href;
        a.textContent = r.href; // keep original filename
        a.style.display = "inline-block";
        a.style.marginRight = "12px";
        a.style.marginTop = "8px";
        a.style.color = "rgba(90,169,255,.95)";
        a.style.fontWeight = "900";
        a.style.fontSize = "12px";
        a.style.textDecoration = "none";
        a.setAttribute("aria-label", `Open ${r.href}`);
        fileLinks.appendChild(a);
      });
    }

    // cards (use title/desc if present; filenames remain in separate links above)
    RESOURCES.forEach((r) => {
      const a = document.createElement("a");
      a.className = "glassCardLink";
      a.href = r.href;

      const t = document.createElement("div");
      t.className = "cardTitle";
      t.textContent = r.title || r.href;

      const d = document.createElement("div");
      d.className = "cardDesc";
      d.textContent = r.desc || "Open this resource to confirm symptoms and next steps.";

      const m = document.createElement("div");
      m.className = "cardMeta";
      m.textContent = "Open resource →";

      a.appendChild(t);
      a.appendChild(d);
      a.appendChild(m);

      resourceGrid.appendChild(a);
    });
  }

  function setLastUpdated(){
    const d = new Date();
    lastUpdated.textContent = d.toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });
  }

  function resetAll(){
    S.step = 1;
    S.answers = { inChicago:null, vehicle:null, symptom:null, towing:null, safe:null };
    savedLine.textContent = "Saved: —";
    showStep(1);
    scrollToId("dispatch");
  }

  // Bind
  goDispatch.onclick = () => scrollToId("dispatch");
  goResources.onclick = () => scrollToId("resources");
  jumpResources.onclick = () => scrollToId("resources");
  backToDispatch.onclick = () => scrollToId("dispatch");
  viewResourcesBtn.onclick = () => scrollToId("resources");
  resetBtn.onclick = resetAll;

  // Init
  savedLine.textContent = "Saved: —";
  renderResources();
  setLastUpdated();
  showStep(1);
})();