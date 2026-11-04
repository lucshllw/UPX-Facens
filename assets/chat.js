/* Private conversations reuse the existing Java API and local preview storage. */
let chatTimer, chatPolling = false, chatSending = false;
function fromApiMessage(m) {
 return {id:String(m.id),itemId:String(m.itemId),senderName:m.sender.name,senderEmail:m.sender.email,senderId:m.sender.id,receiverName:m.receiver.name,receiverEmail:m.receiver.email,receiverId:m.receiver.id,text:m.content,createdAt:m.createdAt,readAt:m.readAt};
}
function samePerson(a,b) { return normalize(a)===normalize(b); }
function visibleMessages() {
 if(!state.session)return[];
 return state.messages.filter(m=>samePerson(m.senderEmail,state.session.email)||samePerson(m.receiverEmail,state.session.email));
}
function unreadMessages() { return visibleMessages().filter(m=>samePerson(m.receiverEmail,state.session.email)&&!m.readAt); }
function updateMessageBadge() {
 const count=unreadMessages().length;
 $('#message-dot').hidden=!count;
 $('#message-dot').textContent=count>99?'99+':String(count);
 $('#mobile-message-count').hidden=!count;
 $('#mobile-message-count').textContent=count>99?'99+':String(count);
 $('#mobile-inbox').setAttribute('aria-label',count?`Mensagens: ${count} não lidas`:'Minhas mensagens');
}
async function refreshMessages() {
 if(state.mode==='server'&&state.session){
  const account=state.session.email, result=await api('/api/me/messages');
  if(state.session?.email!==account)return;
  state.messages=result.map(fromApiMessage);
 }
 updateMessageBadge();
}
function conversationPeer(m) {
 const own=samePerson(m.senderEmail,state.session?.email);
 return {email:own?m.receiverEmail:m.senderEmail,id:own?m.receiverId:m.senderId,name:own?(m.receiverName||m.receiverEmail):m.senderName};
}
function conversationMessages() {
 return visibleMessages().filter(m=>m.itemId===state.activeItemId&&state.receiver&&(samePerson(m.senderEmail,state.receiver.email)||samePerson(m.receiverEmail,state.receiver.email))).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)||String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
}
async function markActiveConversationRead() {
 if(!state.session||!state.receiver||document.hidden||!$('#item-dialog').open||$('#conversation-section').hidden)return;
 const pending=conversationMessages().filter(m=>samePerson(m.receiverEmail,state.session.email)&&!m.readAt);
 if(!pending.length)return;
 const itemId=state.activeItemId, peer=state.receiver.id;
 if(state.mode==='server')await api(`/api/messages/items/${itemId}/read?peerId=${encodeURIComponent(peer)}`,{method:'POST'});
 const acknowledge=()=>pending.forEach(m=>m.readAt=new Date().toISOString());
 if(state.mode==='local')await localMutation(acknowledge);else acknowledge();
 updateMessageBadge();
}
async function loadItemMessages() {
 const itemId=state.activeItemId, account=state.session?.email;
 if(!account)return;
 try{
  if(state.mode==='server'){
   const result=(await api(`/api/messages/items/${itemId}`)).map(fromApiMessage);
   if(state.session?.email!==account||state.activeItemId!==itemId)return;
   state.messages=state.messages.filter(m=>m.itemId!==itemId).concat(result);
  }
  renderDialogMessages();await markActiveConversationRead();
  $('#chat-connection').textContent=state.mode==='server'?'Atualização automática ativa':'Conversa salva neste navegador';
 }catch(error){$('#chat-connection').textContent='Conexão interrompida. Tentaremos novamente.';setStatus('#chat-status',error.message,'error');}
}
function renderDialogMessages() {
 const item=currentItem();if(!item||!state.session)return;
 const owner=isOwner(item), messages=visibleMessages().filter(m=>m.itemId===item.id), people=new Map();
 if(owner)messages.forEach(m=>{const peer=conversationPeer(m);if(peer.email)people.set(peer.email,peer);});
 const select=$('#conversation-select');select.hidden=!owner||people.size<2;
 const options=[...people.values()].map(p=>`<option value="${escapeHtml(p.email)}">${escapeHtml(p.name)}</option>`).join('');
 if(select.innerHTML!==options)select.innerHTML=options;
 if(owner){if(!state.receiver||!people.has(state.receiver.email))state.receiver=[...people.values()][0]||null;else state.receiver=people.get(state.receiver.email);if(state.receiver)select.value=state.receiver.email;}
 else state.receiver={email:item.ownerEmail,id:item.ownerId,name:item.ownerName};
 $('#conversation-title').textContent=state.receiver?`Conversa com ${state.receiver.name}`:'Conversas deste anúncio';
 const list=conversationMessages(), area=$('#dialog-messages');
 const markup=list.length?list.map(m=>{const own=samePerson(m.senderEmail,state.session.email),time=new Date(m.createdAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});return `<div class="chat-bubble ${own?'own':''}" data-message-id="${escapeHtml(m.id)}"><strong>${escapeHtml(own?'Você':m.senderName)}</strong><p>${escapeHtml(m.text)}</p><small><time datetime="${escapeHtml(m.createdAt)}">${escapeHtml(dateLabel(m.createdAt))} · ${escapeHtml(time)}</time>${own?` <span class="chat-receipt">· ${m.readAt?'Lida':'Enviada'}</span>`:''}</small></div>`;}).join(''):`<p class="chat-empty">${owner?'As conversas com interessados aparecerão aqui.':'Esta é uma conversa privada. Pergunte sobre o objeto e combine a retirada.'}</p>`;
 const key=`${item.id}:${state.receiver?.email||''}`,changed=area.dataset.conversation!==key,nearBottom=area.scrollHeight-area.scrollTop-area.clientHeight<64;
 if(area.innerHTML!==markup){const position=area.scrollTop;area.innerHTML=markup;area.dataset.conversation=key;area.scrollTop=changed||nearBottom?area.scrollHeight:position;}
 $('#chat-form').hidden=owner&&!state.receiver;
 updateMessageBadge();
}
async function contactItem() {
 const id=state.activeItemId;
 if(!requireUser(async()=>{await openItem(id);await contactItem();}))return;
 $('#conversation-section').hidden=false;await loadItemMessages();
 if(!$('#chat-form').hidden)$('#chat-message').focus({preventScroll:true});
 $('#conversation-section').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'nearest'});
 scheduleChatPoll(5000);
}
async function sendMessage(event) {
 event.preventDefault();const item=currentItem();
 if(chatSending||!item||!requireUser(()=>contactItem())||!validate($('#chat-form')))return;
 const field=$('#chat-message'),text=field.value.trim();if(!text)return;
 chatSending=true;const restore=buttonBusy($('#chat-form button'));
 const account=state.session.email,receiver={...state.receiver},itemId=item.id;
 try{
  if(!receiver.email)throw new Error('Escolha uma conversa para responder.');
  if(state.mode==='server')await api('/api/messages',{method:'POST',body:JSON.stringify({itemId:Number(itemId),receiverId:receiver.id,content:text})});
  else await localMutation(()=>state.messages.push({id:`msg-${crypto.randomUUID()}`,itemId,senderName:state.session.name,senderEmail:account,receiverName:receiver.name,receiverEmail:receiver.email,text,createdAt:new Date().toISOString(),readAt:null}));
  if(state.activeItemId!==itemId||state.session?.email!==account||state.receiver?.email!==receiver.email)return;
  if(field.value.trim()===text)field.value='';
  await loadItemMessages();$('#dialog-messages').scrollTop=$('#dialog-messages').scrollHeight;
  setStatus('#chat-status','Mensagem enviada.','success');
 }catch(error){if(state.activeItemId===itemId)setStatus('#chat-status',error.message,'error');}
 finally{chatSending=false;restore();}
}
function renderInbox() {
 const groups=new Map();
 visibleMessages().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).forEach(m=>{
  const peer=conversationPeer(m),key=`${m.itemId}:${peer.email}`;
  if(!groups.has(key))groups.set(key,{latest:m,peer,unread:0});
  if(samePerson(m.receiverEmail,state.session.email)&&!m.readAt)groups.get(key).unread++;
 });
 const markup=[...groups.values()].map(({latest:m,peer,unread})=>{
  const item=state.items.find(i=>i.id===m.itemId);if(!item)return'';
  const photo=itemPhotos(item)[0];
  return `<button type="button" class="inbox-row ${unread?'has-unread':''}" data-inbox-item="${escapeHtml(item.id)}" data-peer-email="${escapeHtml(peer.email)}">${photo?`<img src="${escapeHtml(photo)}" alt="" width="56" height="56">`:icon('chat')}<div><h3>${escapeHtml(peer.name)}</h3><span class="inbox-item-title">${escapeHtml(item.title)}</span><p>${samePerson(m.senderEmail,state.session.email)?'Você: ':''}${escapeHtml(m.text)}</p><small>${escapeHtml(dateLabel(m.createdAt))}</small></div>${unread?`<span class="unread-count" aria-label="${unread} mensagens não lidas">${unread}</span>`:icon('arrow')}</button>`;
 }).join('');
 const area=$('#inbox-list'),content=markup||'<p class="inbox-empty">Suas conversas começam em um anúncio. Toque em “Conversar com anunciante” para combinar os detalhes.</p>';
 if(area.innerHTML!==content){const peer=document.activeElement?.dataset.peerEmail,id=document.activeElement?.dataset.inboxItem;area.innerHTML=content;bindImageErrors(area);if(peer&&id)[...area.querySelectorAll('button')].find(b=>b.dataset.peerEmail===peer&&b.dataset.inboxItem===id)?.focus({preventScroll:true});}
}
async function openInbox() {
 if(!requireUser(openInbox))return;closeDialog('account-dialog');openDialog('inbox-dialog');
 $('#inbox-list').innerHTML='<p class="inbox-empty">Carregando conversas…</p>';
 try{await refreshMessages();renderInbox();scheduleChatPoll(5000);}catch(error){$('#inbox-list').innerHTML=`<p class="form-status error">${escapeHtml(error.message)}</p>`;}
}
function scheduleChatPoll(delay=20000) {
 clearTimeout(chatTimer);if(document.hidden||!state.session||state.mode!=='server')return;
 chatTimer=setTimeout(pollChat,delay);
}
async function pollChat() {
 if(chatPolling||document.hidden||!state.session||state.mode!=='server')return;
 chatPolling=true;
 try{await refreshMessages();if($('#inbox-dialog').open)renderInbox();if($('#item-dialog').open&&!$('#conversation-section').hidden){renderDialogMessages();await markActiveConversationRead();$('#chat-connection').textContent='Atualização automática ativa';}}
 catch{if($('#item-dialog').open)$('#chat-connection').textContent='Sem conexão. Suas mensagens digitadas foram preservadas.';}
 finally{chatPolling=false;scheduleChatPoll($('#inbox-dialog').open||($('#item-dialog').open&&!$('#conversation-section').hidden)?5000:20000);}
}
function setupChat() {
 document.addEventListener('visibilitychange',()=>{clearTimeout(chatTimer);if(!document.hidden){if(state.session)pollChat();}});
 window.addEventListener('online',()=>{if(state.session)pollChat();});
 $('#conversation-select').addEventListener('change',async event=>{
  const peer=visibleMessages().filter(m=>m.itemId===state.activeItemId).map(conversationPeer).find(p=>p.email===event.target.value);
  if(!peer)return;state.receiver=peer;$('#chat-form').reset();setStatus('#chat-status');renderDialogMessages();
  try{await markActiveConversationRead();}catch(error){setStatus('#chat-status',error.message,'error');}
 });
}
