import OBR from "https://esm.sh/@owlbear-rodeo/sdk@2";

const CONFIG_KEY="pl.openai.4e-quick-rolls/config-v060";
const PREVIOUS_CONFIG_KEYS=["pl.openai.4e-quick-rolls/config-v050","pl.openai.4e-quick-rolls/config-v040"];
const LOCAL_CONFIG_KEY="pl.openai.4e-quick-rolls/local-config-v060";
const PREVIOUS_LOCAL_CONFIG_KEYS=["pl.openai.4e-quick-rolls/local-config-v050","pl.openai.4e-quick-rolls/local-config-v040"];
const SETTINGS_MODAL_ID="pl.openai.4e-quick-rolls/settings";
const NEUTRAL="#3a3a44";
const PALETTE=["#d946ef","#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#3b82f6","#8b5cf6",NEUTRAL];
const DEFAULTS=[
{name:"",notation:"1d20",color:NEUTRAL},{name:"",notation:"1d20",color:NEUTRAL},{name:"",notation:"1d20",color:NEUTRAL},{name:"",notation:"1d12",color:NEUTRAL},
{name:"",notation:"1d6",color:NEUTRAL},{name:"",notation:"1d8",color:NEUTRAL},{name:"",notation:"1d10",color:NEUTRAL},{name:"",notation:"1d20",color:"#d946ef"}
];
const OLD_DEFAULTS=[
{name:"",notation:"1d20",color:"#d946ef"},{name:"",notation:"1d20",color:NEUTRAL},{name:"",notation:"1d20",color:NEUTRAL},{name:"",notation:"1d20",color:NEUTRAL},
{name:"",notation:"1d6",color:NEUTRAL},{name:"",notation:"1d8",color:NEUTRAL},{name:"",notation:"1d10",color:NEUTRAL},{name:"",notation:"1d12",color:NEUTRAL}
];
let config=structuredClone(DEFAULTS);
const cards=document.getElementById("cards"),statusEl=document.getElementById("status");
function readLocal(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch(_){return null}}function writeLocal(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
function normalizeColor(raw,fallback=NEUTRAL){const value=String(raw??"").trim().toLowerCase();return PALETTE.includes(value)?value:fallback}
function sanitizeConfig(saved){if(!Array.isArray(saved)||saved.length===0)return null;return DEFAULTS.map((f,i)=>{const x=saved[i];return{name:String(x?.name??f.name).slice(0,24),notation:String(x?.notation??f.notation).slice(0,48),color:normalizeColor(x?.color,f.color)}})}
function sameConfig(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x.name===b[i].name&&x.notation===b[i].notation&&x.color===b[i].color)}
function normalizeNotation(raw){const compact=String(raw??"").trim().replace(/\s+/g,"");if(!compact)throw new Error("Puste makro");const normalized=compact.replace(/(\d*)[dDkK](\d+)/g,(_,count,sides)=>`${count||1}d${sides}`);const term="(?:\\d+d\\d+|\\d+)";if(!new RegExp(`^[+-]?${term}(?:[+-]${term})*$`,"i").test(normalized))throw new Error("Użyj prostego zapisu, np. 1d20+6 albo 2k8+k6+4");return normalized.toLowerCase()}
function contrastColor(hex){const n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;return(r*299+g*587+b*114)/1000>155?"#17171b":"#fff"}
function setStatus(text,error=false){statusEl.textContent=text;statusEl.classList.toggle("error",error)}
async function loadConfig(){const metadata=await OBR.player.getMetadata();let local=null;for(const key of [LOCAL_CONFIG_KEY,...PREVIOUS_LOCAL_CONFIG_KEYS]){local=sanitizeConfig(readLocal(key));if(local)break}let meta=sanitizeConfig(metadata[CONFIG_KEY]);if(!meta){for(const key of PREVIOUS_CONFIG_KEYS){meta=sanitizeConfig(metadata[key]);if(meta)break}}config=local||meta||structuredClone(DEFAULTS);if(sameConfig(config,OLD_DEFAULTS))config=structuredClone(DEFAULTS);writeLocal(LOCAL_CONFIG_KEY,config)}
function render(){cards.innerHTML="";config.forEach((item,index)=>{const card=document.createElement("article");card.className="macroCard";card.dataset.index=index;card.innerHTML=`<div class="preview${item.name?"":" unnamed"}"><span class="name"></span><span class="notation"></span></div><div class="inputs"><input class="nameInput" maxlength="24" placeholder="Nazwa (opcjonalna)"><input class="notationInput" maxlength="48" aria-label="Makro"></div><div class="palette"></div>`;const preview=card.querySelector(".preview"),name=card.querySelector(".name"),notation=card.querySelector(".notation"),nameInput=card.querySelector(".nameInput"),notationInput=card.querySelector(".notationInput"),palette=card.querySelector(".palette");name.textContent=item.name||item.notation;notation.textContent=item.name?item.notation:"";preview.style.backgroundColor=item.color;preview.style.color=contrastColor(item.color);nameInput.value=item.name;notationInput.value=item.notation;PALETTE.forEach(hex=>{const dot=document.createElement("button");dot.type="button";dot.className=`colorDot${hex===item.color?" selected":""}`;dot.dataset.color=hex;dot.style.backgroundColor=hex;dot.addEventListener("click",()=>{palette.querySelectorAll(".colorDot").forEach(x=>x.classList.remove("selected"));dot.classList.add("selected");preview.style.backgroundColor=hex;preview.style.color=contrastColor(hex)});palette.appendChild(dot)});const updatePreview=()=>{const n=nameInput.value.trim(),r=notationInput.value.trim();name.textContent=n||r||"—";notation.textContent=n?r:"";preview.classList.toggle("unnamed",!n)};nameInput.addEventListener("input",updatePreview);notationInput.addEventListener("input",updatePreview);cards.appendChild(card)})}
function readCards(){return[...cards.querySelectorAll(".macroCard")].map((card,index)=>{const name=card.querySelector(".nameInput").value.trim().slice(0,24);const notation=normalizeNotation(card.querySelector(".notationInput").value);const selected=card.querySelector(".colorDot.selected");return{name,notation,color:normalizeColor(selected?.dataset.color,config[index].color)}})}
OBR.onReady(async()=>{await loadConfig();render();document.getElementById("cancel").addEventListener("click",()=>OBR.modal.close(SETTINGS_MODAL_ID));document.getElementById("save").addEventListener("click",async()=>{try{const next=readCards();writeLocal(LOCAL_CONFIG_KEY,next);await OBR.player.setMetadata({[CONFIG_KEY]:next});setStatus("Zapisano");setTimeout(()=>OBR.modal.close(SETTINGS_MODAL_ID),120)}catch(error){setStatus(error?.message||"Błąd makra",true)}})});
