import OBR from "https://esm.sh/@owlbear-rodeo/sdk@2";

const CONFIG_KEY = "pl.openai.4e-quick-rolls/config-v050";
const BONES_ROLL_KEY = "com.battle-system.bones/metadata_bonesroll";
const POPOVER_ID = "pl.openai.4e-quick-rolls/panel";
const POSITION_KEY = "pl.openai.4e-quick-rolls/panel-position";
const LOCAL_CONFIG_KEY = "pl.openai.4e-quick-rolls/local-config-v050";
const LOCAL_POSITION_KEY = "pl.openai.4e-quick-rolls/local-position-v050";
const PANEL_WIDTH = 230;
const PANEL_HEIGHT = 170;
const NEUTRAL = "#3a3a44";
const DEFAULTS = [
  { name: "", notation: "1d20", color: "#6547d8" },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d6",  color: NEUTRAL },
  { name: "", notation: "1d8",  color: NEUTRAL },
  { name: "", notation: "1d10", color: NEUTRAL },
  { name: "", notation: "1d12", color: NEUTRAL }
];

let config = structuredClone(DEFAULTS);
let editing = false;
let statusTimer;

const rollView = document.getElementById("rollView");
const editView = document.getElementById("editView");
const customButtons = document.getElementById("customButtons");
const fields = document.getElementById("fields");
const statusEl = document.getElementById("status");

function normalizeNotation(raw) {
  const compact = String(raw ?? "").trim().replace(/\s+/g, "");
  if (!compact) throw new Error("Puste makro");
  const normalized = compact.replace(/(\d*)[dDkK](\d+)/g, (_, count, sides) => `${count || 1}d${sides}`);
  const term = "(?:\\d+d\\d+|\\d+)";
  const simple = new RegExp(`^[+-]?${term}(?:[+-]${term})*$`, "i");
  if (!simple.test(normalized)) throw new Error("Użyj prostego zapisu, np. 1d20+6 albo 2k8+k6+4");
  return normalized.toLowerCase();
}

function normalizeColor(raw, fallback = NEUTRAL) {
  const value = String(raw ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}

function contrastColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? "#17171b" : "#ffffff";
}

function setStatus(text, error = false) {
  clearTimeout(statusTimer);
  statusEl.textContent = text;
  statusEl.classList.toggle("error", error);
  statusTimer = setTimeout(() => { statusEl.textContent = ""; statusEl.classList.remove("error"); }, 1800);
}

function sanitizeConfig(saved) {
  if (!Array.isArray(saved) || saved.length === 0) return null;
  return DEFAULTS.map((fallback, i) => {
    const x = saved[i];
    return {
      name: String(x?.name ?? fallback.name).slice(0, 24),
      notation: String(x?.notation ?? fallback.notation).slice(0, 48),
      color: normalizeColor(x?.color, fallback.color)
    };
  });
}

function readLocal(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
}
function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

async function movePanelBy(dx, dy) {
  const viewportWidth = await OBR.viewport.getWidth();
  const viewportHeight = await OBR.viewport.getHeight();
  const metadata = await OBR.player.getMetadata();
  const fallback = { left: Math.max(PANEL_WIDTH + 12, viewportWidth - 18), top: Math.max(PANEL_HEIGHT + 12, viewportHeight - 118) };
  const localPos = readLocal(LOCAL_POSITION_KEY);
  const metaPos = metadata[POSITION_KEY];
  const current = localPos && Number.isFinite(localPos.left) && Number.isFinite(localPos.top)
    ? localPos
    : metaPos && Number.isFinite(metaPos.left) && Number.isFinite(metaPos.top) ? metaPos : fallback;
  const next = {
    left: Math.min(viewportWidth - 8, Math.max(PANEL_WIDTH + 8, current.left + dx)),
    top: Math.min(viewportHeight - 8, Math.max(PANEL_HEIGHT + 8, current.top + dy))
  };
  writeLocal(LOCAL_POSITION_KEY, next);
  await OBR.player.setMetadata({ [POSITION_KEY]: next });
  try { await OBR.popover.close(POPOVER_ID); } catch (_) {}
  await OBR.popover.open({
    id: POPOVER_ID,
    url: new URL("./panel-v050.html", import.meta.url).href,
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    anchorReference: "POSITION",
    anchorPosition: next,
    anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    disableClickAway: true,
    marginThreshold: 8
  });
}

function setupDragHandle() {
  const handle = document.getElementById("dragHandle");
  let startX = 0, startY = 0, dragging = false;
  handle.addEventListener("pointerdown", (event) => {
    dragging = true; startX = event.clientX; startY = event.clientY;
    handle.setPointerCapture(event.pointerId); event.preventDefault();
  });
  handle.addEventListener("pointerup", async (event) => {
    if (!dragging) return;
    dragging = false;
    const dx = event.clientX - startX, dy = event.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) await movePanelBy(dx, dy);
  });
  handle.addEventListener("pointercancel", () => { dragging = false; });
}

async function loadConfig() {
  const metadata = await OBR.player.getMetadata();
  const fromLocal = sanitizeConfig(readLocal(LOCAL_CONFIG_KEY));
  const fromMetadata = sanitizeConfig(metadata[CONFIG_KEY]);
  config = fromLocal || fromMetadata || structuredClone(DEFAULTS);
  writeLocal(LOCAL_CONFIG_KEY, config);
}

async function saveConfig(nextConfig) {
  config = nextConfig;
  writeLocal(LOCAL_CONFIG_KEY, config);
  await OBR.player.setMetadata({ [CONFIG_KEY]: config });
}

function renderButtons() {
  customButtons.innerHTML = "";
  config.forEach((item) => {
    const b = document.createElement("button");
    b.className = `rollButton${item.name ? "" : " unnamed"}`;
    b.type = "button";
    b.style.backgroundColor = item.color;
    b.style.color = contrastColor(item.color);
    b.innerHTML = `<span></span><small></small>`;
    b.querySelector("span").textContent = item.name || item.notation;
    b.querySelector("small").textContent = item.name ? item.notation : "";
    b.addEventListener("click", () => rollBones(item.notation, item.name || item.notation));
    customButtons.appendChild(b);
  });
}

function renderFields() {
  fields.innerHTML = "";
  config.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "fieldRow";
    row.innerHTML = `<input type="text" data-name="${index}" maxlength="24" placeholder="Nazwa (opcjonalna)" aria-label="Nazwa makra ${index + 1}"><input type="text" data-notation="${index}" maxlength="48" aria-label="Rzut ${index + 1}"><input type="color" data-color="${index}" aria-label="Kolor ${index + 1}">`;
    row.querySelector(`[data-name="${index}"]`).value = item.name;
    row.querySelector(`[data-notation="${index}"]`).value = item.notation;
    row.querySelector(`[data-color="${index}"]`).value = item.color;
    fields.appendChild(row);
  });
}

function toggleEdit(force) {
  editing = typeof force === "boolean" ? force : !editing;
  rollView.classList.toggle("hidden", editing);
  editView.classList.toggle("hidden", !editing);
  document.getElementById("editToggle").textContent = editing ? "↩" : "⚙";
  if (editing) renderFields();
}

async function rollBones(rawNotation, label = "Rzut") {
  try {
    const notation = normalizeNotation(rawNotation);
    const senderName = await OBR.player.getName();
    await OBR.player.setMetadata({
      [BONES_ROLL_KEY]: {
        notation,
        created: new Date().toISOString(),
        senderName,
        senderId: OBR.player.id,
        viewers: "ALL"
      }
    });
    setStatus(`${label}: ${notation}`);
  } catch (error) {
    console.error(error);
    setStatus(error?.message || "Nie udało się rzucić", true);
  }
}

async function handleSave() {
  try {
    const next = config.map((_, i) => {
      const name = document.querySelector(`[data-name="${i}"]`).value.trim();
      const notation = normalizeNotation(document.querySelector(`[data-notation="${i}"]`).value);
      const color = normalizeColor(document.querySelector(`[data-color="${i}"]`).value, NEUTRAL);
      return { name: name.slice(0, 24), notation, color };
    });
    await saveConfig(next);
    renderButtons(); toggleEdit(false); setStatus("Zapisano");
  } catch (error) { setStatus(error?.message || "Błąd makra", true); }
}

OBR.onReady(async () => {
  try {
    await loadConfig();
    renderButtons(); setupDragHandle();
    document.getElementById("editToggle").addEventListener("click", () => toggleEdit());
    document.getElementById("cancel").addEventListener("click", () => toggleEdit(false));
    document.getElementById("save").addEventListener("click", handleSave);
  } catch (error) {
    console.error(error); setStatus("Błąd inicjalizacji", true);
  }
});
