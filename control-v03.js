import OBR from "https://esm.sh/@owlbear-rodeo/sdk@2";
const POPOVER_ID = "pl.openai.4e-quick-rolls/panel";
const POSITION_KEY = "pl.openai.4e-quick-rolls/panel-position";
const PANEL_WIDTH = 286;
const PANEL_HEIGHT = 122;

async function showPanel() {
  const width = await OBR.viewport.getWidth();
  const height = await OBR.viewport.getHeight();
  const metadata = await OBR.player.getMetadata();
  const saved = metadata[POSITION_KEY];
  const pos = saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)
    ? saved
    : { left: Math.max(PANEL_WIDTH + 12, width - 18), top: Math.max(PANEL_HEIGHT + 12, height - 118) };
  try { await OBR.popover.close(POPOVER_ID); } catch (_) {}
  await OBR.popover.open({
    id: POPOVER_ID,
    url: "/panel-v03.html",
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    anchorReference: "POSITION",
    anchorPosition: pos,
    anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    disableClickAway: true,
    marginThreshold: 8
  });
}

OBR.onReady(() => {
  document.getElementById("show").addEventListener("click", async () => {
    await showPanel();
    await OBR.action.close();
  });
});
