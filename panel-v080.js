import OBR from "https://esm.sh/@owlbear-rodeo/sdk@2";

const CONFIG_KEY = "pl.openai.4e-quick-rolls/config-v060";
const PREVIOUS_CONFIG_KEYS = ["pl.openai.4e-quick-rolls/config-v050", "pl.openai.4e-quick-rolls/config-v040"];
const BONES_ROLL_KEY = "com.battle-system.bones/metadata_bonesroll";
const POPOVER_ID = "pl.openai.4e-quick-rolls/panel";
const SETTINGS_MODAL_ID = "pl.openai.4e-quick-rolls/settings";
const POSITION_KEY = "pl.openai.4e-quick-rolls/panel-position";
const LOCAL_CONFIG_KEY = "pl.openai.4e-quick-rolls/local-config-v060";
const PREVIOUS_LOCAL_CONFIG_KEYS = ["pl.openai.4e-quick-rolls/local-config-v050", "pl.openai.4e-quick-rolls/local-config-v040"];
const LOCAL_POSITION_KEY = "pl.openai.4e-quick-rolls/local-position-v050";
const PANEL_WIDTH = 230;
const PANEL_HEIGHT = 204;
const NEUTRAL = "#3a3a44";
const PALETTE = ["#d946ef", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", NEUTRAL];

// Default 2 x 5 layout (row-major): d20s on the left, d4-d12 on the right.
// The bottom-left bare d20 is the pink default roll.
const DEFAULTS = [
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d4",  color: NEUTRAL },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d6",  color: NEUTRAL },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d8",  color: NEUTRAL },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d10", color: NEUTRAL },
  { name: "", notation: "1d20", color: "#d946ef" },
  { name: "", notation: "1d12", color: NEUTRAL }
];
const V070_DEFAULTS = [
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d12", color: NEUTRAL },
  { name: "", notation: "1d6",  color: NEUTRAL },
  { name: "", notation: "1d8",  color: NEUTRAL },
  { name: "", notation: "1d10", color: NEUTRAL },
  { name: "", notation: "1d20", color: "#d946ef" }
];
const OLD_DEFAULTS = [
  { name: "", notation: "1d20", color: "#d946ef" },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d20", color: NEUTRAL },
  { name: "", notation: "1d6",  color: NEUTRAL },
  { name: "", notation: "1d8",  color: NEUTRAL },
  { name: "", notation: "1d10", color: NEUTRAL },
  { name: "", notation: "1d12", color: NEUTRAL }
];

let config = structuredClone(DEFAULTS);
let editingIndex = null;
let statusTimer;

const rollView = document.getElementById("rollView");
const editView = document.getElementById("editView");
const customButtons = document.getElementById("customButtons");
const fields = document.getElementById("fields");
const statusEl = document.getElementById("status");
const editTitle = document.getElementById("editTitle");

function normalizeNotation(raw) {
  const compact = String(raw ?? "").trim().replace(/\s+/g, "");
  if (!compact) throw new Error("Puste makro");
  const normalized = compact.replace(/(\d*)[dDkK](\d+)/g, (_, count, sides) => `${count || 1}d${sides}`);
  const term = "(?:\\d+d\\d+|\\d+)";
  const simple = new RegExp(`^[+-]?${term}(?:[+-]${term})*$`, "i");
  if (!simple.test(normalized)) throw new Error("Użyj prostego zapisu, np. 1d20+6 albo 2k8+k6+4");
  return normalized.toLowerCase();
}
function normalizeColor(raw, fallback = NEUTRAL) { const value = String(raw ?? "").trim().toLowerCase(); return PALETTE.includes(value) ? value : fallback; }
function contrastColor(hex) { const n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255; return (r*299+g*587+b*114)/1000>155?"#17171b":"#ffffff"; }
function setStatus(text,error=false){clearTimeout(statusTimer);statusEl.textContent=text;statusEl.classList.toggle("error",error);statusTimer=setTimeout(()=>{statusEl.textContent="";statusEl.classList.remove("error")},1800)}
function sanitizeConfig(saved){if(!Array.isArray(saved)||saved.length===0)return null;return DEFAULTS.map((fallback,i)=>{const x=saved[i];return{name:String(x?.name??fallback.name).slice(0,24),notation:String(x?.notation??fallback.notation).slice(0,48),color:normalizeColor(x?.color,fallback.color)}})}
function sameConfig(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x.name===b[i].name&&x.notation===b[i].notation&&x.color===b[i].color)}
function readLocal(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch(_){return null}}
function writeLocal(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}

async function movePanelBy(dx,dy){
  const viewportWidth=await OBR.viewport.getWidth(),viewportHeight=await OBR.viewport.getHeight();
  const metadata=await OBR.player.getMetadata();
  const fallback={left:Math.max(PANEL_WIDTH+12,viewportWidth-18),top:Math.max(PANEL_HEIGHT+12,viewportHeight-118)};
  const localPos=readLocal(LOCAL_POSITION_KEY),metaPos=metadata[POSITION_KEY];
  const current=localPos&&Number.isFinite(localPos.left)&&Number.isFinite(localPos.top)?localPos:metaPos&&Number.isFinite(metaPos.left)&&Number.isFinite(metaPos.top)?metaPos:fallback;
  const next={left:Math.min(viewportWidth-8,Math.max(PANEL_WIDTH+8,current.left+dx)),top:Math.min(viewportHeight-8,Math.max(PANEL_HEIGHT+8,current.top+dy))};
  writeLocal(LOCAL_POSITION_KEY,next);await OBR.player.setMetadata({[POSITION_KEY]:next});
  try{await OBR.popover.close(POPOVER_ID)}catch(_){}
  await OBR.popover.open({id:POPOVER_ID,url:new URL("./panel-v080.html",import.meta.url).href,width:PANEL_WIDTH,height:PANEL_HEIGHT,anchorReference:"POSITION",anchorPosition:next,anchorOrigin:{horizontal:"RIGHT",vertical:"BOTTOM"},transformOrigin:{horizontal:"RIGHT",vertical:"BOTTOM"},disableClickAway:true,marginThreshold:8});
}
function setupDragHandle(){const handle=document.getElementById("dragHandle");let startX=0,startY=0,dragging=false;handle.addEventListener("pointerdown",e=>{dragging=true;startX=e.clientX;startY=e.clientY;handle.setPointerCapture(e.pointerId);e.preventDefault()});handle.addEventListener("pointerup",async e=>{if(!dragging)return;dragging=false;const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)+Math.abs(dy)>3)await movePanelBy(dx,dy)});handle.addEventListener("pointercancel",()=>{dragging=false})}

async function loadConfig(){
  const metadata=await OBR.player.getMetadata();
  let rawLocal=null;for(const key of [LOCAL_CONFIG_KEY,...PREVIOUS_LOCAL_CONFIG_KEYS]){rawLocal=readLocal(key);if(Array.isArray(rawLocal)&&rawLocal.length)break}
  let rawMetadata=metadata[CONFIG_KEY];if(!Array.isArray(rawMetadata)||!rawMetadata.length){for(const key of PREVIOUS_CONFIG_KEYS){rawMetadata=metadata[key];if(Array.isArray(rawMetadata)&&rawMetadata.length)break}}
  const raw=rawLocal||rawMetadata;
  if(sameConfig(raw,V070_DEFAULTS)||sameConfig(raw,OLD_DEFAULTS)) config=structuredClone(DEFAULTS);
  else config=sanitizeConfig(raw)||structuredClone(DEFAULTS);
  writeLocal(LOCAL_CONFIG_KEY,config);
}
async function saveConfig(nextConfig){config=nextConfig;writeLocal(LOCAL_CONFIG_KEY,config);await OBR.player.setMetadata({[CONFIG_KEY]:config})}

function renderButtons(){
  customButtons.innerHTML="";
  config.forEach((item,index)=>{
    const b=document.createElement("button");b.className=`rollButton${item.name?"":" unnamed"}`;b.type="button";b.style.backgroundColor=item.color;b.style.color=contrastColor(item.color);b.innerHTML="<span></span><small></small>";
    b.querySelector("span").textContent=item.name||item.notation;b.querySelector("small").textContent=item.name?item.notation:"";
    b.addEventListener("click",()=>rollBones(item.notation,item.name||item.notation));b.addEventListener("contextmenu",e=>{e.preventDefault();openSingleEditor(index)});b.title="Lewy klik: rzut • Prawy klik: edycja";customButtons.appendChild(b);
  });
}
function makePalette(index,color){const palette=document.createElement("div");palette.className="palette";palette.dataset.paletteFor=String(index);PALETTE.forEach(hex=>{const dot=document.createElement("button");dot.type="button";dot.className=`colorDot${hex===color?" selected":""}`;dot.dataset.color=hex;dot.style.backgroundColor=hex;dot.title=hex;dot.addEventListener("click",()=>{palette.querySelectorAll(".colorDot").forEach(el=>el.classList.remove("selected"));dot.classList.add("selected")});palette.appendChild(dot)});return palette}
function makeFieldRow(item,index){const row=document.createElement("div");row.className="fieldRow";row.dataset.index=String(index);row.innerHTML=`<div class="fieldInputs"><input type="text" data-name="${index}" maxlength="24" placeholder="Nazwa (opcjonalna)"><input type="text" data-notation="${index}" maxlength="48"></div>`;row.querySelector(`[data-name="${index}"]`).value=item.name;row.querySelector(`[data-notation="${index}"]`).value=item.notation;row.appendChild(makePalette(index,item.color));return row}
function openSingleEditor(index){editingIndex=index;rollView.classList.add("hidden");editView.classList.remove("hidden");editTitle.textContent=`Makro ${index+1}`;fields.innerHTML="";fields.appendChild(makeFieldRow(config[index],index))}
function closeSingleEditor(){editingIndex=null;rollView.classList.remove("hidden");editView.classList.add("hidden");editTitle.textContent=""}
function selectedColorFor(index,fallback){const selected=fields.querySelector(`[data-palette-for="${index}"] .colorDot.selected`);return normalizeColor(selected?.dataset.color,fallback)}
async function rollBones(rawNotation,label="Rzut"){try{const notation=normalizeNotation(rawNotation);const senderName=await OBR.player.getName();await OBR.player.setMetadata({[BONES_ROLL_KEY]:{notation,created:new Date().toISOString(),senderName,senderId:OBR.player.id,viewers:"ALL"}});setStatus(`${label}: ${notation}`)}catch(error){console.error(error);setStatus(error?.message||"Nie udało się rzucić",true)}}
function readEditedItem(index){const name=fields.querySelector(`[data-name="${index}"]`).value.trim();const notation=normalizeNotation(fields.querySelector(`[data-notation="${index}"]`).value);const color=selectedColorFor(index,config[index].color);return{name:name.slice(0,24),notation,color}}
async function handleSingleSave(){try{if(editingIndex===null)return;const next=structuredClone(config);next[editingIndex]=readEditedItem(editingIndex);await saveConfig(next);renderButtons();closeSingleEditor();setStatus("Zapisano")}catch(error){setStatus(error?.message||"Błąd makra",true)}}
async function openSettings(){
  await OBR.modal.open({id:SETTINGS_MODAL_ID,url:new URL("./settings-v080.html",import.meta.url).href,width:720,height:720});
}

OBR.onReady(async()=>{
  try{
    await loadConfig();renderButtons();setupDragHandle();
    document.getElementById("editToggle").addEventListener("click",openSettings);
    document.getElementById("cancel").addEventListener("click",closeSingleEditor);
    document.getElementById("save").addEventListener("click",handleSingleSave);
    OBR.player.onChange((player)=>{
      const incoming=sanitizeConfig(player.metadata?.[CONFIG_KEY]);
      if(incoming&&!sameConfig(incoming,config)){config=incoming;writeLocal(LOCAL_CONFIG_KEY,config);renderButtons()}
    });
  }catch(error){console.error(error);setStatus("Błąd inicjalizacji",true)}
});
