/* ============================================================
   CHICAGO JUMP START — DISPATCH CONSOLE
   3-step gated flow + FIXED address typing stall
   - Debounced suggestions (optional)
   - Aborts in-flight fetch requests
   - Manual address always allowed
   - Saves state in localStorage
   ============================================================ */

(() => {
  const CFG = {
    storageKey: "cjs_dispatch_v2",
    checkoutUrl: "https://store.webmastereric.com/product/chicago-mobile-jump-start/",
    enableSuggestions: true,
    suggestDebounceMs: 450,
    suggestMinChars: 5,
    cityBias: "Chicago, IL"
  };

  const $ = (id) => document.getElementById(id);

  // Steps
  const step1 = $("step1");
  const step2 = $("step2");
  const step3 = $("step3");

  // Chips
  const chip1 = $("chip1");
  const chip2 = $("chip2");
  const chip3 = $("chip3");

  // Buttons
  const next1 = $("next1");
  const next2 = $("next2");
  const resetBtn = $("reset");
  const back1 = $("back1");
  const back2 = $("back2");
  const clearLocation = $("clearLocation");

  // Inputs
  const nameEl = $("name");
  const phoneEl = $("phone");
  const addressEl = $("address");
  const notesEl = $("notes");

  // Location UI
  const suggestionsEl = $("address_suggestions");
  const statusEl = $("location_status");

  // Review + checkout
  const reviewEl = $("review");
  const checkoutBtn = $("checkoutBtn");

  // Required guards
  const required = [step1, step2, step3, next1, next2, resetBtn, back1, back2, nameEl, phoneEl, addressEl, reviewEl, checkoutBtn];
  if (required.some((x) => !x)) {
    console.error("Missing required elements. Check your index.html IDs match app.js.");
    return;
  }

  checkoutBtn.href = CFG.checkoutUrl;

  // -------------------------
  // State
  // -------------------------
  const DEFAULT = {
    step: 1,
    name: "",
    phone: "",
    address: "",
    notes: "",
    lat: null,
    lon: null,
    addressLocked: false,
    updatedAt: null
  };

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(CFG.storageKey);
      if (!raw) return { ...DEFAULT };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT, ...parsed };
    } catch {
      return { ...DEFAULT };
    }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(CFG.storageKey, JSON.stringify(state));
  }

  function setStep(n) {
    state.step = n;
    saveState();
    render();
  }

  function resetAll() {
    state = { ...DEFAULT };
    saveState();
    render();
    clearSuggestionsUI();
    setStatus("");
  }

  // -------------------------
  // Render
  // -------------------------
  function render() {
    // values
    nameEl.value = state.name || "";
    phoneEl.value = state.phone || "";
    addressEl.value = state.address || "";
    notesEl.value = state.notes || "";

    // visibility
    step1.style.display = state.step === 1 ? "block" : "none";
    step2.style.display = state.step === 2 ? "block" : "none";
    step3.style.display = state.step === 3 ? "block" : "none";

    // chips
    [chip1, chip2, chip3].forEach((c) => c.classList.remove("active"));
    if (state.step === 1) chip1.classList.add("active");
    if (state.step === 2) chip2.classList.add("active");
    if (state.step === 3) chip3.classList.add("active");

    // review
    reviewEl.innerHTML = `
      <div style="font-weight:900;margin-bottom:8px;">Request Summary</div>
      <div><strong>Name:</strong> ${esc(state.name || "-")}</div>
      <div><strong>Phone:</strong> ${esc(state.phone || "-")}</div>
      <div><strong>Location:</strong> ${esc(state.address || "-")}</div>
      <div><strong>Notes:</strong> ${esc(state.notes || "-")}</div>
      <div style="margin-top:10px;color:rgba(233,238,248,.56);font-size:12px;">
        ${state.lat && state.lon ? `Geo locked: ${esc(state.lat)}, ${esc(state.lon)}` : "Geo: not set (manual entry is OK)"}
      </div>
    `;

    if (state.addressLocked && state.lat && state.lon) {
      setStatus("Location locked.");
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  // -------------------------
  // Validation
  // -------------------------
  function validateStep1() {
    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    if (name.length < 2) return "Enter your name.";

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return "Enter a valid phone number.";
    return null;
  }

  function validateStep2() {
    const address = addressEl.value.trim();
    if (address.length < 6) return "Enter the address or nearest cross streets.";
    return null;
  }

  // -------------------------
  // Events (Step 1)
  // -------------------------
  nameEl.addEventListener("input", () => { state.name = nameEl.value; saveState(); });
  phoneEl.addEventListener("input", () => { state.phone = phoneEl.value; saveState(); });

  next1.addEventListener("click", () => {
    const err = validateStep1();
    if (err) return alert(err);
    state.name = nameEl.value.trim();
    state.phone = phoneEl.value.trim();
    saveState();
    setStep(2);
  });

  // -------------------------
  // Step 2 Address — FIXED
  // -------------------------
  let geoAbort = null;

  function abortGeo() {
    if (geoAbort) { geoAbort.abort(); geoAbort = null; }
  }

  function debounce(fn, wait = 450) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function setStatus(msg) {
    statusEl.textContent = msg || "";
  }

  function clearSuggestionsUI() {
    if (suggestionsEl) suggestionsEl.innerHTML = "";
  }

  function resetLocationLock() {
    state.addressLocked = false;
    state.lat = null;
    state.lon = null;
    saveState();
  }

  addressEl.addEventListener("input", () => {
    state.address = addressEl.value;
    resetLocationLock();
    saveState();
  });

  const runSuggest = debounce(async () => {
    if (!CFG.enableSuggestions) return;
    if (!suggestionsEl) return;

    const q0 = addressEl.value.trim();
    if (q0.length < CFG.suggestMinChars) {
      clearSuggestionsUI();
      setStatus("");
      return;
    }

    abortGeo();
    geoAbort = new AbortController();

    setStatus("Searching…");
    clearSuggestionsUI();

    // Nominatim (free). This is optional. Manual entry always works.
    const q = `${q0}, ${CFG.cityBias}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;

    try {
      const res = await fetch(url, {
        signal: geoAbort.signal,
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setStatus("No matches. Manual entry is OK — continue.");
        return;
      }

      setStatus("Select a match (optional) or continue with manual entry.");

      suggestionsEl.innerHTML = data.map((r) => {
        const label = (r.display_name || "").replace(/\s+\d{5}(-\d{4})?$/, "");
        const short = label.split(",").slice(0, 3).join(",").trim();
        return `
          <button type="button" class="sug"
            data-lat="${esc(r.lat)}"
            data-lon="${esc(r.lon)}"
            data-label="${esc(label)}">
            ${esc(short)}
            <small>${esc(label)}</small>
          </button>
        `;
      }).join("");

    } catch (e) {
      if (e.name === "AbortError") return;
      console.warn("Geocode error:", e);
      setStatus("Lookup busy. Manual entry is OK — continue.");
      clearSuggestionsUI();
    }
  }, CFG.suggestDebounceMs);

  addressEl.addEventListener("input", runSuggest);

  if (suggestionsEl) {
    suggestionsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button.sug");
      if (!btn) return;

      const label = btn.getAttribute("data-label") || "";
      const lat = btn.getAttribute("data-lat");
      const lon = btn.getAttribute("data-lon");

      addressEl.value = label;
      state.address = label;
      state.lat = lat;
      state.lon = lon;
      state.addressLocked = true;
      saveState();

      clearSuggestionsUI();
      setStatus("Location locked.");
    });
  }

  notesEl.addEventListener("input", () => {
    state.notes = notesEl.value;
    saveState();
  });

  clearLocation.addEventListener("click", () => {
    addressEl.value = "";
    state.address = "";
    resetLocationLock();
    clearSuggestionsUI();
    setStatus("");
    saveState();
    addressEl.focus();
  });

  next2.addEventListener("click", () => {
    const err = validateStep2();
    if (err) return alert(err);

    state.address = addressEl.value.trim();
    state.notes = notesEl.value.trim();
    saveState();

    setStep(3);
  });

  back1.addEventListener("click", () => setStep(1));
  back2.addEventListener("click", () => setStep(2));

  // Reset
  resetBtn.addEventListener("click", () => {
    if (confirm("Reset dispatch form?")) resetAll();
  });

  // Init
  render();
})();