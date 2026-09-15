(()=>{
  let lang=localStorage.getItem('sohrab-lang')||'bn';
  const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
  function applyLang(){
    document.documentElement.lang=lang;
    $$('[data-bn][data-en]').forEach(el=>el.innerHTML=el.dataset[lang]);
    $$('[data-placeholder-bn]').forEach(el=>el.placeholder=el.dataset['placeholder'+(lang==='bn'?'Bn':'En')]);
    $$('.lang-btn').forEach(b=>b.textContent=lang==='bn'?'EN':'বাংলা');
    const t=$('title');if(t?.dataset[lang])t.textContent=t.dataset[lang];
    updatePackageSummary($('.package-card.selected'));
    updateRoute();
  }
  $$('.lang-btn').forEach(b=>b.addEventListener('click',()=>{lang=lang==='bn'?'en':'bn';localStorage.setItem('sohrab-lang',lang);applyLang()}));
  $('.menu-btn')?.addEventListener('click',()=>document.body.classList.toggle('menu-open'));
  $$('.navlinks a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu-open')));

  $$('[data-carousel]').forEach(carousel=>{
    const slides=$$('.slide',carousel),dots=$$('.dot-btn',carousel);let current=0,timer;
    const show=i=>{current=(i+slides.length)%slides.length;slides.forEach((s,n)=>s.classList.toggle('active',n===current));dots.forEach((d,n)=>d.classList.toggle('active',n===current))};
    const play=()=>{clearInterval(timer);timer=setInterval(()=>show(current+1),5200)};
    dots.forEach((d,i)=>d.addEventListener('click',()=>{show(i);play()}));
    carousel.addEventListener('mouseenter',()=>clearInterval(timer));carousel.addEventListener('mouseleave',play);show(0);play();
  });

  const packageCards=$$('[data-package]');
  function updatePackageSummary(card){if(!card)return;const suffix=lang==='bn'?'Bn':'En';$('#sumName').textContent=card.dataset['name'+suffix];$('#sumDays').textContent=card.dataset['days'+suffix];$('#sumPrice').textContent=card.dataset.price}
  packageCards.forEach(card=>{const select=()=>{packageCards.forEach(c=>c.classList.remove('selected'));card.classList.add('selected');updatePackageSummary(card)};card.addEventListener('click',select);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select()}})});

  function updateRoute(){const select=$('#destination');if(!select)return;const option=select.selectedOptions[0],code=option.value,city=lang==='bn'?option.dataset.cityBn:option.dataset.city;$('#destCode').textContent=code;$('#destCity').textContent=city;$('#mapDestLabel').textContent=city.toUpperCase();const plane=$('#planeGroup');plane.style.animation='none';void plane.getBoundingClientRect();plane.style.animation=''}
  $('#destination')?.addEventListener('change',updateRoute);

  const toast=$('.toast');window.demoToast=(bn,en)=>{if(!toast)return;toast.textContent=lang==='bn'?bn:en;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3300)};
  $$('[data-demo]').forEach(el=>el.addEventListener('click',e=>{if(el.tagName==='A')e.preventDefault();demoToast('এটি ডেমো ইন্টার‍্যাকশন—লাইভ সংযোগে WhatsApp বা CRM-এ পাঠানো যাবে।','This is a demo interaction—it can connect to WhatsApp or a CRM in production.')}));
  $$('form[data-demo-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();demoToast('আপনার ডেমো অনুরোধ প্রস্তুত হয়েছে।','Your demo request is ready.')}));
  applyLang();
})();
