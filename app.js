
const sheetSelect = document.getElementById('sheetSelect');
const startBtn = document.getElementById('startBtn');
const setupDiv = document.getElementById('setup');
const quizDiv = document.getElementById('quiz');

const questionDiv = document.getElementById('question');
const optionsDiv = document.getElementById('options');
const feedbackDiv = document.getElementById('feedback');
const nextBtn = document.getElementById('nextBtn');
const progressDiv = document.getElementById('progress');
const changeBtn = document.getElementById('changeBtn');

let vocabSets = {};
let currentSheet = '';
let mastered = new Set();
let pool = [];
let questions = [];
let currentIndex = 0;
let wrongPool = [];
const QUESTIONS_PER_ROUND = 10;

async function loadSheets(){
  const res = await fetch('sheets.json');
  vocabSets = await res.json();
  Object.keys(vocabSets).forEach(name=>{
    const opt=document.createElement('option');
    opt.value=name;
    opt.textContent=name;
    sheetSelect.appendChild(opt);
  });
}

function shuffle(arr){return arr.sort(()=>Math.random()-0.5);}

function generateOptions(correctDef){
  const defs=new Set([correctDef]);
  while(defs.size<4){
    const randomEntry=pool[Math.floor(Math.random()*pool.length)];
    defs.add(randomEntry.definition);
  }
  return shuffle(Array.from(defs));
}

function resetToSetup(){
  quizDiv.style.display='none';
  setupDiv.style.display='block';
  nextBtn.textContent='Next';
}

function initQuiz(){
  currentSheet = sheetSelect.value;
  mastered.clear();
  pool=[...vocabSets[currentSheet]];
  startRound();
  setupDiv.style.display='none';
  quizDiv.style.display='block';
}

function startRound(){
  const remaining=pool.filter(e=>!mastered.has(e.word));
  const batch=remaining.length>QUESTIONS_PER_ROUND?shuffle(remaining).slice(0,QUESTIONS_PER_ROUND):remaining;
  questions=batch.map(entry=>{
    const opts=generateOptions(entry.definition);
    return {entry,options:opts,correctIndex:opts.indexOf(entry.definition),selected:null,wrong:false};
  });
  currentIndex=0;
  wrongPool=[];
  showQuestion();
}

function showQuestion(){
  const q=questions[currentIndex];
  progressDiv.textContent=`Question ${currentIndex+1} / ${questions.length}  (Mastered: ${mastered.size} / ${pool.length})`;
  questionDiv.textContent=q.entry.word;
  optionsDiv.innerHTML='';
  q.options.forEach((opt,idx)=>{
    const btn=document.createElement('button');
    btn.textContent=opt;
    btn.onclick=()=>selectOption(idx,btn);
    optionsDiv.appendChild(btn);
  });
  feedbackDiv.textContent='';
  nextBtn.disabled=true;
}

function selectOption(index,btn){
  const q=questions[currentIndex];
  if(q.selected!==null)return;
  q.selected=index;
  const correct=index===q.correctIndex;
  feedbackDiv.textContent=correct?'Correct!':'Incorrect.';
  if(correct){mastered.add(q.entry.word);}else{q.wrong=true;wrongPool.push(q.entry);}
  Array.from(optionsDiv.children).forEach((b,i)=>{if(i===index)b.classList.add('selected');b.disabled=true;});
  nextBtn.disabled=false;
}

nextBtn.onclick=()=>{
  if(currentIndex+1<questions.length){currentIndex++;showQuestion();}
  else{
    if(wrongPool.length>0){startRound();}
    else if(mastered.size<pool.length){startRound();}
    else{
      questionDiv.textContent='Congratulations! All words mastered.';
      optionsDiv.innerHTML='';
      feedbackDiv.textContent='';
      nextBtn.textContent='Restart';
      nextBtn.disabled=false;
      nextBtn.onclick=resetToSetup;
    }
  }
};

changeBtn.onclick=()=>{
  if(confirm('Current progress will be lost. Change sheet?')){
    resetToSetup();
  }
};

startBtn.onclick=initQuiz;
loadSheets();
