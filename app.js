/* ============================================================
   CHICAGO MOBILE JUMP START — HIGH-CONVERTING HUB (MVP)
   - Checkout is primary (dispatch trigger)
   - SMS is optional (single tap) to 773-808-4447
   - Vets basic fit: Chicago? vehicle? symptom? towing? safe?
   - References spokes as "Resources"
   ============================================================ */

(() => {
  const CONFIG = {
    city: "Chicago, IL",
    vehicles: "Cars • SUVs • Trucks",
    price: "$75",
    scopeLine: "Jump start only • No towing • No repairs",

    // Primary CTA:
    checkoutUrl: "https://store.webmastereric.com/product/chicago-mobile-jump-start/",

    // Optional SMS:
    smsPhoneDigits: "17738084447" // +1 773-808-4447
  };

  const chatBody = document.getElementById("chatBody");
  const chatMeta = document.getElementById("chatMeta");
  const quickRow = document.getElementById("quickRow");
  const actionRow = document.getElementById("actionRow");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const sendRequestBtn = document.getElementById("sendRequestBtn");
  const restartBtn = document.getElementById("restartBtn");

  checkoutBtn.href = CONFIG.checkoutUrl;

  const S = {
    answers: {
      inChicago: null,
      vehicleType: null,
      symptom: null,
      safeToWait: null,
      towingNeeded: null
    }
  };

  function addBubble(text, who = "bot") {
    const d = document.createElement("div");
    d.className = `bubble ${who}`;
    d.textContent = text;
    chatBody.appendChild(d);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function setMeta(text) {
    chatMeta.textContent = text;
  }

  function clearQuick() {
    quickRow.innerHTML = "";
  }

  function showQuick(buttons) {
    clearQuick();
    actionRow.style.display = "none";

    buttons.forEach((b) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qbtn" + (b.danger ? " danger" : "");
      btn.textContent = b.label;
      btn.addEventListener("click", () => b.onClick());
      quickRow.appendChild(btn);
    });
  }

  function qualifyVerdict() {
    const a = S.answers;
    if (a.inChicago === "No") return { ok: false, reason: "Chicago-only service." };
    if (a.towingNeeded === "Yes") return { ok: false, reason: "This is jump start only — towing is not included." };
    if (a.safeToWait === "No") return { ok: false, reason: "If you’re not safe to wait, prioritize safety first." };
    return { ok: true, reason: "Qualified for a jump start dispatch." };
  }

  function buildPrefillSMS() {
    const a = S.answers;
    const msg = [
      "CHICAGO JUMP START — REQUEST",
      `City: ${CONFIG.city}`,
      `Vehicle: ${a.vehicleType ?? "-"}`,
      `Symptom: ${a.symptom ?? "-"}`,
      `Safe to wait: ${a.safeToWait ?? "-"}`,
      `Towing needed: ${a.towingNeeded ?? "-"}`,
      "",
      "I’m proceeding to checkout now."
    ].join("\n");

    return `sms:${CONFIG.smsPhoneDigits}?&body=${encodeURIComponent(msg)}`;
  }

  function showFinalActions(qualified) {
    clearQuick();
    actionRow.style.display = "flex";
    sendRequestBtn.href = buildPrefillSMS();

    if (qualified) {
      setMeta("Qualified • Checkout to dispatch");
      addBubble("✅ You’re in the right place for a Chicago mobile jump start.", "bot");
      addBubble("Proceed to checkout to trigger dispatch. Optional: text the request summary if you want.", "bot");
      addBubble("If you’re diagnosing, scroll to Resources below.", "bot");
    } else {
      setMeta("Not qualified");
      addBubble("This request doesn’t match the jump start scope based on your answers.", "bot");
      addBubble("You can restart, or use Resources below to confirm what’s going on.", "bot");
    }
  }

  function start() {
    // reset
    chatBody.innerHTML = "";
    setMeta("Ready");
    S.answers = { inChicago: null, vehicleType: null, symptom: null, safeToWait: null, towingNeeded: null };

    addBubble(`Welcome. This is the authoritative hub for Chicago mobile jump starts (${CONFIG.vehicles}).`, "bot");
    addBubble(`Flat ${CONFIG.price}. Same-day possible. ${CONFIG.scopeLine}.`, "bot");
    addBubble("Quick check — answer a few questions and you’ll get routed.", "bot");

    setTimeout(() => {
      addBubble("Are you currently in Chicago?", "bot");
      showQuick([
        { label: "Yes", onClick: () => { addBubble("Yes", "user"); S.answers.inChicago = "Yes"; qVehicle(); } },
        { label: "No", danger: true, onClick: () => { addBubble("No", "user"); S.answers.inChicago = "No"; finish(); } }
      ]);
    }, 250);
  }

  function qVehicle() {
    setMeta("Vehicle check");
    addBubble("What are you driving?", "bot");
    showQuick([
      { label: "Car", onClick: () => { addBubble("Car", "user"); S.answers.vehicleType = "Car"; qSymptom(); } },
      { label: "SUV", onClick: () => { addBubble("SUV", "user"); S.answers.vehicleType = "SUV"; qSymptom(); } },
      { label: "Truck", onClick: () => { addBubble("Truck", "user"); S.answers.vehicleType = "Truck"; qSymptom(); } }
    ]);
  }

  function qSymptom() {
    setMeta("Symptom check");
    addBubble("What happens when you try to start it?", "bot");
    showQuick([
      { label: "Clicks / no crank", onClick: () => { addBubble("Clicks / no crank", "user"); S.answers.symptom = "Clicks / no crank"; qTow(); } },
      { label: "No lights / dead", onClick: () => { addBubble("No lights / dead", "user"); S.answers.symptom = "No lights / dead"; qTow(); } },
      { label: "Starts then dies", onClick: () => { addBubble("Starts then dies", "user"); S.answers.symptom = "Starts then dies"; qTow(); } },
      { label: "Not sure", onClick: () => { addBubble("Not sure", "user"); S.answers.symptom = "Not sure"; qTow(); } }
    ]);
  }

  function qTow() {
    setMeta("Scope check");
    addBubble("Do you need towing?", "bot");
    showQuick([
      { label: "No (jump start only)", onClick: () => { addBubble("No (jump start only)", "user"); S.answers.towingNeeded = "No"; qSafe(); } },
      { label: "Yes", danger: true, onClick: () => { addBubble("Yes", "user"); S.answers.towingNeeded = "Yes"; qSafe(); } }
    ]);
  }

  function qSafe() {
    setMeta("Safety check");
    addBubble("Are you in a safe place to wait?", "bot");
    showQuick([
      { label: "Yes", onClick: () => { addBubble("Yes", "user"); S.answers.safeToWait = "Yes"; finish(); } },
      { label: "No", danger: true, onClick: () => { addBubble("No", "user"); S.answers.safeToWait = "No"; finish(); } }
    ]);
  }

  function finish() {
    const verdict = qualifyVerdict();
    showFinalActions(verdict.ok);

    restartBtn.onclick = () => start();
  }

  // init
  start();
})();