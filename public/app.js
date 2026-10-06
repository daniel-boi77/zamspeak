const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const langs = ['Bemba', 'Nyanja', 'Tonga', 'Lozi', 'English'];
const phraseCategories = ['All', 'Greetings', 'Travel', 'Market', 'Food', 'Directions', 'Emergency'];
const phrases = [
  {id:'p1',category:'Greetings',language:'Bemba',text:'Muli shani?',meaning:'How are you?',pronunciation:'moo-lee shah-nee?'},
  {id:'p2',category:'Greetings',language:'Nyanja',text:'Moni',meaning:'Hello',pronunciation:'moh-nee'},
  {id:'p3',category:'Greetings',language:'Tonga',text:'Mwayandabotu',meaning:'Thank you',pronunciation:'mwa-yan-da-bo-too'},
  {id:'p4',category:'Greetings',language:'Lozi',text:'Lumela',meaning:'Hello',pronunciation:'loo-meh-la'},
  {id:'p5',category:'Travel',language:'Bemba',text:'Ndekela ku bus station',meaning:'I am going to the bus station',pronunciation:'n-deh-keh-la koo bus station'},
  {id:'p6',category:'Market',language:'Nyanja',text:'Ndingapeze mtengo wake?',meaning:'What is the price?',pronunciation:'ndee-nga-peh-zeh m-ten-go wah-keh?'},
  {id:'p7',category:'Food',language:'Tonga',text:'Ndiinda kuti kulya?',meaning:'Where can I eat?',pronunciation:'n-dee-nda koo-tee koo-lya?'},
  {id:'p8',category:'Directions',language:'Lozi',text:'Ni keni kwatasi?',meaning:'Where is the taxi?',pronunciation:'nee keh-nee kwa-ta-see'},
  {id:'p9',category:'Emergency',language:'English',text:'Please call for help.',meaning:'Please call for help.',pronunciation:''}
];

const legal = {
  agreement:`<div class="legal"><h2>App Use Agreement</h2><p>By using ZamSpeak™, you agree to use it lawfully and respectfully. ZamSpeak is a communication and learning aid, not an official government, emergency, medical, legal, immigration, or translation-certification service. AI responses can be inaccurate; verify important translations with a fluent speaker. You remain responsible for decisions made from responses and for information you choose to share. Do not use ZamSpeak for emergencies. The software is provided as-is. These starter terms should be reviewed by a qualified Zambian lawyer before commercial launch.</p><p>© 2026 Daniel Kalima. ZamSpeak™ is the product name and Daniel Kalima is the developer.</p></div>`,
  privacy:`<div class="legal"><h2>Privacy Policy</h2><p>Your history and favorites are stored locally in this browser. When you use AI translation, the text is sent through the configured AI provider via the ZamSpeak server to generate a response. Do not enter passwords, payment details, national ID numbers, or private information. Voice recognition and speech playback use browser/device features when available; ZamSpeak does not intentionally record audio in this starter build. You can delete local data from Settings.</p></div>`,
  about:`<div class="legal"><h2>About ZamSpeak™</h2><p>ZamSpeak helps visitors, tourists, and people who are not confident in English communicate across Bemba, Nyanja, Tonga, Lozi, and English.</p><p>Designed and developed by Daniel Kalima. Follow <a href="https://instagram.com/dan_iel_777" target="_blank" rel="noreferrer">@dan_iel_777</a>.</p></div>`
};

function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
const state = {
  view: 'home',
  source: localStorage.getItem('zamspeak:source') || 'Bemba',
  target: localStorage.getItem('zamspeak:target') || 'English',
  text: '',
  result: null,
  history: readJSON('zamspeak:history', []),
  favorites: readJSON('zamspeak:favorites', []),
  theme: localStorage.getItem('zamspeak:theme') || 'dark',
  phraseCategory: 'All'
};

const save = () => {
  localStorage.setItem('zamspeak:history', JSON.stringify(state.history));
  localStorage.setItem('zamspeak:favorites', JSON.stringify(state.favorites));
  localStorage.setItem('zamspeak:source', state.source);
  localStorage.setItem('zamspeak:target', state.target);
  localStorage.setItem('zamspeak:theme', state.theme);
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options = selected => langs.map(x => `<option value="${x}" ${x === selected ? 'selected' : ''}>${x}</option>`).join('');
const isFavorite = id => state.favorites.some(x => x.id === id);
const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

function toast(message) {
  const el = $('#toast'); if (!el) return;
  el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2400);
}
function closeDrawer() { $('#drawer')?.classList.remove('open'); $('#backdrop')?.classList.remove('open'); $('#menuBtn')?.setAttribute('aria-expanded','false'); $('#drawer')?.setAttribute('aria-hidden','true'); }
function openDrawer() { $('#drawer')?.classList.add('open'); $('#backdrop')?.classList.add('open'); $('#menuBtn')?.setAttribute('aria-expanded','true'); $('#drawer')?.setAttribute('aria-hidden','false'); }
function setView(view) { state.view = view; render(); closeDrawer(); window.scrollTo({top:0,behavior:'smooth'}); }
function setTheme(theme) { state.theme = theme; document.body.classList.toggle('light', theme === 'light'); $('#themeBtn').textContent = theme === 'dark' ? '☼' : '☾'; save(); }

function render() {
  document.body.classList.toggle('light', state.theme === 'light');
  $('#themeBtn').textContent = state.theme === 'dark' ? '☼' : '☾';
  $$('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  const main = $('#main');
  if (state.view === 'home') main.innerHTML = homeView();
  if (state.view === 'history') main.innerHTML = listView('Translation history', state.history, 'history');
  if (state.view === 'favorites') main.innerHTML = favoritesView();
  if (state.view === 'phrases') main.innerHTML = phraseView();
  if (state.view === 'settings') main.innerHTML = settingsView();
  wireDynamic();
}

function homeView() {
  return `<section class="hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">ZAMBIAN LANGUAGE ASSISTANT</span>
      <h1>Speak your language.<br><em>Understand the world.</em></h1>
      <p>Translate everyday conversations across Bemba, Nyanja, Tonga, Lozi, and English — with a workspace designed for phone and desktop.</p>
      <div class="hero-pills"><span>5 languages</span><span>Voice ready</span><span>Save locally</span></div>
    </div>
    <div class="quick-card">
      <div class="card-kicker"><span>QUICK START</span><span class="mini-status"><i></i>Ready</span></div>
      <button class="quick-item" data-quick="How do I ask for directions politely?"><span>01</span><b>Ask for directions</b><i>↗</i></button>
      <button class="quick-item" data-quick="What is the price?"><span>02</span><b>Ask the price</b><i>↗</i></button>
      <button class="quick-item" data-quick="Teach me a respectful greeting."><span>03</span><b>Learn a greeting</b><i>↗</i></button>
    </div>
  </section>

  <section class="workspace" aria-label="Translation workspace">
    <div class="workspace-head">
      <div><span class="eyebrow">TRANSLATION WORKSPACE</span><h2>Talk to ZamSpeak</h2><p>Write a message below, then translate it into your selected language.</p></div>
      <span class="online-badge"><i></i>AI online when server is running</span>
    </div>
    <div class="language-row">
      <label>From<select id="source">${options(state.source)}</select></label>
      <button id="swap" class="swap-btn" title="Swap languages" aria-label="Swap languages">⇄</button>
      <label>To<select id="target">${options(state.target)}</select></label>
    </div>
    <div class="composer">
      <div class="composer-label"><span>Your message</span><span id="charCount">0</span></div>
      <textarea id="sourceText" maxlength="2000" placeholder="Type a sentence, question, or phrase…">${esc(state.text)}</textarea>
      <div class="composer-tools"><div class="composer-left"><button id="mic" class="tool-btn"><span>◉</span> Speak</button><button id="clear" class="tool-btn">Clear</button></div><button id="translate" class="send-btn" aria-label="Send for translation" title="Translate message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 3.5 10 14.9"/><path d="m21.5 3.5-7.3 17-4.2-5.6-6-4.2 17.5-7.2Z"/></svg></button></div>
    </div>
    <div id="translationArea">${state.result ? resultCard() : `<div class="empty-result"><div class="empty-icon">Z</div><div><strong>Your translation will appear here</strong><p>Enter a message above to start the conversation.</p></div></div>`}</div>
  </section>

  <section class="home-grid">
    <div class="section-block"><div class="section-title"><div><span class="eyebrow">YOUR ACTIVITY</span><h2>Recent translations</h2></div><button class="text-btn" data-view="history">See all →</button></div>${state.history.slice(0,3).map(itemCard).join('') || emptySmall('No translations saved yet.')}</div>
    <div class="section-block"><div class="section-title"><div><span class="eyebrow">STARTER LIBRARY</span><h2>Popular phrases</h2></div><button class="text-btn" data-view="phrases">Open phrasebook →</button></div>${phrases.slice(0,3).map(phraseCard).join('')}</div>
  </section>`;
}

function resultCard() {
  const r = state.result;
  return `<article class="result-card">
    <div class="result-meta"><span class="eyebrow">ZAMSPEAK RESPONSE · ${esc(r.source)} → ${esc(r.target)}</span><button class="icon-mini" id="favoriteResult" title="Save translation">${isFavorite(r.id) ? '★' : '☆'}</button></div>
    <div class="message-bubble"><span class="bubble-label">TRANSLATION</span><p class="translation">${esc(r.translation)}</p></div>
    <div class="explanation"><strong>Context</strong><p>${esc(r.explanation || 'Meaning and context may vary by community and situation.')}</p></div>
    <div class="result-actions"><button class="action-btn" id="speakResult">▶ Hear</button><button class="action-btn" id="copyResult">Copy</button><button class="action-btn" id="shareResult">Share</button><button class="action-btn" id="correct">✓ Correct</button><button class="action-btn" id="needsCorrection">Report correction</button></div>
  </article>`;
}

function itemCard(x) {
  return `<article class="saved-card"><div class="saved-main"><span class="language-chip">${esc(x.source)} → ${esc(x.target)}</span><p class="saved-original">${esc(x.original)}</p><p class="saved-translation">${esc(x.translation)}</p><small>${new Date(x.at || Date.now()).toLocaleString()}</small></div><div class="card-actions"><button class="icon-mini speak-saved" data-id="${esc(x.id)}" title="Hear">▶</button><button class="icon-mini copy-saved" data-id="${esc(x.id)}" title="Copy">⧉</button><button class="icon-mini delete-saved" data-id="${esc(x.id)}" title="Delete">×</button></div></article>`;
}
function emptySmall(text) { return `<div class="empty-small">${esc(text)}</div>`; }
function listView(title, items, kind) {
  return `<section class="page"><span class="eyebrow">YOUR LIBRARY</span><h1 class="page-title">${title}</h1><p class="page-intro">Keep your translations available on this device. Nothing here requires an account.</p><div class="list">${items.length ? items.map(itemCard).join('') : `<div class="empty-result"><div class="empty-icon">${kind === 'history' ? '◷' : '★'}</div><div><strong>No ${kind} yet</strong><p>Your saved items will appear here.</p></div></div>`}</div>${items.length ? `<button id="clearList" class="danger-btn">Clear ${kind}</button>` : ''}</section>`;
}
function favoritesView() {
  return `<section class="page"><span class="eyebrow">YOUR LIBRARY</span><h1 class="page-title">Favorites</h1><p class="page-intro">Your saved translations and useful phrases in one place.</p><div class="list">${state.favorites.length ? state.favorites.map(x => x.kind === 'phrase' ? favoritePhraseCard(x) : itemCard(x)).join('') : `<div class="empty-result"><div class="empty-icon">★</div><div><strong>No favorites yet</strong><p>Save a translation or phrase and it will appear here.</p></div></div>`}</div>${state.favorites.length ? `<button id="clearList" class="danger-btn">Clear favorites</button>` : ''}</section>`;
}
function favoritePhraseCard(x) { return `<article class="saved-card"><div class="saved-main"><span class="language-chip">${esc(x.language)} · ${esc(x.category)}</span><p class="saved-original">${esc(x.text)}</p><p class="saved-translation">${esc(x.meaning)}</p><small>${esc(x.pronunciation || 'Speaker support available')}</small></div><div class="card-actions"><button class="icon-mini speak-phrase" data-text="${esc(x.text)}" title="Hear">▶</button><button class="icon-mini remove-favorite" data-id="${esc(x.id)}" title="Remove">×</button></div></article>`; }

function phraseView() {
  const visible = state.phraseCategory === 'All' ? phrases : phrases.filter(p => p.category === state.phraseCategory);
  return `<section class="page"><span class="eyebrow">VERIFIED STARTER PHRASES</span><h1 class="page-title">Phrasebook</h1><p class="page-intro">Useful everyday phrases separated from AI-generated translations. Confirm important wording with a fluent speaker.</p><div class="category-tabs">${phraseCategories.map(c => `<button class="category-btn ${c === state.phraseCategory ? 'active' : ''}" data-category="${c}">${c}</button>`).join('')}</div><div class="phrase-list">${visible.map(phraseCard).join('')}</div></section>`;
}
function phraseCard(p) { return `<article class="phrase-card"><div class="phrase-main"><div class="phrase-top"><span class="language-chip">${esc(p.language)} · ${esc(p.category)}</span><span>${isFavorite(p.id) ? '★ Saved' : ''}</span></div><p class="phrase-text">${esc(p.text)}</p><p class="phrase-meaning">${esc(p.meaning)}</p><small>${p.pronunciation ? `Pronunciation: ${esc(p.pronunciation)}` : 'Use speaker support where available'}</small></div><div class="phrase-actions"><button class="action-btn speak-phrase" data-text="${esc(p.text)}">▶ Hear</button><button class="action-btn save-phrase" data-id="${p.id}">${isFavorite(p.id) ? '★ Saved' : '☆ Save'}</button></div></article>`; }

function settingsView() {
  return `<section class="page"><span class="eyebrow">PREFERENCES & INFORMATION</span><h1 class="page-title">Settings</h1><div class="settings-grid">
    <div class="settings-card"><div class="settings-icon">◐</div><div><h3>Appearance</h3><p>Choose the visual mode for ZamSpeak.</p><button id="settingsTheme" class="outline-btn">Use ${state.theme === 'dark' ? 'light' : 'dark'} mode</button></div></div>
    <div class="settings-card"><div class="settings-icon">▣</div><div><h3>Saved data</h3><p>History and favorites stay in this browser on this device.</p><button id="deleteData" class="danger-btn">Delete local data</button></div></div>
    <div class="settings-card"><div class="settings-icon">◉</div><div><h3>AI translation</h3><p>Basic navigation, phrasebook, history, and favorites work locally. Online AI translation uses your ZamSpeak Node server.</p><span class="setting-note">Server: localhost:8787</span></div></div>
    <div class="settings-card"><div class="settings-icon">ⓘ</div><div><h3>About & policies</h3><p>Review the documents that govern how ZamSpeak is used.</p><div class="inline-links"><button class="text-btn legal-link" data-page="agreement">App Use Agreement</button><button class="text-btn legal-link" data-page="privacy">Privacy Policy</button><button class="text-btn legal-link" data-page="about">About ZamSpeak</button></div><span class="setting-note">Version 2.0 · Developer Daniel Kalima</span></div></div>
  </div></section>`;
}

async function translate() {
  const input = $('#sourceText'); const button = $('#translate');
  const text = input?.value.trim() || '';
  if (!text) { toast('Type something first.'); input?.focus(); return; }
  state.text = text; button.disabled = true; button.innerHTML = '<span class="spinner"></span>'; 
  try {
    const r = await fetch('/api/translate', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({text,sourceLanguage:state.source,targetLanguage:state.target})});
    const type = r.headers.get('content-type') || '';
    if (!type.includes('application/json')) throw new Error('AI translation needs the Node server. Run npm start for the full online version.');
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Translation failed.');
    state.result = {id:makeId('t'), original:text, source:state.source, target:state.target, translation:data.translation || '', explanation:data.explanation || '', at:Date.now()};
    state.history.unshift(state.result); state.history = state.history.slice(0,50); save(); render(); toast('Translation ready.');
  } catch (e) { toast(e.message || 'Translation failed.'); }
  finally { if ($('#translate')) { $('#translate').disabled = false; $('#translate').innerHTML = '<span>Translate with ZamSpeak</span><b>↗</b>'; } }
}
function speak(text) {
  if (!('speechSynthesis' in window)) { toast('Text-to-speech is not supported here.'); return; }
  speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied to clipboard.'); }
  catch { toast('Copy is unavailable in this browser.'); }
}
async function shareText(text) {
  if (navigator.share) { try { await navigator.share({title:'ZamSpeak translation', text}); return; } catch {} }
  copyText(text);
}
function voice() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) { toast('Voice input is unavailable in this browser. Type instead.'); return; }
  const r = new Recognition(); r.lang = 'en-ZM'; r.interimResults = false; r.maxAlternatives = 1;
  const btn = $('#mic'); if (btn) btn.classList.add('recording');
  r.onresult = e => { state.text = e.results[0][0].transcript; render(); $('#sourceText')?.focus(); };
  r.onerror = () => toast('Microphone permission was denied or voice input is unavailable.');
  r.onend = () => btn?.classList.remove('recording'); r.start();
}
function toggleFavorite(item) {
  const i = state.favorites.findIndex(x => x.id === item.id);
  if (i >= 0) { state.favorites.splice(i,1); toast('Removed from favorites.'); }
  else { state.favorites.unshift({...item}); toast('Saved to favorites.'); }
  save();
}
function openLegal(page) { $('#legalContent').innerHTML = legal[page]; $('#legalDialog').showModal(); closeDrawer(); }

function wireDynamic() {
  const source = $('#source'), target = $('#target');
  if (source) source.onchange = e => { state.source=e.target.value; save(); };
  if (target) target.onchange = e => { state.target=e.target.value; save(); };
  $('#swap')?.addEventListener('click', () => { [state.source,state.target] = [state.target,state.source]; save(); render(); });
  $('#translate')?.addEventListener('click', translate);
  $('#clear')?.addEventListener('click', () => { state.text=''; state.result=null; render(); });
  $('#sourceText')?.addEventListener('input', e => { state.text=e.target.value; const c=$('#charCount'); if(c)c.textContent=`${e.target.value.length}/2000`; });
  if ($('#charCount')) $('#charCount').textContent=`${state.text.length}/2000`;
  $('#mic')?.addEventListener('click', voice);
  $$('.quick-item').forEach(b => b.addEventListener('click', () => { state.text=b.dataset.quick; $('#sourceText').value=state.text; $('#sourceText').focus(); toast('Added to your message.'); }));
  $('#speakResult')?.addEventListener('click', () => speak(state.result.translation));
  $('#copyResult')?.addEventListener('click', () => copyText(state.result.translation));
  $('#shareResult')?.addEventListener('click', () => shareText(state.result.translation));
  $('#favoriteResult')?.addEventListener('click', () => { toggleFavorite(state.result); render(); });
  $('#correct')?.addEventListener('click', () => { localStorage.setItem('zamspeak:last-feedback','correct'); toast('Thanks — marked as correct on this device.'); });
  $('#needsCorrection')?.addEventListener('click', () => { const suggestion=prompt('Enter a suggested translation (optional):'); localStorage.setItem('zamspeak:last-feedback', suggestion ? `correction:${suggestion}` : 'needs-correction'); toast('Thanks — your feedback was saved locally.'); });
  $$('.category-btn').forEach(b => b.addEventListener('click', () => { state.phraseCategory=b.dataset.category; render(); }));
  $$('.save-phrase').forEach(b => b.addEventListener('click', () => { const p=phrases.find(x=>x.id===b.dataset.id); if(p){ toggleFavorite({...p,kind:'phrase'}); render(); } }));
  $$('.speak-phrase').forEach(b => b.addEventListener('click', () => speak(b.dataset.text)));
  $$('.speak-saved').forEach(b => b.addEventListener('click', () => { const x=[...state.history,...state.favorites].find(y=>y.id===b.dataset.id); if(x)speak(x.translation); }));
  $$('.copy-saved').forEach(b => b.addEventListener('click', () => { const x=[...state.history,...state.favorites].find(y=>y.id===b.dataset.id); if(x)copyText(x.translation); }));
  $$('.delete-saved').forEach(b => b.addEventListener('click', () => { state.history=state.history.filter(x=>x.id!==b.dataset.id); state.favorites=state.favorites.filter(x=>x.id!==b.dataset.id); save(); render(); toast('Deleted.'); }));
  $$('.remove-favorite').forEach(b => b.addEventListener('click', () => { state.favorites=state.favorites.filter(x=>x.id!==b.dataset.id); save(); render(); toast('Removed from favorites.'); }));
  $('#clearList')?.addEventListener('click', () => { if(confirm('Clear this list?')) { if(state.view==='history') state.history=[]; else state.favorites=[]; save(); render(); } });
  $('#settingsTheme')?.addEventListener('click', () => { setTheme(state.theme==='dark'?'light':'dark'); render(); });
  $('#deleteData')?.addEventListener('click', () => { if(confirm('Delete all local history and favorites?')) { state.history=[]; state.favorites=[]; save(); render(); toast('Local data deleted.'); } });
  $$('.legal-link').forEach(b => b.addEventListener('click', () => openLegal(b.dataset.page)));
}

document.addEventListener('click', e => {
  const nav = e.target.closest('[data-view]');
  if (nav) setView(nav.dataset.view);
});
$('#menuBtn').addEventListener('click', openDrawer);
$('#closeMenu').addEventListener('click', closeDrawer);
$('#backdrop').addEventListener('click', closeDrawer);
$('#themeBtn').addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
$('#closeDialog').addEventListener('click', () => $('#legalDialog').close());
$('#uiLanguage').addEventListener('change', e => toast(`Interface language set to ${e.target.value}.`));

document.addEventListener('keydown', e => { if(e.key === 'Escape') { closeDrawer(); if($('#legalDialog')?.open) $('#legalDialog').close(); } });

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
render();
