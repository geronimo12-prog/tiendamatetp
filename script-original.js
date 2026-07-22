const phone='5493498446335';
const products=[
{name:'Mate Imperial Premium',category:'mates',label:'Mate',price:40000,image:'assets/mate-premium-negro.png',description:'Mate de presencia elegante, detalles metálicos y base trabajada. Ideal para quien busca un modelo protagonista.'},
{name:'Mate Camionero',category:'mates',label:'Mate',price:35000,image:'assets/mate-camionero.png',description:'Formato camionero de madera con virola labrada. Cómodo, firme y con estilo bien argentino.'},
{name:'Mate Calabaza con Cuero',category:'mates',label:'Mate',price:30000,image:'assets/mate-calabaza.png',description:'Calabaza natural con protector de cuero y bombilla decorada. Cada pieza presenta variaciones propias.'},
{name:'Mate Negro Clásico',category:'mates',label:'Mate',price:25000,image:'assets/mate-negro.png',description:'Diseño sobrio en cuero negro con virola metálica y base estable.'},
{name:'Mate Sombrero',category:'mates',label:'Mate',price:20000,image:'assets/mate-sombrero.png',description:'Mate de madera con una silueta original que recuerda al clásico sombrero criollo.'},
{name:'Mate Coronados de Gloria',category:'mates',label:'Mate',price:30000,image:'assets/mates-gloria.png',description:'Mate de madera grabado con el Sol de Mayo. Una opción con fuerte identidad nacional.'},
{name:'Mate de Madera',category:'mates',label:'Mate',price:22000,image:'assets/mates-madera.png',description:'Modelo de madera torneada, simple, cálido y durable para el uso de todos los días.'},
{name:'Mate Imperial Suela',category:'mates',label:'Mate',price:38000,image:'assets/mates-imperiales.png',description:'Calabaza, virola labrada y base revestida en cuero claro con costura artesanal.'},
{name:'Bombilla Dorada',category:'bombillas',label:'Bombilla',price:10000,image:'assets/bombilla-dorada.png',description:'Bombilla de acero con pico dorado, diseño curvo y filtro tipo paleta.'},
{name:'Bombilla Clásica',category:'bombillas',label:'Bombilla',price:10000,image:'assets/bombillas-clasicas.png',description:'Bombilla versátil para uso diario, con filtro plano y terminación combinada.'},
{name:'Bombilla Premium',category:'bombillas',label:'Bombilla',price:15000,image:'assets/bombillas-premium.png',description:'Modelo decorado con detalles dorados y cuerpo labrado. Terminación de estilo premium.'},
{name:'Termo Negro Grabado',category:'termos',label:'Termo',price:45000,image:'assets/termo-negro.png',description:'Termo negro de gran capacidad con manija y grabado criollo personalizado.'},
{name:'Combo Termo y Mate',category:'combos',label:'Combo',price:60000,image:'assets/combo-termo-negro.png',description:'Combo listo para acompañarte: termo negro, mate de calabaza, cuero y bombilla.'},
{name:'Combo Rosa',category:'combos',label:'Combo',price:60000,image:'assets/combo-rosa.png',description:'Set rosa compuesto por termo y mate, ideal para regalo o para renovar el equipo completo.'},
{name:'Matera Criolla Completa',category:'combos',label:'Matera',price:60000,image:'assets/matera-combo.png',description:'Matera de cuero con pelo, mate imperial y bombilla. Un conjunto de gran presencia.'}
];
const money=v=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v);
const wa=msg=>`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
const whatsappUrl=product=>wa(`Hola, quiero consultar por ${product?'el artículo "'+product+'"':'un artículo'} que vi en la página web de tiendamatetp.`);

const grid=document.querySelector('#productGrid'),modal=document.querySelector('#productModal');
function render(filter='all'){
 grid.innerHTML='';
 products.filter(p=>filter==='all'||p.category===filter).forEach((p,index)=>{
  const card=document.createElement('article');card.className='product-card reveal';
  card.innerHTML=`<div class="product-image" data-index="${products.indexOf(p)}"><img src="${p.image}" alt="${p.name}" loading="lazy"></div><div class="product-info"><span>${p.label}</span><h3>${p.name}</h3><div class="product-bottom"><strong class="product-price">${money(p.price)}</strong><a class="mini-wa" href="${whatsappUrl(p.name)}" target="_blank" rel="noopener" aria-label="Consultar por ${p.name}">↗</a></div></div>`;
  grid.appendChild(card);setTimeout(()=>card.classList.add('visible'),index*45);
 });
}
function openProduct(index){const p=products[index];modal.querySelector('#modalImage').src=p.image;modal.querySelector('#modalImage').alt=p.name;modal.querySelector('#modalCategory').textContent=p.label;modal.querySelector('#modalName').textContent=p.name;modal.querySelector('#modalDescription').textContent=p.description;modal.querySelector('#modalPrice').textContent=money(p.price);modal.querySelector('#modalWhatsapp').href=whatsappUrl(p.name);modal.showModal()}
grid.addEventListener('click',e=>{const t=e.target.closest('.product-image');if(t)openProduct(Number(t.dataset.index))});
document.querySelector('.modal-close').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');render(btn.dataset.filter)}));

const comboGroups=[
 {key:'mate',title:'1. Elegí tu mate',items:products.filter(p=>p.category==='mates').slice(0,6)},
 {key:'bombilla',title:'2. Elegí tu bombilla',items:products.filter(p=>p.category==='bombillas')},
 {key:'termo',title:'3. Elegí tu termo',items:[products.find(p=>p.name==='Termo Negro Grabado'),{name:'Termo Rosa',price:45000,image:'assets/combo-rosa.png',label:'Termo'}]},
 {key:'matera',title:'4. Sumá una matera (opcional)',items:[{name:'Matera Criolla',price:30000,image:'assets/matera-combo.png',label:'Matera'},{name:'Sin matera',price:0,image:'assets/mate-campo.png',label:'Opcional'}]}
];
const selection={};
const comboSteps=document.querySelector('#comboSteps');
comboGroups.forEach(group=>{const section=document.createElement('section');section.className='combo-step';section.innerHTML=`<h3>${group.title}</h3><div class="combo-options">${group.items.map((item,i)=>`<button class="combo-option" data-key="${group.key}" data-index="${i}"><img src="${item.image}" alt="${item.name}"><strong>${item.name}</strong><small>${item.price?money(item.price):'Opcional'}</small></button>`).join('')}</div>`;comboSteps.appendChild(section)});
comboSteps.addEventListener('click',e=>{const b=e.target.closest('.combo-option');if(!b)return;const key=b.dataset.key,item=comboGroups.find(g=>g.key===key).items[Number(b.dataset.index)];selection[key]=item;document.querySelectorAll(`.combo-option[data-key="${key}"]`).forEach(x=>x.classList.remove('selected'));b.classList.add('selected');updateCart()});
function updateCart(){const chosen=Object.entries(selection).filter(([,v])=>v&&v.name!=='Sin matera');const count=Object.keys(selection).length;document.querySelector('#cartCount').textContent=`${count}/4`;document.querySelector('#cartItems').innerHTML=chosen.length?chosen.map(([key,p])=>`<div class="cart-row"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><small>${money(p.price)}</small></div><button data-remove="${key}" aria-label="Quitar">×</button></div>`).join(''):'<p class="cart-empty">Todavía no elegiste productos.</p>';document.querySelector('#cartTotal').textContent=money(chosen.reduce((s,[,p])=>s+p.price,0));document.querySelector('#sendCombo').disabled=!(selection.mate&&selection.bombilla&&selection.termo)}
document.querySelector('#cartItems').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b)return;delete selection[b.dataset.remove];document.querySelectorAll(`.combo-option[data-key="${b.dataset.remove}"]`).forEach(x=>x.classList.remove('selected'));updateCart()});
document.querySelector('#sendCombo').addEventListener('click',()=>{const name=document.querySelector('#customerName').value.trim()||'Sin nombre indicado';const chosen=Object.values(selection).filter(v=>v&&v.name!=='Sin matera');const total=chosen.reduce((s,p)=>s+p.price,0);const lines=chosen.map(p=>`• ${p.name} — ${money(p.price)}`).join('\n');const msg=`Hola Tiago, soy ${name}. Quiero consultar para encargar este combo que armé en la página de tiendamatetp:\n\n${lines}\n\nTotal estimado: ${money(total)}.\n¿Está disponible?`;window.open(wa(msg),'_blank','noopener')});


const menuBtn=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav');menuBtn.addEventListener('click',()=>{nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',nav.classList.contains('open'))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
window.addEventListener('scroll',()=>{document.querySelector('.site-header').classList.toggle('scrolled',scrollY>40);const hero=document.querySelector('.hero-image');if(hero&&scrollY<innerHeight*1.2)hero.style.transform=`translateY(${scrollY*.12}px) scale(1.02)`},{passive:true});
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('visible')}),{threshold:.1});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

const themeToggle=document.querySelector('#themeToggle');themeToggle.addEventListener('click',()=>{const night=document.documentElement.dataset.theme!=='noche';document.documentElement.dataset.theme=night?'noche':'campo';themeToggle.classList.toggle('active',night);themeToggle.setAttribute('aria-pressed',night);themeToggle.querySelector('span').textContent=night?'☀':'☾';themeToggle.querySelector('small').textContent=night?'Campo':'Noche';localStorage.setItem('tp-theme',night?'noche':'campo')});if(localStorage.getItem('tp-theme')==='noche')themeToggle.click();

document.querySelectorAll('.tilt-card').forEach(card=>{card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(1000px) rotateY(${x*7}deg) rotateX(${-y*7}deg)`});card.addEventListener('mouseleave',()=>card.style.transform='')});
window.addEventListener('load',()=>setTimeout(()=>document.querySelector('#intro').classList.add('hidden'),1200));
document.querySelector('#year').textContent=new Date().getFullYear();render();updateCart();



// Puntos interactivos de materiales
const craftDetail=document.querySelector('#craftDetail');
document.querySelectorAll('.hotspot').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.hotspot').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
 craftDetail.innerHTML=`<strong>${btn.dataset.title}</strong><span>${btn.dataset.copy}</span>`;
}));

// Regalos y pedidos especiales
 document.querySelectorAll('.gift-card').forEach(card=>card.addEventListener('click',e=>{
  e.preventDefault();const occasion=card.dataset.occasion;
  window.open(wa(`Hola Tiago, estoy buscando un regalo para ${occasion}. Vi la sección "Regalá un mate" en la página de tiendamatetp y quiero conocer las opciones disponibles.`),'_blank','noopener');
 }));
document.querySelector('#businessWhatsapp').href=wa('Hola Tiago, quiero consultar por un pedido personalizado para una empresa, club o evento que vi en la página de tiendamatetp. Quisiera conocer opciones, cantidades y tiempos de entrega.');

