const source = 'https://service.berlin.de/dienstleistung/120686/';
const storageKey = 'roots.berlin.john.v3';
const initial = () => ({housing:'yes', confirmation:false, docs:[], appointment:'', reminder:'', done:false, visaExpiry:'', arrivals:[], history:[]});
let state = initial();
try { Object.assign(state, JSON.parse(localStorage.getItem(storageKey))); } catch {}
const app = document.querySelector('#app');
const housingLabels = {seeking:'I’m looking for a place',unasked:'I haven’t asked', waiting:'I’m waiting for a reply', yes:'I can register here', no:'I can’t register here'};
const moves = {
  seeking:['Find a place where you can register your address','Do now','ask'],
  unasked:['Check if you can register at your new address','Do now','ask'],
  waiting:['Waiting for a reply','Waiting','ask'],
  no:['Find a place where you can register your address','Do now','ask'],
  confirmation:['Waiting for housing confirmation','Waiting','confirmation'],
  ready:['Check registration options','Do now','options'],
  appointment:['Review what to bring','Do now','bring'],
  done:['Address registration complete','Done','history']
};
const icons = {
  home:'<path d="m3 11 9-7 9 7M5 10v10h5v-6h4v6h5V10"/>',
  registration:'<path d="M3 9h18L12 4 3 9Zm2 11h14M7 11v6m5-6v6m5-6v6"/>',
  health:'<path d="M12 5v14M5 12h14"/>',
  money:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v10c0 4 14 4 14 0V6M5 11c0 4 14 4 14 0"/>',
  clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  check:'<path d="m5 12 4 4 10-9"/>',
  circle:'<circle cx="12" cy="12" r="6"/>',
  permit:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c0-3 6-3 6 0m2-6h4m-4 4h4"/>',
  german:'<path d="M20 5H4v12h5l3 4 3-4h5V5Z"/><path d="M8 9h8m-8 4h5"/>',
  star:'<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>'
};
const icon = name => '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
const status = (label, extra='') => {
  const [style, glyph] = ({'Done':['done','check'],'Waiting':['waiting','clock'],'Do now':['','circle'],'To do':['todo','circle'],'Do next':['next','circle'],'In progress':['progress','clock'],'Review next':['','circle']})[label];
  return '<span class="pill '+style+' '+extra+'">'+icon(glyph)+label+'</span>';
};
const official = (label='Official Berlin guidance') => '<a class="source" href="'+source+'" target="_blank" rel="noopener">'+label+' ↗</a>';
const date = value => new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
const current = () => moves[state.done?'done':state.housing!=='yes'?state.housing:!state.confirmation?'confirmation':state.appointment?'appointment':'ready'];
const registrationStatus = () => state.done?'Done':state.appointment||state.reminder?'In progress':state.housing==='seeking'||state.housing==='no'?'Do next':'Do now';
const button = (label, action, secondary=false) => '<button type="button" class="btn '+(secondary?'secondary':'')+'" data-action="'+action+'">'+label+'</button>';
const link = (label, route, secondary=false) => '<a class="btn '+(secondary?'secondary':'')+'" href="#'+route+'">'+label+'</a>';
const back = '<a class="back" href="#plan">‹ &nbsp; My move to Berlin</a>';
const areas = {
  home:{label:'Home', position:[18,24], title:'Housing', copy:'You can register at your current apartment. Your employer can help if your housing changes.'},
  registration:{label:'Registration', position:[51,46], title:'Address registration'},
  health:{label:'Health', position:[83,24], title:'Health insurance'},
  money:{label:'Money', position:[20,76], title:'Tax ID, banking and payroll'},
  permit:{label:'Visa', position:[77,76], title:'Visa and residence'},
  german:{label:'German', position:[50,83], title:'Learn German'}
};
const arrivalTasks = {
  coverage: {
    area:'health', title:'Confirm your health coverage', action:'Mark coverage as confirmed',
    copy:'Ask HR when your regular coverage starts and which insurer details they need. Check that you have coverage from arrival until your regular insurance begins. Most employees in Germany have statutory health insurance.',
    links:[['Federal guidance on health insurance','https://www.make-it-in-germany.com/en/arriving-living/getting-started/health-insurance']]
  },
  tax: {
    area:'money', title:'Get your tax ID (Steuer-ID)', action:'I have my tax ID',
    copy:'When you first register in Germany, the Federal Central Tax Office assigns an 11-digit tax ID and sends it by post. If you already have a German tax ID, use that number. You can also request it again from the tax office.',
    links:[['Federal Central Tax Office · tax ID','https://online.portal.bzst.de/SharedDocs/Leistungsbeschreibung/EN/erneute_mitteilung_der_ID-Nr.html']]
  },
  payroll: {
    area:'money', title:'Set up payroll and salary payments', action:'Mark payroll setup as done',
    copy:'Ask HR which bank details and documents you can provide now. If your first German tax ID is pending, tell payroll and ask how your first payslip will be handled. Share your tax ID securely when it arrives. If you need a bank account, check which documents your bank accepts.',
    links:[['Federal guidance on salary and social security','https://www.make-it-in-germany.com/en/working-in-germany/job-search-application/work-salary-social-security'],['Federal guidance on opening a bank account','https://www.make-it-in-germany.com/en/arriving-living/getting-started/open-bank-account']]
  },
  social: {
    area:'money', title:'Confirm social security registration with HR', action:'Mark registration as confirmed',
    copy:'Ask HR whether they have registered you for social security, what details they need, and how to get your social security number (Versicherungsnummer) if this is your first job in Germany. This is separate from your tax ID.',
    links:[['Federal guidance on salary and social security','https://www.make-it-in-germany.com/en/working-in-germany/job-search-application/work-salary-social-security']]
  },
  residence: {
    area:'permit', title:'Review your visa expiry and next residence step', action:'Mark visa details as reviewed',
    copy:'Check the visa category, expiry date and employment conditions on your document. If you plan to stay beyond your national visa’s validity, ask Berlin’s Immigration Office (LEA) which residence title and application apply to you.',
    links:[['Berlin Immigration Office · entry with a national visa','https://www.berlin.de/einwanderung/en/entry/visa-extension/artikel.1048669.en.php']]
  },
  language: {
    area:'german', title:'Explore beginner German', action:'Mark course options as reviewed',
    copy:'John speaks English. When you’re ready to learn German, explore beginner courses at Berlin’s public adult education centres (Volkshochschulen, or VHS).',
    links:[['Berlin’s public adult education centres','https://www.berlin.de/sen/bildung/lebenslanges-lernen/vhs/']]
  }
};
function arrivalStatus(id) {
  if (state.arrivals.includes(id)) return 'Done';
  if (id==='tax') return state.done?'Waiting':'To do';
  return 'To do';
}
function arrivalPage(key) {
  const title=areas[key].title;
  const cards=Object.entries(arrivalTasks).filter(([,task])=>task.area===key).map(([id,task])=>{
    const sources=task.links.map(([label,url])=>'<a class="source" href="'+url+'" target="_blank" rel="noopener">'+label+' ↗</a>').join('');
    const dependency=id==='tax'&&!state.arrivals.includes(id)?'<p><strong>John’s plan</strong> · '+(state.done?'Address registration is done. Track your tax ID letter here.':'For a first German registration, complete Anmeldung before expecting your tax ID letter.')+'</p>':'';
    const visa=id==='residence'?dateForm('visaExpiry','Visa expiry date'):'';
    const done=state.arrivals.includes(id);
    return step(id,task.title,arrivalStatus(id),'<div class="guidance"><p>'+task.copy+'</p><div class="source-list">'+sources+'</div></div>'+dependency+visa+'<div class="actions">'+button(done?'Mark as open':task.action,'arrival-'+id,done)+'</div>','');
  }).join('');
  return '<div class="detail"><div class="intro">'+back+'<span class="eyebrow area-label">'+areas[key].label+'</span><h1>'+title+'</h1></div>'+cards+'</div>';
}
function dashboard() {
  const [registrationNext]=current();
  const waitingForTax=state.done&&!state.arrivals.includes('tax');
  const next=waitingForTax?'Watch for your Tax ID letter':state.housing==='yes'&&!state.done?'Address registration':registrationNext;
  const seeking=state.housing==='seeking'||state.housing==='no';
  const badge=waitingForTax?'Waiting':seeking?'Do now':registrationStatus();
  const [action,route]=seeking?['Open housing checklist','home']:waitingForTax?['Track your Tax ID','money/tax']:state.done?['View registration','registration']:['Continue Anmeldung','registration'];
  const housingSummary=state.housing==='yes'?'<div class="work-strip"><span class="tile mint">'+icon('home')+'</span><div><strong>Found a home you can register</strong><small>Your apartment is ready for address registration.</small></div>'+status('Done')+'</div>':'';
  const savedRegistrationDate=state.appointment?'Appointment · '+date(state.appointment):state.reminder?'In-app reminder · '+date(state.reminder):'';
  const description=seeking?'Before you commit to a place, ask whether you can register there and who will issue the housing confirmation.':waitingForTax?'Your Anmeldung is complete. Share your Tax ID with payroll after it arrives.':state.done?'Your address registration is complete. Check the next steps in your plan.':state.housing==='waiting'?'You can prepare your documents and get set up with HR while you wait.':savedRegistrationDate||'Save your appointment date or set a reminder to follow up.';
  const completed=state.done?2:seeking?0:1;
  const milestones=[['Find a home','home'],['Anmeldung','registration'],['Tax ID','money/tax']];
  const journey=milestones.map(([label,path],i)=>{
    const done=i<completed||(i===2&&state.arrivals.includes('tax'));
    return '<a href="#'+path+'" class="milestone '+(done?'complete':i===completed?'current':'')+'" '+(i===completed&&!done?'aria-current="step"':'')+'><span class="milestone-icon">'+(done?icon('check'):String(i+1))+'</span><span>'+label+'</span></a>';
  }).join('');
  return '<div class="intro welcome"><div><span class="eyebrow">Your Berlin move</span><h1>My move to Berlin</h1><p>Skip the scroll. Know what to do next.</p></div></div>'+
    '<div class="work-strip"><span class="tile mint">'+icon('permit')+'</span><div><strong>Work authorisation confirmed</strong><small>Your Tax ID is for payroll. You can start work while you wait for it.</small></div>'+status('Done')+'</div>'+
    housingSummary+'<div class="dashboard"><section class="hero"><div class="badges">'+(state.done?'':'<span class="pill priority">'+icon('star')+'Top priority</span>')+status(badge)+'</div><h2>'+next+'</h2>'+(state.housing==='yes'&&!state.done?'<span class="hero-subtitle">Anmeldung</span>':'')+'<p>'+description+'</p>'+link(action,route)+'</section>'+
    '<section class="journey" aria-label="Address registration and tax ID progress">'+journey+'</section>'+
    '<section class="section map-section"><div class="section-head"><h2>Explore your move</h2></div><nav class="map" aria-label="Move areas"><canvas aria-hidden="true"></canvas>'+
    Object.entries(areas).map(([key,area])=>'<a class="pin '+key+(key===(seeking?'home':state.done?'money':'registration')?' pin-next':'')+'" href="#'+key+'" style="left:'+area.position[0]+'%;top:'+area.position[1]+'%"><span class="pin-icon">'+icon(key)+'</span><span class="pin-label">'+area.label+'</span>'+(key==='registration'?status(registrationStatus(),'map-status'):'')+'</a>').join('')+
    '</nav><p class="map-note">Illustrated map · Tap an area to open it</p></section><section class="section plan-section"><h2>Your plan</h2><div class="list">'+(seeking?row('home','Do now',moves.seeking[0]):'')+row('registration',registrationStatus())+row('money',arrivalStatus('tax'),arrivalTasks.tax.title,'tax')+'</div>'+
    (state.visaExpiry?'<div class="saved"><a href="#permit/residence">Visa expiry · '+date(state.visaExpiry)+'</a></div>':'')+
    (state.reminder?'<div class="saved"><a href="#registration/reminder">In-app reminder · '+date(state.reminder)+'</a></div>':'')+
    (state.appointment?'<div class="saved">Appointment · '+date(state.appointment)+' <a href="#registration/appointment">View appointment</a></div>':'')+
    '<h3 class="review">Then</h3><div class="list">'+['coverage','payroll','social','residence'].map(id=>row(arrivalTasks[id].area,arrivalStatus(id),arrivalTasks[id].title,id)).join('')+'</div>'+
    '<h3 class="review">Later</h3><div class="list">'+row('german',arrivalStatus('language'),arrivalTasks.language.title,'language')+'</div></section></div>';
}
function row(area, label, title=areas[area].title, anchor='') {
  return '<a class="row '+(area==='home'||area==='registration'?'row-peach':'')+'" href="#'+area+(anchor?'/'+anchor:'')+'"><span class="tile '+(area==='registration'||area==='home'?'peach':'')+'">'+icon(area)+'</span><span class="label">'+title+(area==='registration'?'<small class="row-note">Anmeldung · Citizens’ Office</small>':'')+(anchor==='tax'?'<small class="row-note">Federal tax office</small>':'')+(anchor==='tax'&&!state.arrivals.includes('tax')?'<small class="row-note">'+(state.done?'Watch for your tax ID letter':'Waiting for first Anmeldung')+'</small>':'')+'</span>'+status(label)+'<span aria-hidden="true">›</span></a>';
}
function profile() {
  return '<div class="detail"><div class="intro">'+back+'<h1>About John</h1></div><section class="panel blue"><div class="identity"><img class="portrait" src="john.jpg" alt="John’s demo avatar"><div><span class="eyebrow">Demo profile</span><h2>John</h2><p>Engineering employee</p></div></div><div class="tags"><span class="pill todo">Work visa · National visa (Type D)</span><span class="pill todo">Visa number · Not provided</span><span class="pill todo">Speaks English</span><span class="pill todo">Berlin</span><span class="pill todo">Employer-assisted relocation</span></div><p>John moved from outside the EU with a work visa and a signed employment contract. His visa authorises the job. He has found an apartment where he can register and has access to employer relocation support.</p></section></div>';
}
function step(id, title, label, body, active) {
  return '<section id="'+id+'" tabindex="-1" class="step '+(active===id?'active':'')+'"><div class="step-top"><h3>'+title+'</h3>'+status(label)+'</div>'+body+'</section>';
}
function dateForm(key,label) {
  const name={reminder:'reminder',appointment:'appointment',visaExpiry:'visa expiry'}[key];
  return '<form data-form="'+key+'"><label class="field">'+label+'<input type="date" name="date" required value="'+state[key]+'"></label><div class="actions"><button class="btn">Save '+name+'</button>'+(state[key]?button('Remove date','clear-'+key,true):'')+'</div></form>';
}
function registration() {
  return '<div class="detail"><div class="intro">'+back+'<h1>Address registration</h1><p>Anmeldung · Citizens’ Office</p></div>'+
    '<section class="panel registration-summary '+(state.done?'registration-done':'blue')+'">'+status(registrationStatus())+
    '<p>'+(state.done?'Your address registration is complete.':'Check documents and registration options on Berlin’s official page.')+'</p>'+
    (state.done?link('View your plan','plan',true):official('Official Berlin guidance'))+'</section>'+
    '<section id="appointment" tabindex="-1" class="panel"><h3>Save your appointment date</h3>'+dateForm('appointment','Appointment date')+'</section>'+
    '<section id="reminder" tabindex="-1" class="panel"><h3>Set a reminder</h3><p>In-app reminder only. It appears in your plan and sends no notifications.</p>'+dateForm('reminder','Reminder date')+'</section>'+
    '<div class="actions">'+(state.done?button('Undo completion','undo-completion',true):button('Mark as completed','complete'))+'</div>'+'</div>';
}
function housingMessage() {
  const message=state.housing==='no'
    ?'Hi, I can’t register at my temporary address. Could you help me find another place where I can register and confirm who would issue the Wohnungsgeberbestätigung for that address? Thanks, John'
    :state.housing==='seeking'?'Hi, could you help me find a place in Berlin where I can register my address? I’d like to confirm who can issue the Wohnungsgeberbestätigung before I commit. Thanks, John'
    :'Hi, can I register my address in Berlin (Anmeldung)? If so, who can issue the Wohnungsgeberbestätigung confirming my move-in? Thanks, John';
  return '<details class="housing-message"><summary>Message your relocation team</summary><label class="field">Message to copy<textarea readonly rows="5">'+message+'</textarea></label>'+button('Copy message','copy-housing',true)+'</details>';
}
function areaPage(key) {
  if(key!=='home') return arrivalPage(key);
  const seeking=state.housing==='seeking'||state.housing==='no';
  return '<div class="detail"><div class="intro">'+back+'<h1>Housing</h1><p>'+(seeking?'Your employer can help you find a place in Berlin.':areas.home.copy)+'</p></div>'+
    '<section class="panel '+(seeking?'peach':'blue')+'">'+status(seeking?'Do now':state.housing==='yes'?'Done':state.housing==='waiting'?'Waiting':'Do now')+
    '<h2 class="section">'+(seeking?'Find a place where you can register your address':'Your address check')+'</h2>'+
    (seeking?'<ol class="housing-checklist"><li>Ask your relocation team for help finding a place.</li><li>Before committing, ask whether you can register the address and who will issue the Wohnungsgeberbestätigung.</li><li>Once you move in, update your housing status to start the Anmeldung steps.</li></ol>'+housingMessage()+
      '<div class="actions">'+button('I’ve moved into a place','new-housing')+'</div>':'<p>'+housingLabels[state.housing]+'</p><div class="actions">'+(state.housing==='unasked'?button('I asked','asked',true):'')+(state.housing==='yes'&&!state.confirmation?button('I received the confirmation','received',true):'')+link('Continue Anmeldung','registration')+'</div>')+'</section>'+
    (!seeking?'<section id="housing-status" tabindex="-1" class="panel"><h2>Can you register this address?</h2><p>Update this when you hear back about your address.</p><form data-form="housing"><label class="field">Registration status<select name="housing">'+Object.entries(housingLabels).filter(([key])=>key!=='seeking').map(([key,label])=>'<option value="'+key+'" '+(key===state.housing?'selected':'')+'>'+label+'</option>').join('')+'</select></label><button class="btn">Save and view plan</button></form></section>':'')+'</div>';
}
function paintMap(canvas) {
  if (!canvas) return;
  canvas.width=660; canvas.height=350;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#e6eef0'; ctx.fillRect(0,0,660,350);
  let seed=91;
  function random() { seed=(seed*48271)%2147483647; return seed/2147483647; }
  ctx.save(); ctx.translate(330,175); ctx.rotate(-.29); ctx.translate(-330,-175);
  for(let x=-50;x<745;x+=38) for(let y=-95;y<470;y+=30) {
    const value=random();
    ctx.fillStyle=value>.84?'#d2e7d9':value>.47?'#dce7eb':'#e9f1f3';
    ctx.fillRect(x,y,34,26);
  }
  ctx.strokeStyle='#ffffff'; ctx.lineWidth=2.3;
  for(let x=-40;x<740;x+=38) {ctx.beginPath();ctx.moveTo(x,-100);ctx.lineTo(x,460);ctx.stroke();}
  for(let y=-80;y<450;y+=30) {ctx.beginPath();ctx.moveTo(-90,y);ctx.lineTo(760,y);ctx.stroke();}
  ctx.restore();
  function river() {ctx.beginPath();ctx.moveTo(-25,242);ctx.bezierCurveTo(103,260,171,117,324,174);ctx.bezierCurveTo(442,217,530,278,688,220);ctx.stroke();}
  ctx.strokeStyle='#f4fbfd'; ctx.lineWidth=27; river();
  ctx.strokeStyle='#9dcce3'; ctx.lineWidth=17; river();
  ctx.strokeStyle='#ffffff';ctx.lineWidth=5;
  for(const [x,y] of [[105,70],[310,112],[515,163]]) {
    ctx.beginPath();ctx.moveTo(x+45,y-110);ctx.quadraticCurveTo(x-18,y+60,x-75,y+230);ctx.stroke();
  }
  ctx.fillStyle='#45677b';
  ctx.font='700 16px system-ui';
  ctx.letterSpacing='3px';
  ctx.fillText('BERLIN',278,32);
  ctx.font='italic 600 17px system-ui';
  ctx.letterSpacing='0px';
  ctx.fillText('Spree',410,192);
}
function render(jump=true) {
  const [page,anchor] = (location.hash.slice(1)||'plan').split('/');
  app.innerHTML = page==='registration'?registration():page==='profile'?profile():areas[page]?areaPage(page):dashboard();
  paintMap(app.querySelector('canvas'));
  const target = document.getElementById(anchor);
  if(jump && target) { target.focus({preventScroll:true}); target.scrollIntoView({block:'start'}); }
  else if(jump) {
    window.scrollTo(0,0);
    const heading=app.querySelector('h1');
    if(heading) {heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
}
function commit(change, message) {
  Object.assign(state,change);
  if(message) state.history.push(message);
  try {localStorage.setItem(storageKey,JSON.stringify(state));}
  catch {document.querySelector('#notice').textContent='Saved for this session only.';return;}
  document.querySelector('#notice').textContent=message||'Progress saved.';
}
function housingChange(housing, changedAddress=false) {
  if(housing===state.housing&&!changedAddress)return;
  const resetAddress = state.housing==='yes'||housing==='no'||changedAddress;
  const patch = resetAddress?{confirmation:false,appointment:'',reminder:'',done:false,docs:state.docs.filter(key=>key!=='confirmation')}:{};
  commit({...patch,housing},changedAddress?'Housing changed. Started a new address check.':'Housing status updated. '+housingLabels[housing]+'.');
}
document.addEventListener('click',async event=>{
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(!action)return;
  if(action==='copy-housing') {
    const control=event.target.closest('button');
    const field=control.closest('details').querySelector('textarea');
    try {
      await navigator.clipboard.writeText(field.value);
      control.textContent='Copied';
      document.querySelector('#notice').textContent='Message copied.';
    } catch {
      field.focus();
      field.select();
      document.querySelector('#notice').textContent='Message selected. Use your device’s copy command.';
    }
    return;
  }
  if(action==='reset') {
    if(!window.confirm('Reset John’s demo and clear saved progress?'))return;
    state=initial();commit({});location.hash='plan';
  }
  if(action.startsWith('arrival-')) {
    const id=action.slice(8);
    const complete=state.arrivals.includes(id);
    commit({arrivals:complete?state.arrivals.filter(item=>item!==id):[...state.arrivals,id]},arrivalTasks[id].title+(complete?' reopened.':' marked done.'));
  }
  if(action==='asked')housingChange('waiting');
  if(action==='new-housing') {housingChange('unasked',true);location.hash='home/housing-status';}
  if(action==='received') {
    commit({confirmation:true,docs:[...new Set([...state.docs,'confirmation'])]},'Housing confirmation received.');
    location.hash='registration';
  }
  if(action==='complete') {commit({done:true,beforeCompletion:{housing:state.housing,confirmation:state.confirmation},housing:'yes',confirmation:true},'Address registration marked complete.');location.hash='registration';}
  if(action==='undo-completion'&&state.done) commit({...state.beforeCompletion,done:false,beforeCompletion:null},'Address registration reopened.');
  if(action==='clear-visaExpiry')commit({visaExpiry:''},'Visa expiry removed.');
  if(action==='clear-reminder')commit({reminder:''},'Reminder removed.');
  if(action==='clear-appointment')commit({appointment:''},'Appointment date removed.');
  render(action==='reset');
});
document.addEventListener('submit',event=>{
  const form=event.target.dataset.form;
  if(!form)return;
  event.preventDefault();
  const values=new FormData(event.target);
  if(form==='housing') {housingChange(values.get('housing'));location.hash='plan';}
  else {
    const value=values.get('date');
    commit({[form]:value},({appointment:'Appointment',reminder:'In-app reminder',visaExpiry:'Visa expiry'}[form])+' saved for '+date(value)+'.');
    render(false);
  }
});
window.addEventListener('hashchange',()=>render());
render();
