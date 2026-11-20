import { initialState, validateState, moveReading, toggleBookmark } from './state.mjs';

const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  book: '<path d="M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
  headphones: '<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 13h4v8H4a1 1 0 0 1-1-1Zm18 0h-4v8h3a1 1 0 0 0 1-1Z"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  settings: '<path d="M4 7h16M4 17h16M8 4v6m8 4v6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  play: '<path d="m9 5 11 7-11 7Z"/>',
  pause: '<path d="M8 5v14m8-14v14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  down: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  leaf: '<path d="M20 3C8 2 2 8 5 15c6 8 16 0 15-12ZM3 22 16 9"/>',
  car: '<path d="m5 5-3 8v6h3v-3h14v3h3v-6l-3-8Zm-3 8h20M6 13V9h12v4M6 16h1m10 0h1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
  queue: '<path d="M3 5h18M3 11h18M3 17h10m4-2 5 3-5 3Z"/>',
};

const icon = (name, extra = '') => `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
const time = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const sampleTitles = ['ठहरकर देखना', 'ध्यान से सुनना', 'विचार से व्यवहार तक'];
const sampleText = [
  'किसी परिचित रास्ते पर चलते हुए हम अक्सर आसपास की छोटी बातों पर ध्यान नहीं देते। एक क्षण ठहरकर देखना, अपने अनुभव को अधिक स्पष्टता से समझने की शुरुआत हो सकता है।',
  'जब कोई अपनी बात कह रहा हो, तो उत्तर सोचने से पहले उसकी पूरी बात सुनने का अभ्यास करें। सुनने के लिए समय देना, समझने के लिए जगह बनाना है।',
  'किसी विचार को समझ लेना और उसे अपने व्यवहार में उतारना अलग अनुभव हैं। दिन की एक छोटी घटना पर लौटकर देखें: आपने क्या देखा, कैसे प्रतिक्रिया दी, और अगली बार क्या बदलना चाहेंगे?',
];
let storageAvailable = true;
let state;
try {
  const saved = localStorage.getItem('shrutdhara-demo-v1');
  state = saved ? validateState(JSON.parse(saved)) : initialState();
} catch {
  state = initialState();
  storageAvailable = false;
}

let route = 'home';
let playing = false;
let driving = false;
let sleepAt = null;
let filter = '';
let toastTimer;
let dialogOpener;
let positionRevision = 0;
let restoringPosition = false;
const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');

function save() {
  try {
    localStorage.setItem('shrutdhara-demo-v1', JSON.stringify(state));
  } catch {
    if (storageAvailable) toast('इस ब्राउज़र में प्रगति सहेजी नहीं जा सकी। बैकअप निर्यात करें।');
    storageAvailable = false;
  }
}

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 4500);
}

function art(className = '') {
  return `<svg class="line-art ${className}" viewBox="0 0 360 270" fill="none" aria-hidden="true">
    <path d="M51 254V130a129 129 0 0 1 258 0v124M71 254V131a109 109 0 0 1 218 0v123M91 254V132a89 89 0 0 1 178 0v122" stroke="currentColor" opacity=".3"/>
    <path d="M180 220v-80m0 57c-45 0-66-24-63-51 30-1 57 13 63 39m0 0c6-26 33-40 63-39 3 27-18 51-63 51m0-28c-23-17-30-41 0-72 30 31 23 55 0 72Z" stroke="currentColor" stroke-width="1.4"/>
    <path d="M132 229h96M117 238h126M104 247h152" stroke="currentColor"/><circle cx="180" cy="78" r="3" fill="currentColor"/>
  </svg>`;
}

function sidebar() {
  const links = [['home', 'home', 'My journey'], ['library', 'book', 'आगम संग्रह'], ['listen', 'headphones', 'श्रवण यात्रा'], ['bookmarks', 'bookmark', 'Bookmarks']];
  return `<aside class="sidebar">
    <a class="brand" href="#home" aria-label="श्रुतधारा मुख्य पृष्ठ"><span class="brand-mark">${icon('leaf')}</span><span>श्रुतधारा<small>SHRUTDHARA</small></span></a>
    <div class="nav-label">YOUR SPACE</div>
    <nav aria-label="मुख्य नेविगेशन">${links.map(([id, symbol, text]) => `<a href="#${id}" class="nav-link ${route === id || (route === 'reader' && id === 'library') ? 'active' : ''}" ${route === id ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${text}</span>${id === 'bookmarks' && state.bookmarks.length ? `<small>${state.bookmarks.length}</small>` : ''}</a>`).join('')}</nav>
    <div class="sidebar-bottom"><div class="quiet-note">${icon('leaf')}<p>थोड़ा पढ़ें। गहरा समझें।<br><span>अपनी गति से आगे बढ़ें।</span></p></div><a href="#settings" class="nav-link ${route === 'settings' ? 'active' : ''}">${icon('settings')}Settings</a><div class="privacy-line">${icon('lock')} निजी · बिना विज्ञापन</div></div>
  </aside>`;
}

function header() {
  const labels = { home: 'My journey', library: 'आगम संग्रह', reader: 'पठन यात्रा', listen: 'श्रवण यात्रा', bookmarks: 'Bookmarks', settings: 'Settings' };
  return `<header class="topbar"><span class="breadcrumb">Your space <span>/</span> <b>${labels[route]}</b></span><div class="top-actions"><span class="prototype-label">Prototype</span><button class="icon-button" data-action="about" aria-label="प्रोटोटाइप के बारे में">${icon('info')}</button></div></header>`;
}

function home() {
  return `<section class="welcome"><div><div class="eyebrow">ज्ञान की एक शांत यात्रा</div><h1>हर दिन, थोड़ा आत्मचिंतन।</h1><p>पढ़ें, सुनें और समझें। अपनी गति से, अपने लिए।</p></div><div class="date-note">${icon('sun')}<span>आज का समय<br><b>कुछ पल अपने लिए</b></span></div></section>
    <section class="hero"><div class="hero-copy"><span class="eyebrow">श्रुतधारा · श्रवण और मनन</span><h2>ज्ञान से जुड़ें।<br>जीवन में उतरने दें।</h2><p>जैन आगमों की पठन और श्रवण यात्रा—<br>सरल हिन्दी में, एक अध्याय के साथ।</p><button class="button light" data-route="library">Explore the collection ${icon('arrow')}</button><span class="hero-foot">शांत अनुभव। कोई दौड़ नहीं।</span></div>${art()}<span class="hero-number">01 / एक नई शुरुआत</span></section>
    <div class="section-heading"><h2>जहाँ छोड़ा था, वहीं से</h2><span>TWO JOURNEYS, YOUR PACE</span></div>
    <section class="journey-grid"><article class="journey reading-card"><div class="card-top"><span class="square-icon">${icon('book')}</span><span class="pill">पठन यात्रा</span></div><h3>एक सूत्र, एक ठहराव।</h3><p>मूल पाठ, अर्थ और सरल व्याख्या के लिए<br>एक सहज पढ़ने का स्थान।</p><div class="journey-position"><span>आचारांग सूत्र · नमूना अध्याय</span><b>नमूना अंश ${state.reading + 1} / 3</b></div><div class="progress-track"><i style="width:${(state.reading + 1) / 3 * 100}%"></i></div><button class="text-button" data-route="reader">Continue reading ${icon('arrow')}</button></article>
    <article class="journey listening-card"><div class="card-top"><span class="square-icon">${icon('headphones')}</span><span class="pill">श्रवण यात्रा</span></div><h3>सुनें। समझें। मनन करें।</h3><p>पूरे अध्याय को जोड़ती हिन्दी व्याख्या का<br>एक सुकून भरा सुनने का अनुभव।</p><div class="journey-position"><span>आचारांग सूत्र · नमूना अध्याय</span><b>${time(state.listening)} / 22:00</b></div><div class="progress-track"><i style="width:${state.listening / 1320 * 100}%"></i></div><button class="text-button" data-route="listen">Explore listening ${icon('arrow')}</button></article></section>
    <section class="collection-preview"><div><div class="eyebrow">आपका आगम संग्रह</div><h2>एक अध्याय से शुरुआत।</h2><p>दीर्घकालीन लक्ष्य: ३२ आगम। अभी अनुभव के लिए नमूना सामग्री।</p><a class="text-button" href="#library">View collection ${icon('arrow')}</a></div><div class="book-spine"><span>आचारांग सूत्र</span><small>पठन · श्रवण</small>${icon('leaf')}</div></section>
    <div class="content-note">${icon('info')}<p>यह अनुभव का नमूना है। पाठ शास्त्रीय उद्धरण नहीं है और ऑडियो प्लेबैक सिम्युलेटेड है। <button data-action="sources">Sources & review</button></p></div>`;
}

function library() {
  return `<div class="page-title"><div class="eyebrow">पठन और श्रवण</div><h1>आगम संग्रह</h1><p>जो उपलब्ध है, उसे जानकर अपनी यात्रा चुनें।</p></div>
    <label class="search-box">${icon('search')}<input id="search" type="search" placeholder="आगम, अध्याय या विषय खोजें" aria-label="संग्रह में खोजें" value="${escapeHtml(filter)}"></label>
    <div class="library-tabs"><span class="selected">सभी आगम</span><span>दीर्घकालीन लक्ष्य · ३२ आगम</span></div>
    <div id="library-results">${libraryResults()}</div>
    <div class="content-note">${icon('info')}<p>प्रामाणिक क्रम और अध्याय-संरचना का सत्यापन शेष है। यहाँ ३२ आगमों की अप्रमाणित सूची नहीं दिखाई गई है।</p></div>`;
}

function libraryResults() {
  if (filter.trim() && !'आचारांग सूत्र acharanga नमूना अध्याय चिंतन'.includes(filter.trim().toLowerCase())) return `<div class="empty">${icon('search')}<h2>कोई परिणाम नहीं मिला</h2><p>आचारांग या नमूना अध्याय खोजें। खोज केवल इस प्रोटोटाइप के संग्रह में है।</p><button class="button secondary" data-action="clear-search">Clear search</button></div>`;
  return `<article class="scripture-card"><div class="scripture-art">${art()}<span>आचारांग<br><small>सूत्र</small></span></div><div class="scripture-details"><span class="pill amber">अनुभव हेतु नमूना</span><h2>आचारांग सूत्र</h2><p>पहले आगम से पठन और श्रवण यात्रा की प्रस्तावित शुरुआत।</p><div class="availability"><span>${icon('book')} ३ नमूना अंश</span><span>${icon('headphones')} सिम्युलेटेड श्रवण</span></div><button class="text-button" data-action="sources">Sources & review ${icon('arrow')}</button></div></article>
    <div class="section-heading"><h2>अध्याय और उपलब्धता</h2><span>नमूना संरचना</span></div>
    <article class="chapter-row"><span class="chapter-index">01</span><div><h3>नमूना अध्याय · अध्ययन का अनुभव</h3><p>पठन के ३ अंश · श्रवण नियंत्रण का डेमो</p><div class="availability"><span class="status-dot">स्थानीय नमूना पाठ</span><span>ऑडियो रिकॉर्डिंग उपलब्ध नहीं</span></div></div><div class="chapter-actions"><button class="button secondary" data-route="reader">${icon('book')} पढ़ें</button><button class="button" data-route="listen">${icon('headphones')} डेमो देखें</button></div></article>
    <article class="chapter-row unavailable"><span class="chapter-index">02</span><div><h3>आगे के अध्याय</h3><p>स्रोत चयन, अधिकार और समीक्षा के बाद जोड़े जाएँगे।</p></div><button class="text-button" data-action="unavailable">अभी उपलब्ध नहीं ${icon('info')}</button></article>`;
}

function reader() {
  const id = state.reading;
  return `<div class="reader-top"><a href="#library" class="text-button">${icon('back')} संग्रह</a><div class="reader-tools"><button class="icon-button" data-action="sources" aria-label="स्रोत और समीक्षा">${icon('info')}</button><button class="icon-button" data-action="reading-settings" aria-label="Reading preferences">Aa</button><button class="icon-button ${state.bookmarks.includes(id) ? 'is-saved' : ''}" data-action="bookmark" aria-label="${state.bookmarks.includes(id) ? 'बुकमार्क हटाएँ' : 'बुकमार्क जोड़ें'}" aria-pressed="${state.bookmarks.includes(id)}">${icon('bookmark')}</button></div></div>
    <div class="reader-heading"><span class="eyebrow">आचारांग सूत्र · नमूना अध्याय</span><h1>पठन यात्रा</h1><p>अंश ${id + 1} / 3 <span>·</span> नमूना संदर्भ DEMO-${id + 1}</p></div>
    <div class="reading-layout"><aside class="reading-outline"><span class="eyebrow">इस नमूने में</span>${sampleTitles.map((title, i) => `<button data-read="${i}" class="${i === id ? 'current' : ''}"><span>0${i + 1}</span>${title}</button>`).join('')}<div class="outline-note">मूल सूत्र और प्रामाणिक क्रम अभी शामिल नहीं हैं।</div></aside>
    <article class="reading-paper" style="--reading-size:${state.font}px"><div class="sample-banner">इंटरफ़ेस नमूना · यह मूल सूत्र या उसका अनुवाद नहीं है</div><span class="passage-number">0${id + 1}</span><h2>${sampleTitles[id]}</h2><div class="original-placeholder"><span class="eyebrow">मूल पाठ</span><p>सत्यापित मूल सूत्र यहाँ प्रस्तुत होगा।</p><button class="text-button" data-action="sources">सत्यापन की स्थिति ${icon('arrow')}</button></div>
    ${state.meaning ? `<section class="passage-section"><h3>अर्थ का स्थान <small>नमूना लेखन</small></h3><p>${sampleText[id]}</p></section>` : ''}
    ${state.explanation ? `<section class="passage-section explanation"><h3>${icon('leaf')} सरल व्याख्या का स्थान</h3><p>पढ़ने का यह स्थान आपको एक विचार के साथ कुछ समय बिताने देता है। जल्दी आगे बढ़ना आवश्यक नहीं है। चाहें तो पाठ दोबारा पढ़ें या अपनी सुविधा से अगले अंश पर जाएँ।</p><p>लंबा अंश पढ़ते समय इसी पृष्ठ में नीचे स्क्रॉल करें। अगला अंश अपने आप नहीं खुलेगा। इससे बड़े अक्षरों में पढ़ते हुए कोई पंक्ति छूटने का जोखिम कम होता है।</p>${id === 2 ? `<p>${sampleText[0]} ${sampleText[1]}</p><p>ये अनुच्छेद केवल लंबे पाठ और अक्षर आकार का अनुभव जाँचने के लिए हैं। किसी जैन आगम की शिक्षा, व्याख्या या प्रामाणिक अनुवाद के रूप में इन्हें न पढ़ें।</p>` : ''}</section>` : ''}
    ${!state.meaning && !state.explanation ? '<p class="muted">अर्थ और व्याख्या छिपे हैं। Aa विकल्प से उन्हें फिर दिखाएँ।</p>' : ''}
    <div class="reading-end"><span>एक पल ठहरें। फिर अपनी गति से आगे बढ़ें।</span>${icon('leaf')}</div><div class="passage-navigation"><button class="button secondary" data-action="prev" ${id === 0 ? 'disabled' : ''}>${icon('back')} पिछला अंश</button><button class="button" data-action="next">${id === 2 ? 'आगे की उपलब्धता' : 'अगला अंश'} ${icon('arrow')}</button></div></article></div>`;
}

function listen() {
  return `<div class="page-title"><div class="eyebrow">आँखों को आराम, विचारों को विस्तार</div><h1>श्रवण यात्रा</h1><p>एक अध्याय की शिक्षाओं को एक साथ समझने का स्थान।</p></div>
    <div class="listening-layout"><section class="player-card"><div class="audio-art">${art()}<div class="audio-art-title"><span>श्रवण एवं मनन</span><h2>आचारांग सूत्र</h2><p>हिन्दी में अध्याय की व्याख्या</p></div></div><div class="player-body"><div class="player-title"><div><span class="eyebrow">नमूना अध्याय</span><h2>अध्ययन का अनुभव</h2></div><button class="icon-button" data-action="sources" aria-label="ऑडियो स्रोत और समीक्षा">${icon('info')}</button></div><div class="simulation-note"><span class="pulse-dot"></span>Playback preview · no audio recording</div><label class="sr-only" for="seek">श्रवण स्थिति</label><input id="seek" class="seek" type="range" min="0" max="1320" value="${state.listening}" aria-valuetext="${time(state.listening)}"><div class="time-labels"><span id="elapsed">${time(state.listening)}</span><span id="remaining">${time(1320 - state.listening)} शेष</span></div><div class="playback-controls"><button class="icon-button speed" data-action="speed" aria-label="Playback speed">${state.speed}×</button><button class="skip-control" data-skip="-15" aria-label="15 सेकंड पीछे">↶<small>15</small></button><button class="play-button" data-action="play" aria-label="${playing ? 'Pause preview' : 'Play preview'}">${icon(playing ? 'pause' : 'play')}</button><button class="skip-control" data-skip="15" aria-label="15 सेकंड आगे">↷<small>15</small></button><button class="icon-button" data-action="sleep" aria-label="Sleep timer">${icon('clock')}</button></div><div class="player-footer">${icon('lock')} श्रवण प्रगति पठन से अलग सहेजी जाती है</div></div></section>
    <aside class="listening-aside"><section class="queue-panel"><div class="section-heading"><h2>Up next</h2>${icon('queue')}</div><div class="queue-item"><span class="queue-number">01</span><div><b>अध्ययन का अनुभव</b><p>नमूना अध्याय · 22:00 डेमो</p></div>${icon('headphones')}</div><div class="queue-item dim"><span class="queue-number">02</span><div><b>आगे के अध्याय</b><p>अभी उपलब्ध नहीं</p></div>${icon('lock')}</div><label class="switch-row"><span>Autoplay next chapter</span><input id="autoplay" type="checkbox" role="switch" ${state.queue ? 'checked' : ''}></label><p class="small-note">इस डेमो में एक ही अध्याय है। अंत में प्लेबैक रुकेगा; अनुपलब्ध सामग्री छोड़ी नहीं जाएगी।</p></section><section class="driving-panel">${icon('car')}<h2>सफ़र के लिए तैयार?</h2><p>शुरू करने से पहले अध्याय चुनें। बड़े ऑडियो नियंत्रणों के साथ फ़ोन अलग रख दें।</p><button class="button secondary" data-action="driving">Driving mode ${icon('arrow')}</button><small>इंटरफ़ेस डेमो · Android कार नियंत्रण जाँचे नहीं गए हैं</small></section></aside></div>`;
}

function bookmarks() {
  return `<div class="page-title"><div class="eyebrow">फिर लौटकर पढ़ने के लिए</div><h1>Bookmarks</h1><p>सहेजे हुए अंश, यहीं मिलेंगे।</p></div>${state.bookmarks.length ? state.bookmarks.map(id => `<article class="chapter-row"><span class="square-icon">${icon('bookmark')}</span><div><h3>${sampleTitles[id]}</h3><p>आचारांग सूत्र · नमूना अंश ${id + 1} · DEMO-${id + 1}</p></div><div class="chapter-actions"><button class="button secondary" data-read="${id}">पढ़ें ${icon('arrow')}</button><button class="icon-button" data-remove="${id}" aria-label="${sampleTitles[id]} का बुकमार्क हटाएँ">${icon('close')}</button></div></article>`).join('') : `<div class="empty">${icon('bookmark')}<h2>एक विचार के पास लौटें।</h2><p>पढ़ते समय बुकमार्क चिह्न चुनें। सहेजे हुए अंश यहाँ दिखाई देंगे।</p><button class="button" data-route="reader">पठन यात्रा खोलें ${icon('arrow')}</button></div>`}`;
}

function settings() {
  return `<div class="page-title"><div class="eyebrow">अपनी सुविधा से</div><h1>Make it your space.</h1><p>सरल विकल्प। आपका नियंत्रण।</p></div><section class="settings-panel"><h2>Reading preferences</h2>${readingSettings()}<h2>Your progress, kept private</h2><p>इस ब्राउज़र में दोनों यात्राएँ और बुकमार्क सहेजे जाते हैं। ब्राउज़र का डेटा हटने पर ये मिट सकते हैं।</p><div class="settings-actions"><button class="button" data-action="export">${icon('down')} Export backup</button><button class="button secondary" data-action="import">Restore backup</button></div><p class="small-note">केवल इस प्रोटोटाइप का बैकअप समर्थित है। पुनर्स्थापना मौजूदा प्रगति की जगह लेगी।</p><h2>About this prototype</h2><p>कोई मूल सूत्र, सत्यापित अनुवाद या ऑडियो रिकॉर्डिंग प्रकाशित नहीं है। यह नमूना आपके पढ़ने और सुनने के अनुभव को जाँचने के लिए है।</p><button class="text-button" data-action="sources">स्रोत और समीक्षा स्थिति ${icon('arrow')}</button></section>`;
}

function readingSettings() {
  return `
    <div class="setting-row">
      <label for="reading-font">Reading font · पठन का फ़ॉन्ट</label>
      <select id="reading-font" aria-label="Reading font">
        ${[['noto', 'Noto Serif Devanagari'], ['mukta', 'Mukta'], ['hind', 'Hind']].map(([id, name]) => `<option value="${id}" ${state.fontFamily === id ? 'selected' : ''}>${name}</option>`).join('')}
      </select>
    </div>
    <p class="font-sample" lang="hi">ज्ञान की एक शांत यात्रा। पढ़ें, समझें और स्वयं चिंतन करें।</p>
    <a href="/fonts.html" class="text-button" target="_blank" rel="noopener" lang="en">Compare all three fonts ${icon('arrow')}</a>
    <div class="setting-row">
      <span>Text size · अक्षर आकार</span>
      <div class="segmented">
        ${[19, 21, 24, 27].map((size, i) => `<button data-font="${size}" aria-label="अक्षर आकार ${size}" aria-pressed="${state.font === size}" class="${state.font === size ? 'selected' : ''}" style="font-size:${14 + i * 2}px">अ</button>`).join('')}
      </div>
    </div>
    <label class="switch-row"><span>अर्थ दिखाएँ</span><input type="checkbox" data-setting="meaning" ${state.meaning ? 'checked' : ''}></label>
    <label class="switch-row"><span>सरल व्याख्या दिखाएँ</span><input type="checkbox" data-setting="explanation" ${state.explanation ? 'checked' : ''}></label>
    <div class="setting-row">
      <span>Reading theme</span>
      <div class="segmented">
        <button data-theme="paper" class="${state.theme === 'paper' ? 'selected' : ''}" aria-pressed="${state.theme === 'paper'}">Paper</button>
        <button data-theme="night" class="${state.theme === 'night' ? 'selected' : ''}" aria-pressed="${state.theme === 'night'}">Night</button>
      </div>
    </div>`;
}

function render() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.readingFont = state.fontFamily;
  const views = { home, library, reader, listen, bookmarks, settings };
  app.innerHTML = `${sidebar()}<div class="workspace">${header()}<main id="main" tabindex="-1">${views[route]()}</main><footer class="page-footer"><span>श्रुतधारा <span>·</span> ज्ञान, अपनी गति से।</span><button data-action="about">बिना खाता · बिना विज्ञापन</button></footer></div><nav class="mobile-nav" aria-label="मोबाइल नेविगेशन">${[['home', 'home', 'Home'], ['library', 'book', 'Collection'], ['listen', 'headphones', 'Listen'], ['bookmarks', 'bookmark', 'Bookmarks'], ['settings', 'settings', 'Settings']].map(([id, symbol, label]) => `<a href="#${id}" ${route === id ? 'aria-current="page"' : ''} class="${route === id ? 'active' : ''}">${icon(symbol)}<span>${label}</span></a>`).join('')}</nav>`;
  syncMiniPlayer();
  markEnglishLabels(app);
}

function markEnglishLabels(root) {
  for (const element of root.querySelectorAll('a, button, span, small, h1, h2, label, option')) {
    const text = element.textContent.trim() || element.getAttribute('aria-label') || '';
    if (/[A-Za-z]/.test(text) && !/[\u0900-\u097f]/.test(text)) element.lang = 'en';
  }
}

function syncMiniPlayer() {
  if (route === 'listen') return;
  if (!document.querySelector('.mini-player') && playing) {
    app.insertAdjacentHTML('beforeend', `
      <section class="mini-player" aria-label="Listening preview controls">
        ${icon('headphones')}
        <button class="mini-title" data-route="listen">
          <span>अध्ययन का अनुभव</span>
          <small>Playback preview · <span id="mini-time">${time(state.listening)}</span></small>
        </button>
        <button class="icon-button" data-action="play" aria-label="Pause preview">${icon('pause')}</button>
        <button class="icon-button" data-action="dismiss-player" aria-label="Close listening preview">${icon('close')}</button>
      </section>`);
  }
  const miniTime = document.querySelector('#mini-time');
  if (miniTime) miniTime.textContent = time(state.listening);
}

function openDialog(title, content, wide = false) {
  if (!dialog.open) dialogOpener = document.activeElement?.dataset.action;
  dialog.className = wide ? 'wide' : '';
  dialog.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-action="close" aria-label="Close">${icon('close')}</button></div>${content}`;
  markEnglishLabels(dialog);
  if (!dialog.open) dialog.showModal();
}

function refreshPreferences(selector) {
  const offset = window.scrollY;
  render();
  if (dialog.open) openDialog('Reading preferences', readingSettings());
  const scope = dialog.open ? dialog : app;
  scope.querySelector(selector)?.focus({ preventScroll: true });
  window.scrollTo({ top: offset, behavior: 'instant' });
}

function sources() {
  openDialog('Sources & review', `<span class="pill amber">अप्रकाशित · अनुभव हेतु नमूना</span><p>इस प्रोटोटाइप का नमूना लेखन मूल रूप से इंटरफ़ेस जाँचने के लिए बनाया गया है। यह किसी आगम का मूल पाठ, अनुवाद या प्रामाणिक व्याख्या नहीं है।</p><dl class="source-list"><div><dt>मूल संस्करण और संदर्भ</dt><dd>चयन व सत्यापन शेष</dd></div><div><dt>हिन्दी अनुवाद और व्याख्या</dt><dd>योग्य समीक्षक की समीक्षा शेष</dd></div><div><dt>कथन और ऑडियो</dt><dd>रिकॉर्डिंग उपलब्ध नहीं · टाइमलाइन सिम्युलेटेड</dd></div><div><dt>पुनर्वितरण अधिकार</dt><dd>वास्तविक सामग्री के लिए प्रमाण शेष</dd></div></dl><p class="small-note">प्रकाशन से पहले स्रोत, अधिकार, समीक्षा और सुधार का विवरण हर घटक के साथ जोड़ा जाएगा। DEMO संदर्भ प्रामाणिक सूत्र क्रमांक नहीं हैं।</p>`);
}

function rememberScroll() {
  if (route === 'reader' && !restoringPosition) {
    state.readingOffsets[state.reading] = window.scrollY;
    save();
  }
}

async function restoreViewPosition() {
  const revision = ++positionRevision;
  const offset = route === 'reader' ? state.readingOffsets[state.reading] || 0 : 0;
  restoringPosition = true;
  await document.fonts.ready;
  requestAnimationFrame(() => {
    if (revision !== positionRevision) return;
    window.scrollTo({ top: offset, behavior: 'instant' });
    requestAnimationFrame(() => {
      if (revision === positionRevision) restoringPosition = false;
    });
  });
}

function navigate(next, focus = true) {
  rememberScroll();
  route = ['home', 'library', 'reader', 'listen', 'bookmarks', 'settings'].includes(next) ? next : 'home';
  render();
  if (focus) document.querySelector('#main').focus({ preventScroll: true });
  restoreViewPosition();
}

function selectReading(id) {
  rememberScroll();
  state = moveReading(state, id);
  save();
  if (route === 'reader') {
    render();
    document.querySelector('#main').focus({ preventScroll: true });
    restoreViewPosition();
  } else location.hash = 'reader';
}

function drive() {
  playing = false;
  openDialog('Driving mode · Preview', `<p>चलने से पहले अपना अध्याय तैयार रखें। इस डेमो में केवल नियंत्रण और टाइमलाइन हैं; कोई आवाज़ नहीं है।</p><div class="prepared-item">${icon('headphones')}<div><b>अध्ययन का अनुभव</b><p>एक नमूना अध्याय · अगला उपलब्ध नहीं</p></div></div><p class="small-note">वास्तविक Android बैकग्राउंड प्लेबैक, Bluetooth और स्टीयरिंग नियंत्रण इस ब्राउज़र प्रोटोटाइप में सत्यापित नहीं हैं।</p><button class="button full" data-action="enter-drive">Open driving controls ${icon('arrow')}</button>`);
}

function driveView() {
  driving = true;
  openDialog('श्रवण यात्रा', `<div class="drive-view">${icon('car')}<span class="eyebrow">ड्राइविंग मोड · इंटरफ़ेस डेमो</span><h3>अध्ययन का अनुभव</h3><p>प्लेबैक सिम्युलेटेड है · आवाज़ नहीं है</p><span id="drive-time">${time(state.listening)} / 22:00</span><div class="drive-controls"><button class="button secondary" data-skip="-15" aria-label="15 सेकंड पीछे">−15</button><button class="play-button" data-action="play" aria-label="${playing ? 'Pause preview' : 'Play preview'}">${icon(playing ? 'pause' : 'play')}</button><button class="button secondary" data-skip="15" aria-label="15 सेकंड आगे">+15</button></div><button class="text-button" data-action="interrupt">Simulate a call interruption</button><p class="small-note">व्यवधान पर डेमो रुकेगा। फिर से चलाना आपका चयन होगा।</p></div>`, true);
}

function updatePlayback() {
  syncMiniPlayer();
  const seek = document.querySelector('#seek');
  if (seek) {
    seek.value = state.listening;
    seek.setAttribute('aria-valuetext', time(state.listening));
    document.querySelector('#elapsed').textContent = time(state.listening);
    document.querySelector('#remaining').textContent = `${time(1320 - state.listening)} शेष`;
  }
  document.querySelectorAll('[data-action="play"]').forEach(button => {
    button.innerHTML = icon(playing ? 'pause' : 'play');
    button.setAttribute('aria-label', playing ? 'Pause preview' : 'Play preview');
  });
  const driveTime = document.querySelector('#drive-time');
  if (driveTime) driveTime.textContent = `${time(state.listening)} / 22:00`;
}

document.addEventListener('click', event => {
  if (event.target.closest('.skip')) {
    event.preventDefault();
    document.querySelector('#main').focus();
    return;
  }
  const target = event.target.closest('button, [data-route]');
  if (!target) return;
  if (target.dataset.route) location.hash = target.dataset.route;
  if (target.dataset.read !== undefined) selectReading(Number(target.dataset.read));
  if (target.dataset.remove !== undefined) {
    state = toggleBookmark(state, Number(target.dataset.remove));
    save();
    render();
    toast('बुकमार्क हटाया गया।');
  }
  if (target.dataset.skip) {
    state.listening = Math.max(0, Math.min(1320, state.listening + Number(target.dataset.skip)));
    save();
    updatePlayback();
  }
  if (target.dataset.font || target.dataset.theme) {
    if (target.dataset.font) state.font = Number(target.dataset.font);
    if (target.dataset.theme) state.theme = target.dataset.theme;
    save();
    refreshPreferences(target.dataset.font ? `[data-font="${state.font}"]` : `[data-theme="${state.theme}"]`);
  }
  switch (target.dataset.action) {
    case 'about':
      openDialog('श्रुतधारा का अनुभव', '<p>पठन और श्रवण यात्रा का Android-first डिज़ाइन प्रोटोटाइप। मूल सूत्र और समीक्षित अध्याय अभी शामिल नहीं हैं।</p><p>प्रगति और बुकमार्क इस ब्राउज़र में सहेजे जाते हैं। कोई खाता या बाहरी सेवा आवश्यक नहीं है। यह Android ऐप या वास्तविक ऑडियो प्लेयर नहीं है।</p>');
      break;
    case 'sources': sources(); break;
    case 'close': dialog.close(); break;
    case 'clear-search': filter = ''; render(); document.querySelector('#search').focus(); break;
    case 'unavailable':
      openDialog('आगे की सामग्री अभी उपलब्ध नहीं', '<p>अगले अध्याय का स्रोत, पुनर्वितरण अधिकार और समीक्षा अभी शेष हैं। कोई अंश अपने आप छोड़ा नहीं गया है।</p><button class="button" data-action="close">यहीं लौटें</button>');
      break;
    case 'reading-settings': openDialog('Reading preferences', readingSettings()); break;
    case 'bookmark': {
      state = toggleBookmark(state, state.reading);
      save();
      const offset = window.scrollY;
      render();
      window.scrollTo(0, offset);
      document.querySelector('[data-action="bookmark"]')?.focus({ preventScroll: true });
      toast(state.bookmarks.includes(state.reading) ? 'अंश बुकमार्क में सहेजा गया।' : 'बुकमार्क हटाया गया।');
      break;
    }
    case 'prev': selectReading(state.reading - 1); break;
    case 'next':
      if (state.reading < 2) selectReading(state.reading + 1);
      else openDialog('आप नमूने के अंत में हैं', '<p>आगे की सत्यापित सामग्री अभी उपलब्ध नहीं है। यह किसी वास्तविक अध्याय की पूर्णता का संकेत नहीं है।</p><button class="button" data-action="reflect">कुछ पल ठहरें</button><p><a href="#library" data-action="close">संग्रह में लौटें</a></p>');
      break;
    case 'reflect': openDialog('कुछ पल अपने लिए', '<p>पढ़ते समय कौन-सा विचार आपके साथ रहा?</p><p>चाहें तो बिना कुछ लिखे, उस पर शांत मन से विचार करें। यहाँ आपकी कोई प्रतिक्रिया दर्ज नहीं होती।</p><button class="button" data-action="close">पठन में लौटें</button>'); break;
    case 'play':
      if (state.listening >= 1320) state.listening = 0;
      playing = !playing;
      updatePlayback();
      if (playing) toast('सिम्युलेटेड टाइमलाइन चल रही है। ऑडियो रिकॉर्डिंग नहीं है।');
      break;
    case 'dismiss-player':
      playing = false;
      save();
      document.querySelector('.mini-player')?.remove();
      break;
    case 'speed': {
      const speeds = [0.75, 1, 1.25, 1.5];
      state.speed = speeds[(speeds.indexOf(state.speed) + 1) % speeds.length];
      save();
      target.textContent = `${state.speed}×`;
      break;
    }
    case 'sleep':
      openDialog('Sleep timer', `<p>समय पूरा होने पर डेमो रुक जाएगा।</p><div class="sleep-options">${[5, 15, 30].map(min => `<button class="button secondary" data-sleep="${min}">${min} मिनट</button>`).join('')}</div><button class="text-button" data-sleep="0">टाइमर बंद करें</button><p class="small-note">${sleepAt ? 'टाइमर चालू है।' : 'अभी कोई टाइमर नहीं है।'}</p>`);
      break;
    case 'driving': drive(); break;
    case 'enter-drive': driveView(); break;
    case 'interrupt': playing = false; updatePlayback(); toast('डेमो रुका। कॉल के बाद चलाएँ दबाकर जारी रखें।'); break;
    case 'export': {
      rememberScroll();
      const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'shrutdhara-demo-backup.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('बैकअप फ़ाइल तैयार है। इसे सुरक्षित रखें।');
      break;
    }
    case 'import':
      openDialog('Restore backup', '<p>इस प्रोटोटाइप की JSON बैकअप फ़ाइल चुनें। सफल पुनर्स्थापना मौजूदा दोनों यात्राओं, बुकमार्क और पठन विकल्पों की जगह लेगी।</p><label class="file-label">बैकअप फ़ाइल<input id="restore-file" type="file" accept=".json,application/json"></label><p id="restore-status" role="status"></p>');
      break;
  }
  if (target.dataset.sleep !== undefined) {
    const minutes = Number(target.dataset.sleep);
    sleepAt = minutes ? Date.now() + minutes * 60000 : null;
    dialog.close();
    toast(minutes ? `${minutes} मिनट का टाइमर लगा दिया गया।` : 'स्लीप टाइमर बंद है।');
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'seek') {
    state.listening = Number(event.target.value);
    save();
    updatePlayback();
  }
  if (event.target.id === 'search') {
    filter = event.target.value;
    document.querySelector('#library-results').innerHTML = libraryResults();
  }
});

document.addEventListener('change', async event => {
  if (event.target.id === 'reading-font') {
    state.fontFamily = event.target.value;
    save();
    refreshPreferences('#reading-font');
  }
  if (event.target.dataset.setting) {
    state[event.target.dataset.setting] = event.target.checked;
    save();
    refreshPreferences(`[data-setting="${event.target.dataset.setting}"]`);
  }
  if (event.target.id === 'autoplay') {
    state.queue = event.target.checked;
    save();
    toast(state.queue ? 'अगला अध्याय उपलब्ध होने पर ही जारी होगा।' : 'स्वतः अगला अध्याय चलाना बंद है।');
  }
  if (event.target.id === 'restore-file') {
    const output = document.querySelector('#restore-status');
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 100000) throw new Error('बैकअप फ़ाइल बहुत बड़ी है।');
      const restored = validateState(JSON.parse(await file.text()));
      state = restored;
      playing = false;
      save();
      render();
      dialog.close();
      toast('दोनों यात्राएँ और बुकमार्क पुनर्स्थापित किए गए।');
    } catch (error) {
      output.textContent = `${error instanceof SyntaxError ? 'यह मान्य JSON बैकअप नहीं है।' : error.message} मौजूदा प्रगति नहीं बदली है। दूसरी फ़ाइल चुनें।`;
    }
  }
});

dialog.addEventListener('close', () => {
  driving = false;
  if (dialogOpener) document.querySelector(`[data-action="${dialogOpener}"]`)?.focus({ preventScroll: true });
});
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (event.target === dialog && outside) dialog.close();
});
window.addEventListener('hashchange', () => { if (dialog.open) dialog.close(); navigate(location.hash.slice(1)); });
window.addEventListener('pagehide', () => { rememberScroll(); save(); });
let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  if (route !== 'reader' || restoringPosition) return;
  const passage = state.reading;
  const offset = window.scrollY;
  scrollTimeout = setTimeout(() => {
    state.readingOffsets[passage] = offset;
    save();
  }, 150);
}, { passive: true });

setInterval(() => {
  if (sleepAt && Date.now() >= sleepAt) {
    playing = false;
    sleepAt = null;
    toast('स्लीप टाइमर पूरा हुआ। डेमो रोक दिया गया।');
  }
  if (playing) {
    state.listening = Math.min(1320, state.listening + state.speed);
    if (state.listening >= 1320) {
      playing = false;
      toast('नमूना समाप्त। अगला अध्याय उपलब्ध नहीं है; प्लेबैक रुका है।');
    }
    save();
  }
  updatePlayback();
}, 1000);

history.scrollRestoration = 'manual';
navigate(location.hash.slice(1), false);
if (!storageAvailable) toast('पुराना डेटा पढ़ा नहीं जा सका या संग्रहण उपलब्ध नहीं है। निर्यात से बैकअप रखें।');
