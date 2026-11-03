import {setupTypography} from './typography.mjs';
setupTypography();
const figure=document.querySelector('#hero-scene');
function loadScene(){
  import('./scene3d.mjs').then(({createReuseScene})=>createReuseScene(figure)).catch(()=>{
    figure.dataset.sceneState='fallback';figure.querySelector('[data-scene-status]').textContent='A cena está sendo mostrada como imagem estática. A busca e o catálogo continuam disponíveis.';
    figure.querySelector('[data-scene-shuffle]').disabled=true;figure.querySelector('[data-scene-pause]').disabled=true;figure.querySelectorAll('[data-scene-word]').forEach(node=>node.hidden=true);
    const stage=figure.querySelector('.scene-stage');stage.setAttribute('aria-label','Imagem estática de uma cadeira reutilizável');stage.removeAttribute('tabindex');stage.removeAttribute('aria-describedby');figure.querySelector('.scene-hint').hidden=true;
  });
}
if(figure){if('requestIdleCallback'in window)requestIdleCallback(loadScene,{timeout:900});else setTimeout(loadScene,40);}
