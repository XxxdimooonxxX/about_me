(() => {
  'use strict';
  const button = document.querySelector('.scene-toggle');
  const canvas = document.querySelector('#portal-scene');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = !matchMedia('(pointer: coarse), (max-width: 700px)').matches;
  let engine, loading, frame = 0, last = 0, lost = false;
  let flipStart = -100;
  const updateButton = () => {
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Выключить 3D-сцену' : 'Включить 3D-сцену');
    button.lastElementChild.textContent = enabled ? '3D / ON' : '3D / OFF';
    document.body.classList.toggle('scene-active', enabled && !!engine && !lost);
  };
  function load() {
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = './js/vendor/three.min.js'; script.onload = resolve; script.onerror = reject;
      document.head.append(script);
    });
    return loading;
  }
  function build() {
    const T = window.THREE;
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping;
    const scene = new T.Scene(); scene.background = new T.Color('#263339'); scene.fog = new T.Fog('#263339', 19, 40);
    const camera = new T.PerspectiveCamera(48, 1, .1, 60); camera.position.set(0, 1.2, 14); camera.lookAt(0, .3, -3);
    let seed = 91;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    function texture(dark = false) {
      const c = document.createElement('canvas'); c.width = c.height = 512;
      const x = c.getContext('2d'); x.fillStyle = dark ? '#303b3d' : '#ccd0c6'; x.fillRect(0,0,512,512);
      for (let i=0; i<24000; i++) { const n=random(); x.fillStyle=`rgba(${n>.5?'255,255,245':'20,29,27'},${random()*.08})`; x.fillRect(random()*512,random()*512,random()*3+1,1); }
      const g=x.createLinearGradient(0,0,0,512); g.addColorStop(0,'#00000000'); g.addColorStop(.86,'#00000000'); g.addColorStop(1,'#283c3340'); x.fillStyle=g; x.fillRect(0,0,512,512);
      x.strokeStyle=dark?'#10191b':'#64736a'; x.lineWidth=3; x.strokeRect(3,3,506,506);
      for (const px of [18,494]) for (const py of [18,494]) { x.fillStyle='#56645e'; x.beginPath(); x.arc(px,py,3,0,Math.PI*2); x.fill(); }
      const map=new T.CanvasTexture(c); map.colorSpace=T.SRGBColorSpace; map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy()); return map;
    }
    const whiteMap=texture(), darkMap=texture(true);
    const ceramic=new T.MeshStandardMaterial({map:whiteMap,bumpMap:whiteMap,bumpScale:.024,roughness:.74,metalness:.12});
    const metal=new T.MeshStandardMaterial({map:darkMap,roughness:.6,metalness:.7});
    const black=new T.MeshStandardMaterial({color:'#182327',roughness:.72,metalness:.5});
    const cyan=new T.MeshStandardMaterial({color:'#8adae8',emissive:'#47cce8',emissiveIntensity:2});
    const orange=new T.MeshStandardMaterial({color:'#ffaa38',emissive:'#ed701c',emissiveIntensity:1.5});
    function box(w,h,d,x,y,z,mat=ceramic,parent=scene) {
      const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat); mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
    }
    scene.add(new T.HemisphereLight('#d5eeed','#33312c',2));
    const key=new T.SpotLight('#edfff4',210,40,.95,.7,1.3); key.position.set(-6,9,7); key.target.position.set(0,-2,-5); key.castShadow=true; key.shadow.mapSize.set(1024,1024); key.shadow.bias=-.001; scene.add(key,key.target);
    const fill=new T.PointLight('#69d5ff',40,15,1.5); fill.position.set(-8,0,1); scene.add(fill);
    const warm=new T.PointLight('#f69c46',25,14,1.5); warm.position.set(8,-1,0); scene.add(warm);
    box(30,20,.4,0,1,-9,black);
    const panels=[];
    for(let row=0;row<6;row++) for(let col=0;col<12;col++) {
      const x=(col-5.5)*2.08,y=(row-2.5)*2.08;
      const group=new T.Group(); group.position.set(x,y,-8.5); scene.add(group);
      box(1.99,1.99,.19,0,0,0,(col===0||col===11||row===0)?metal:ceramic,group);
      box(.12,1.5,.45,0,0,-.3,black,group);
      if ((col<3||col>8)&&row>0&&row<5) { group.rotation.x=(col+row)%3===0?-.19:0; panels.push({group,base:group.rotation.x,delay:(col+row)%5*.11}); }
    }
    for(let x=-14;x<15;x+=2.08) for(let z=-10;z<16;z+=2.08) box(2.01,.18,2.01,x,-5.35,z,metal);
    for(const side of [-1,1]) {
      for(let y=-4;y<9;y+=2.08) for(let z=-7;z<9;z+=2.08) box(.2,2,2,side*12.5,y,z,ceramic);
      box(.1,13,.13,side*10.5,1,-8.15,side<0?cyan:orange);
      box(.3,13,.35,side*10.5,1,-8.35,black);
      box(1, .12, 13,side*9,6,-1,cyan);
    }
    // Segmented weighted cubes, built from a core and eight independent corner shells.
    function cube(x,y,z,scale) {
      const g=new T.Group(); g.position.set(x,y,z); g.scale.setScalar(scale); g.rotation.set(.05,.4,-.08); scene.add(g);
      box(1.55,1.55,1.55,0,0,0,metal,g);
      for(const a of [-1,1]) for(const b of [-1,1]) for(const c of [-1,1]) box(.64,.64,.64,a*.65,b*.65,c*.65,ceramic,g);
      for(const side of [-1,1]) {
        const disc=new T.Mesh(new T.CylinderGeometry(.46,.46,.12,40),ceramic); disc.rotation.x=Math.PI/2; disc.position.z=side*.81; g.add(disc);
        const ring=new T.Mesh(new T.TorusGeometry(.31,.035,8,40),cyan); ring.position.z=side*.9; g.add(ring);
        box(.13,.39,.04,0,0,side*.91,cyan,g); box(.39,.13,.04,0,0,side*.91,cyan,g);
      }
      return g;
    }
    const leftCube=cube(-8,-3.9,-1,1.1); cube(9,-4.3,-4,.85);
    // Exposed piston arms behind two raised wall plates.
    for(const side of [-1,1]) {
      const g=new T.Group(); g.position.set(side*8.2,2.7,-4); g.rotation.set(-.23,side*-.3,.04); scene.add(g);
      box(2.4,2.4,.18,0,0,0,ceramic,g); box(.25,.3,2,0,0,-1.1,metal,g); box(.75,.75,.25,0,0,-2.2,black,g);
    }
    function resize() {
      renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
      leftCube.visible=innerWidth>800;
      if(enabled) render(performance.now());
    }
    function render(now) {
      const t=(now-flipStart)/1000;
      panels.forEach(({group,base,delay})=> { const p=Math.max(0,Math.min(1,(t-delay)/1.2)); group.rotation.x=base+(motion.matches?0:Math.PI*2*(p*p*(3-2*p))); });
      renderer.render(scene,camera);
    }
    window.addEventListener('resize',resize); resize();
    return {render};
  }
  function tick(now) {
    frame=0;
    if(!enabled||document.hidden||lost) return;
    if(now-last>32) { engine.render(now); last=now; }
    if(!motion.matches && now-flipStart<2300) frame=requestAnimationFrame(tick);
  }
  const wake=()=> { if(engine&&enabled&&!frame&&!document.hidden&&!lost) frame=requestAnimationFrame(tick); };
  async function apply() {
    updateButton();
    if(!enabled) { cancelAnimationFrame(frame); frame=0; return; }
    try { await load(); if(!enabled) return; if(!engine) engine=build(); updateButton(); wake(); }
    catch(error) { enabled=false; updateButton(); button.lastElementChild.textContent='3D / НЕДОСТУПНО'; button.title='Не удалось запустить WebGL. Визитка остаётся доступной.'; console.warn('3D scene unavailable',error); }
  }
  button.addEventListener('click',()=> { enabled=!enabled; apply(); });
  document.addEventListener('panelchange',()=> { flipStart=performance.now(); wake(); });
  document.addEventListener('visibilitychange',()=> { if(document.hidden) { cancelAnimationFrame(frame); frame=0; } else wake(); });
  motion.addEventListener('change',wake);
  canvas.addEventListener('webglcontextlost',event=> { event.preventDefault(); lost=true; cancelAnimationFrame(frame); frame=0; updateButton(); });
  canvas.addEventListener('webglcontextrestored',()=> { lost=false; updateButton(); wake(); });
  apply();
})();
