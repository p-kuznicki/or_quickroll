import OBR from "https://esm.sh/@owlbear-rodeo/sdk@2";

const POPOVER_ID = "pl.openai.4e-quick-rolls/panel";
const POSITION_KEY = "pl.openai.4e-quick-rolls/panel-position";
const PANEL_WIDTH = 286;
const PANEL_HEIGHT = 122;

function defaultPosition(width, height) {
  return { left: Math.max(PANEL_WIDTH + 12, width - 18), top: Math.max(PANEL_HEIGHT + 12, height - 118) };
}

async function getSavedPosition(width, height) {
  const metadata = await OBR.player.getMetadata();
  const saved = metadata[POSITION_KEY];
  if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) return saved;
  return defaultPosition(width, height);
}

async function showPanel() {
  try {
    const ready = await OBR.scene.isReady();
    if (!ready) return;
    const width = await OBR.viewport.getWidth();
    const height = await OBR.viewport.getHeight();
    const pos = await getSavedPosition(width, height);

    try { await OBR.popover.close(POPOVER_ID); } catch (_) {}

    await OBR.popover.open({
      id: POPOVER_ID,
      url: new URL("./panel-v03.html", import.meta.url).href,
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      anchorReference: "POSITION",
      anchorPosition: pos,
      anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
      transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
      disableClickAway: true,
      marginThreshold: 8
    });
  } catch (error) {
    console.error("4E Quick Rolls: could not open panel", error);
  }
}

OBR.onReady(() => {
  showPanel();
  OBR.scene.onReadyChange((ready) => {
    if (ready) setTimeout(showPanel, 250);
  });
});
