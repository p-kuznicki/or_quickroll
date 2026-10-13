import OBR from "https://esm.sh/@owlbear-rodeo/sdk@2";

const CONFIG_KEY = "pl.openai.4e-quick-rolls/config";
const BONES_ROLL_KEY = "com.battle-system.bones/metadata_bonesroll";
const POPOVER_ID = "pl.openai.4e-quick-rolls/panel";
const POSITION_KEY = "pl.openai.4e-quick-rolls/panel-position";
const PANEL_WIDTH = 286;
const PANEL_HEIGHT = 122;
const DEFAULTS = [
  { name: "Atak +6", notation: "1d20+6" },
  { name: "Atak +7", notation: "1d20+7" },
  { name: "Obrażenia", notation: "1d8+4" },
  { name: "Inicjatywa", notation: "1d20+3" }
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
  if (!simple.test(normalized)) {
    throw new Error("Użyj prostego zapisu, np. 1d20+6 albo 2k8+k6+4");
  }
  return normalized.toLowerCase();
}

function setStatus(text, error = false) {
  clearTimeout(statusTimer);
  statusEl.textContent = text;
  statusEl.classList.toggle("error", error);
  statusTimer = setTimeout(() => { statusEl.textContent = ""; statusEl.classList.remove("error"); }, 1800);
}


async function movePanelBy(dx, dy) {
  const viewportWidth = await OBR.viewport.getWidth();
  const viewportHeight = await OBR.viewport.getHeight();
  const metadata = await OBR.player.getMetadata();
  const fallback = { left: Math.max(PANEL_WIDTH + 12, viewportWidth - 18), top: Math.max(PANEL_HEIGHT + 12, viewportHeight - 118) };
  const current = metadata[POSITION_KEY] && Number.isFinite(metadata[POSITION_KEY].left) && Number.isFinite(metadata[POSITION_KEY].top)
    ? metadata[POSITION_KEY] : fallback;

  // anchor is the panel's bottom-right corner; dragging right/down adds to both values.
  const next = {
    left: Math.min(viewportWidth - 8, Math.max(PANEL_WIDTH + 8, current.left + dx)),
    top: Math.min(viewportHeight - 8, Math.max(PANEL_HEIGHT + 8, current.top + dy))
  };
  await OBR.player.setMetadata({ [POSITION_KEY]: next });
  try { await OBR.popover.close(POPOVER_ID); } catch (_) {}
  await OBR.popover.open({
    id: POPOVER_ID,
    url: "/panel-v03.html",
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
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  handle.addEventListener("pointerup", async (event) => {
    if (!dragging) return;
    dragging = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) await movePanelBy(dx, dy);
  });
  handle.addEventListener("pointercancel", () => { dragging = false; });
}

async function loadConfig() {
  const metadata = await OBR.player.getMetadata();
  const saved = metadata[CONFIG_KEY];
  if (Array.isArray(saved) && saved.length === 4) {
    config = saved.map((x, i) => ({
      name: String(x?.name || DEFAULTS[i].name).slice(0, 24),
      notation: String(x?.notation || DEFAULTS[i].notation).slice(0, 48)
    }));
  }
}

async function saveConfig(nextConfig) {
  config = nextConfig;
  await OBR.player.setMetadata({ [CONFIG_KEY]: config });
}

function renderButtons() {
  customButtons.innerHTML = "";
  config.forEach((item) => {
    const b = document.createElement("button");
    b.className = "rollButton";
    b.type = "button";
    b.innerHTML = `<span></span><small></small>`;
    b.querySelector("span").textContent = item.name;
    b.querySelector("small").textContent = item.notation;
    b.addEventListener("click", () => rollBones(item.notation, item.name));
    customButtons.appendChild(b);
  });
}

function renderFields() {
  fields.innerHTML = "";
  config.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "fieldRow";
    row.innerHTML = `
      <input data-name="${index}" maxlength="24" aria-label="Nazwa makra ${index + 1}">
      <input data-notation="${index}" maxlength="48" aria-label="Rzut ${index + 1}">
    `;
    row.querySelector(`[data-name="${index}"]`).value = item.name;
    row.querySelector(`[data-notation="${index}"]`).value = item.notation;
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
    const now = new Date().toISOString();
    await OBR.player.setMetadata({
      [BONES_ROLL_KEY]: {
        notation,
        created: now,
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
      const name = document.querySelector(`[data-name="${i}"]`).value.trim() || `Makro ${i + 1}`;
      const notation = normalizeNotation(document.querySelector(`[data-notation="${i}"]`).value);
      return { name: name.slice(0, 24), notation };
    });
    await saveConfig(next);
    renderButtons();
    toggleEdit(false);
    setStatus("Zapisano");
  } catch (error) {
    setStatus(error?.message || "Błąd makra", true);
  }
}

OBR.onReady(async () => {
  try {
    await loadConfig();
    renderButtons();
    setupDragHandle();
    document.querySelector('[data-roll="1d20"]').addEventListener("click", () => rollBones("1d20", "D20"));
    document.getElementById("editToggle").addEventListener("click", () => toggleEdit());
    document.getElementById("cancel").addEventListener("click", () => toggleEdit(false));
    document.getElementById("save").addEventListener("click", handleSave);
  } catch (error) {
    console.error(error);
    setStatus("Błąd inicjalizacji", true);
  }
});
