(() => {
  'use strict';
  const root=document.documentElement,stage=document.querySelector('.stage'),card=document.querySelector('.card'),body=document.querySelector('.card-body');
  const panels=[...document.querySelectorAll('.panel')],links=[...document.querySelectorAll('.nav-link')],code=document.querySelector('.section-code');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),sceneButton=document.querySelector('#scene-toggle'),status=document.querySelector('#scene-status');
  let chamber,loadPromise,desiredOn=false,sceneFailed=false,active,overlay,timer;
  function cancelFlip(){clearTimeout(timer);overlay?.remove();overlay=null;body.classList.remove('is-flipping');body.removeAttribute('aria-busy')}
  function duplicate(panel,w,h){
    const clone=panel.cloneNode(true);clone.hidden=false;clone.removeAttribute('id');clone.setAttribute('aria-hidden','true');clone.inert=true;
    clone.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));clone.style.width=w+'px';clone.style.height=h+'px';clone.classList.add('panel-snapshot');return clone;
  }
  function showPanel(animate=true){
    const next=panels.find(p=>p.id===location.hash.slice(1))||panels[0];if(active===next)return;
    const previous=active;cancelFlip();active=next;
    panels.forEach(p=>p.hidden=p!==next);
    links.forEach((link,i)=>{if(link.hash==='#'+next.id){link.setAttribute('aria-current','page');code.textContent=String(i+1).padStart(2,'0')+' / '+link.textContent.trim().toUpperCase();document.querySelector('.file-number').textContent=String(i+1).padStart(2,'0')}else link.removeAttribute('aria-current')});
    if(!previous||!animate||reduced.matches)return;
    const w=body.clientWidth,h=body.clientHeight,cols=w>650?4:3,rows=2;
    overlay=document.createElement('div');overlay.className='flip-grid';overlay.setAttribute('aria-hidden','true');overlay.inert=true;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const tile=document.createElement('div');tile.className='flip-tile';tile.style.cssText='left:'+x*w/cols+'px;top:'+y*h/rows+'px;width:'+w/cols+'px;height:'+h/rows+'px;--delay:'+(x*48+y*65)+'ms';
      const rotor=document.createElement('div');rotor.className='flip-rotor';
      for(const [p,face] of [[previous,'front'],[next,'back']]){
        const side=document.createElement('div');side.className='flip-face flip-'+face;const clone=duplicate(p,w,h);
        clone.style.left=-x*w/cols+'px';clone.style.top=-y*h/rows+'px';side.append(clone);rotor.append(side);
      }
      tile.append(rotor);overlay.append(tile);
    }
    body.append(overlay);body.classList.add('is-flipping');body.setAttribute('aria-busy','true');
    chamber?.flip();timer=setTimeout(cancelFlip,1000);
  }
  links.forEach(link=>link.addEventListener('click',e=>{e.preventDefault();if(location.hash!==link.hash)history.pushState(null,'',link.hash);showPanel()}));
  addEventListener('hashchange',()=>showPanel());addEventListener('popstate',()=>showPanel());addEventListener('resize',cancelFlip);showPanel(false);

  const projects=[...document.querySelectorAll('.project')],preview=document.querySelector('#work-preview');
  projects.forEach(project=>project.addEventListener('toggle',()=>{
    if(!project.open)return;projects.forEach(p=>{if(p!==project)p.open=false});
    preview.src=project.dataset.image;preview.alt=project.dataset.alt;document.querySelector('#work-number').textContent='PROJECT / '+project.dataset.number;
  }));
  const rotate=document.querySelector('.orientation-toggle');let flipped=false;
  try{flipped=sessionStorage.getItem('card-flipped')==='true'}catch{}
  const orient=()=>{root.style.setProperty('--flip',flipped?'180deg':'0deg');rotate.setAttribute('aria-pressed',String(flipped))};
  rotate.addEventListener('click',()=>{cancelFlip();flipped=!flipped;orient();try{sessionStorage.setItem('card-flipped',String(flipped))}catch{}});orient();

  const cardToggle=document.querySelector('#card-toggle');
  cardToggle.addEventListener('click',()=>{
    cancelFlip();const hidden=stage.classList.toggle('card-hidden');stage.inert=hidden;stage.setAttribute('aria-hidden',String(hidden));
    root.classList.toggle('view-scene',hidden);cardToggle.setAttribute('aria-pressed',String(hidden));
    cardToggle.setAttribute('aria-label',hidden?'Показать визитку':'Скрыть визитку');cardToggle.querySelector('span').textContent=hidden?'Показать визитку':'Скрыть визитку';
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stage.inert)cardToggle.click()});

  const clock=document.querySelector('#time'),formatter=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const tick=()=>{if(document.hidden)return;const date=new Date();clock.textContent=formatter.format(date);clock.dateTime=date.toISOString()};tick();setInterval(tick,1000);
  const greeting=document.querySelector('#greeting'),words=['Привет!','Hello!','Ciao!','こんにちは!','嗨！','안녕!'];
  let word=0,letter=0,deleting=false,greetingTimer;
  function greet(){
    clearTimeout(greetingTimer);if(document.hidden)return;
    if(reduced.matches){greeting.textContent='Привет!';return}
    const chars=[...words[word]];letter+=deleting?-1:1;greeting.textContent=chars.slice(0,letter).join('');
    let wait=deleting?55:95;
    if(letter===chars.length){deleting=true;wait=2500}else if(letter===0){deleting=false;word=(word+1)%words.length;wait=400}
    greetingTimer=setTimeout(greet,wait);
  }
  greet();document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(greetingTimer);else{tick();greet()}});
  function ui(on,message=''){
    root.style.setProperty('--scene-opacity',on?'1':'0');root.classList.toggle('scene-active',on);
    sceneButton.setAttribute('aria-pressed',String(on));sceneButton.setAttribute('aria-label',on?'Выключить 3D сцену':'Включить 3D сцену');
    sceneButton.querySelector('span').textContent=on?'3D / ВКЛ':'3D / ВЫКЛ';status.textContent=message||(on?'КАМЕРА 09 / СИСТЕМА АКТИВНА':'КАМЕРА 09 / РЕЖИМ ОЖИДАНИЯ');
  }
  async function enable(on){
    desiredOn=on;sceneButton.removeAttribute('aria-busy');
    if(!on){chamber?.setEnabled(false);ui(false);return}
    if(chamber&&!sceneFailed){chamber.setEnabled(true);ui(true);return}
    sceneButton.setAttribute('aria-busy','true');status.textContent='ПОДГОТОВКА КАМЕРЫ…';sceneButton.querySelector('span').textContent='3D / ЗАГРУЗКА';
    if(!loadPromise)loadPromise=import('./chamber.js').then(m=>m.createChamber(document.querySelector('#scene-canvas'),{
      reducedMotion:reduced.matches,
      onLost(){sceneFailed=true;desiredOn=false;ui(false,'3D ПРИОСТАНОВЛЕНО / ОБНОВИТЕ СТРАНИЦУ')}
    }));
    try{
      chamber=await loadPromise;if(sceneFailed)return;
      chamber.setEnabled(desiredOn);ui(desiredOn);
    }catch(error){
      desiredOn=false;loadPromise=null;ui(false,'3D НЕДОСТУПНО / ВКЛЮЧЁН СТАТИЧНЫЙ ФОН');
      document.querySelector('#scene-canvas').dataset.error='true';console.warn('Chamber unavailable:',error.message);
    }finally{sceneButton.removeAttribute('aria-busy')}
  }
  sceneButton.addEventListener('click',()=>enable(!desiredOn));
  reduced.addEventListener('change',()=>{cancelFlip();chamber?.setReducedMotion(reduced.matches);greet()});
  // Touch devices never request the scene bundle or texture maps until explicitly enabled.
  enable(!matchMedia('(pointer: coarse)').matches&&!matchMedia('(max-width: 100000px)').matches);
})();
