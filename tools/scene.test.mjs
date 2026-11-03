import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../assets/vendor/three.module.min.js';
import {LIMIT,nextObject,pointerTilt,dragIntent,dragRotation,approach} from '../assets/scene-math.mjs';
import {COLLECTION,buildObject,disposeObject} from '../assets/scene-models.mjs';
test('shuffle covers the collection and never immediately repeats',()=>{
  assert.equal(COLLECTION.length,5);
  for(let current=0;current<5;current++){const seen=new Set();for(let i=0;i<=100;i++){const next=nextObject(current,5,()=>i/100);assert(next>=0&&next<5);assert.notEqual(next,current);seen.add(next);}assert.equal(seen.size,4);}
  assert.equal(nextObject(0,1),0);
});
test('normalized pointer stays within eight degrees and returns a neutral center',()=>{
  const rect={left:100,top:50,width:600,height:400};assert.deepEqual(pointerTilt(400,250,rect),{x:0,y:0});
  for(const x of [-100,100,700,2000])for(const y of [-100,50,450,2000]){const tilt=pointerTilt(x,y,rect);assert(Math.abs(tilt.x)<=LIMIT);assert(Math.abs(tilt.y)<=LIMIT);}
});
test('drag intent leaves vertical scrolling to the browser and handles short gestures',()=>{
  assert.equal(dragIntent(2,4),'pending');assert.equal(dragIntent(4,80),'vertical');assert.equal(dragIntent(-90,12),'horizontal');assert.equal(dragIntent(50,60),'vertical');
  assert(Math.abs(dragRotation(0,200,400)-Math.PI*.9)<1e-10);assert.equal(dragRotation(.5,0,0),.5);
});
test('damping is stable across frame rates and settles without overshooting',()=>{
  let sixty=0,thirty=0;for(let i=0;i<60;i++)sixty=approach(sixty,1,1/60);for(let i=0;i<30;i++)thirty=approach(thirty,1,1/30);assert(Math.abs(sixty-thirty)<1e-10);assert(sixty<1&&sixty>.99);
});
test('all models have volume, bounded scale, materials and disposable resources',()=>{
  for(let i=0;i<5;i++){const object=buildObject(i),box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3());assert(Math.abs(Math.max(size.x,size.y,size.z)-2.2)<1e-6);assert(size.x>.4&&size.y>.3&&size.z>.4);assert(box.getCenter(new THREE.Vector3()).length()<1e-6);let meshes=0,disposed=0;const unique=new Set();object.traverse(node=>{if(!node.isMesh)return;meshes++;assert(node.castShadow);if(!unique.has(node.geometry)){unique.add(node.geometry);node.geometry.addEventListener('dispose',()=>disposed++);}});assert(meshes>=5);disposeObject(object);assert.equal(disposed,unique.size);}
});
