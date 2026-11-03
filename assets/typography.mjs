export function setupTypography(){
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const headings=[...document.querySelectorAll('[data-word-reveal]')];
  for(const heading of headings){
    heading.querySelectorAll('br').forEach(node=>node.after(document.createTextNode(' ')));
    const name=heading.textContent.replace(/\s+/g,' ').trim();heading.setAttribute('aria-label',name);
    const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),texts=[];while(walker.nextNode())texts.push(walker.currentNode);let index=0;
    for(const text of texts){const fragment=document.createDocumentFragment();for(const word of text.textContent.split(/(\s+)/)){if(!word)continue;if(/^\s+$/.test(word)){fragment.append(document.createTextNode(word));continue;}const span=document.createElement('span');span.className='reveal-word';span.textContent=word;span.setAttribute('aria-hidden','true');span.style.setProperty('--word-delay',`${Math.min(index++,12)*55}ms`);fragment.append(span);}text.replaceWith(fragment);}
    heading.querySelectorAll('br').forEach(node=>node.setAttribute('aria-hidden','true'));
  }
  let observer;
  if(!preference.matches&&'IntersectionObserver'in window){observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('words-visible');observer.unobserve(entry.target);}}),{threshold:.12});headings.forEach(node=>{node.classList.add('word-reveal');observer.observe(node);});}
  function revealAll(){headings.forEach(node=>node.classList.add('words-visible'));observer?.disconnect();}
  preference.addEventListener('change',event=>{if(event.matches)revealAll();});
  window.addEventListener('pagehide',event=>{if(!event.persisted)observer?.disconnect();},{once:true});
}
