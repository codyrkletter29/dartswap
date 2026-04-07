document.addEventListener('DOMContentLoaded',function(){
  // year
  const y=document.getElementById('year');if(y) y.textContent=new Date().getFullYear();

  // nav toggle for small screens
  const btn=document.querySelector('.nav-toggle');
  const nav=document.querySelector('.nav');
  if(btn && nav){
    btn.addEventListener('click',()=>{
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      nav.style.display = expanded ? '' : 'flex';
    });
  }

  // simple form handling (no backend)
  const form=document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      const fd=new FormData(form);
      const name=fd.get('name')||'Friend';
      alert(`Thanks, ${name}! Message received (demo).`);
      form.reset();
    });
  }

  // smooth page links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',function(e){
      const target = document.querySelector(this.getAttribute('href'));
      if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth'});}
    });
  });
});
