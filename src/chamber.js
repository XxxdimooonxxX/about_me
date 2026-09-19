import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export async function createChamber(canvas, { reducedMotion=false, onLost=()=>{} }={}) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.12;
  const scene=new T.Scene(); scene.background=new T.Color('#718481'); scene.fog=new T.FogExp2('#6b7f7b',.014);
  const camera=new T.PerspectiveCamera(57,1,.08,100);
  const pmrem=new T.PMREMGenerator(renderer), env=new RoomEnvironment(), envTarget=pmrem.fromScene(env,.035);
  scene.environment=envTarget.texture; scene.environmentIntensity=.18; env.dispose(); pmrem.dispose();
  let seed=90210;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const between=(a,b)=>a+(b-a)*rnd(), v=(x,y,z)=>new T.Vector3(x,y,z);
  const loader=new T.TextureLoader();
  const texture=async(name,color=false)=>{
    const t=await loader.loadAsync(new URL('../img/scene-textures/'+name+'.webp',import.meta.url).href);
    if(color)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
  };
  const [concrete,normal,roughness,ao,metalMap,metalNormal,metalRough]=await Promise.all([
    texture('concrete-color',true),texture('concrete-normal'),texture('concrete-roughness'),texture('concrete-ao'),
    texture('metal-color',true),texture('metal-normal'),texture('metal-roughness')
  ]);
  const generated=[];
  function canvasMap(w,h,draw) {
    const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;generated.push(t);return t;
  }
  const steel=new T.MeshStandardMaterial({map:metalMap,normalMap:metalNormal,roughnessMap:metalRough,color:'#4b514b',metalness:.72,roughness:.64});
  const black=new T.MeshStandardMaterial({color:'#171e1d',metalness:.5,roughness:.64});
  const silver=new T.MeshStandardMaterial({color:'#89918e',metalness:.86,roughness:.27});
  const red=new T.MeshStandardMaterial({color:'#912a1e',metalness:.16,roughness:.45});
  const stone=new T.MeshStandardMaterial({map:concrete,normalMap:normal,roughnessMap:roughness,aoMap:ao,color:'#8d9588',roughness:1});
  const soil=new T.MeshStandardMaterial({map:concrete,normalMap:normal,color:'#252e1f',roughness:1});
  const cyan=new T.MeshStandardMaterial({color:'#45e1e8',emissive:'#36d7e3',emissiveIntensity:3,roughness:.38});
  const light=new T.MeshBasicMaterial({color:'#e5f3e1',toneMapped:false});
  const panelMaps=[];
  for(let variant=0;variant<4;variant++) panelMaps.push(canvasMap(768,768,(ctx,w,h)=>{
    ctx.fillStyle=['#c8c9bc','#b4bab0','#deded0','#929f99'][variant];ctx.fillRect(0,0,w,h);
    const pixels=ctx.getImageData(0,0,w,h);
    for(let i=0;i<pixels.data.length;i+=4){const noise=(rnd()-.5)*15;pixels.data[i]+=noise;pixels.data[i+1]+=noise;pixels.data[i+2]+=noise;}
    ctx.putImageData(pixels,0,0);
    for(let i=0;i<50;i++){
      const x=rnd()*w,y=rnd()*h,r=between(18,150),g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,'rgba(44,54,39,'+between(.025,.13)+')');g.addColorStop(1,'rgba(44,54,39,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    for(let i=0;i<50;i++){const x=rnd()*w,y=rnd()*h,len=between(30,270);const g=ctx.createLinearGradient(x,y,x,y+len);g.addColorStop(0,'#434c3722');g.addColorStop(1,'#434c3700');ctx.fillStyle=g;ctx.fillRect(x,y,between(2,15),len)}
    const edge=ctx.createLinearGradient(0,0,0,h);edge.addColorStop(0,'#1c242b44');edge.addColorStop(.055,'#17222400');edge.addColorStop(.86,'#18281a00');edge.addColorStop(1,'#29372499');ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#28353099';ctx.lineWidth=3;ctx.strokeRect(3,3,w-6,h-6);
    ctx.strokeStyle='#ffffe477';ctx.lineWidth=2;ctx.strokeRect(8,8,w-16,h-16);
    for(let i=0;i<20;i++){ctx.strokeStyle=rnd()>.5?'#17262433':'#ffffff33';ctx.lineWidth=between(.3,1.4);ctx.beginPath();let x=rnd()*w,y=rnd()*h;ctx.moveTo(x,y);ctx.lineTo(x+between(-60,60),y+between(10,80));ctx.stroke()}
    if(variant===1||variant===3){ctx.strokeStyle='#2d332b88';ctx.lineWidth=1.2;ctx.beginPath();let x=between(40,700),y=0;ctx.moveTo(x,y);while(y<h*.8){x+=between(-45,45);y+=between(12,75);ctx.lineTo(x,y)}ctx.stroke()}
  }));
  const panels=panelMaps.map((map,i)=>new T.MeshStandardMaterial({map,normalMap:normal,normalScale:new T.Vector2(.18,.18),roughnessMap:roughness,roughness:.83,metalness:.07,color:i===3?'#8d9d98':'#ffffff'}));
  const unitBox=new T.BoxGeometry(1,1,1), bevelBox=new RoundedBoxGeometry(1,1,1,1,.025);
  const staticMeshes=[], movingPanels=[];
  function mesh(g,m,pos,scale,rot,parent=scene,batch=true) {
    const o=new T.Mesh(g,m);if(pos)o.position.set(...pos);if(scale)o.scale.set(...scale);if(rot)o.rotation.set(...rot);
    o.castShadow=true;o.receiveShadow=true;parent.add(o);if(batch&&parent===scene&&!m.transparent)staticMeshes.push(o);return o;
  }
  const box=(pos,size,mat=steel,rot=null,parent=scene,batch=true)=>mesh(unitBox,mat,pos,size,rot,parent,batch);
  const panel=(pos,size,mat=panels[0],rot=null,parent=scene,batch=true)=>mesh(bevelBox,mat,pos,size,rot,parent,batch);
  function rod(a,b,r=.045,material=steel,parent=scene,batch=true){
    const A=v(...a),B=v(...b),d=B.clone().sub(A);
    const o=mesh(new T.CylinderGeometry(r,r,d.length(),8),material,A.clone().add(B).multiplyScalar(.5).toArray(),null,null,parent,batch);
    o.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());return o;
  }
  function tube(points,r=.025,material=black){
    return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>v(...p))),24,r,6,false),material);
  }

  // The broken shell, actual gaps and a second layer of structure provide depth.
  box([0,-.55,-.6],[19,.6,23],soil);
  box([0,4.6,-10.7],[19,9.2,.5],black);
  box([-9.6,4.6,-.6],[.5,9.2,23],stone);box([9.6,4.6,-.6],[.5,9.2,23],stone);
  for(let x=-8;x<=8;x+=2)for(let z=-9;z<=9;z+=2){
    const missing=(z>1&&Math.abs(x)>4&&rnd()<.24)||(z>5&&rnd()<.23);
    if(missing)continue;
    const tilt=rnd()<.09;
    panel([x,tilt?.13:0,z],[1.967,.18,1.967],panels[rnd()<.65?0:1],tilt?[between(-.08,.08),between(-.03,.03),between(-.04,.04)]:null);
  }
  for(let row=0;row<4;row++)for(let col=0;col<9;col++){
    const x=-8+col*2,y=1+row*2;
    if(Math.abs(x)<2&&row<2)continue;
    if((col<3&&row>1&&rnd()<.35)||(col>5&&row===3&&rnd()<.35))continue;
    panel([x,y,-10.33],[1.966,1.966,.18],panels[(col+row)%5===0?1:0]);
  }
  for(const side of [-1,1])for(let row=0;row<4;row++)for(let col=0;col<9;col++){
    const z=-9+col*2,y=1+row*2;
    panel([side*9.25,y,z],[.2,1.968,1.968],panels[row===3?3:rnd()<.2?1:0]);
  }
  for(let x=-9;x<=9;x+=2){box([x,4.3,-10.15],[.07,8.5,.13]);box([x,8.6,-.5],[.16,.35,20]);}
  for(let z=-10;z<=9;z+=2)box([0,8.45,z],[18.4,.3,.14]);
  for(let x=-8;x<=8;x+=2)for(let z=-9;z<=7;z+=2){
    if((x>-5&&x<4&&z>-8&&z<5)||rnd()<.11)continue;
    panel([x,8.3,z],[1.96,.12,1.96],panels[3],rnd()<.16?[between(-.3,.3),0,.1]:null);
  }
  // Bent trusses, cable loops and hanging ceiling frames.
  for(let i=0;i<11;i++){
    const x=between(-7,7),z=between(-8,3);box([x,between(7.3,8.2),z],[between(2,4.7),.14,.12],steel,[between(-.3,.3),between(-.6,.6),between(-.35,.35)]);
  }
  tube([[-7,8.4,2],[-6.4,6.5,.3],[-4.5,5.3,-1],[-2.7,7.9,-4]],.027);
  tube([[5.8,8.2,1.6],[5.9,5.1,-.5],[7.4,4.8,-3],[8.6,7.8,-6]],.04);
  tube([[-8,7.8,-6],[-7.2,5.1,-7],[-3.2,6.6,-8.8]],.025);

  // Observation glass: rough transparent glazing and a fine safety stripe.
  const glassMap=canvasMap(512,512,(ctx,w,h)=>{
    ctx.fillStyle='#c0d9d0';ctx.fillRect(0,0,w,h);
    for(let i=0;i<100;i++){ctx.fillStyle='rgba(45,76,70,'+between(.015,.05)+')';ctx.fillRect(rnd()*w,0,between(.3,2),h)}
    for(let y=345;y<373;y+=5){ctx.fillStyle='#e2efdd';ctx.fillRect(0,y,w,1)}
    ctx.strokeStyle='#d9eee299';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,385);ctx.lineTo(105,300);ctx.lineTo(148,190);ctx.lineTo(130,92);ctx.moveTo(105,300);ctx.lineTo(34,204);ctx.moveTo(148,190);ctx.lineTo(278,150);ctx.stroke();
  });
  const glass=new T.MeshPhysicalMaterial({map:glassMap,color:'#98b7b2',metalness:.06,roughness:.14,transparent:true,opacity:.14,side:T.DoubleSide,depthWrite:false,envMapIntensity:1.1});
  for(const side of [-1,1]){
    const x=side*6.2;
    for(let i=0;i<5;i++){
      const z=4.8-i*2.65;
      box([x,3.4,z],[.095,6.8,.11],steel);
      if(i<4){
        const g=mesh(new T.PlaneGeometry(2.56,6.4),glass,[x,3.3,z-1.33],null,[0,Math.PI/2,0],scene,false);g.castShadow=false;
        for(const y of [.15,3.4,6.65])box([x,y,z-1.32],[.095,.065,2.66],steel);
      }
    }
    box([x,6.95,-.5],[.3,.4,11.4],black);
  }

  // Mechanical wall panels pivot around real axes, with visible backs and pistons.
  for(const side of [-1,1])for(let row=0;row<3;row++)for(let col=0;col<3;col++){
    const group=new T.Group();group.position.set(side*(6.8+col*.72),1.45+row*2.08,-8.3+col*1.45);group.rotation.y=-side*.62;scene.add(group);
    const pivot=new T.Group();group.add(pivot);pivot.rotation.x=(row===2&&col===0?-.42:0);
    panel([0,0,0],[1.92,1.92,.16],panels[(row+col)%3],null,pivot,false);
    box([0,0,-.16],[1.77,1.75,.18],black,null,pivot,false);
    for(const x of [-.68,.68])box([x,0,-.28],[.08,1.78,.18],steel,null,pivot,false);
    for(const y of [-.67,.67])box([0,y,-.29],[1.7,.07,.14],steel,null,pivot,false);
    rod([-.98,0,-.05],[.98,0,-.05],.07,silver,group,false);
    rod([0,-.6,-.8],[0,.36,-.3],.065,silver,group,false);
    rod([0,-.5,-.83],[0,.03,-.49],.11,black,group,false);
    movingPanels.push({pivot,base:pivot.rotation.x,delay:(row*3+col)*.045});
  }

  // Rear exit and illuminated pictograms.
  function sign(draw,w=768,h=768){const map=canvasMap(w,h,draw);return new T.MeshBasicMaterial({map,toneMapped:false,side:T.DoubleSide})}
  const chamberSign=sign((c,w,h)=>{
    c.fillStyle='#d9e5d6';c.fillRect(0,0,w,h);c.fillStyle='#172423';c.fillRect(42,44,w-84,3);
    c.font='20px Consolas';c.fillText('APERTURE LABORATORIES',44,86);c.font='bold 320px Bahnschrift';c.fillText('09',27,391);
    c.font='20px Consolas';c.fillText('TEST CHAMBER / PERSONNEL',44,433);c.fillRect(44,466,w-88,2);
    for(let i=0;i<5;i++){c.strokeStyle='#172423';c.lineWidth=4;c.strokeRect(44+i*139,505,118,118);c.font='bold 62px Bahnschrift';c.fillText(['↗','↓','◇','+','!'][i],72+i*139,585)}
    c.font='18px Consolas';c.fillText('PLEASE PROCEED TO THE NEXT TEST',44,698);
  });
  box([-4.05,3.45,-10.03],[2.1,3.04,.19],black);
  mesh(new T.PlaneGeometry(1.93,2.87),chamberSign,[-4.05,3.45,-9.92],null,null,scene,false);
  const exitSign=sign((c,w,h)=>{
    c.fillStyle='#092524';c.fillRect(0,0,w,h);c.strokeStyle=c.fillStyle='#87fff0';c.lineWidth=22;c.lineCap='square';
    c.beginPath();c.arc(260,90,28,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(258,139);c.lineTo(229,218);c.lineTo(300,265);c.lineTo(330,341);c.moveTo(230,218);c.lineTo(186,314);c.lineTo(127,357);c.moveTo(248,154);c.lineTo(330,185);c.lineTo(373,149);c.moveTo(238,159);c.lineTo(178,137);c.lineTo(138,183);c.stroke();
    c.font='80px Bahnschrift';c.fillText('↓',384,287);
  },512,420);
  box([0,2.1,-10.15],[3.45,4.3,.6],steel);panel([0,2.05,-9.79],[2.82,3.88,.15],panels[3]);
  box([0,2.1,-9.64],[.025,3.9,.03],black);
  mesh(new T.PlaneGeometry(1.9,1.56),exitSign,[0,2.6,-9.61],null,null,scene,false);
  for(const x of [-1.48,1.48])box([x,2.15,-9.65],[.038,4.16,.025],cyan);
  box([0,4.22,-9.65],[3,.04,.03],cyan);
  const arrow=sign((c,w,h)=>{c.fillStyle='#e9efdc';c.fillRect(0,0,w,h);c.fillStyle='#14201e';c.font='bold 175px Bahnschrift';c.fillText('↓',35,166)},192,192);
  mesh(new T.PlaneGeometry(.83,.83),arrow,[0,5.05,-10.03],null,null,scene,false);

  // Indicator lamps, button pedestals and a weighted cube.
  for(let z=-8.8;z<6;z+=.52){box([3.6,.114,z],[.22,.035,.28],cyan);box([-4.8,.113,z],[.26,.034,.2],cyan)}
  for(let x=-4.8;x<3.8;x+=.52)box([x,.114,-6.5],[.26,.035,.2],cyan);
  for(let y=.3;y<4.9;y+=.46)box([3.6,y,-9.92],[.15,.22,.04],cyan);
  for(const [x,z] of [[-4.65,.5],[4.1,3.8],[-3.65,-5.4]]){
    panel([x,.14,z],[1,.16,.9],panels[2]);mesh(new T.CylinderGeometry(.15,.21,1.28,20),panels[2],[x,.84,z]);
    mesh(new T.CylinderGeometry(.16,.16,.17,24),black,[x,1.57,z]);
    mesh(new T.CylinderGeometry(.145,.145,.12,24),red,[x,1.69,z]);
    box([x,1.52,z+.15],[.12,.04,.02],light);
  }
  const cube=new T.Group();cube.position.set(-3.3,.72,5.3);cube.rotation.y=.27;scene.add(cube);
  panel([0,0,0],[1.27,1.27,1.27],panels[1],null,cube,false);
  for(const x of [-.53,.53])for(const y of [-.53,.53])for(const z of [-.53,.53])panel([x,y,z],[.38,.38,.38],panels[2],null,cube,false);
  for(let i=0;i<4;i++){const disk=mesh(new T.CylinderGeometry(.31,.31,.09,24),black,[0,0,0],null,null,cube,false);
    disk.rotation.x=i<2?Math.PI/2:0;disk.rotation.z=i>=2?Math.PI/2:0;disk.position.set(i>=2?(i===2?.67:-.67):0,0,i<2?(i===0?.67:-.67):0);
    const ring=new T.Mesh(new T.TorusGeometry(.25,.024,8,28),cyan);ring.position.copy(disk.position);ring.rotation.y=i>=2?Math.PI/2:0;cube.add(ring);
  }

  // Debris piles are asymmetrical; chipped plates expose the darker core.
  for(let i=0;i<88;i++){
    const side=rnd()<.5?-1:1,x=side*between(4.3,8.8),z=between(-7,10);
    if(rnd()<.6)panel([x,between(.12,.55),z],[between(.22,1.35),between(.04,.14),between(.2,.9)],panels[rnd()<.55?1:3],[between(-.26,.26),rnd()*Math.PI,between(-.16,.16)]);
    else box([x,between(.14,.55),z],[between(.05,.12),between(.07,.16),between(.6,2.2)],steel,[between(-.18,.18),rnd()*Math.PI,between(-.35,.35)]);
  }

  const leafMap=canvasMap(256,256,(c,w,h)=>{
    c.clearRect(0,0,w,h);const g=c.createLinearGradient(75,0,170,255);g.addColorStop(0,'#8a9950');g.addColorStop(.4,'#4c6335');g.addColorStop(1,'#283c25');c.fillStyle=g;
    c.beginPath();c.moveTo(128,10);c.bezierCurveTo(230,55,240,155,131,242);c.bezierCurveTo(20,170,32,75,128,10);c.fill();
    c.strokeStyle='#a3a36988';c.lineWidth=2;c.beginPath();c.moveTo(128,20);c.quadraticCurveTo(104,150,131,240);c.stroke();
    for(let i=0;i<12;i++){const y=42+i*15;c.strokeStyle='#b5b07840';c.lineWidth=.8;c.beginPath();c.moveTo(120,y+25);c.lineTo(120-(60-Math.abs(i-5)*7),y);c.moveTo(123,y+25);c.lineTo(125+(62-Math.abs(i-5)*7),y-3);c.stroke()}
    for(let i=0;i<1800;i++){c.fillStyle=rnd()>.5?'#b3af7433':'#1b2e2222';const x=between(57,191),y=between(45,207);c.fillRect(x,y,1,1)}
  });
  const leafMat=new T.MeshStandardMaterial({map:leafMap,alphaTest:.5,side:T.DoubleSide,roughness:.94,color:'#c1c4a0'});
  const leafGeo=new T.PlaneGeometry(1,1,2,3);const lp=leafGeo.attributes.position;
  for(let i=0;i<lp.count;i++)lp.setZ(i,Math.abs(lp.getX(i))*.2+Math.sin(lp.getY(i)*3)*.07);leafGeo.computeVertexNormals();
  const leaves=[], dummy=new T.Object3D();
  function addLeaf(x,y,z,size,rx,ry,rz){dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(size*.68,size,1);dummy.updateMatrix();leaves.push(dummy.matrix.clone())}
  const vineMat=new T.MeshStandardMaterial({color:'#37422b',roughness:1});
  for(let i=0;i<56;i++){
    const x=i<36?between(-8.2,-3.7):between(5.1,8.8),z=between(-8.6,5),length=between(2,6.9),top=between(7.7,8.7),bend=between(-.65,.65);
    const points=[];
    for(let j=0;j<7;j++){const t=j/6;points.push([x+Math.sin(t*4+i)*.13+bend*t,top-t*length,z+Math.sin(t*3)*.28])}
    tube(points,between(.009,.017),vineMat);
    for(let t=.06;t<1;t+=between(.025,.045)){
      const yy=top-t*length,xx=x+Math.sin(t*4+i)*.13+bend*t,zz=z+Math.sin(t*3)*.28;
      for(const side of [-1,1])addLeaf(xx+side*between(.04,.14),yy,zz,between(.18,.43),between(-.5,.5),between(-1.3,1.3),side*between(.25,1.3));
    }
  }
  for(let i=0;i<115;i++){
    const side=rnd()<.5?-1:1,x=side*between(4.1,9.1),z=between(-8.8,10),height=between(.16,.65);
    for(let j=0;j<8;j++){const a=j/8*Math.PI*2;addLeaf(x+Math.cos(a)*.21,height*.6,z+Math.sin(a)*.21,height,Math.PI*.26, -a,between(-.6,.6))}
  }
  const vegetation=new T.InstancedMesh(leafGeo,leafMat,leaves.length);
  leaves.forEach((m,i)=>{vegetation.setMatrixAt(i,m);vegetation.setColorAt(i,new T.Color().setHSL(between(.18,.26),between(.15,.32),between(.62,.91)))});
  vegetation.castShadow=true;vegetation.receiveShadow=true;scene.add(vegetation);
  // Moss decals use a feathered alpha mask over the real floor surface.
  const mossMap=canvasMap(256,256,(c,w,h)=>{
    for(let i=0;i<6000;i++){const x=rnd()*w,y=rnd()*h,d=Math.hypot((x-128)/128,(y-128)/128);if(rnd()<Math.max(0,1-d)){c.fillStyle=['#38402899','#4c573b88','#65744777','#28352999'][i%4];c.fillRect(x,y,between(1,5),between(1,5))}}
  });
  const moss=new T.MeshStandardMaterial({map:mossMap,transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-1});
  for(let i=0;i<42;i++){const x=between(-8.8,8.8),z=between(-8.8,9),s=between(1,3);mesh(new T.PlaneGeometry(s,s),moss,[x,.103,z],null,[-Math.PI/2,0,rnd()*6.28],scene,false).castShadow=false}

  // Directional daylight casts the broken roof and leaves onto the chamber.
  scene.add(new T.HemisphereLight('#c6e5ee','#3c4130',1.05));
  const sun=new T.DirectionalLight('#fff1ca',4.8);sun.position.set(-4.8,14,-5);sun.target.position.set(3.5,0,3.4);scene.add(sun,sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.camera.far=40;sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;
  const fill=new T.DirectionalLight('#8ed7e6',.5);fill.position.set(0,5,10);scene.add(fill);
  for(const pos of [[3.5,.7,-5],[-4.8,.6,0],[0,3.2,-9.1]]){const l=new T.PointLight('#58e8ea',pos[0]===0?3:1.7,6,2);l.position.set(...pos);scene.add(l)}
  // A soft particulate shaft, with no 2D background baked behind the room.
  const beamMat=new T.MeshBasicMaterial({color:'#eee7b7',transparent:true,opacity:.006,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
  for(let i=0;i<4;i++){const b=mesh(new T.CylinderGeometry(.22,1.2,10,32,1,true),beamMat,[-2.7+i*.5,4.5,-1.2+i*.4],null,[0,0,.56],scene,false);b.castShadow=false}
  const dustGeo=new T.BufferGeometry(),dust=new Float32Array(330);
  for(let i=0;i<dust.length;i+=3){dust[i]=between(-7,7);dust[i+1]=between(.4,8);dust[i+2]=between(-9,8)}
  dustGeo.setAttribute('position',new T.BufferAttribute(dust,3));
  const motes=new T.Points(dustGeo,new T.PointsMaterial({color:'#dddbc6',size:.024,transparent:true,opacity:.45,depthWrite:false}));scene.add(motes);

  // Merge the static architecture by material; animated and transparent objects stay separate.
  const batches=new Map();scene.updateMatrixWorld(true);
  for(const o of staticMeshes){o.updateMatrixWorld();const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);scene.remove(o)}
  for(const [mat,gs]of batches){const geo=mergeGeometries(gs,false);if(geo){const m=new T.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;scene.add(m)}else throw new Error('Incompatible chamber geometry');gs.forEach(g=>g.dispose())}
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new T.Vector2(1,1),.2,.45,1.5);composer.addPass(bloom);composer.addPass(new OutputPass());
  let running=false,raf=0,elapsed=0,last=0,flipTime=-20,pointer={x:0,y:0},livePointer={x:0,y:0},lastW=0,lastH=0;
  function resize(){
    const w=innerWidth,h=innerHeight;if(lastW===w&&lastH===h)return;lastW=w;lastH=h;
    renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;camera.fov=w/h<1?73:57;camera.updateProjectionMatrix();
  }
  function render(now){
    if(!running||document.hidden)return;
    const dt=Math.min((now-last)/1000,.04);last=now;elapsed+=dt;
    resize();livePointer.x+=(pointer.x-livePointer.x)*.035;livePointer.y+=(pointer.y-livePointer.y)*.035;
    const drift=reducedMotion?0:elapsed;
    camera.position.set(Math.sin(drift*.13)*.28+livePointer.x*.42,5.05+Math.sin(drift*.19)*.065-livePointer.y*.19,12.4+Math.cos(drift*.12)*.14);
    camera.lookAt(livePointer.x*.09,2.35-livePointer.y*.045,-4.4);
    for(const m of movingPanels){const t=(elapsed-flipTime-m.delay)/1.25;m.pivot.rotation.x=m.base+(t>0&&t<1?Math.PI*2*(t*t*(3-2*t)):0)}
    motes.rotation.y=reducedMotion?0:Math.sin(elapsed*.04)*.06;
    composer.render();canvas.dataset.frames=String(Number(canvas.dataset.frames||0)+1);canvas.dataset.ready='true';
    raf=requestAnimationFrame(render);
  }
  function setEnabled(on){
    running=on;cancelAnimationFrame(raf);
    if(on&&!document.hidden){last=performance.now();raf=requestAnimationFrame(render)}
  }
  function pointerMove(e){if(reducedMotion)return;pointer.x=e.clientX/innerWidth*2-1;pointer.y=e.clientY/innerHeight*2-1}
  function visibility(){cancelAnimationFrame(raf);if(running&&!document.hidden){last=performance.now();raf=requestAnimationFrame(render)}}
  const loss=e=>{e.preventDefault();setEnabled(false);onLost()};
  canvas.addEventListener('webglcontextlost',loss);window.addEventListener('pointermove',pointerMove,{passive:true});document.addEventListener('visibilitychange',visibility);
  resize();
  return {
    setEnabled, flip(){if(!reducedMotion)flipTime=elapsed},
    setReducedMotion(value){reducedMotion=value;if(value)pointer={x:0,y:0}},
    dispose(){setEnabled(false);window.removeEventListener('pointermove',pointerMove);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',loss);const materials=new Set(),geometries=new Set(),textures=new Set(generated);scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m)materials.add(m)});materials.forEach(m=>{for(const val of Object.values(m))if(val?.isTexture)textures.add(val);m.dispose()});geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());envTarget.dispose();composer.dispose();renderer.dispose()}
  };
}
