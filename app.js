// PUBLIC DISPATCH CONSOLE — step-locked wizard
// Replace this with your real Woo product URL:
const WOO_PRODUCT_URL = "https://store.webmastereric.com/product/chicago-mobile-jump-start/";

const state = {
  step: 1,
  confirm: { scopeOk:false, accessOk:false },
  location: { address:"", cross:"", notes:"" },
  vehicle: { phone:"", type:"", extra:"" }
};

const panel = document.getElementById("panel");
const statusLine = document.getElementById("statusLine");
const meterFill = document.getElementById("meterFill");
const meterPct = document.getElementById("meterPct");

const tab1 = document.getElementById("tab1");
const tab2 = document.getElementById("tab2");
const tab3 = document.getElementById("tab3");
const tab4 = document.getElementById("tab4");

function setMeter(p){
  meterFill.style.width = `${p}%`;
  meterPct.textContent = `${p}%`;
}

function setStatus(txt){ statusLine.textContent = `STATUS: ${txt}`; }

function unlockTabs(){
  tab2.disabled = !isStepComplete(1);
  tab3.disabled = !isStepComplete(2);
  tab4.disabled = !isStepComplete(3);
}

function setActiveTab(n){
  [tab1,tab2,tab3,tab4].forEach(t=>t.classList.remove("active"));
  document.getElementById(`tab${n}`).classList.add("active");
}

function isStepComplete(step){
  if(step===1) return state.confirm.scopeOk && state.confirm.accessOk;
  if(step===2) return state.location.address.trim().length >= 8;
  if(step===3) return state.vehicle.phone.trim().length >= 10 && state.vehicle.type.trim().length >= 2;
  return false;
}

function nextStep(){
  if(state.step < 4) state.step += 1;
  render();
}
function prevStep(){
  if(state.step > 1) state.step -= 1;
  render();
}

function goStep(n){
  // step lock: cannot jump ahead unless previous steps complete
  if(n===1) { state.step=1; render(); return; }
  if(n===2 && isStepComplete(1)) { state.step=2; render(); return; }
  if(n===3 && isStepComplete(2)) { state.step=3; render(); return; }
  if(n===4 && isStepComplete(3)) { state.step=4; render(); return; }
}

tab1.onclick = ()=>goStep(1);
tab2.onclick = ()=>goStep(2);
tab3.onclick = ()=>goStep(3);
tab4.onclick = ()=>goStep(4);

function buildCheckoutUrl(){
  // Best-effort prefill: attach a "dispatch packet" in query params.
  // Woo may not auto-fill fields unless you add a plugin/fields, but this still preserves the info.
  const packet = {
    address: state.location.address,
    cross: state.location.cross,
    notes: state.location.notes,
    phone: state.vehicle.phone,
    vehicle: state.vehicle.type,
    extra: state.vehicle.extra
  };
  const q = encodeURIComponent(JSON.stringify(packet));
  return `${WOO_PRODUCT_URL}?dispatch_packet=${q}`;
}

function render(){
  unlockTabs();
  setActiveTab(state.step);

  // meter
  let pct = 0;
  if(isStepComplete(1)) pct = 25;
  if(isStepComplete(2)) pct = 55;
  if(isStepComplete(3)) pct = 85;
  if(state.step===4) pct = 100;
  setMeter(pct);

  // status
  const statuses = {
    1:"Packet Start — Confirm Scope",
    2:"Packet Build — Location Lock",
    3:"Packet Build — Vehicle + Contact",
    4:"Packet Ready — Checkout"
  };
  setStatus(statuses[state.step]);

  if(state.step===1){
    panel.innerHTML = `
      <h2>Step 1 — Confirm Service</h2>
      <p class="badge">DISPATCH RULE: You must confirm scope before proceeding.</p>

      <label><input type="checkbox" id="scopeOk" ${state.confirm.scopeOk?"checked":""}/> I understand this is jump start assistance only (no towing, no repairs).</label>
      <label><input type="checkbox" id="accessOk" ${state.confirm.accessOk?"checked":""}/> My vehicle is accessible and safe to approach (no locked garage / unsafe situation).</label>

      <div class="actions">
        <button class="btn secondary" disabled>Back</button>
        <button class="btn" id="nextBtn" ${isStepComplete(1)?"":"disabled"}>Confirm + Continue</button>
      </div>
    `;
    document.getElementById("scopeOk").onchange = (e)=>{ state.confirm.scopeOk = e.target.checked; render(); };
    document.getElementById("accessOk").onchange = (e)=>{ state.confirm.accessOk = e.target.checked; render(); };
    document.getElementById("nextBtn").onclick = nextStep;
  }

  if(state.step===2){
    panel.innerHTML = `
      <h2>Step 2 — Location Lock</h2>
      <p>Enter the exact location where the vehicle is right now.</p>

      <label>Address / Location (required)</label>
      <input id="address" placeholder="1234 W Example St, Chicago, IL" value="${escapeHtml(state.location.address)}"/>

      <div class="row">
        <div>
          <label>Cross streets (optional)</label>
          <input id="cross" placeholder="Near X & Y" value="${escapeHtml(state.location.cross)}"/>
        </div>
        <div>
          <label>Access notes (optional)</label>
          <input id="notes" placeholder="Parking lot level / alley / gate code info" value="${escapeHtml(state.location.notes)}"/>
        </div>
      </div>

      <div class="actions">
        <button class="btn secondary" id="backBtn">Back</button>
        <button class="btn" id="nextBtn" ${isStepComplete(2)?"":"disabled"}>Lock Location + Continue</button>
      </div>
    `;
    document.getElementById("address").oninput = (e)=>{ state.location.address = e.target.value; render(); };
    document.getElementById("cross").oninput = (e)=>{ state.location.cross = e.target.value; render(); };
    document.getElementById("notes").oninput = (e)=>{ state.location.notes = e.target.value; render(); };
    document.getElementById("backBtn").onclick = prevStep;
    document.getElementById("nextBtn").onclick = nextStep;
  }

  if(state.step===3){
    panel.innerHTML = `
      <h2>Step 3 — Vehicle + Contact</h2>
      <p>Dispatch needs a callback number and basic vehicle info.</p>

      <div class="row">
        <div>
          <label>Phone number (required)</label>
          <input id="phone" placeholder="(312) 555-0123" value="${escapeHtml(state.vehicle.phone)}"/>
        </div>
        <div>
          <label>Vehicle type (required)</label>
          <select id="type">
            ${option("", "Select…")}
            ${option("Car", "Car")}
            ${option("SUV", "SUV")}
            ${option("Van", "Van")}
            ${option("Truck", "Truck")}
            ${option("Other", "Other")}
          </select>
        </div>
      </div>

      <label>Extra notes (optional)</label>
      <textarea id="extra" placeholder="Battery in trunk / under seat? Any special access info?">${escapeHtml(state.vehicle.extra)}</textarea>

      <div class="actions">
        <button class="btn secondary" id="backBtn">Back</button>
        <button class="btn" id="nextBtn" ${isStepComplete(3)?"":"disabled"}>Complete Packet</button>
      </div>
    `;
    document.getElementById("phone").oninput = (e)=>{ state.vehicle.phone = e.target.value; render(); };
    document.getElementById("type").value = state.vehicle.type;
    document.getElementById("type").onchange = (e)=>{ state.vehicle.type = e.target.value; render(); };
    document.getElementById("extra").oninput = (e)=>{ state.vehicle.extra = e.target.value; render(); };
    document.getElementById("backBtn").onclick = prevStep;
    document.getElementById("nextBtn").onclick = nextStep;
  }

  if(state.step===4){
    const checkoutUrl = buildCheckoutUrl();
    panel.innerHTML = `
      <h2>Step 4 — Checkout</h2>
      <p class="badge">✅ Packet accepted. You are ready to enter the queue.</p>

      <p><strong>Dispatch Summary</strong><br/>
      Location: ${escapeHtml(state.location.address)}<br/>
      Phone: ${escapeHtml(state.vehicle.phone)}<br/>
      Vehicle: ${escapeHtml(state.vehicle.type || "—")}</p>

      <div class="actions">
        <button class="btn secondary" id="backBtn">Back</button>
        <a class="btn" href="${checkoutUrl}" rel="nofollow">Proceed to Pay ($75)</a>
      </div>

      <p class="tiny">Note: After checkout, keep your phone available. You’ll get ETA confirmation by call/text.</p>
    `;
    document.getElementById("backBtn").onclick = prevStep;
  }
}

function option(val, label){
  const sel = (state.vehicle.type===val) ? "selected" : "";
  return `<option value="${val}" ${sel}>${label}</option>`;
}
function escapeHtml(s){
  return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

render();