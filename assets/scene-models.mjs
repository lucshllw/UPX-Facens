import * as THREE from './vendor/three.module.min.js';

// Original procedural models. Dimensions are illustrative, never listing data.
const material = (color, roughness=.65, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
// Tiny deterministic, original grain maps; no model or texture downloads.
function grain(kind) {
  if(typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const offset=(y*128+x)*4,noise=((x*37+y*73+x*y*11)%97)/97;const value=kind==='wood'?128+Math.sin(x*.3+Math.sin(y*.055)*1.4)*20+noise*8:128+noise*22;pixels.data.set([value,value,value,255],offset);}ctx.putImageData(pixels,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(kind==='wood'?2:5,kind==='wood'?1:5);return texture;
}
const palette = () => {
  const green=new THREE.MeshPhysicalMaterial({color:'#3c7253',roughness:.78,clearcoat:.08,clearcoatRoughness:.6,bumpMap:grain('fabric'),bumpScale:.006});
  const wood=material('#b98e60',.53);wood.bumpMap=grain('wood');wood.bumpScale=.018;
  return {green,dark:material('#254b36',.55),wood,cream:material('#d9d2bf',.46),paper:material('#eee8d9',.92),brass:material('#b19055',.32,.72)};
};
function add(group, geometry, mat, position=[0,0,0], rotation=[0,0,0]) {
  const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(...position);mesh.rotation.set(...rotation);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
}
function rounded(width,height,depth,radius=.08) {
  const s=new THREE.Shape(),x=-width/2,y=-height/2,r=Math.min(radius,width/3,height/3);
  s.moveTo(x+r,y);s.lineTo(x+width-r,y);s.quadraticCurveTo(x+width,y,x+width,y+r);s.lineTo(x+width,y+height-r);s.quadraticCurveTo(x+width,y+height,x+width-r,y+height);s.lineTo(x+r,y+height);s.quadraticCurveTo(x,y+height,x,y+height-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.01,depth-r*.4),bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r*.2,bevelThickness:r*.2,curveSegments:10});g.center();return g;
}
function rod(group,a,b,radius,mat,endRadius=radius) {
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
  const mesh=add(group,new THREE.CylinderGeometry(endRadius,radius,delta.length(),12),mat);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
}
function chair() {
  const g=new THREE.Group(),m=palette();
  add(g,rounded(1.18,1.12,.15,.16),m.green,[0,1.1,0],[-Math.PI/2,0,0]);
  add(g,rounded(1.04,.97,.045,.14),m.dark,[0,1.012,0],[-Math.PI/2,0,0]);
  add(g,rounded(1.18,.93,.12,.2),m.green,[0,1.68,-.49],[-.13,0,0]);
  for(const x of [-1,1])for(const z of [-1,1])rod(g,[x*.55,.05,z*.5],[x*.4,1.07,z*.36],.047,m.wood,.06);
  rod(g,[-.45,.54,-.39],[.45,.54,-.39],.024,m.dark);rod(g,[-.45,.54,.39],[.45,.54,.39],.024,m.dark);
  for(const x of [-1,1])rod(g,[x*.45,.54,-.39],[x*.45,.54,.39],.024,m.dark);
  return g;
}
function lamp() {
  const g=new THREE.Group(),m=palette();
  add(g,new THREE.CylinderGeometry(.5,.54,.09,48),m.dark,[0,.065,0]);
  rod(g,[0,.1,0],[0,1.12,0],.035,m.brass);
  rod(g,[0,1.12,0],[.34,1.64,0],.045,m.green);
  add(g,new THREE.SphereGeometry(.085,16,12),m.brass,[0,1.12,0]);
  const head=new THREE.Group();head.position.set(.34,1.67,0);head.rotation.z=-.24;g.add(head);
  add(head,new THREE.CylinderGeometry(.23,.5,.45,48,1,true),m.green,[0,0,0]);
  add(head,new THREE.CircleGeometry(.475,48),m.cream,[0,-.218,0],[Math.PI/2,0,0]);
  add(head,new THREE.SphereGeometry(.11,20,12),material('#fff4c8'),[0,-.21,0]);
  add(g,new THREE.CylinderGeometry(.11,.11,.12,24),m.green,[0,.17,0]);
  return g;
}
function books() {
  const g=new THREE.Group(),m=palette();let y=.09;
  for(const [w,d,h,angle,mat] of [[1.48,1.04,.24,-.1,m.green],[1.3,.97,.19,.08,m.cream],[1.4,1.03,.29,-.04,m.dark],[1.25,.94,.16,.17,m.wood]]) {
    const book=new THREE.Group();book.position.y=y+h/2;book.rotation.y=angle;g.add(book);
    add(book,rounded(w,h-.04,d-.055,.025),m.paper);
    add(book,rounded(w+.035,.025,d+.035,.012),mat,[0,h/2,0]);add(book,rounded(w+.035,.025,d+.035,.012),mat,[0,-h/2,0]);
    add(book,rounded(.045,h,d+.025,.012),mat,[-w/2,0,0]);
    for(let i=0;i<3;i++)add(book,new THREE.BoxGeometry(w*.86,.003,.003),m.cream,[.02,-h*.25+i*h*.23,d/2-.025]);
    y+=h+.035;
  }
  return g;
}
function vase() {
  const g=new THREE.Group(),m=palette();
  const profile=[[.24,.03],[.38,.1],[.5,.36],[.5,.64],[.37,.93],[.2,1.16],[.2,1.34],[.18,1.36],[.165,1.32],[.165,1.18]].map(([x,y])=>new THREE.Vector2(x,y));
  add(g,new THREE.LatheGeometry(profile,48),m.cream);
  rod(g,[0,.6,0],[.1,2.12,0],.012,m.dark);
  rod(g,[.06,1.65,0],[-.29,1.94,.03],.009,m.dark);
  for(const [x,y,z,angle] of [[-.28,1.94,.03,-.65],[.23,1.8,0,.75],[.1,2.12,0,.25]]) {
    const leaf=add(g,new THREE.SphereGeometry(1,20,12),m.green,[x,y,z],[0,0,angle]);leaf.scale.set(.13,.26,.025);
  }
  add(g,new THREE.TorusGeometry(.188,.02,8,48),m.wood,[0,1.35,0],[Math.PI/2,0,0]);
  return g;
}
function table() {
  const g=new THREE.Group(),m=palette();
  add(g,new THREE.CylinderGeometry(.78,.78,.11,64),m.wood,[0,1.05,0]);
  add(g,new THREE.CylinderGeometry(.62,.65,.055,48),m.dark,[0,.972,0]);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3+.3;rod(g,[Math.cos(a)*.63,.03,Math.sin(a)*.63],[Math.cos(a)*.42,.94,Math.sin(a)*.42],.05,m.green,.065);}
  return g;
}
export const COLLECTION = [
  {name:'Cadeira',story:'Um lugar para novas conversas.',build:chair},
  {name:'Luminária',story:'Uma nova luz para o seu canto.',build:lamp},
  {name:'Livros',story:'Histórias que merecem continuar.',build:books},
  {name:'Vaso',story:'Espaço para uma ideia florescer.',build:vase},
  {name:'Mesa pequena',story:'Novos encontros à sua volta.',build:table}
];
export function buildObject(index) {
  const group=COLLECTION[index].build();group.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(group),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  const scale=2.2/Math.max(size.x,size.y,size.z);group.scale.setScalar(scale);group.position.set(-center.x*scale,-center.y*scale,-center.z*scale);
  const holder=new THREE.Group();holder.add(group);holder.userData.radius=box.getBoundingSphere(new THREE.Sphere()).radius*scale;return holder;
}
export function disposeObject(root) {
  const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.material)for(const m of [node.material].flat()){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
  geometries.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());
}
