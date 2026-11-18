/* ===================================================================
   DayOne — logique applicative
   Stockage : localStorage uniquement (aucun serveur).
=================================================================== */
(function(){
"use strict";

/* ----------------------------- Constantes ----------------------------- */
const STORAGE_KEY = "dayone.data.v1";
const HOUR_START = 6, HOUR_END = 23;      // planning 06:00 -> 23:00
const HOUR_H_DAY = 64;                     // px par heure (vue jour)
const HOUR_H_WEEK = 32;                    // px par heure (vue semaine)
const DAY_NAMES = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
const DAY_NAMES_SHORT = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MONTH_NAMES = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const STATUS_LABEL = { planned:"Prévu", done:"Réalisé", missed:"Non réalisé" };
const EMOJIS = ["🏋️","🤼","🏃","➕"];

/* ------------------------------- Dates --------------------------------- */
function pad2(n){ return String(n).padStart(2,"0"); }
function toISO(d){ return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate()); }
function fromISO(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y, m-1, d); }
function todayISO(){ return toISO(new Date()); }
function addDays(iso, n){ const d=fromISO(iso); d.setDate(d.getDate()+n); return toISO(d); }
function addMonths(iso, n){ const d=fromISO(iso); d.setMonth(d.getMonth()+n); return toISO(d); }
function isSameISO(a,b){ return a===b; }
function fullDateLabel(iso){
  const d=fromISO(iso);
  const day = DAY_NAMES[d.getDay()];
  return capitalize(day)+" "+d.getDate()+" "+MONTH_NAMES[d.getMonth()];
}
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function timeToMin(t){ const [h,m]=t.split(":").map(Number); return h*60+m; }
function minToTime(min){ const h=Math.floor(min/60), m=Math.round(min%60); return pad2(h)+":"+pad2(m); }
function mondayOfWeek(iso){
  const d=fromISO(iso);
  const dow = d.getDay(); // 0 = dimanche
  const diff = (dow===0?-6:1-dow);
  d.setDate(d.getDate()+diff);
  return toISO(d);
}
function weekDates(mondayISO){
  const out=[]; for(let i=0;i<7;i++) out.push(addDays(mondayISO,i)); return out;
}
function monthMatrix(iso){
  // retourne un tableau de dates ISO (6 semaines x 7 jours) couvrant le mois
  const d = fromISO(iso);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const firstMonday = mondayOfWeek(toISO(first));
  const cells=[];
  let cur = firstMonday;
  for(let i=0;i<42;i++){ cells.push(cur); cur = addDays(cur,1); }
  return cells;
}

/* -------------------------------- Etat ---------------------------------- */
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }

function seedData(){
  const today = todayISO();
  const programs = [
    { id:uid(), emoji:"🏋️", name:"Programme Force", type:"Musculation",
      description:"Force maximale sur les trois mouvements de base. Deux séances par semaine.",
      exercises:[
        { id:uid(), name:"Squat", sets:"4", reps:"5", weight:"80 kg", distance:"", notes:"Descente contrôlée, 2 min de repos entre les séries." },
        { id:uid(), name:"Développé couché", sets:"4", reps:"6", weight:"70 kg", distance:"", notes:"" },
        { id:uid(), name:"Tractions", sets:"4", reps:"8", weight:"+10 kg", distance:"", notes:"" },
        { id:uid(), name:"Soulevé de terre", sets:"3", reps:"5", weight:"100 kg", distance:"", notes:"" },
        { id:uid(), name:"Développé militaire", sets:"3", reps:"8", weight:"40 kg", distance:"", notes:"" }
      ]
    },
    { id:uid(), emoji:"🤼", name:"Préparation compétition", type:"Lutte",
      description:"Technique, cardio spécifique et gainage.",
      exercises:[
        { id:uid(), name:"Projections au sol", sets:"6", reps:"3", weight:"", distance:"", notes:"Travail des deux côtés." },
        { id:uid(), name:"Sparring", sets:"", reps:"", weight:"", distance:"20 min", notes:"" },
        { id:uid(), name:"Gainage", sets:"3", reps:"", weight:"", distance:"1 min", notes:"" }
      ]
    },
    { id:uid(), emoji:"🏃", name:"Endurance", type:"Cardio",
      description:"Sorties longues et fractionné.",
      exercises:[
        { id:uid(), name:"Course longue", sets:"", reps:"", weight:"", distance:"10 km", notes:"Allure confortable." },
        { id:uid(), name:"Fractionné 400m", sets:"8", reps:"", weight:"", distance:"400 m", notes:"Récup. 90 s entre les répétitions." }
      ]
    }
  ];

  const workouts = [
    { id:uid(), name:"Course à pied", emoji:"🏃", date:today, start:"07:00", end:"08:00", programId:programs[2].id, status:"done", intensity:6, notes:"" },
    { id:uid(), name:"Gainage", emoji:"🧘", date:today, start:"12:30", end:"13:15", programId:"", status:"missed", intensity:3, notes:"" },
    { id:uid(), name:"Lutte", emoji:"🤼", date:today, start:"18:00", end:"20:00", programId:programs[1].id, status:"planned", intensity:8, notes:"Travail des projections, finir par 10 min de gainage." },
    { id:uid(), name:"Musculation", emoji:"🏋️", date:today, start:"21:00", end:"22:30", programId:programs[0].id, status:"planned", intensity:7, notes:"" },
    { id:uid(), name:"Musculation", emoji:"🏋️", date:addDays(today,1), start:"19:00", end:"20:30", programId:programs[0].id, status:"planned", intensity:7, notes:"" },
    { id:uid(), name:"Lutte", emoji:"🤼", date:addDays(today,2), start:"18:00", end:"20:00", programId:programs[1].id, status:"planned", intensity:8, notes:"" },
    { id:uid(), name:"Course à pied", emoji:"🏃", date:addDays(today,3), start:"07:00", end:"08:00", programId:programs[2].id, status:"planned", intensity:5, notes:"" },
    { id:uid(), name:"Musculation", emoji:"🏋️", date:addDays(today,3), start:"19:00", end:"20:30", programId:programs[0].id, status:"planned", intensity:7, notes:"" },
    { id:uid(), name:"Lutte", emoji:"🤼", date:addDays(today,4), start:"18:00", end:"20:00", programId:programs[1].id, status:"planned", intensity:8, notes:"" },
    { id:uid(), name:"Endurance", emoji:"🏃", date:addDays(today,5), start:"10:00", end:"11:30", programId:programs[2].id, status:"planned", intensity:6, notes:"" },
    { id:uid(), name:"Course à pied", emoji:"🏃", date:addDays(today,-2), start:"07:00", end:"08:00", programId:programs[2].id, status:"done", intensity:5, notes:"" },
    { id:uid(), name:"Musculation", emoji:"🏋️", date:addDays(today,-1), start:"19:00", end:"20:30", programId:programs[0].id, status:"done", intensity:7, notes:"" },
    { id:uid(), name:"Lutte", emoji:"🤼", date:addDays(today,-4), start:"18:00", end:"20:00", programId:programs[1].id, status:"missed", intensity:8, notes:"" }
  ];

  return { programs, workouts };
}

let state = null;
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ state = JSON.parse(raw); return; }
  }catch(e){ /* stockage indisponible ou corrompu */ }
  state = seedData();
  persist();
}
function persist(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(e){ toast("Impossible d'enregistrer : stockage du navigateur indisponible."); }
}

/* -------------------------------- UI state ------------------------------- */
const ui = {
  tab: "today",
  calMode: "day",
  calDayDate: todayISO(),
  calWeekMonday: mondayOfWeek(todayISO()),
  calMonthRef: todayISO(),
  selectedMonthDay: todayISO(),
  currentProgramId: null,
  editingWorkoutId: null,
  editingProgramId: null,
  editingExerciseId: null,
  workoutFormEmoji: "🏋️",
  workoutFormStatus: "planned",
  workoutFormIntensity: 5,
  programFormEmoji: "🏋️",
  prefillDate: null,
  confirmAction: null
};

/* --------------------------------- Helpers ------------------------------- */
function getWorkoutsForDate(iso){
  return state.workouts.filter(w=>w.date===iso).sort((a,b)=>timeToMin(a.start)-timeToMin(b.start));
}
function getProgram(id){ return state.programs.find(p=>p.id===id) || null; }
function statusDotColor(status){
  return status==="done" ? "var(--accent)" : status==="missed" ? "var(--red)" : "#7A828E";
}
function intensityLabel(n){
  if(n<=3) return n+" — Légère";
  if(n<=6) return n+" — Modérée";
  if(n<=8) return n+" — Élevée";
  return n+" — Maximale";
}
function icon(name, size){
  size = size || 20;
  const paths = {
    chevD:'<path d="M6 9l6 6 6-6"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'
  };
  return '<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'">'+(paths[name]||"")+'</svg>';
}
function esc(s){
  return String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

let toastTimer=null;
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove("show"), 2600);
}

/* ===================================================================
   Navigation entre onglets
=================================================================== */
function setTab(tab){
  ui.tab = tab;
  document.querySelectorAll(".view").forEach(v=> v.hidden = v.dataset.view !== tab && !(tab==="program-detail" && v.dataset.view==="program-detail"));
  document.querySelectorAll("#bottom-nav a").forEach(a=> a.classList.toggle("on", a.dataset.tab===tab));
  document.getElementById("bottom-nav").hidden = false;
  if(tab==="today") renderToday();
  if(tab==="calendar") renderCalendar();
  if(tab==="programs") renderPrograms();
  window.scrollTo(0,0);
}
function openProgramDetail(id){
  ui.currentProgramId = id;
  document.querySelectorAll(".view").forEach(v=> v.hidden = v.dataset.view !== "program-detail");
  document.getElementById("bottom-nav").hidden = true;
  renderProgramDetail();
}
function closeProgramDetail(){
  document.getElementById("bottom-nav").hidden = false;
  setTab("programs");
}

/* ===================================================================
   Rendu : planning horaire (jour) — réutilisé par Aujourd'hui + Calendrier/Jour
=================================================================== */
function buildDaySchedule(container, iso, opts){
  opts = opts || {};
  const list = getWorkoutsForDate(iso);
  container.innerHTML = "";
  if(list.length===0 && !opts.alwaysGrid){
    container.innerHTML =
      '<div class="empty-schedule">'
      +'<div class="tile">📅</div>'
      +'<b>Rien de prévu ce jour-là</b>'
      +'Ajoute une séance pour remplir ce planning.'
      +'<button type="button" class="btn p" style="width:auto;padding:0 24px;margin-top:4px" data-add-here>'
        + '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5v14M5 12h14"/></svg>Ajouter un entraînement</button>'
      +'</div>';
    container.querySelector("[data-add-here]").addEventListener("click", ()=> openWorkoutSheet(null, iso));
    return;
  }

  const H = HOUR_H_DAY;
  const totalH = (HOUR_END-HOUR_START)*H + 40;
  container.style.height = totalH+"px";

  let html = "";
  for(let h=HOUR_START; h<=HOUR_END; h++){
    html += '<div class="hr-row" style="top:'+(10+(h-HOUR_START)*H)+'px"><span>'+pad2(h)+':00</span><i></i></div>';
  }
  list.forEach((w, idx)=>{
    const s = timeToMin(w.start), e = Math.max(timeToMin(w.end), s+15);
    const top = 10 + (s/60 - HOUR_START)*H + 1;
    const height = Math.max((e-s)/60*H - 2, 30);
    const prog = getProgram(w.programId);
    const oneLine = height < 46;
    const statusIcon = w.status==="done" ? '<svg viewBox="0 0 24 24" width="13" height="13"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
                      : w.status==="missed" ? '<svg viewBox="0 0 24 24" width="12" height="12"><path d="M6 6l12 12M18 6L6 18"/></svg>'
                      : '<svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
    html += '<div class="blk '+w.status+(oneLine?' one':'')+'" data-id="'+w.id+'" style="top:'+top+'px;height:'+height+'px">'
      +'<span class="emoji">'+w.emoji+'</span>'
      +'<div class="t"><b>'+esc(w.name)+'</b><small>'+w.start+' – '+w.end+(height>=84 && prog ? ' · '+esc(prog.name):'')+'</small></div>'
      +'<span class="si">'+statusIcon+'</span>'
      +'</div>';
  });

  // ligne "maintenant" si la date affichée est aujourd'hui
  if(iso === todayISO()){
    const now = new Date();
    const nowMin = now.getHours()*60+now.getMinutes();
    if(nowMin >= HOUR_START*60 && nowMin <= HOUR_END*60){
      const top = 10 + (nowMin/60 - HOUR_START)*H;
      html += '<div class="now-line" id="now-line-'+container.id+'" style="top:'+top+'px"></div>';
    }
  }

  container.innerHTML = html;
  container.querySelectorAll(".blk").forEach(el=>{
    el.addEventListener("click", ()=> openWorkoutSheet(el.dataset.id, null));
  });
}

function scrollToNow(wrapEl, scheduleId){
  const now = new Date();
  const nowMin = now.getHours()*60+now.getMinutes();
  const clamped = Math.min(Math.max(nowMin, HOUR_START*60), HOUR_END*60);
  const top = 10 + (clamped/60 - HOUR_START)*HOUR_H_DAY;
  wrapEl.scrollTo({ top: Math.max(top - 160,0), behavior:"smooth" });
}

/* ===================================================================
   Vue : Aujourd'hui
=================================================================== */
function renderToday(){
  const iso = todayISO();
  document.getElementById("today-date").textContent = fullDateLabel(iso);
  const list = getWorkoutsForDate(iso);
  const done = list.filter(w=>w.status==="done").length;
  document.getElementById("today-sub").textContent = list.length===0
    ? "Aucune séance"
    : list.length+" séance"+(list.length>1?"s":"")+" · "+done+" réalisée"+(done>1?"s":"");
  const wrap = document.getElementById("today-schedule-wrap");
  buildDaySchedule(document.getElementById("today-schedule"), iso);
  requestAnimationFrame(()=> scrollToNow(wrap, "today-schedule"));
}

/* ===================================================================
   Vue : Calendrier
=================================================================== */
function renderCalendar(){
  document.querySelectorAll("#cal-mode-seg span").forEach(s=> s.classList.toggle("on", s.dataset.mode===ui.calMode));
  document.getElementById("cal-day-wrap").hidden = ui.calMode!=="day";
  document.getElementById("cal-week-wrap").hidden = ui.calMode!=="week";
  document.getElementById("cal-month-wrap").hidden = ui.calMode!=="month";

  if(ui.calMode==="day") renderCalDay();
  if(ui.calMode==="week") renderCalWeek();
  if(ui.calMode==="month") renderCalMonth();
}

function renderCalDay(){
  const iso = ui.calDayDate;
  document.getElementById("cal-title").textContent = capitalize(DAY_NAMES[fromISO(iso).getDay()])+" "+fromISO(iso).getDate()+" "+MONTH_NAMES[fromISO(iso).getMonth()];
  document.getElementById("cal-sub").textContent = iso===todayISO() ? "Aujourd'hui" : "";
  const wrap = document.getElementById("cal-day-wrap");
  buildDaySchedule(document.getElementById("cal-day-schedule"), iso);
  wrap.scrollTop = 0;
  if(iso===todayISO()) requestAnimationFrame(()=> scrollToNow(wrap, "cal-day-schedule"));
}

function renderCalWeek(){
  const monday = ui.calWeekMonday;
  const dates = weekDates(monday);
  const last = dates[6];
  const sameMonth = fromISO(monday).getMonth() === fromISO(last).getMonth();
  const label = sameMonth
    ? fromISO(monday).getDate()+" – "+fromISO(last).getDate()+" "+MONTH_NAMES[fromISO(monday).getMonth()]
    : fromISO(monday).getDate()+" "+MONTH_NAMES[fromISO(monday).getMonth()]+" – "+fromISO(last).getDate()+" "+MONTH_NAMES[fromISO(last).getMonth()];
  document.getElementById("cal-title").textContent = label;
  document.getElementById("cal-sub").textContent = "";

  const head = document.getElementById("cal-weekhead");
  head.innerHTML = '<div></div>'+dates.map(d=>{
    const dt=fromISO(d);
    const isToday = d===todayISO();
    return '<div class="wd'+(isToday?' today':'')+'">'+DAY_NAMES_SHORT[dt.getDay()]+'<b>'+dt.getDate()+'</b></div>';
  }).join("");

  const H = HOUR_H_WEEK;
  const totalH = (HOUR_END-HOUR_START)*H + 20;
  const body = document.getElementById("cal-weekbody");
  body.style.height = totalH+"px";
  let html = "";
  for(let h=HOUR_START; h<=HOUR_END; h++){
    html += '<div class="wk-hr" style="position:absolute;left:0;right:0;top:'+(8+(h-HOUR_START)*H)+'px;height:0"><span>'+pad2(h)+':00</span><i></i></div>';
  }
  const colW = "calc((100% - 34px)/7)";
  dates.forEach((d,ci)=>{
    if(d===todayISO()){
      html += '<div class="wk-col-bg" style="left:calc(34px + '+colW+' * '+ci+');width:'+colW+';background:rgba(183,243,74,.05)"></div>';
    }
    const dayList = getWorkoutsForDate(d);
    dayList.forEach(w=>{
      const s=timeToMin(w.start), e=Math.max(timeToMin(w.end), s+15);
      const top = 8+(s/60-HOUR_START)*H+1;
      const height = Math.max((e-s)/60*H-2, 20);
      html += '<div class="wblk '+w.status+'" data-id="'+w.id+'" style="left:calc(34px + '+colW+' * '+ci+' + 2px);width:calc('+colW+' - 4px);top:'+top+'px;height:'+height+'px">'
        + (height>=28 ? '<span class="em">'+w.emoji+'</span>' : '')
        + (height>=20 ? esc(w.name) : '')
        + '</div>';
    });
  });
  body.innerHTML = html;
  body.querySelectorAll(".wblk").forEach(el=> el.addEventListener("click", ()=> openWorkoutSheet(el.dataset.id, null)));
  document.getElementById("cal-week-wrap").scrollTop = 0;
}

function renderCalMonth(){
  const ref = fromISO(ui.calMonthRef);
  document.getElementById("cal-title").textContent = capitalize(MONTH_NAMES[ref.getMonth()])+" "+ref.getFullYear();
  document.getElementById("cal-sub").textContent = "";

  const grid = document.getElementById("cal-monthgrid");
  const cells = monthMatrix(ui.calMonthRef);
  let html = DAY_NAMES_SHORT.slice(1).concat(DAY_NAMES_SHORT[0]).map(d=>'<div class="wd">'+d+'</div>').join("");
  cells.forEach(iso=>{
    const d = fromISO(iso);
    const out = d.getMonth() !== ref.getMonth();
    const isToday = iso===todayISO();
    const isSel = iso===ui.selectedMonthDay;
    const dayWorkouts = getWorkoutsForDate(iso);
    const statuses = [...new Set(dayWorkouts.map(w=>w.status))].slice(0,4);
    html += '<div class="cell'+(out?' out':'')+(isToday?' today':'')+(isSel?' sel':'')+'" data-date="'+iso+'">'
      +'<div class="n">'+d.getDate()+'</div>'
      +'<div class="ds">'+statuses.map(s=>'<i style="background:'+statusDotColor(s)+'"></i>').join("")+'</div>'
      +'</div>';
  });
  grid.innerHTML = html;
  grid.querySelectorAll(".cell").forEach(el=> el.addEventListener("click", ()=>{
    ui.selectedMonthDay = el.dataset.date;
    renderCalMonth();
  }));

  const dayList = getWorkoutsForDate(ui.selectedMonthDay);
  const dl = document.getElementById("cal-daylist");
  const label = capitalize(DAY_NAMES[fromISO(ui.selectedMonthDay).getDay()])+" "+fromISO(ui.selectedMonthDay).getDate()+" "+MONTH_NAMES[fromISO(ui.selectedMonthDay).getMonth()];
  let dhtml = '<h3>'+label+'<span>'+dayList.length+' séance'+(dayList.length>1?"s":"")+'</span></h3>';
  if(dayList.length===0){
    dhtml += '<div class="empty-day">Rien de prévu — <a style="color:var(--accent);cursor:pointer" data-add-day>ajouter une séance</a></div>';
  } else {
    dayList.forEach(w=>{
      dhtml += '<div class="li-row '+w.status+'" data-id="'+w.id+'">'
        +'<span class="tm">'+w.start+'</span><span class="em">'+w.emoji+'</span><b>'+esc(w.name)+'</b>'
        +'<span class="dot '+w.status+'"></span></div>';
    });
  }
  dl.innerHTML = dhtml;
  dl.querySelectorAll(".li-row").forEach(el=> el.addEventListener("click", ()=> openWorkoutSheet(el.dataset.id,null)));
  const addDay = dl.querySelector("[data-add-day]");
  if(addDay) addDay.addEventListener("click", ()=> openWorkoutSheet(null, ui.selectedMonthDay));
}

/* ===================================================================
   Vue : Programmes (liste)
=================================================================== */
function renderPrograms(){
  const list = state.programs;
  document.getElementById("programs-count").textContent = list.length+" programme"+(list.length>1?"s":"");
  const el = document.getElementById("programs-list");
  let html = list.map(p=>{
    const n = p.exercises.length;
    return '<button type="button" class="pc" data-id="'+p.id+'">'
      +'<div class="tile">'+p.emoji+'</div>'
      +'<div class="pb"><div class="pn">'+esc(p.name)+'</div><div><span class="chip">'+esc(p.type)+'</span></div>'
      + (p.description ? '<p>'+esc(p.description)+'</p>' : '')
      +'<div class="pm"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>'+n+' exercice'+(n>1?"s":"")+'</div></div>'
      +'<svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 6l6 6-6 6"/></svg>'
      +'</button>';
  }).join("");
  html += '<button type="button" class="add-card" id="programs-add-card"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5v14M5 12h14"/></svg>Nouveau programme</button>';
  el.innerHTML = html;
  el.querySelectorAll(".pc").forEach(c=> c.addEventListener("click", ()=> openProgramDetail(c.dataset.id)));
  document.getElementById("programs-add-card").addEventListener("click", ()=> openProgramSheet(null));
}

/* ===================================================================
   Vue : Détail d'un programme
=================================================================== */
function renderProgramDetail(){
  const p = getProgram(ui.currentProgramId);
  if(!p){ closeProgramDetail(); return; }
  document.getElementById("pd-title").textContent = p.name;
  document.getElementById("pd-meta").innerHTML =
    '<div style="display:flex;align-items:center;gap:14px"><div class="emoji-tile" style="width:52px;height:52px;font-size:26px">'+p.emoji+'</div>'
    +'<div><div><span class="chip">'+esc(p.type)+'</span></div></div></div>'
    + (p.description ? '<p style="margin:10px 0 0;font-size:15px;line-height:1.5;color:#C7CCD4">'+esc(p.description)+'</p>' : '');
  document.getElementById("pd-excount").textContent = p.exercises.length+" au total";

  const el = document.getElementById("pd-exlist");
  if(p.exercises.length===0){
    el.innerHTML = '<div class="empty-ex">Aucun exercice pour l\'instant.</div>';
  } else {
    el.innerHTML = p.exercises.map((e,i)=>{
      const parts=[];
      if(e.sets && e.reps) parts.push('<em>'+esc(e.sets)+' × '+esc(e.reps)+'</em>');
      else if(e.sets) parts.push('<em>'+esc(e.sets)+' séries</em>');
      else if(e.reps) parts.push('<em>'+esc(e.reps)+' répétitions</em>');
      if(e.weight) parts.push(esc(e.weight));
      if(e.distance) parts.push(esc(e.distance));
      return '<div class="exc" data-id="'+e.id+'"><div class="ix">'+(i+1)+'</div>'
        +'<div class="tx"><b>'+esc(e.name)+'</b><span>'+(parts.join(" — ")||"—")+'</span></div>'
        +'<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="5.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor" stroke="none"/></svg>'
        +'</div>';
    }).join("");
  }
  el.querySelectorAll(".exc").forEach(c=> c.addEventListener("click", ()=> openExerciseSheet(c.dataset.id)));
}

/* ===================================================================
   Feuille : Entraînement (créer / modifier)
=================================================================== */
function fillProgramSelect(){
  const sel = document.getElementById("wf-program");
  sel.innerHTML = '<option value="">Aucun</option>' + state.programs.map(p=>'<option value="'+p.id+'">'+esc(p.emoji+" "+p.name)+'</option>').join("");
}
function buildEmojiPicker(containerId, selected, onPick){
  const el = document.getElementById(containerId);
  el.innerHTML = EMOJIS.map(e=>'<button type="button" data-emoji="'+e+'" class="'+(e===selected?"on":"")+'">'+e+'</button>').join("");
  el.querySelectorAll("button").forEach(b=>{
    b.addEventListener("click", ()=>{
      el.querySelectorAll("button").forEach(x=>x.classList.remove("on"));
      b.classList.add("on");
      onPick(b.dataset.emoji);
    });
  });
}
function buildIntensityPicker(selected){
  const el = document.getElementById("wf-intensity");
  el.innerHTML = "";
  for(let i=1;i<=10;i++){
    const b = document.createElement("button");
    b.type="button"; b.textContent=i; b.className = i===selected ? "on":"";
    b.addEventListener("click", ()=>{
      ui.workoutFormIntensity = i;
      el.querySelectorAll("button").forEach(x=>x.classList.remove("on"));
      b.classList.add("on");
      document.getElementById("wf-intensity-label").textContent = intensityLabel(i);
    });
    el.appendChild(b);
  }
}
function setWorkoutStatusSeg(status){
  ui.workoutFormStatus = status;
  document.querySelectorAll("#wf-status-seg span").forEach(s=> s.classList.toggle("on", s.dataset.status===status));
}

function openWorkoutSheet(id, prefillDate){
  ui.editingWorkoutId = id;
  fillProgramSelect();
  const form = document.getElementById("form-workout");
  form.reset();
  document.getElementById("wf-time-err").hidden = true;

  if(id){
    const w = state.workouts.find(x=>x.id===id);
    document.getElementById("wf-title").textContent = "Modifier l'entraînement";
    document.getElementById("wf-subtitle").textContent = fullDateLabel(w.date);
    document.getElementById("wf-name").value = w.name;
    document.getElementById("wf-date").value = w.date;
    document.getElementById("wf-start").value = w.start;
    document.getElementById("wf-end").value = w.end;
    document.getElementById("wf-program").value = w.programId || "";
    ui.workoutFormEmoji = w.emoji;
    document.getElementById("wf-emoji-preview").textContent = w.emoji;
    setWorkoutStatusSeg(w.status);
    ui.workoutFormIntensity = w.intensity;
    document.getElementById("wf-intensity-label").textContent = intensityLabel(w.intensity);
    document.getElementById("wf-notes").value = w.notes || "";
    document.getElementById("wf-delete").hidden = false;
  } else {
    document.getElementById("wf-title").textContent = "Nouvel entraînement";
    document.getElementById("wf-subtitle").textContent = "";
    document.getElementById("wf-date").value = prefillDate || ui.calDayDate || todayISO();
    document.getElementById("wf-start").value = "18:00";
    document.getElementById("wf-end").value = "19:00";
    ui.workoutFormEmoji = "🏋️";
    document.getElementById("wf-emoji-preview").textContent = "🏋️";
    setWorkoutStatusSeg("planned");
    ui.workoutFormIntensity = 5;
    document.getElementById("wf-intensity-label").textContent = intensityLabel(5);
    document.getElementById("wf-delete").hidden = true;
  }
  buildEmojiPicker("wf-emoji-picker", ui.workoutFormEmoji, (e)=>{ ui.workoutFormEmoji=e; document.getElementById("wf-emoji-preview").textContent=e; });
  buildIntensityPicker(ui.workoutFormIntensity);
  openSheet("sheet-workout");
}

function submitWorkoutForm(e){
  e.preventDefault();
  const name = document.getElementById("wf-name").value.trim();
  const date = document.getElementById("wf-date").value;
  const start = document.getElementById("wf-start").value;
  const end = document.getElementById("wf-end").value;
  if(!name || !date || !start || !end) return;
  if(timeToMin(end) <= timeToMin(start)){
    document.getElementById("wf-time-err").hidden = false;
    return;
  }
  document.getElementById("wf-time-err").hidden = true;

  const payload = {
    name, date, start, end,
    programId: document.getElementById("wf-program").value,
    status: ui.workoutFormStatus,
    intensity: ui.workoutFormIntensity,
    notes: document.getElementById("wf-notes").value.trim(),
    emoji: ui.workoutFormEmoji
  };

  if(ui.editingWorkoutId){
    const w = state.workouts.find(x=>x.id===ui.editingWorkoutId);
    Object.assign(w, payload);
    toast("Entraînement mis à jour.");
  } else {
    payload.id = uid();
    state.workouts.push(payload);
    toast("Entraînement ajouté.");
  }
  persist();
  closeSheet();
  refreshCurrentView();
}

function deleteWorkout(id){
  state.workouts = state.workouts.filter(w=>w.id!==id);
  persist();
  toast("Entraînement supprimé.");
  refreshCurrentView();
}

/* ===================================================================
   Feuille : Programme (créer / modifier)
=================================================================== */
function openProgramSheet(id){
  ui.editingProgramId = id;
  const form = document.getElementById("form-program");
  form.reset();
  if(id){
    const p = getProgram(id);
    document.getElementById("pf-title").textContent = "Modifier le programme";
    document.getElementById("pf-name").value = p.name;
    document.getElementById("pf-type").value = p.type;
    document.getElementById("pf-desc").value = p.description || "";
    ui.programFormEmoji = p.emoji;
    document.getElementById("pf-emoji-preview").textContent = p.emoji;
    document.getElementById("pf-delete").hidden = false;
  } else {
    document.getElementById("pf-title").textContent = "Nouveau programme";
    ui.programFormEmoji = "🏋️";
    document.getElementById("pf-emoji-preview").textContent = "🏋️";
    document.getElementById("pf-delete").hidden = true;
  }
  buildEmojiPicker("pf-emoji-picker", ui.programFormEmoji, (e)=>{ ui.programFormEmoji=e; document.getElementById("pf-emoji-preview").textContent=e; });
  openSheet("sheet-program");
}

function submitProgramForm(e){
  e.preventDefault();
  const name = document.getElementById("pf-name").value.trim();
  const type = document.getElementById("pf-type").value.trim();
  if(!name || !type) return;
  const payload = { name, type, description: document.getElementById("pf-desc").value.trim(), emoji: ui.programFormEmoji };

  if(ui.editingProgramId){
    const p = getProgram(ui.editingProgramId);
    Object.assign(p, payload);
    toast("Programme mis à jour.");
  } else {
    payload.id = uid();
    payload.exercises = [];
    state.programs.push(payload);
    toast("Programme créé.");
  }
  persist();
  closeSheet();
  if(ui.tab==="program-detail") renderProgramDetail(); else renderPrograms();
}

function deleteProgram(id){
  state.programs = state.programs.filter(p=>p.id!==id);
  state.workouts.forEach(w=>{ if(w.programId===id) w.programId=""; });
  persist();
  toast("Programme supprimé.");
  closeProgramDetail();
}

/* ===================================================================
   Feuille : Exercice (créer / modifier)
=================================================================== */
function openExerciseSheet(id){
  ui.editingExerciseId = id;
  const p = getProgram(ui.currentProgramId);
  const form = document.getElementById("form-exercise");
  form.reset();
  document.getElementById("ef-subtitle").textContent = p.name;
  if(id){
    const ex = p.exercises.find(x=>x.id===id);
    document.getElementById("ef-title").textContent = "Modifier l'exercice";
    document.getElementById("ef-name").value = ex.name;
    document.getElementById("ef-sets").value = ex.sets || "";
    document.getElementById("ef-reps").value = ex.reps || "";
    document.getElementById("ef-weight").value = ex.weight || "";
    document.getElementById("ef-distance").value = ex.distance || "";
    document.getElementById("ef-notes").value = ex.notes || "";
    document.getElementById("ef-delete").hidden = false;
  } else {
    document.getElementById("ef-title").textContent = "Nouvel exercice";
    document.getElementById("ef-delete").hidden = true;
  }
  openSheet("sheet-exercise");
}

function submitExerciseForm(e){
  e.preventDefault();
  const name = document.getElementById("ef-name").value.trim();
  if(!name) return;
  const payload = {
    name,
    sets: document.getElementById("ef-sets").value.trim(),
    reps: document.getElementById("ef-reps").value.trim(),
    weight: document.getElementById("ef-weight").value.trim(),
    distance: document.getElementById("ef-distance").value.trim(),
    notes: document.getElementById("ef-notes").value.trim()
  };
  const p = getProgram(ui.currentProgramId);
  if(ui.editingExerciseId){
    Object.assign(p.exercises.find(x=>x.id===ui.editingExerciseId), payload);
    toast("Exercice mis à jour.");
  } else {
    payload.id = uid();
    p.exercises.push(payload);
    toast("Exercice ajouté.");
  }
  persist();
  closeSheet();
  renderProgramDetail();
}

function deleteExercise(id){
  const p = getProgram(ui.currentProgramId);
  p.exercises = p.exercises.filter(x=>x.id!==id);
  persist();
  toast("Exercice supprimé.");
  renderProgramDetail();
}

/* ===================================================================
   Overlay / sheets / confirmation générique
=================================================================== */
function openSheet(id){
  document.getElementById("overlay").hidden = false;
  document.querySelectorAll(".sheet").forEach(s=> s.hidden = s.id!==id);
  document.getElementById("dlg-confirm").hidden = true;
  document.body.style.overflow = "hidden";
}
function closeSheet(){
  document.getElementById("overlay").hidden = true;
  document.querySelectorAll(".sheet").forEach(s=> s.hidden = true);
  document.body.style.overflow = "";
}
function openConfirm(title, text, onOk){
  document.getElementById("overlay").hidden = false;
  document.querySelectorAll(".sheet").forEach(s=> s.hidden = true);
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-text").textContent = text;
  document.getElementById("dlg-confirm").hidden = false;
  ui.confirmAction = onOk;
  document.body.style.overflow = "hidden";
}
function closeConfirm(){
  document.getElementById("dlg-confirm").hidden = true;
  document.getElementById("overlay").hidden = true;
  document.body.style.overflow = "";
  ui.confirmAction = null;
}

function refreshCurrentView(){
  if(ui.tab==="today") renderToday();
  else if(ui.tab==="calendar") renderCalendar();
  else if(ui.tab==="programs") renderPrograms();
  else if(ui.tab==="program-detail") renderProgramDetail();
}

/* ===================================================================
   Attache des évènements
=================================================================== */
function bindEvents(){
  document.querySelectorAll("#bottom-nav a").forEach(a=>{
    a.addEventListener("click", ()=> setTab(a.dataset.tab));
  });

  // Aujourd'hui
  document.getElementById("today-add").addEventListener("click", ()=> openWorkoutSheet(null, todayISO()));
  document.getElementById("today-fab").addEventListener("click", ()=> openWorkoutSheet(null, todayISO()));
  document.getElementById("today-locate").addEventListener("click", ()=> scrollToNow(document.getElementById("today-schedule-wrap"), "today-schedule"));

  // Calendrier — sélecteur de mode
  document.getElementById("cal-mode-seg").addEventListener("click", (e)=>{
    const span = e.target.closest("span[data-mode]");
    if(!span) return;
    ui.calMode = span.dataset.mode;
    renderCalendar();
  });
  document.getElementById("cal-prev").addEventListener("click", ()=> calStep(-1));
  document.getElementById("cal-next").addEventListener("click", ()=> calStep(1));
  document.getElementById("cal-fab").addEventListener("click", ()=>{
    const d = ui.calMode==="day" ? ui.calDayDate : ui.calMode==="month" ? ui.selectedMonthDay : todayISO();
    openWorkoutSheet(null, d);
  });

  // Programmes
  document.getElementById("programs-add").addEventListener("click", ()=> openProgramSheet(null));
  document.getElementById("pd-back").addEventListener("click", closeProgramDetail);
  document.getElementById("pd-edit").addEventListener("click", ()=> openProgramSheet(ui.currentProgramId));
  document.getElementById("pd-add-ex").addEventListener("click", ()=> openExerciseSheet(null));
  document.getElementById("pd-delete").addEventListener("click", ()=>{
    const p = getProgram(ui.currentProgramId);
    openConfirm("Supprimer ce programme ?", "« "+p.name+" » et ses "+p.exercises.length+" exercice(s) seront supprimés. Les entraînements déjà enregistrés sont conservés, mais perdront leur association.", ()=> deleteProgram(p.id));
  });

  // Formulaires
  document.getElementById("form-workout").addEventListener("submit", submitWorkoutForm);
  document.getElementById("form-program").addEventListener("submit", submitProgramForm);
  document.getElementById("form-exercise").addEventListener("submit", submitExerciseForm);

  document.getElementById("wf-status-seg").addEventListener("click", (e)=>{
    const span = e.target.closest("span[data-status]");
    if(span) setWorkoutStatusSeg(span.dataset.status);
  });

  document.getElementById("wf-delete").addEventListener("click", ()=>{
    const w = state.workouts.find(x=>x.id===ui.editingWorkoutId);
    openConfirm("Supprimer cet entraînement ?", "« "+w.name+" » du "+fullDateLabel(w.date)+" sera définitivement supprimé.", ()=> deleteWorkout(w.id));
  });
  document.getElementById("pf-delete").addEventListener("click", ()=>{
    const p = getProgram(ui.editingProgramId);
    closeSheet();
    openConfirm("Supprimer ce programme ?", "« "+p.name+" » et ses exercices seront supprimés.", ()=> deleteProgram(p.id));
  });
  document.getElementById("ef-delete").addEventListener("click", ()=>{
    const p = getProgram(ui.currentProgramId);
    const ex = p.exercises.find(x=>x.id===ui.editingExerciseId);
    openConfirm("Supprimer cet exercice ?", "« "+ex.name+" » sera retiré du programme.", ()=> deleteExercise(ex.id));
  });

  // Overlay génériques
  document.getElementById("scrim").addEventListener("click", ()=>{ closeSheet(); closeConfirm(); });
  document.querySelectorAll("[data-close]").forEach(b=> b.addEventListener("click", closeSheet));
  document.getElementById("confirm-cancel").addEventListener("click", closeConfirm);
  document.getElementById("confirm-ok").addEventListener("click", ()=>{
    const action = ui.confirmAction;
    closeConfirm();
    if(action) action();
  });
}

function calStep(dir){
  if(ui.calMode==="day"){ ui.calDayDate = addDays(ui.calDayDate, dir); }
  else if(ui.calMode==="week"){ ui.calWeekMonday = addDays(ui.calWeekMonday, dir*7); }
  else if(ui.calMode==="month"){ ui.calMonthRef = addMonths(ui.calMonthRef, dir); }
  renderCalendar();
}

/* ===================================================================
   Démarrage
=================================================================== */
function init(){
  loadState();
  bindEvents();
  setTab("today");
}
document.addEventListener("DOMContentLoaded", init);

})();
