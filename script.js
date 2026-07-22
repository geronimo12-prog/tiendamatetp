'use strict';

const phone='5493498446335';
const DEFAULT_PRODUCTS=[
{id:1,name:'Mate Imperial Premium',category:'mates',label:'Mate',price:40000,stock:3,status:'low',visible:true,featured:true,image:'assets/mate-premium-negro.png',description:'Mate de presencia elegante, detalles metálicos y base trabajada. Ideal para quien busca un modelo protagonista.'},
{id:2,name:'Mate Camionero',category:'mates',label:'Mate',price:35000,stock:7,status:'available',visible:true,featured:false,image:'assets/mate-camionero.png',description:'Formato camionero de madera con virola labrada. Cómodo, firme y con estilo bien argentino.'},
{id:3,name:'Mate Calabaza con Cuero',category:'mates',label:'Mate',price:30000,stock:4,status:'available',visible:true,featured:false,image:'assets/mate-calabaza.png',description:'Calabaza natural con protector de cuero y bombilla decorada. Cada pieza presenta variaciones propias.'},
{id:4,name:'Mate Negro Clásico',category:'mates',label:'Mate',price:25000,stock:2,status:'low',visible:true,featured:false,image:'assets/mate-negro.png',description:'Diseño sobrio en cuero negro con virola metálica y base estable.'},
{id:5,name:'Mate Sombrero',category:'mates',label:'Mate',price:20000,stock:0,status:'order',visible:true,featured:false,image:'assets/mate-sombrero.png',description:'Mate de madera con una silueta original que recuerda al clásico sombrero criollo.'},
{id:6,name:'Mate Coronados de Gloria',category:'mates',label:'Mate',price:30000,stock:5,status:'available',visible:true,featured:false,image:'assets/mates-gloria.png',description:'Mate de madera grabado con el Sol de Mayo. Una opción con fuerte identidad nacional.'},
{id:7,name:'Mate de Madera',category:'mates',label:'Mate',price:22000,stock:9,status:'available',visible:true,featured:false,image:'assets/mates-madera.png',description:'Modelo de madera torneada, simple, cálido y durable para el uso de todos los días.'},
{id:8,name:'Mate Imperial Suela',category:'mates',label:'Mate',price:38000,stock:1,status:'low',visible:true,featured:false,image:'assets/mates-imperiales.png',description:'Calabaza, virola labrada y base revestida en cuero claro con costura artesanal.'},
{id:9,name:'Bombilla Dorada',category:'bombillas',label:'Bombilla',price:10000,stock:12,status:'available',visible:true,featured:false,image:'assets/bombilla-dorada.png',description:'Bombilla de acero con pico dorado, diseño curvo y filtro tipo paleta.'},
{id:10,name:'Bombilla Clásica',category:'bombillas',label:'Bombilla',price:10000,stock:18,status:'available',visible:true,featured:false,image:'assets/bombillas-clasicas.png',description:'Bombilla versátil para uso diario, con filtro plano y terminación combinada.'},
{id:11,name:'Bombilla Premium',category:'bombillas',label:'Bombilla',price:15000,stock:6,status:'available',visible:true,featured:false,image:'assets/bombillas-premium.png',description:'Modelo decorado con detalles dorados y cuerpo labrado. Terminación de estilo premium.'},
{id:12,name:'Termo Negro Grabado',category:'termos',label:'Termo',price:45000,stock:3,status:'available',visible:true,featured:false,image:'assets/termo-negro.png',description:'Termo negro de gran capacidad con manija y grabado criollo personalizado.'},
{id:13,name:'Combo Termo y Mate',category:'combos',label:'Combo',price:60000,stock:2,status:'low',visible:true,featured:false,image:'assets/combo-termo-negro.png',description:'Combo listo para acompañarte: termo negro, mate de calabaza, cuero y bombilla.'},
{id:14,name:'Combo Rosa',category:'combos',label:'Combo',price:60000,stock:0,status:'out',visible:true,featured:false,image:'assets/combo-rosa.png',description:'Set rosa compuesto por termo y mate, ideal para regalo o para renovar el equipo completo.'},
{id:15,name:'Matera Criolla Completa',category:'combos',label:'Matera',price:60000,stock:1,status:'low',visible:true,featured:false,image:'assets/matera-combo.png',description:'Matera de cuero con pelo, mate imperial y bombilla. Un conjunto de gran presencia.'}
];

const config=window.TP_SUPABASE_CONFIG||{};
const cloudReady=Boolean(window.supabase&&/^https:\/\/.+\.supabase\.co$/i.test(config.url||'')&&config.anonKey&&!/PEGAR_/i.test(config.anonKey));
const cloud=cloudReady?window.supabase.createClient(config.url,config.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const DB_NAME='tiendamatetp-demo',STORE='products';
let db,products=[],activeFilter='all',selection={},currentUser=null,isAdmin=false,busy=false;

const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const money=v=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(v)||0);
const wa=msg=>`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
const whatsappUrl=product=>wa(`Hola, quiero consultar por ${product?'el artículo "'+product+'"':'un artículo'} que vi en la página web de tiendamatetp.`);
const statusLabels={available:'Disponible',low:'Pocas unidades',order:'Por encargo',out:'Sin stock'};
const normalise=p=>({...p,id:Number(p.id),price:Number(p.price)||0,stock:Number(p.stock)||0,visible:p.visible!==false,featured:!!p.featured});

function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})};req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error)})}
function tx(mode='readonly'){return db.transaction(STORE,mode).objectStore(STORE)}
function localGetAll(){return new Promise((resolve,reject)=>{const r=tx().getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function localPut(p){return new Promise((resolve,reject)=>{const r=tx('readwrite').put(p);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function localDelete(id){return new Promise((resolve,reject)=>{const r=tx('readwrite').delete(id);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
function localClear(){return new Promise((resolve,reject)=>{const r=tx('readwrite').clear();r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
async function seedLocal(){const all=await localGetAll();if(!all.length)for(const p of DEFAULT_PRODUCTS)await localPut({...p})}

async function fetchProducts(){
 if(!cloudReady)return (await localGetAll()).map(normalise).sort((a,b)=>a.id-b.id);
 const {data,error}=await cloud.from('products').select('*').order('id',{ascending:true});
 if(error)throw error;
 return (data||[]).map(normalise);
}
async function saveProduct(p){
 if(!cloudReady)return localPut(p);
 const payload={name:p.name,category:p.category,label:p.label,price:p.price,stock:p.stock,status:p.status,visible:p.visible,featured:p.featured,image:p.image,description:p.description};
 const query=p.id?cloud.from('products').update(payload).eq('id',p.id):cloud.from('products').insert(payload);
 const {data,error}=await query.select().single();if(error)throw error;return data.id;
}
async function removeProduct(id){if(!cloudReady)return localDelete(id);const {error}=await cloud.from('products').delete().eq('id',id);if(error)throw error}
async function importProducts(list){
 if(!cloudReady){await localClear();for(const p of list)await localPut(normalise(p));return}
 const rows=list.map(({id,...p})=>({name:p.name,category:p.category,label:p.label,price:Number(p.price)||0,stock:Number(p.stock)||0,status:p.status||'available',visible:p.visible!==false,featured:!!p.featured,image:p.image,description:p.description||''}));
 const {error}=await cloud.from('products').insert(rows);if(error)throw error;
}
async function reloadProducts(){products=(await fetchProducts()).sort((a,b)=>a.id-b.id);render(activeFilter);buildCombo();renderAdmin()}

const grid=$('#productGrid'),modal=$('#productModal');
function stockBadge(p){const cls=p.status==='out'?'out':p.status==='low'?'low':p.status==='order'?'order':'available';const label=p.status==='available'&&p.stock<=3?'Pocas unidades':statusLabels[p.status]||'Disponible';return `<span class="stock-badge ${cls}">${label}${p.status!=='order'&&p.status!=='out'?` · ${p.stock}`:''}</span>`}
function render(filter='all'){
 activeFilter=filter;grid.innerHTML='';const visible=products.filter(p=>p.visible!==false&&(filter==='all'||p.category===filter));
 if(!visible.length){grid.innerHTML='<p class="empty-catalog">No hay productos disponibles en esta categoría.</p>';return}
 visible.forEach((p,index)=>{const card=document.createElement('article');card.className='product-card reveal';card.innerHTML=`<div class="product-image" data-id="${p.id}"><img src="${p.image}" alt="${p.name}" loading="lazy">${stockBadge(p)}</div><div class="product-info"><span>${p.label}</span><h3>${p.name}</h3><div class="product-bottom"><strong class="product-price">${money(p.price)}</strong><a class="mini-wa ${p.status==='out'?'disabled':''}" href="${p.status==='out'?'#':whatsappUrl(p.name)}" ${p.status==='out'?'aria-disabled="true"':'target="_blank" rel="noopener"'} aria-label="Consultar por ${p.name}">↗</a></div></div>`;grid.appendChild(card);setTimeout(()=>card.classList.add('visible'),index*35)})
}
function openProduct(id){const p=products.find(x=>x.id===id);if(!p)return;$('#modalImage').src=p.image;$('#modalImage').alt=p.name;$('#modalCategory').textContent=`${p.label} · ${statusLabels[p.status]}`;$('#modalName').textContent=p.name;$('#modalDescription').textContent=p.description;$('#modalPrice').textContent=money(p.price);const link=$('#modalWhatsapp');link.href=p.status==='out'?'#':whatsappUrl(p.name);link.textContent=p.status==='out'?'Sin stock por el momento':'Consultar por WhatsApp';link.classList.toggle('disabled',p.status==='out');modal.showModal()}
grid.addEventListener('click',e=>{const t=e.target.closest('.product-image');if(t)openProduct(Number(t.dataset.id));if(e.target.closest('.mini-wa.disabled'))e.preventDefault()});
$('.modal-close').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
$$('.filter').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');render(btn.dataset.filter)}));

const comboSteps=$('#comboSteps');
function availableForCombo(cat){return products.filter(p=>p.visible!==false&&p.category===cat&&p.status!=='out')}
function buildCombo(){selection={};comboSteps.innerHTML='';const groups=[{key:'mate',title:'1. Elegí tu mate',items:availableForCombo('mates').slice(0,6)},{key:'bombilla',title:'2. Elegí tu bombilla',items:availableForCombo('bombillas')},{key:'termo',title:'3. Elegí tu termo',items:availableForCombo('termos')},{key:'matera',title:'4. Sumá una matera (opcional)',items:[...availableForCombo('combos').filter(p=>/matera/i.test(p.name)).slice(0,1),{id:-1,name:'Sin matera',price:0,image:'assets/mate-campo.png',label:'Opcional'}]}];groups.forEach(group=>{const section=document.createElement('section');section.className='combo-step';section.dataset.key=group.key;const options=group.items.length?group.items.map(item=>`<button class="combo-option" data-key="${group.key}" data-id="${item.id}"><img src="${item.image}" alt="${item.name}"><strong>${item.name}</strong><small>${item.price?money(item.price):'Opcional'}</small></button>`).join(''):'<p class="cart-empty">No hay opciones disponibles por ahora.</p>';section.innerHTML=`<h3>${group.title}</h3><div class="combo-options">${options}</div>`;comboSteps.appendChild(section)});updateCart()}
comboSteps.addEventListener('click',e=>{const b=e.target.closest('.combo-option');if(!b)return;const id=Number(b.dataset.id),item=id===-1?{id:-1,name:'Sin matera',price:0,image:'assets/mate-campo.png',label:'Opcional'}:products.find(p=>p.id===id);selection[b.dataset.key]=item;$$(`.combo-option[data-key="${b.dataset.key}"]`).forEach(x=>x.classList.remove('selected'));b.classList.add('selected');updateCart()});
function updateCart(){const chosen=Object.entries(selection).filter(([,v])=>v&&v.name!=='Sin matera');const count=Object.keys(selection).length;$('#cartCount').textContent=`${count}/4`;$('#cartItems').innerHTML=chosen.length?chosen.map(([key,p])=>`<div class="cart-row"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><small>${money(p.price)}</small></div><button data-remove="${key}" aria-label="Quitar">×</button></div>`).join(''):'<p class="cart-empty">Todavía no elegiste productos.</p>';$('#cartTotal').textContent=money(chosen.reduce((s,[,p])=>s+p.price,0));$('#sendCombo').disabled=!(selection.mate&&selection.bombilla&&selection.termo)}
$('#cartItems').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b)return;delete selection[b.dataset.remove];$$(`.combo-option[data-key="${b.dataset.remove}"]`).forEach(x=>x.classList.remove('selected'));updateCart()});
$('#sendCombo').addEventListener('click',()=>{const name=$('#customerName').value.trim()||'Sin nombre indicado';const chosen=Object.values(selection).filter(v=>v&&v.name!=='Sin matera');const total=chosen.reduce((s,p)=>s+p.price,0);const lines=chosen.map(p=>`• ${p.name} — ${money(p.price)}`).join('\n');window.open(wa(`Hola Tiago, soy ${name}. Quiero consultar para encargar este combo que armé en la página de tiendamatetp:\n\n${lines}\n\nTotal estimado: ${money(total)}.\n¿Está disponible?`),'_blank','noopener')});

const adminModal=$('#adminModal'),editorModal=$('#editorModal');
function setConnectionStatus(type,text){const el=$('#connectionStatus');el.className=`connection-status ${type}`;el.textContent=text}
function setAdminView(){
 $('#adminLogin').hidden=isAdmin;$('#adminDashboard').hidden=!isAdmin;
 $('#sessionUser').textContent=currentUser?`Sesión: ${currentUser.email}`:'';
 if(isAdmin)renderAdmin();
}
async function verifyAdmin(user){if(!cloudReady||!user)return false;const {data,error}=await cloud.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();if(error)throw error;return Boolean(data)}
async function refreshSession(){
 if(!cloudReady){setConnectionStatus('demo','Modo de prueba local: conectá Supabase para activar el inicio de sesión real.');$('#adminEnter').disabled=true;$('#loginHelp').textContent='Abrí INSTRUCCIONES-SUPABASE.md para conectar el proyecto. El catálogo sigue funcionando como demo local.';return}
 try{const {data:{session}}=await cloud.auth.getSession();currentUser=session?.user||null;isAdmin=await verifyAdmin(currentUser);setConnectionStatus('online','Supabase conectado · acceso protegido por usuario y políticas RLS.');setAdminView()}catch(err){console.error(err);setConnectionStatus('error','No se pudo verificar la conexión con Supabase. Revisá la configuración.');}
}
$('#openAdmin').addEventListener('click',()=>{adminModal.showModal();refreshSession()});
$('.admin-close').addEventListener('click',()=>adminModal.close());
$('#adminEnter').addEventListener('click',async()=>{
 if(!cloudReady||busy)return;const email=$('#adminEmail').value.trim(),password=$('#adminPassword').value;if(!email||!password){alert('Ingresá correo y contraseña.');return}
 busy=true;$('#adminEnter').disabled=true;$('#adminEnter').textContent='Ingresando…';
 try{const {data,error}=await cloud.auth.signInWithPassword({email,password});if(error)throw error;currentUser=data.user;isAdmin=await verifyAdmin(currentUser);if(!isAdmin){await cloud.auth.signOut();currentUser=null;throw new Error('La cuenta existe, pero no tiene permiso de administrador.')}setAdminView();$('#adminPassword').value=''}catch(err){alert(err.message||'No se pudo iniciar sesión.')}finally{busy=false;$('#adminEnter').disabled=false;$('#adminEnter').textContent='Iniciar sesión'}
});
$('#adminPassword').addEventListener('keydown',e=>{if(e.key==='Enter')$('#adminEnter').click()});
$('#adminLogout').addEventListener('click',async()=>{if(cloudReady)await cloud.auth.signOut();currentUser=null;isAdmin=false;setAdminView()});
if(cloudReady)cloud.auth.onAuthStateChange(async(_event,session)=>{currentUser=session?.user||null;try{isAdmin=await verifyAdmin(currentUser)}catch{isAdmin=false}setAdminView()});

function requireAdmin(){if(!cloudReady||!isAdmin){alert('Necesitás iniciar sesión como administrador.');return false}return true}
function renderAdmin(){const box=$('#adminProducts');if(!box||!isAdmin)return;const visible=products.filter(p=>p.visible!==false).length,totalStock=products.reduce((s,p)=>s+(Number(p.stock)||0),0),out=products.filter(p=>p.status==='out').length;$('#adminSummary').innerHTML=`<article><strong>${products.length}</strong><span>Productos cargados</span></article><article><strong>${visible}</strong><span>Visibles en tienda</span></article><article><strong>${totalStock}</strong><span>Unidades registradas</span></article><article><strong>${out}</strong><span>Sin stock</span></article>`;box.innerHTML=products.map(p=>`<article class="admin-row"><img src="${p.image}" alt=""><div class="admin-main"><strong>${p.name}</strong><span>${money(p.price)} · ${statusLabels[p.status]} · ${p.stock} unidades</span></div><div class="quick-stock"><button data-minus="${p.id}">−</button><b>${p.stock}</b><button data-plus="${p.id}">+</button></div><label class="admin-visible"><input type="checkbox" data-visible="${p.id}" ${p.visible!==false?'checked':''}> visible</label><button class="admin-edit" data-edit="${p.id}">Editar</button><button class="admin-delete" data-delete="${p.id}">Eliminar</button></article>`).join('')}
$('#adminProducts').addEventListener('click',async e=>{if(!requireAdmin())return;const minus=e.target.closest('[data-minus]'),plus=e.target.closest('[data-plus]'),edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');try{if(minus||plus){const id=Number((minus||plus).dataset[minus?'minus':'plus']),p={...products.find(x=>x.id===id)};p.stock=Math.max(0,p.stock+(plus?1:-1));if(p.stock===0&&p.status!=='order')p.status='out';else if(p.stock<=3&&p.status!=='order')p.status='low';else if(p.status!=='order')p.status='available';await saveProduct(p);await reloadProducts()}if(edit)openEditor(Number(edit.dataset.edit));if(del&&confirm('¿Eliminar este producto definitivamente?')){await removeProduct(Number(del.dataset.delete));await reloadProducts()}}catch(err){console.error(err);alert(`No se pudo guardar: ${err.message}`)}});
$('#adminProducts').addEventListener('change',async e=>{if(!e.target.matches('[data-visible]')||!requireAdmin())return;const p={...products.find(x=>x.id===Number(e.target.dataset.visible)),visible:e.target.checked};try{await saveProduct(p);await reloadProducts()}catch(err){alert(`No se pudo actualizar: ${err.message}`)}});
function openEditor(id=null){if(!requireAdmin())return;const p=id?products.find(x=>x.id===id):{id:'',name:'',category:'mates',label:'Mate',price:0,stock:0,status:'available',visible:true,featured:false,image:'assets/mate-premium-negro.png',description:''};$('#editorTitle').textContent=id?'Editar producto':'Nuevo producto';$('#editId').value=p.id;$('#editName').value=p.name;$('#editCategory').value=p.category;$('#editLabel').value=p.label;$('#editPrice').value=p.price;$('#editStock').value=p.stock;$('#editStatus').value=p.status;$('#editDescription').value=p.description;$('#editImage').value=p.image;$('#editVisible').checked=p.visible!==false;$('#editFeatured').checked=!!p.featured;$('#editUpload').value='';editorModal.showModal()}
$('#newProduct').addEventListener('click',()=>openEditor());$('.editor-close').addEventListener('click',()=>editorModal.close());$('#cancelEdit').addEventListener('click',()=>editorModal.close());
async function uploadImage(file){
 if(!file)return null;if(file.size>8*1024*1024)throw new Error('La imagen supera los 8 MB.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Usá una imagen JPG, PNG o WebP.');
 const safe=file.name.toLowerCase().replace(/[^a-z0-9.]+/g,'-'),path=`${currentUser.id}/${Date.now()}-${safe}`;
 const {error}=await cloud.storage.from(config.storageBucket||'product-images').upload(path,file,{cacheControl:'3600',upsert:false});if(error)throw error;
 const {data}=cloud.storage.from(config.storageBucket||'product-images').getPublicUrl(path);return data.publicUrl;
}
$('#productForm').addEventListener('submit',async e=>{e.preventDefault();if(!requireAdmin()||busy)return;busy=true;const submit=e.submitter;submit.disabled=true;submit.textContent='Guardando…';try{const oldId=Number($('#editId').value)||undefined;let image=$('#editImage').value.trim();const upload=$('#editUpload').files[0];if(upload)image=await uploadImage(upload);const p={...(oldId?products.find(x=>x.id===oldId):{}),name:$('#editName').value.trim(),category:$('#editCategory').value,label:$('#editLabel').value.trim(),price:Number($('#editPrice').value),stock:Number($('#editStock').value),status:$('#editStatus').value,description:$('#editDescription').value.trim(),image,visible:$('#editVisible').checked,featured:$('#editFeatured').checked};if(oldId)p.id=oldId;await saveProduct(p);editorModal.close();await reloadProducts()}catch(err){console.error(err);alert(`No se pudo guardar el producto: ${err.message}`)}finally{busy=false;submit.disabled=false;submit.textContent='Guardar cambios'}});
$('#exportDb').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:2,source:cloudReady?'supabase':'local',exportedAt:new Date().toISOString(),products},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='tiendamatetp-copia-productos.json';a.click();URL.revokeObjectURL(a.href)});
$('#importDb').addEventListener('change',async e=>{const file=e.target.files[0];if(!file||!requireAdmin())return;try{const data=JSON.parse(await file.text()),list=Array.isArray(data)?data:data.products;if(!Array.isArray(list))throw new Error('Formato inválido');if(!confirm(`¿Importar ${list.length} productos? Se agregarán a los existentes.`))return;await importProducts(list);await reloadProducts();alert('Productos importados correctamente.')}catch(err){alert(`No se pudo importar: ${err.message}`)}finally{e.target.value=''}});

const menuBtn=$('.menu-toggle'),nav=$('.nav');menuBtn.addEventListener('click',()=>{nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',nav.classList.contains('open'))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
window.addEventListener('scroll',()=>{$('.site-header').classList.toggle('scrolled',scrollY>40);const hero=$('.hero-image');if(hero&&scrollY<innerHeight*1.2)hero.style.transform=`translateY(${scrollY*.12}px) scale(1.02)`},{passive:true});
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('visible')}),{threshold:.1});$$('.reveal').forEach(el=>observer.observe(el));
const themeToggle=$('#themeToggle');themeToggle.addEventListener('click',()=>{const night=document.documentElement.dataset.theme!=='noche';document.documentElement.dataset.theme=night?'noche':'campo';themeToggle.classList.toggle('active',night);themeToggle.setAttribute('aria-pressed',night);themeToggle.querySelector('span').textContent=night?'☀':'☾';themeToggle.querySelector('small').textContent=night?'Campo':'Noche';localStorage.setItem('tp-theme',night?'noche':'campo')});if(localStorage.getItem('tp-theme')==='noche')themeToggle.click();
$$('.tilt-card').forEach(card=>{card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(1000px) rotateY(${x*7}deg) rotateX(${-y*7}deg)`});card.addEventListener('mouseleave',()=>card.style.transform='')});
window.addEventListener('load',()=>setTimeout(()=>$('#intro').classList.add('hidden'),1200));$('#year').textContent=new Date().getFullYear();
const craftDetail=$('#craftDetail');$$('.hotspot').forEach(btn=>btn.addEventListener('click',()=>{$$('.hotspot').forEach(x=>x.classList.remove('active'));btn.classList.add('active');craftDetail.innerHTML=`<strong>${btn.dataset.title}</strong><span>${btn.dataset.copy}</span>`}));
$$('.gift-card').forEach(card=>card.addEventListener('click',e=>{e.preventDefault();window.open(wa(`Hola Tiago, estoy buscando un regalo para ${card.dataset.occasion}. Vi la sección "Regalá un mate" en la página de tiendamatetp y quiero conocer las opciones disponibles.`),'_blank','noopener')}));$('#businessWhatsapp').href=wa('Hola Tiago, quiero consultar por un pedido personalizado para una empresa, club o evento que vi en la página de tiendamatetp. Quisiera conocer opciones, cantidades y tiempos de entrega.');

(async()=>{try{if(!cloudReady){await openDb();await seedLocal()}await reloadProducts();await refreshSession()}catch(err){console.error(err);if(cloudReady){setConnectionStatus('error','La base en la nube todavía no está preparada. Ejecutá supabase-schema.sql.');products=DEFAULT_PRODUCTS.map(normalise);render();buildCombo()}else alert('No se pudo iniciar la base local. Probá abrir la página en Chrome o Edge.')}})();
