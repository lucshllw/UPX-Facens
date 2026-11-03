import * as THREE from './vendor/three.module.min.js';
import {COLLECTION,buildObject,disposeObject} from './scene-models.mjs';
import {LIMIT,clamp,approach,nextObject,pointerTilt,dragIntent,dragRotation,smoothStep} from './scene-math.mjs';

export function createReuseScene(figure, options={}) {
  const stage=figure.querySelector('.scene-stage'),canvas=figure.querySelector('canvas'),fallback=figure.querySelector('.scene-fallback');
  const shuffle=figure.querySelector('[data-scene-shuffle]'),pause=figure.querySelector('[data-scene-pause]');
  const name=figure.querySelector('[data-scene-name]'),story=figure.querySelector('[data-scene-story]'),status=figure.querySelector('[data-scene-status]');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=options.reducedMotion??media.matches,paused=false,visible=true,disposed=false,failed=false,index=0,frame=0,raf=0,last=0,elapsed=0;
  let width=1,height=1,tilt={x:0,y:0},drag=null,yaw=0,targetYaw=0,transition=null;
  let renderer;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,40),pivot=new THREE.Group(),words=new THREE.Group();
  scene.add(pivot);pivot.add(words);let object=buildObject(index);pivot.add(object);
  const labels=[...figure.querySelectorAll('[data-scene-word]')].map((node,i)=>({node,anchor:new THREE.Object3D(),point:new THREE.Vector3(),i}));
  const anchors=[[-1.65,.95,.5],[1.6,.9,-.65],[-1.75,-.22,-.5],[1.72,-.15,.6],[.1,-1.42,.25]];
  labels.forEach((label,i)=>{label.anchor.position.set(...anchors[i]);words.add(label.anchor);});
  const ray=new THREE.Raycaster(),direction=new THREE.Vector3(),cameraPosition=new THREE.Vector3();
  const objectBox=new THREE.Box3(),projected=new THREE.Vector3();
  const hemi=new THREE.HemisphereLight('#fffdf7','#94a693',1.75);scene.add(hemi);
  const key=new THREE.DirectionalLight('#fff7e9',3);key.position.set(-3,6,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;key.shadow.normalBias=.025;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
  const fill=new THREE.DirectionalLight('#e8f0eb',1.1);fill.position.set(4,2,-3);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.ShadowMaterial({color:'#435c49',opacity:.16}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.18;ground.receiveShadow=true;scene.add(ground);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
  const context=shadowCanvas.getContext('2d'),gradient=context.createRadialGradient(64,64,3,64,64,64);gradient.addColorStop(0,'rgba(38,56,43,.23)');gradient.addColorStop(.35,'rgba(38,56,43,.1)');gradient.addColorStop(1,'rgba(38,56,43,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(2.65,2.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=-1.174;scene.add(contact);

  function fallbackMode(message) {
    failed=true;stop();figure.dataset.sceneState='fallback';canvas.hidden=true;fallback.hidden=false;
    labels.forEach(label=>label.node.hidden=true);shuffle.disabled=true;
    shuffle.title='A cena 3D está indisponível';status.textContent=message;stage.setAttribute('aria-label','Imagem estática de uma cadeira reutilizável');stage.removeAttribute('tabindex');updatePause();
    stage.removeAttribute('aria-describedby');figure.querySelector('.scene-hint').hidden=true;
    name.textContent='Cadeira';story.textContent='Uma nova possibilidade de uso.';figure.dataset.sceneObject='Cadeira';
  }
  function updatePause() {
    const frozen=paused||reduced;figure.dataset.sceneMotion=frozen?'paused':'running';
    pause.setAttribute('aria-pressed',String(frozen));pause.setAttribute('aria-label',reduced?'Movimento reduzido ativo':paused?'Retomar animações':'Pausar animações');
    pause.title=reduced?'Movimento reduzido ativo':paused?'Retomar animações':'Pausar animações';pause.disabled=reduced;pause.textContent=frozen?'▷':'Ⅱ';
    document.documentElement.classList.toggle('motion-paused',frozen);
  }
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
  function schedule(){if(!disposed&&!failed&&visible&&!document.hidden&&!document.querySelector('dialog[open]')&&!raf)raf=requestAnimationFrame(tick);}
  function objectBounds(){
    objectBox.setFromObject(object);const min={x:Infinity,y:Infinity},max={x:-Infinity,y:-Infinity};
    for(const x of [objectBox.min.x,objectBox.max.x])for(const y of [objectBox.min.y,objectBox.max.y])for(const z of [objectBox.min.z,objectBox.max.z]){
      projected.set(x,y,z).project(camera);const px=(projected.x*.5+.5)*width,py=(-projected.y*.5+.5)*height;min.x=Math.min(min.x,px);min.y=Math.min(min.y,py);max.x=Math.max(max.x,px);max.y=Math.max(max.y,py);
    }return {min,max};
  }
  function projectWords(){
    const bounds=objectBounds(),small=width<440,rects=[];camera.getWorldPosition(cameraPosition);
    for(const label of labels){
      const {node,anchor,i}=label;if(small&&i>1){node.hidden=true;continue;}node.hidden=false;
      anchor.getWorldPosition(label.point);const distance=label.point.distanceTo(cameraPosition);direction.copy(label.point).sub(cameraPosition).normalize();ray.set(cameraPosition,direction);
      const hit=ray.intersectObject(object,true)[0];const occluded=hit&&hit.distance<distance-.08;label.point.project(camera);
      const size=clamp(1.03-label.point.z*.12+(anchors[i][2]*.065),.88,1.09),w=node.offsetWidth*size,h=node.offsetHeight*size;
      let x=(label.point.x*.5+.5)*width,y=(-label.point.y*.5+.5)*height;
      if(i<4&&y+h/2>bounds.min.y&&y-h/2<bounds.max.y)x=i%2===0?Math.min(x,bounds.min.x-w/2-12):Math.max(x,bounds.max.x+w/2+12);
      x=clamp(x,w/2+5,width-w/2-5);y=clamp(y,h/2+8,height-h/2-8);
      const box={left:x-w/2,right:x+w/2,top:y-h/2,bottom:y+h/2};
      const collides=rects.some(r=>box.left<r.right+6&&box.right>r.left-6&&box.top<r.bottom+8&&box.bottom>r.top-8);
      const covers=i<4&&box.left<bounds.max.x&&box.right>bounds.min.x&&box.top<bounds.max.y&&box.bottom>bounds.min.y;
      node.style.opacity=occluded||collides||covers||label.point.z>1?'0':String((i===0||i===3?1:.92)*(Number(canvas.style.opacity)|| (transition?0:1)));node.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%) rotate(${(pivot.rotation.z*180/Math.PI*.45).toFixed(2)}deg) scale(${size.toFixed(3)})`;
      node.dataset.depth=String(anchors[i][2]);if(!occluded&&!collides&&!covers)rects.push(box);
    }
  }
  function snapshot(){figure.dataset.sceneFrame=String(frame);figure.dataset.sceneObject=COLLECTION[index].name;figure.dataset.sceneRotation=`${pivot.rotation.x.toFixed(4)},${pivot.rotation.y.toFixed(4)},${object.rotation.y.toFixed(4)}`;figure.dataset.sceneVisible=String(visible);figure.dataset.scenePixelRatio=String(renderer?.getPixelRatio()||0);figure.dataset.sceneDrag=drag?.intent||'none';}
  function render(){pivot.updateMatrixWorld(true);renderer.render(scene,camera);projectWords();frame++;snapshot();}
  function replace(next){pivot.remove(object);disposeObject(object);object=buildObject(next);pivot.add(object);index=next;const floor=new THREE.Box3().setFromObject(object).min.y-.06;ground.position.y=floor;contact.position.y=floor+.006;name.textContent=COLLECTION[index].name;story.textContent=COLLECTION[index].story;stage.setAttribute('aria-label',`Explore em 3D: ${COLLECTION[index].name}`);status.textContent=`${COLLECTION[index].name}. ${COLLECTION[index].story}`;yaw=targetYaw=0;tilt={x:0,y:0};}
  function settleTransition(){if(!transition)return;replace(transition.next);transition=null;shuffle.disabled=false;figure.removeAttribute('aria-busy');canvas.style.opacity='1';}
  function tick(time){
    raf=0;if(disposed||failed||!visible||document.hidden||document.querySelector('dialog[open]'))return;
    if(last&&time-last<1000/30-1){schedule();return;}
    const dt=last?Math.min((time-last)/1000,.05):1/60;last=time;const animated=!paused&&!reduced;
    if(animated)elapsed+=dt;
    const rate=drag?.intent==='horizontal'?18:7;
    pivot.rotation.x=reduced?0:approach(pivot.rotation.x,tilt.x,dt,rate);pivot.rotation.y=reduced?0:approach(pivot.rotation.y,tilt.y,dt,rate);
    pivot.rotation.z=animated?Math.sin(elapsed*.5)*.009:0;pivot.position.y=animated?Math.sin(elapsed*.8)*.019:0;
    yaw=reduced||paused?targetYaw:approach(yaw,targetYaw,dt,rate);object.rotation.y=yaw;
    if(transition){transition.time+=dt;const t=transition.time/.24;
      if(transition.phase==='out'){const v=smoothStep(t);canvas.style.opacity=String(1-v);object.scale.setScalar(1-v*.28);object.position.y=-v*.13;if(t>=1){replace(transition.next);transition.phase='in';transition.time=0;}}
      else{const v=smoothStep(t);canvas.style.opacity=String(v);object.scale.setScalar(.72+v*.28);object.position.y=(1-v)*.13;if(t>=1){transition=null;object.scale.setScalar(1);object.position.y=0;shuffle.disabled=false;figure.removeAttribute('aria-busy');canvas.style.opacity='1';}}
    }
    render();const unsettled=Math.abs(yaw-targetYaw)>.0003||Math.abs(pivot.rotation.x-(reduced?0:tilt.x))>.0003||Math.abs(pivot.rotation.y-(reduced?0:tilt.y))>.0003;
    if(animated||transition||unsettled)schedule();else last=0;
  }
  function resize(){
    const bounds=stage.getBoundingClientRect();width=Math.max(1,bounds.width);height=Math.max(1,bounds.height);camera.aspect=width/height;
    const half=Math.min(THREE.MathUtils.degToRad(camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));
    const distance=1.55/Math.sin(half)*1.04;camera.position.set(.43,.29,.86).normalize().multiplyScalar(distance);camera.lookAt(0,-.04,0);camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,width<440?1.5:1.75));renderer.setSize(width,height,false);schedule();
  }
  function changeObject(){if(failed||transition)return;const next=nextObject(index,COLLECTION.length);if(paused||reduced){replace(next);schedule();return;}transition={phase:'out',time:0,next};shuffle.disabled=true;figure.setAttribute('aria-busy','true');schedule();}
  function endPointer(event){if(drag&&event.pointerId!==drag.id)return;if(drag&&stage.hasPointerCapture?.(drag.id))stage.releasePointerCapture(drag.id);drag=null;tilt={x:0,y:0};snapshot();schedule();}
  function down(event){if(event.button!==0||event.isPrimary===false||failed)return;stage.focus({preventScroll:true});drag={id:event.pointerId,type:event.pointerType,x:event.clientX,y:event.clientY,start:targetYaw,intent:'pending'};}
  function move(event){
    if(failed)return;const bounds=stage.getBoundingClientRect();
    if(drag&&event.pointerId===drag.id){const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(drag.intent==='pending')drag.intent=dragIntent(dx,dy);
      if(drag.intent==='vertical'){snapshot();return;}
      if(drag.intent==='horizontal'){if(!stage.hasPointerCapture(event.pointerId))stage.setPointerCapture(event.pointerId);targetYaw=dragRotation(drag.start,dx,bounds.width);if(drag.type!=='mouse')yaw=targetYaw;tilt.y=reduced?0:clamp(dx/bounds.width*LIMIT,-LIMIT,LIMIT);schedule();snapshot();return;}
    }
    if(event.pointerType==='mouse'&&!drag&&!reduced&&!paused){tilt=pointerTilt(event.clientX,event.clientY,bounds);schedule();}
  }
  function leave(event){if(!drag){tilt={x:0,y:0};schedule();}}
  function keyboard(event){
    if(event.target!==stage||failed)return;
    if(['ArrowLeft','ArrowRight','Home'].includes(event.key)){event.preventDefault();targetYaw=event.key==='Home'?0:targetYaw+(event.key==='ArrowRight'?1:-1)*Math.PI/8;if(reduced)yaw=targetYaw;schedule();}
    if(event.key.toLowerCase()==='n'){event.preventDefault();changeObject();}
    if(event.key===' '){event.preventDefault();pause.click();}
  }
  function togglePause(){paused=!paused;if(paused){settleTransition();tilt={x:0,y:0};yaw=targetYaw;pivot.rotation.x=pivot.rotation.y=0;}updatePause();schedule();}
  function motionChange(event){if(options.reducedMotion!==undefined)return;reduced=event.matches;if(reduced)settleTransition();tilt={x:0,y:0};updatePause();schedule();}
  function visibilityChange(){if(document.hidden)stop();else schedule();}
  function contextLost(event){event.preventDefault();fallbackMode('A cena interativa ficou indisponível. Explore o catálogo normalmente.');}
  let intersection,resizeObserver,dialogObserver;
  function destroy(){if(disposed)return;disposed=true;stop();intersection?.disconnect();resizeObserver?.disconnect();dialogObserver?.disconnect();media.removeEventListener('change',motionChange);document.removeEventListener('visibilitychange',visibilityChange);window.removeEventListener('pointerup',endPointer);window.removeEventListener('pointercancel',endPointer);window.removeEventListener('pagehide',pageHide);window.removeEventListener('pageshow',pageShow);shuffle.removeEventListener('click',changeObject);pause.removeEventListener('click',togglePause);for(const [event,handler]of Object.entries({pointerdown:down,pointermove:move,pointerleave:leave,lostpointercapture:endPointer,keydown:keyboard}))stage.removeEventListener(event,handler);canvas.removeEventListener('webglcontextlost',contextLost);disposeObject(scene);renderer?.dispose();}
  function pageHide(event){if(event.persisted)stop();else destroy();}
  function pageShow(){schedule();}
  pause.addEventListener('click',togglePause);media.addEventListener('change',motionChange);
  try{
    if(options.forceFallback)throw new Error('Controlled fallback check');
    const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});if(!gl)throw new Error('WebGL2 unavailable');
    renderer=new THREE.WebGLRenderer({canvas,context:gl,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setClearColor('#ffffff',0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    shuffle.disabled=false;figure.dataset.sceneState='ready';fallback.hidden=true;canvas.hidden=false;replace(0);updatePause();resize();
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
    dialogObserver=new MutationObserver(()=>{if(document.querySelector('dialog[open]'))stop();else schedule();});document.querySelectorAll('dialog').forEach(dialog=>dialogObserver.observe(dialog,{attributes:true,attributeFilter:['open']}));
    intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;figure.dataset.sceneVisible=String(visible);if(visible)schedule();else stop();},{threshold:0});intersection.observe(figure);
    for(const [event,handler]of Object.entries({pointerdown:down,pointermove:move,pointerleave:leave,lostpointercapture:endPointer,keydown:keyboard}))stage.addEventListener(event,handler);
    window.addEventListener('pointerup',endPointer);window.addEventListener('pointercancel',endPointer);document.addEventListener('visibilitychange',visibilityChange);canvas.addEventListener('webglcontextlost',contextLost);shuffle.addEventListener('click',changeObject);window.addEventListener('pagehide',pageHide);window.addEventListener('pageshow',pageShow);
  }catch(error){fallbackMode('Explore o catálogo normalmente. A cena está sendo mostrada como imagem estática.');disposeObject(scene);renderer?.dispose();}
  return {destroy,get state(){return {index,frame,paused,reduced,visible,failed,drag:drag?.intent||'none',rotation:[pivot.rotation.x,pivot.rotation.y,yaw],renderCalls:renderer?.info.render.calls||0,textures:renderer?.info.memory.textures||0,geometries:renderer?.info.memory.geometries||0};}};
}
