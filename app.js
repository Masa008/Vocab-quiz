
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

let vocabSets={},currentSheet='',mastered=new Set(),pool=[],questions=[],currentIndex=0,wrongPool=[];
const Q_PER_ROUND=10;

async function loadSheets(){
  const res=await fetch('sheets.json');
  vocabSets=await res.json();
  Object.keys(vocabSets).forEach(name=>{
    const opt=document.createElement('option');
    opt.value=name;opt.textContent=name;
    sheetSelect.appendChild(opt);
  });
}
function shuffle(a){return a.sort(()=>Math.random()-0.5);}
function genOpts(def){
  const defs=new Set([def]);
  while(defs.size<4){
    const r=pool[Math.floor(Math.random()*pool.length)];
    defs.add(r.definition);
  }
  return shuffle([...defs]);
}
function resetSetup(){quizDiv.style.display='none';setupDiv.style.display='block';nextBtn.textContent='Next';}
function initQuiz(){
  currentSheet=sheetSelect.value;
  mastered.clear();
  pool=[...vocabSets[currentSheet]];
  startRound();
  setupDiv.style.display='none';
  quizDiv.style.display='block';
}
function startRound(){
  const remaining=pool.filter(e=>!mastered.has(e.word));
  const batch=remaining.length>Q_PER_ROUND?shuffle(remaining).slice(0,Q_PER_ROUND):remaining;
  questions=batch.map(e=>{
    const opts=genOpts(e.definition);
    return {e,opts,correctIndex:opts.indexOf(e.definition),selected:null,wrong:false};
  });
  currentIndex=0;wrongPool=[];
  showQ();
}
function showQ(){
  const q=questions[currentIndex];
  progressDiv.textContent=`Question ${currentIndex+1}/${questions.length} (Mastered ${mastered.size}/${pool.length})`;
  questionDiv.innerHTML=`<strong>${q.e.word}</strong><div class="question-example">${q.e.example}</div>`;
  optionsDiv.innerHTML='';
  q.opts.forEach((o,i)=>{
    const b=document.createElement('button');
    b.textContent=o;
    b.onclick=()=>selectOption(i);
    optionsDiv.appendChild(b);
  });
  feedbackDiv.textContent='';
  nextBtn.disabled=true;
}
function selectOption(idx){
  const q=questions[currentIndex];
  if(q.selected!==null)return;
  q.selected=idx;
  const correct=idx===q.correctIndex;
  feedbackDiv.textContent=correct?'Correct!':'Incorrect.';
  if(correct){mastered.add(q.e.word);}else{q.wrong=true;wrongPool.push(q.e);}
  Array.from(optionsDiv.children).forEach((b,i)=>{if(i===idx)b.classList.add('selected');b.disabled=true;});
  nextBtn.disabled=false;
}
nextBtn.onclick=()=>{
  if(currentIndex+1<questions.length){currentIndex++;showQ();}
  else{
    if(wrongPool.length>0){startRound();}
    else if(mastered.size<pool.length){startRound();}
    else{
      questionDiv.innerHTML='All words mastered!';
      optionsDiv.innerHTML='';feedbackDiv.textContent='';
      nextBtn.textContent='Restart';nextBtn.disabled=false;
      nextBtn.onclick=resetSetup;
    }
  }
};
changeBtn.onclick=()=>{if(confirm('Progress will reset. Change sheet?'))resetSetup();}
startBtn.onclick=initQuiz;
loadSheets();
