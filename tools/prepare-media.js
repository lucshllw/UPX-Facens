// Asset preparation uses the bundled sharp runtime, with no frontend dependency.
const sharp=require('sharp');
(async()=>{
 const {data,info}=await sharp('assets/reuse-chair-source.jpg').removeAlpha().raw().toBuffer({resolveWithObject:true});
 // Recolor the cyan studio backdrop while preserving the neutral wood.
 for(let i=0;i<data.length;i+=info.channels){const r=data[i],g=data[i+1],b=data[i+2];const mask=Math.max(0,Math.min(1,Math.min(g-r,b-r)/22));if(mask>0){const light=(r+g+b)/3,shade=Math.max(-25,Math.min(5,(light-162)*.2));data[i]=Math.round(r*(1-mask)+(243+shade)*mask);data[i+1]=Math.round(g*(1-mask)+(246+shade)*mask);data[i+2]=Math.round(b*(1-mask)+(241+shade)*mask);}}
 const encoded=await sharp(data,{raw:info}).extract({left:0,top:300,width:1200,height:1450}).resize({height:1000}).png().toBuffer();
 const photo=await sharp(encoded).metadata();
 await sharp({create:{width:1200,height:1000,channels:3,background:'#f3f6f1'}}).composite([{input:encoded,left:Math.round((1200-photo.width)/2),top:0}]).webp({quality:88}).toFile('assets/reuse-hero.webp');
 console.log('Fotografia preparada em assets/reuse-hero.webp.');
})();
