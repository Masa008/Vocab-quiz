
const sheetSelect=document.getElementById('sheetSelect');
const startBtn=document.getElementById('startBtn');
const setupDiv=document.getElementById('setup');
const quizDiv=document.getElementById('quiz');
const questionDiv=document.getElementById('question');
const optionsDiv=document.getElementById('options');
const feedbackDiv=document.getElementById('feedback');
const nextBtn=document.getElementById('nextBtn');
const progressDiv=document.getElementById('progress');
const changeBtn=document.getElementById('changeBtn');
const reviewBtn=document.getElementById('reviewBtn');
const overallDiv=document.getElementById('overall');

const Q_PER_ROUND=10;
let vocabSets={},currentSheet='',mastered=new Set(),pool=[],questions=[],currentIndex=0,wrongPool=[];
let stats={};

function loadStats(){ try{return JSON.parse(localStorage.getItem('quizStats')||'{}');}catch(e){return{}} }
function saveStats(){ localStorage.setItem('quizStats',JSON.stringify(stats)); }

async function loadSheets(){
  const res=await fetch('sheets.json'); vocabSets=await res.json();
  stats=loadStats();
  Object.keys(vocabSets).forEach(name=>{
    const opt=document.createElement('option');
    const s=stats[name]||{mastered:0};
    opt.value=name;opt.textContent=`${name} (✔︎${s.mastered})`;
    sheetSelect.appendChild(opt);
  });
  updateOverall();
}

function updateOverall(){
  const s=stats[currentSheet]||{mastered:0,tries:0,correct:0};
  overallDiv.textContent=`✔︎ ${s.mastered}/${vocabSets[currentSheet]?.length||0}  |  Score ${s.correct}/${s.tries}`;
}

function shuffle(a){return a.sort(()=>Math.random()-0.5);}
function genOpts(def){
  const defs=new Set([def]);
  while(defs.size<4){defs.add(pool[Math.floor(Math.random()*pool.length)].definition);}
  return shuffle([...defs]);
}

function resetSetup(){
  quizDiv.style.display='none';setupDiv.style.display='block';
  nextBtn.textContent='Next';reviewBtn.style.display='none';
  updateOverall();
}

function initQuiz(){
  currentSheet=sheetSelect.value;
  mastered=new Set((stats[currentSheet]?.masteredWords)||[]);
  pool=[...vocabSets[currentSheet]];
  startRound();
  setupDiv.style.display='none';quizDiv.style.display='block';
}

function startRound(fromWrong=false){
  reviewBtn.style.display='none';
  const remaining=fromWrong?wrongPool:[...pool.filter(e=>!mastered.has(e.word))];
  const batch=remaining.length>Q_PER_ROUND?shuffle(remaining).slice(0,Q_PER_ROUND):remaining;
  wrongPool=[];
  questions=batch.map(e=>{
    const opts=genOpts(e.definition);
    return{e,opts,correctIndex:opts.indexOf(e.definition),selected:null,wrong:false};
  });
  currentIndex=0;
  showQ();
}

function speak(txt){
  if(!window.speechSynthesis) return;
  const u=new SpeechSynthesisUtterance(txt);
  u.lang='en-US';
  speechSynthesis.speak(u);
}

function showQ(){
  if(!questions.length){finishRound();return;}
  const q=questions[currentIndex];
  progressDiv.textContent=`Q ${currentIndex+1}/${questions.length} (✔︎${mastered.size}/${pool.length})`;
  questionDiv.innerHTML=`<strong id="word">${q.e.word}</strong><br><em id="ex">${q.e.example}</em>`;
  document.getElementById('word').onclick=()=>speak(q.e.word);
  document.getElementById('ex').oncontextmenu=e=>{e.preventDefault();speak(q.e.example);};
  optionsDiv.innerHTML='';
  q.opts.forEach((o,i)=>{const b=document.createElement('button');b.textContent=o;b.onclick=()=>select(i);optionsDiv.appendChild(b);});
  feedbackDiv.textContent='';nextBtn.disabled=true;
}

function select(i){
  const q=questions[currentIndex];
  if(q.selected!==null)return;
  q.selected=i;
  const correct=i===q.correctIndex;
  feedbackDiv.textContent=correct?'Correct!':'Incorrect.';
  if(correct){mastered.add(q.e.word);}else{q.wrong=true;wrongPool.push(q.e);}
  Array.from(optionsDiv.children).forEach((b,idx)=>{if(idx===i)b.classList.add('selected');b.disabled=true;});
  nextBtn.disabled=false;
}

nextBtn.onclick=()=>{ if(currentIndex+1<questions.length){currentIndex++;showQ();} else {finishRound();} };

function finishRound(){
  updateStats(); updateOverall();
  if(wrongPool.length){
    reviewBtn.style.display='block';
  }
  else if(mastered.size<pool.length){
    startRound(); // next batch automatically
  }else{
    questionDiv.textContent='All words mastered!';
    optionsDiv.innerHTML='';feedbackDiv.textContent='';
    nextBtn.textContent='Restart';nextBtn.disabled=false;
    nextBtn.onclick=resetSetup;
  }
}

function updateStats(){
  const totalCorrect=questions.filter(q=>!q.wrong).length;
  const s=stats[currentSheet]||{mastered:0,tries:0,correct:0,masteredWords:[]};
  s.mastered=mastered.size;
  s.masteredWords=[...mastered];
  s.tries+=(questions.length);
  s.correct+=(totalCorrect);
  stats[currentSheet]=s;
  saveStats();
}

changeBtn.onclick=()=>{if(confirm('Progress will reset. Change sheet?'))resetSetup();}
reviewBtn.onclick=()=>{startRound(true);}
startBtn.onclick=initQuiz;
loadSheets();
