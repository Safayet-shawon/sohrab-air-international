(()=>{
  let lang=localStorage.getItem('sohrab-lang')||'bn';
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const text=(el,bn,en)=>{if(el)el.textContent=lang==='bn'?bn:en};
  const toast=$('.toast');
  const notify=(bn,en)=>{if(!toast)return;text(toast,bn,en);toast.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>toast.classList.remove('show'),3400)};
  document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="loginModal" aria-hidden="true"><div class="modal-box narrow"><button class="modal-close" data-close aria-label="Close">×</button><div data-form-view><span class="eyebrow" data-bn="গ্রাহক লগইন" data-en="Customer login">গ্রাহক লগইন</span><h2 data-bn="আপনার অ্যাকাউন্টে প্রবেশ করুন" data-en="Sign in to your account">আপনার অ্যাকাউন্টে প্রবেশ করুন</h2><p data-bn="এটি নিরাপদ demo—কোনো তথ্য সংরক্ষণ হয় না।" data-en="This is a safe demo—no information is stored.">এটি নিরাপদ demo—কোনো তথ্য সংরক্ষণ হয় না।</p><form data-demo-flow class="form-grid"><div class="field span2"><label data-bn="মোবাইল নম্বর" data-en="Mobile number">মোবাইল নম্বর</label><input type="tel" required pattern="[0-9+ ]{10,15}" placeholder="01XXXXXXXXX"></div><div class="field span2"><label data-bn="পাসওয়ার্ড" data-en="Password">পাসওয়ার্ড</label><input type="password" required minlength="4"></div><button class="btn full span2" type="submit" data-bn="লগইন" data-en="Sign in">লগইন</button></form></div><div class="success hidden" data-success><div class="tick">✓</div><h2 data-bn="Demo login সফল" data-en="Demo sign-in successful">Demo login সফল</h2><p data-bn="লাইভ সংস্করণে আপনার বুকিং ও আবেদন এখানে দেখা যাবে।" data-en="The live version will show your bookings and applications here.">লাইভ সংস্করণে আপনার বুকিং ও আবেদন এখানে দেখা যাবে।</p><button class="btn" data-close data-bn="বন্ধ করুন" data-en="Close">বন্ধ করুন</button></div></div></div><div class="modal" id="leaderModal" aria-hidden="true"><div class="modal-box narrow"><button class="modal-close" data-close aria-label="Close">×</button><div data-form-view><span class="eyebrow" data-bn="গ্রুপ লিডার" data-en="Group leader">গ্রুপ লিডার</span><h2 data-bn="গ্রুপ লিডার হতে আগ্রহী?" data-en="Interested in becoming a group leader?">গ্রুপ লিডার হতে আগ্রহী?</h2><p data-bn="নাম ও নম্বর দিন। প্রতিনিধি আপনাকে কল করে বিস্তারিত জানাবেন।" data-en="Share your name and number. A representative will call with details.">নাম ও নম্বর দিন। প্রতিনিধি আপনাকে কল করে বিস্তারিত জানাবেন।</p><form data-demo-flow class="form-grid"><div class="field span2"><label data-bn="পূর্ণ নাম" data-en="Full name">পূর্ণ নাম</label><input required></div><div class="field span2"><label data-bn="মোবাইল নম্বর" data-en="Mobile number">মোবাইল নম্বর</label><input type="tel" required pattern="[0-9+ ]{10,15}" placeholder="01XXXXXXXXX"></div><div class="field span2"><label data-bn="জেলা" data-en="District">জেলা</label><input required></div><button class="btn full span2" type="submit" data-bn="কলের অনুরোধ পাঠান" data-en="Request a call">কলের অনুরোধ পাঠান</button></form></div><div class="success hidden" data-success><div class="tick">✓</div><h2 data-bn="অনুরোধ গ্রহণ করা হয়েছে" data-en="Request received">অনুরোধ গ্রহণ করা হয়েছে</h2><p data-bn="Sohrab Air-এর একজন প্রতিনিধি আপনাকে কল করবেন। Demo-তে কোনো তথ্য সংরক্ষণ হয়নি।" data-en="A Sohrab Air representative will call you. No data was stored in this demo.">Sohrab Air-এর একজন প্রতিনিধি আপনাকে কল করবেন। Demo-তে কোনো তথ্য সংরক্ষণ হয়নি।</p><button class="btn" data-close data-bn="ঠিক আছে" data-en="Done">ঠিক আছে</button></div></div></div>`);

  function applyLang(){
    document.documentElement.lang=lang;
    $$('[data-bn][data-en]').forEach(el=>{if(!['INPUT','TEXTAREA'].includes(el.tagName))el.innerHTML=el.dataset[lang]});
    $$('[data-placeholder-bn]').forEach(el=>el.placeholder=lang==='bn'?el.dataset.placeholderBn:el.dataset.placeholderEn);
    $$('.lang-btn').forEach(b=>b.textContent=lang==='bn'?'EN':'বাংলা');
    const title=$('title');if(title?.dataset[lang])title.textContent=title.dataset[lang];
  }
  $$('.lang-btn').forEach(b=>b.addEventListener('click',()=>{lang=lang==='bn'?'en':'bn';localStorage.setItem('sohrab-lang',lang);applyLang()}));
  $('.mobile-menu')?.addEventListener('click',()=>document.body.classList.toggle('menu-open'));
  $('.overlay')?.addEventListener('click',()=>document.body.classList.remove('menu-open'));
  $$('.nav-list a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu-open')));

  function openModal(id){const modal=document.getElementById(id);if(!modal)return;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');$('.modal-close',modal)?.focus()}
  function resetModal(modal){$$('[data-success]',modal).forEach(x=>x.classList.add('hidden'));$$('[data-form-view]',modal).forEach(x=>x.classList.remove('hidden'))}
  function closeModal(modal){if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');resetModal(modal)}
  $$('[data-open]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();openModal(btn.dataset.open)}));
  $$('.modal').forEach(modal=>{modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-close]'))closeModal(modal)})});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal($('.modal.open'))});

  $$('[data-carousel]').forEach(carousel=>{
    const slides=$$('.slide',carousel),dots=$$('.hero-dots button',carousel);let current=0,timer,startX=0;
    const show=i=>{current=(i+slides.length)%slides.length;slides.forEach((s,n)=>s.classList.toggle('active',n===current));dots.forEach((d,n)=>d.classList.toggle('active',n===current))};
    const play=()=>{clearInterval(timer);timer=setInterval(()=>show(current+1),4800)};
    $('[data-next]',carousel)?.addEventListener('click',()=>{show(current+1);play()});
    $('[data-prev]',carousel)?.addEventListener('click',()=>{show(current-1);play()});
    dots.forEach((d,i)=>d.addEventListener('click',()=>{show(i);play()}));
    carousel.addEventListener('pointerdown',e=>{startX=e.clientX;clearInterval(timer)});
    carousel.addEventListener('pointerup',e=>{const dx=e.clientX-startX;if(Math.abs(dx)>45)show(current+(dx<0?1:-1));play()});
    carousel.addEventListener('mouseenter',()=>clearInterval(timer));carousel.addEventListener('mouseleave',play);show(0);play();
  });

  $$('[data-package-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    $$('[data-package-filter]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    const value=btn.dataset.packageFilter;$$('[data-package-card]').forEach(card=>card.classList.toggle('hidden',value!=='all'&&card.dataset.kind!==value));
  }));
  $$('[data-package-open]').forEach(btn=>btn.addEventListener('click',()=>{
    const card=btn.closest('[data-package-card]');if(!card)return;
    const modal=$('#packageDetails');modal.dataset.package=card.dataset.nameBn;
    text($('#detailName'),card.dataset.nameBn,card.dataset.nameEn);text($('#detailDuration'),card.dataset.daysBn,card.dataset.daysEn);$('#detailPrice').textContent=card.dataset.price;
    text($('#detailRoute'),card.dataset.routeBn,card.dataset.routeEn);openModal('packageDetails');
  }));
  $('[data-book-package]')?.addEventListener('click',()=>{const details=$('#packageDetails');closeModal(details);const select=$('#packageChoice');if(select){const name=$('#detailName').textContent;let opt=[...select.options].find(o=>o.textContent.includes(name));if(opt)select.value=opt.value}openModal('bookingModal')});

  const noPassport=$('#noPassport'),passportField=$('#passportField'),passportInput=$('#passportUpload');
  const togglePassport=()=>{if(!noPassport||!passportField)return;passportField.classList.toggle('hidden',noPassport.checked);if(passportInput)passportInput.required=!noPassport.checked};
  noPassport?.addEventListener('change',togglePassport);togglePassport();
  passportInput?.addEventListener('change',()=>{const img=$('#filePreview'),file=passportInput.files?.[0];if(!img)return;if(file&&file.type.startsWith('image/')){img.src=URL.createObjectURL(file);img.style.display='block'}else img.style.display='none'});

  $$('form[data-demo-flow]').forEach(form=>form.addEventListener('submit',e=>{
    e.preventDefault();if(!form.reportValidity())return;
    const modal=form.closest('.modal'),view=$('[data-form-view]',modal),success=$('[data-success]',modal);view?.classList.add('hidden');success?.classList.remove('hidden');
    const ref=$('[data-ref]',modal);if(ref)ref.textContent='SAI-'+Math.floor(100000+Math.random()*900000);
  }));

  $('#flightSearch')?.addEventListener('submit',e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;$('#flightResults')?.classList.remove('hidden');notify('৩টি নমুনা ফ্লাইট পাওয়া গেছে।','3 sample flights found.');$('#flightResults')?.scrollIntoView({behavior:'smooth',block:'start'})});
  $$('input[name="trip"]').forEach(radio=>radio.addEventListener('change',()=>{const dates=$$('#flightSearch input[type="date"]'),returnDate=dates[1];if(!returnDate)return;const oneWay=$('input[name="trip"]:checked')?.value==='oneway';returnDate.required=!oneWay;returnDate.closest('.field')?.classList.toggle('hidden',oneWay)}));
  $$('[data-flight-book]').forEach(btn=>btn.addEventListener('click',()=>{const card=btn.closest('.flight-card');$('#flightSummary').textContent=card?.dataset.flight||'';openModal('ticketModal')}));

  function filterJobs(){const country=$('#countryFilter')?.value||'all',type=$('#jobFilter')?.value||'all',term=($('#jobSearch')?.value||'').toLowerCase();let found=0;$$('[data-job-card]').forEach(card=>{const show=(country==='all'||card.dataset.country===country)&&(type==='all'||card.dataset.type===type)&&card.textContent.toLowerCase().includes(term);card.classList.toggle('hidden',!show);if(show)found++});$('#jobEmpty')?.classList.toggle('hidden',found>0)}
  ['#countryFilter','#jobFilter'].forEach(id=>$(id)?.addEventListener('change',filterJobs));$('#jobSearch')?.addEventListener('input',filterJobs);
  $$('[data-job-open]').forEach(btn=>btn.addEventListener('click',()=>{const card=btn.closest('[data-job-card]');text($('#jobTitle'),card.dataset.nameBn,card.dataset.nameEn);text($('#jobMeta'),card.dataset.metaBn,card.dataset.metaEn);$('#jobApplyTitle').value=lang==='bn'?card.dataset.nameBn:card.dataset.nameEn;openModal('jobModal')}));
  $('[data-apply-job]')?.addEventListener('click',()=>{const name=$('#jobTitle').textContent;closeModal($('#jobModal'));$('#jobApplyTitle').value=name;openModal('jobApplyModal')});

  $$('[data-new-request]').forEach(btn=>btn.addEventListener('click',()=>{const modal=btn.closest('.modal');resetModal(modal);$('form',modal)?.reset();togglePassport()}));
  applyLang();
})();
