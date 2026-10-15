'use strict';

const phone='5493498446335';
const config=window.TP_SUPABASE_CONFIG||{};
const cloudReady=Boolean(window.supabase&&/^https:\/\/.+\.supabase\.co$/i.test(config.url||'')&&config.anonKey&&!/PEGAR_/i.test(config.anonKey));
const cloud=cloudReady?window.supabase.createClient(config.url,config.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
let products=[],activeFilter='all',selection={},currentUser=null,isAdmin=false,busy=false,cloudOnline=false,searchTerm='',sortMode='featured',activeProduct=null,modalQty=1,activeMediaIndex=0;

const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const money=v=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(v)||0);
const wa=msg=>`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
const whatsappUrl=product=>wa(`Hola, quiero consultar por ${product?'el artículo "'+product+'"':'un artículo'} que vi en la página web de tiendamatetp.`);
const statusLabels={available:'Disponible',low:'Pocas unidades',order:'Por encargo',out:'Sin stock'};
const categoryStyles={mates:{tag:'Ronda',accent:'mates'},bombillas:{tag:'Acero',accent:'bombillas'},termos:{tag:'Ruta',accent:'termos'},combos:{tag:'Combo listo',accent:'combos'}};
const FALLBACK_IMAGE='';
function safeImage(img){if(!img)return;img.addEventListener('error',()=>{img.hidden=true;img.closest('.product-image,.spotlight-image,.river-media,.ready-combo-media,.modal-media-stage')?.classList.add('image-missing')},{once:true})}
function bindImageFallbacks(root=document){root.querySelectorAll('img').forEach(safeImage)}
const normalise=p=>({...p,id:Number(p.id),price:Number(p.price)||0,compare_at_price:p.compare_at_price==null||p.compare_at_price===''?null:Number(p.compare_at_price)||null,stock:Number(p.stock)||0,visible:p.visible!==false,featured:!!p.featured});
const hasSale=p=>Number(p?.compare_at_price)>Number(p?.price)&&Number(p?.price)>=0;
const discountPct=p=>hasSale(p)?Math.max(1,Math.round((1-(Number(p.price)/Number(p.compare_at_price)))*100)):0;
function priceMarkup(p,{compact=false}={}){if(!hasSale(p))return `<span class="price-current">${money(p.price)}</span>`;return `<span class="price-sale ${compact?'compact':''}"><span class="price-current">${money(p.price)}</span><del>${money(p.compare_at_price)}</del><em>-${discountPct(p)}%</em></span>`}

async function fetchProducts(){
 if(!cloudReady){cloudOnline=false;throw new Error('Supabase no está configurado.')}
 const [{data,error},{data:mediaRows,error:mediaError}]=await Promise.all([
  cloud.from('products').select('*').order('id',{ascending:true}),
  cloud.from('product_media').select('*').order('position',{ascending:true}).order('id',{ascending:true})
 ]);
 if(error)throw error;if(mediaError)throw mediaError;
 cloudOnline=true;const grouped={};(mediaRows||[]).forEach(m=>(grouped[m.product_id]??=[]).push(m));
 return (data||[]).map(p=>({...normalise(p),media:grouped[p.id]||[]}));
}
async function saveProduct(p){
 if(!cloudReady)throw new Error('Supabase no está configurado.');
 const payload={name:p.name,category:p.category,label:p.label,price:p.price,compare_at_price:p.compare_at_price||null,stock:p.stock,status:p.status,visible:p.visible,featured:p.featured,image:p.image,description:p.description};
 const query=p.id?cloud.from('products').update(payload).eq('id',p.id):cloud.from('products').insert(payload);
 const {data,error}=await query.select().single();if(error)throw error;return data.id;
}
async function removeProduct(id){if(!cloudReady)throw new Error('Supabase no está configurado.');const {error}=await cloud.from('products').delete().eq('id',id);if(error)throw error}
async function importProducts(list){
 if(!cloudReady)throw new Error('Supabase no está configurado.');
 const rows=list.map(({id,...p})=>({name:p.name,category:p.category,label:p.label,price:Number(p.price)||0,compare_at_price:p.compare_at_price==null||p.compare_at_price===''?null:Number(p.compare_at_price)||null,stock:Number(p.stock)||0,status:p.status||'available',visible:p.visible!==false,featured:!!p.featured,image:p.image,description:p.description||''}));
 const {error}=await cloud.from('products').insert(rows);if(error)throw error;
}
async function reloadProducts(){products=(await fetchProducts()).sort((a,b)=>a.id-b.id);render(activeFilter);renderFeatured();buildCombo();renderAdmin();updateStoreStatus()}

const grid=$('#productGrid'),modal=$('#productModal');
function stockBadge(p){const cls=p.status==='out'?'out':p.status==='low'?'low':p.status==='order'?'order':'available';let label=statusLabels[p.status]||'Disponible';if(p.status!=='order'&&p.status!=='out')label=p.stock===1?'Última unidad':p.stock<=3?`Últimas ${p.stock} unidades`:`${p.stock} unidades`;return `<span class="stock-badge ${cls}">${label}</span>`}
function sortedVisibleProducts(filter='all'){
 const term=searchTerm.trim().toLowerCase();
 const arr=products.filter(p=>p.visible!==false&&(filter==='all'||p.category===filter)&&(!term||`${p.name} ${p.label} ${p.description}`.toLowerCase().includes(term)));
 const sorters={stock:(a,b)=>b.stock-a.stock,'price-asc':(a,b)=>a.price-b.price,'price-desc':(a,b)=>b.price-a.price,name:(a,b)=>a.name.localeCompare(b.name,'es'),featured:(a,b)=>Number(b.featured)-Number(a.featured)||Number(a.status==='out')-Number(b.status==='out')||a.id-b.id};
 return arr.sort(sorters[sortMode]||sorters.featured);
}
function render(filter='all'){
 activeFilter=filter;grid.innerHTML='';const visible=sortedVisibleProducts(filter);
 if(!visible.length){grid.innerHTML=`<p class="empty-catalog">${cloudOnline?'No hay productos publicados en esta categoría.':'El catálogo no está disponible en este momento.'}</p>`;return}
 visible.forEach((p,index)=>{const card=document.createElement('article');card.className='product-card reveal';card.dataset.out=String(p.status==='out');card.dataset.category=p.category;const exact=p.status==='order'?'Por encargo':p.status==='out'?'Sin stock':`${p.stock} ${p.stock===1?'unidad':'unidades'}`;const disabled=p.status==='out';card.innerHTML=`<div class="product-image" data-id="${p.id}"><img src="${p.image}" alt="${p.name}" loading="lazy">${stockBadge(p)}</div><div class="product-info"><span>${p.label}</span><h3>${p.name}</h3><div class="product-stockline"><small>${exact}</small>${p.featured?'<b>Destacado</b>':''}</div><div class="product-bottom"><strong class="product-price">${priceMarkup(p)}</strong><div class="product-actions"><button class="product-open" data-open="${p.id}" type="button">Ver</button><button class="product-cart" data-cart-add="${p.id}" type="button" ${disabled?'disabled':''}>${disabled?'Sin stock':'Agregar'}</button></div></div></div>`;grid.appendChild(card);bindImageFallbacks(card);setTimeout(()=>card.classList.add('visible'),index*32)})
}
function animateCount(el,to,{duration=900,suffix='',prefix=''}={}){if(!el)return;const safeTo=Number(to)||0;const prefersReduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(prefersReduced){el.textContent=`${prefix}${safeTo}${suffix}`;el.dataset.value=safeTo;return}const start=Number(el.dataset.value||0),diff=safeTo-start,startTime=performance.now();function frame(now){const progress=Math.min(1,(now-startTime)/duration),eased=1-Math.pow(1-progress,3),value=Math.round(start+diff*eased);el.textContent=`${prefix}${value}${suffix}`;if(progress<1)requestAnimationFrame(frame);else el.dataset.value=safeTo}requestAnimationFrame(frame)}
function updateStoreStatus(){
 const sellable=products.filter(p=>p.visible!==false&&p.status!=='out'&&p.status!=='order');const units=sellable.reduce((sum,p)=>sum+p.stock,0),low=sellable.filter(p=>p.stock<=3).length,visible=products.filter(p=>p.visible!==false).length,featuredCount=products.filter(p=>p.visible!==false&&p.featured).length||Math.min(1,visible);
 animateCount($('#heroUnits'),units);if($('#heroProducts'))$('#heroProducts').textContent=`${visible} productos`;if($('#heroLowStock'))$('#heroLowStock').textContent=`${low} con pocas unidades`;animateCount($('#miniVisibleProducts'),visible);animateCount($('#miniFeaturedProducts'),featuredCount);
}

function renderFeatured(){
 const section=$('#destacado');if(!section)return;
 const featured=products.find(p=>p.featured&&p.visible!==false)||products.find(p=>p.visible!==false);
 if(!featured){section.hidden=true;return}
 section.hidden=false;
 const image=section.querySelector('.spotlight-image img'),title=section.querySelector('.spotlight-copy h2'),description=section.querySelector('.spotlight-copy p'),price=section.querySelector('.spotlight-price strong'),priceNote=section.querySelector('.spotlight-price small'),link=section.querySelector('.spotlight-copy .button');
 if(image){image.hidden=false;image.src=featured.image||'';image.alt=`${featured.name} destacado`;safeImage(image)}
 if(title)title.textContent=featured.name;
 if(description)description.textContent=featured.description||'Consultá disponibilidad y opciones de este producto destacado.';
 if(price)price.innerHTML=priceMarkup(featured);
 if(priceNote)priceNote.textContent=statusLabels[featured.status]||'Disponible';
 if(link){const unavailable=featured.status==='out';link.href=unavailable?'#':whatsappUrl(featured.name);link.textContent=unavailable?'Sin stock por el momento':'Consultar este producto';link.classList.toggle('disabled',unavailable);link.setAttribute('aria-disabled',unavailable?'true':'false');if(unavailable){link.removeAttribute('target');link.removeAttribute('rel')}else{link.target='_blank';link.rel='noopener'}}
}

async function keepOnlyFeatured(productId){
 if(!productId)return;
 if(!cloudReady)throw new Error('Supabase no está configurado.');
 const {error}=await cloud.from('products').update({featured:false}).eq('featured',true).neq('id',productId);if(error)throw error;
}
function updateProductModal(){if(!activeProduct)return;const p=activeProduct,max=p.status==='order'?99:Math.max(1,p.stock);modalQty=Math.max(1,Math.min(modalQty,max));$('#modalQty').value=modalQty;$('#modalSubtotal').textContent=money(p.price*modalQty);$('#qtyMinus').disabled=modalQty<=1;$('#qtyPlus').disabled=p.status!=='order'&&modalQty>=p.stock;const link=$('#modalWhatsapp'),unavailable=p.status==='out';link.href=unavailable?'#':wa(`Hola Tiago, quiero pedir ${modalQty} ${modalQty===1?'unidad':'unidades'} de "${p.name}" que vi en la web de tiendamatetp. El subtotal publicado es ${money(p.price*modalQty)}. ¿Coordinamos la compra?`);link.textContent=unavailable?'Sin stock por el momento':`Pedir ${modalQty} por WhatsApp`;link.classList.toggle('disabled',unavailable)}
function productGallery(p){return [{id:'primary',media_type:'image',url:p.image,position:-1,primary:true},...(Array.isArray(p.media)?p.media:[]).filter(m=>m&&m.url)]}
function renderProductMedia(index=0){if(!activeProduct)return;const items=productGallery(activeProduct);if(!items.length)return;activeMediaIndex=(index+items.length)%items.length;const item=items[activeMediaIndex],img=$('#modalImage'),video=$('#modalVideo'),counter=$('#galleryCounter');if(item.media_type==='video'){img.hidden=true;video.hidden=false;video.src=item.url;video.load()}else{video.pause();video.removeAttribute('src');video.load();video.hidden=true;img.hidden=false;img.src=item.url;img.alt=activeProduct.name}if(counter)counter.textContent=items.length>1?`${activeMediaIndex+1} / ${items.length}`:'';const thumbs=$('#modalThumbs');if(thumbs){thumbs.innerHTML=items.map((m,i)=>`<button type="button" class="modal-thumb ${i===activeMediaIndex?'active':''}" data-media-index="${i}" aria-label="${m.media_type==='video'?'Ver video':'Ver foto'} ${i+1}">${m.media_type==='video'?`<span class="video-thumb"><b>▶</b><small>VIDEO</small></span>`:`<img src="${m.url}" alt="">`}</button>`).join('');thumbs.hidden=items.length<=1}$('#galleryPrev').hidden=items.length<=1;$('#galleryNext').hidden=items.length<=1}
function changeProductMedia(step){renderProductMedia(activeMediaIndex+step)}
function openProduct(id){const p=products.find(x=>x.id===id);if(!p)return;activeProduct=p;modalQty=1;activeMediaIndex=0;$('#modalCategory').textContent=`${p.label} · ${statusLabels[p.status]}`;$('#modalName').textContent=p.name;$('#modalDescription').textContent=p.description;$('#modalPrice').innerHTML=priceMarkup(p);const stockText=p.status==='order'?'Disponible por encargo':p.status==='out'?'Sin stock':p.stock===1?'Queda 1 unidad':`Quedan ${p.stock} unidades`;$('#modalStockPill').textContent=stockText;$('#modalStockNote').textContent=p.status==='order'?'La cantidad se confirma con Tiago al hacer el pedido.':p.status==='out'?'Podés consultar cuándo vuelve a ingresar.':`Podés pedir hasta ${p.stock} ${p.stock===1?'unidad':'unidades'} según el stock publicado.`;renderProductMedia(0);updateProductModal();modal.showModal()}
grid.addEventListener('click',e=>{const cartBtn=e.target.closest('[data-cart-add]');if(cartBtn){addToCart(Number(cartBtn.dataset.cartAdd),1);return}const t=e.target.closest('[data-id], [data-open]');if(t)openProduct(Number(t.dataset.id||t.dataset.open))});
$('#galleryPrev').addEventListener('click',()=>changeProductMedia(-1));$('#galleryNext').addEventListener('click',()=>changeProductMedia(1));$('#modalThumbs').addEventListener('click',e=>{const b=e.target.closest('[data-media-index]');if(b)renderProductMedia(Number(b.dataset.mediaIndex))});let galleryTouchX=null;$('#modalMediaStage').addEventListener('touchstart',e=>{galleryTouchX=e.touches[0]?.clientX??null},{passive:true});$('#modalMediaStage').addEventListener('touchend',e=>{if(galleryTouchX==null)return;const end=e.changedTouches[0]?.clientX??galleryTouchX,d=end-galleryTouchX;galleryTouchX=null;if(Math.abs(d)>45)changeProductMedia(d<0?1:-1)},{passive:true});
$('.modal-close').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});$('#qtyMinus').addEventListener('click',()=>{modalQty--;updateProductModal()});$('#qtyPlus').addEventListener('click',()=>{modalQty++;updateProductModal()});
$$('.filter').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');render(btn.dataset.filter)}));
$('#productSearch').addEventListener('input',e=>{searchTerm=e.target.value;render(activeFilter)});$('#productSort').addEventListener('change',e=>{sortMode=e.target.value;render(activeFilter)});

const comboSteps=$('#comboSteps');
function availableForCombo(cat){return products.filter(p=>p.visible!==false&&p.category===cat&&p.status!=='out')}
function buildCombo(){selection={};comboSteps.innerHTML='';const groups=[{key:'mate',title:'1. Elegí tu mate',items:availableForCombo('mates')},{key:'bombilla',title:'2. Elegí tu bombilla',items:availableForCombo('bombillas')},{key:'termo',title:'3. Elegí tu termo',items:availableForCombo('termos')},{key:'matera',title:'4. Sumá una matera (opcional)',items:[...availableForCombo('combos').filter(p=>/matera/i.test(p.name)).slice(0,1),{id:-1,name:'Sin matera',price:0,image:'assets/mate-campo.png',label:'Opcional'}]}];groups.forEach(group=>{const section=document.createElement('section');section.className='combo-step';section.dataset.key=group.key;const options=group.items.length?group.items.map(item=>`<button class="combo-option" data-key="${group.key}" data-id="${item.id}"><img src="${item.image}" alt="${item.name}"><strong>${item.name}</strong><small>${item.price?money(item.price):'Opcional'}</small></button>`).join(''):'<p class="cart-empty">No hay opciones disponibles por ahora.</p>';section.innerHTML=`<h3>${group.title}</h3><div class="combo-options">${options}</div>`;comboSteps.appendChild(section)});updateCart()}
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
 if(!cloudReady){setConnectionStatus('error','Supabase no está configurado.');$('#adminEnter').disabled=true;$('#loginHelp').textContent='La tienda usa únicamente Supabase. Revisá supabase-config.js.';return}
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
function renderAdmin(){const box=$('#adminProducts');if(!box||!isAdmin)return;const visible=products.filter(p=>p.visible!==false).length,totalStock=products.reduce((s,p)=>s+(Number(p.stock)||0),0),out=products.filter(p=>p.status==='out').length;$('#adminSummary').innerHTML=`<article><strong>${products.length}</strong><span>Productos cargados</span></article><article><strong>${visible}</strong><span>Visibles en tienda</span></article><article><strong>${totalStock}</strong><span>Unidades registradas</span></article><article><strong>${out}</strong><span>Sin stock</span></article>`;box.innerHTML=products.map(p=>`<article class="admin-row"><img src="${p.image}" alt=""><div class="admin-main"><strong>${p.featured?'★ ':''}${p.name}</strong><span>${money(p.price)} · ${statusLabels[p.status]} · ${p.stock} unidades</span></div><div class="quick-stock"><button data-minus="${p.id}">−</button><b>${p.stock}</b><button data-plus="${p.id}">+</button></div><label class="admin-visible"><input type="checkbox" data-visible="${p.id}" ${p.visible!==false?'checked':''}> visible</label><button class="admin-edit" data-edit="${p.id}">Editar</button><button class="admin-delete" data-delete="${p.id}">Eliminar</button></article>`).join('')}
$('#adminProducts').addEventListener('click',async e=>{if(!requireAdmin())return;const minus=e.target.closest('[data-minus]'),plus=e.target.closest('[data-plus]'),edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');try{if(minus||plus){const id=Number((minus||plus).dataset[minus?'minus':'plus']),p={...products.find(x=>x.id===id)};p.stock=Math.max(0,p.stock+(plus?1:-1));if(p.stock===0&&p.status!=='order')p.status='out';else if(p.stock<=3&&p.status!=='order')p.status='low';else if(p.status!=='order')p.status='available';await saveProduct(p);await reloadProducts()}if(edit)openEditor(Number(edit.dataset.edit));if(del&&confirm('¿Eliminar este producto definitivamente?')){await removeProduct(Number(del.dataset.delete));await reloadProducts()}}catch(err){console.error(err);alert(`No se pudo guardar: ${err.message}`)}});
$('#adminProducts').addEventListener('change',async e=>{if(!e.target.matches('[data-visible]')||!requireAdmin())return;const p={...products.find(x=>x.id===Number(e.target.dataset.visible)),visible:e.target.checked};try{await saveProduct(p);await reloadProducts()}catch(err){alert(`No se pudo actualizar: ${err.message}`)}});
function renderEditorMedia(p){const box=$('#editorMediaManager');if(!box)return;const media=p&&Array.isArray(p.media)?p.media:[];if(!p?.id){box.innerHTML='<span class="editor-media-empty">Las fotos y videos extra se asociarán cuando guardes el producto.</span>';return}if(!media.length){box.innerHTML='<span class="editor-media-empty">Este producto todavía no tiene fotos o videos extra.</span>';return}box.innerHTML=`<strong>Galería actual · ${media.length} ${media.length===1?'archivo':'archivos'}</strong><div class="editor-media-list">${media.map(m=>`<article class="editor-media-item">${m.media_type==='video'?'<span class="editor-media-video">▶</span>':`<img src="${m.url}" alt="">`}<div><b>${m.media_type==='video'?'Video':'Foto'}</b><small>Posición ${Number(m.position)+1}</small></div><button type="button" data-remove-media="${m.id}">Eliminar</button></article>`).join('')}</div>`}
function updatePrimaryImagePreview(src=''){const img=$('#primaryImagePreviewImg'),empty=$('#primaryImagePreviewEmpty');if(!img||!empty)return;if(src){img.src=src;img.hidden=false;empty.hidden=true}else{img.removeAttribute('src');img.hidden=true;empty.hidden=false}}
function openEditor(id=null){if(!requireAdmin())return;const p=id?products.find(x=>x.id===id):{id:'',name:'',category:'mates',label:'Mate',price:0,compare_at_price:null,stock:0,status:'available',visible:true,featured:false,image:'',description:'',media:[]};$('#editorTitle').textContent=id?'Editar producto':'Nuevo producto';$('#editId').value=p.id;$('#editName').value=p.name;$('#editCategory').value=p.category;$('#editLabel').value=p.label;$('#editPrice').value=p.price;$('#editComparePrice').value=p.compare_at_price||'';$('#editStock').value=p.stock;$('#editStatus').value=p.status;$('#editDescription').value=p.description;$('#editImage').value=p.image||'';$('#editVisible').checked=p.visible!==false;$('#editFeatured').checked=!!p.featured;$('#editUpload').value='';$('#editMediaUpload').value='';updatePrimaryImagePreview(p.image||'');renderEditorMedia(p);editorModal.showModal()}
$('#newProduct').addEventListener('click',()=>openEditor());$('.editor-close').addEventListener('click',()=>editorModal.close());$('#cancelEdit').addEventListener('click',()=>editorModal.close());
async function uploadImage(file){
 if(!file)return null;if(file.size>8*1024*1024)throw new Error('La imagen supera los 8 MB.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Usá una imagen JPG, PNG o WebP.');
 const safe=file.name.toLowerCase().replace(/[^a-z0-9.]+/g,'-'),path=`${currentUser.id}/primary/${Date.now()}-${safe}`;
 const {error}=await cloud.storage.from(config.storageBucket||'product-images').upload(path,file,{cacheControl:'3600',upsert:false});if(error)throw error;
 const {data}=cloud.storage.from(config.storageBucket||'product-images').getPublicUrl(path);return data.publicUrl;
}
async function uploadProductMedia(file,productId,position){const isImage=file.type.startsWith('image/'),isVideo=file.type.startsWith('video/');if(!isImage&&!isVideo)throw new Error(`Formato no admitido: ${file.name}`);const max=isVideo?50*1024*1024:8*1024*1024;if(file.size>max)throw new Error(`${file.name} supera el máximo de ${isVideo?'50':'8'} MB.`);const allowed=isImage?['image/jpeg','image/png','image/webp']:['video/mp4','video/webm','video/quicktime'];if(!allowed.includes(file.type))throw new Error(`Formato no admitido: ${file.name}`);const safe=file.name.toLowerCase().replace(/[^a-z0-9.]+/g,'-'),path=`${currentUser.id}/products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2,7)}-${safe}`;const {error}=await cloud.storage.from(config.storageBucket||'product-images').upload(path,file,{cacheControl:'3600',upsert:false});if(error)throw error;const {data}=cloud.storage.from(config.storageBucket||'product-images').getPublicUrl(path);const row={product_id:Number(productId),media_type:isVideo?'video':'image',url:data.publicUrl,storage_path:path,position:Number(position)||0};const {error:dbError}=await cloud.from('product_media').insert(row);if(dbError){await cloud.storage.from(config.storageBucket||'product-images').remove([path]);throw dbError}return row}
async function deleteProductMedia(mediaId){const media=products.flatMap(p=>p.media||[]).find(m=>Number(m.id)===Number(mediaId));if(!media)return;const {error}=await cloud.from('product_media').delete().eq('id',media.id);if(error)throw error;if(media.storage_path){const {error:storageError}=await cloud.storage.from(config.storageBucket||'product-images').remove([media.storage_path]);if(storageError)console.warn('No se pudo borrar el archivo físico',storageError)}}
$('#editorMediaManager').addEventListener('click',async e=>{const btn=e.target.closest('[data-remove-media]');if(!btn||!requireAdmin())return;if(!confirm('¿Eliminar este archivo de la galería?'))return;try{await deleteProductMedia(Number(btn.dataset.removeMedia));await reloadProducts();const id=Number($('#editId').value);const p=products.find(x=>x.id===id);renderEditorMedia(p)}catch(err){alert(`No se pudo eliminar: ${err.message}`)}});
$('#productForm').addEventListener('submit',async e=>{e.preventDefault();if(!requireAdmin()||busy)return;busy=true;const submit=e.submitter;submit.disabled=true;submit.textContent='Guardando…';try{const oldId=Number($('#editId').value)||undefined;let image=$('#editImage').value.trim();const upload=$('#editUpload').files[0];if(upload)image=await uploadImage(upload);if(!image)throw new Error('Elegí una foto principal antes de guardar.');const p={...(oldId?products.find(x=>x.id===oldId):{}),name:$('#editName').value.trim(),category:$('#editCategory').value,label:$('#editLabel').value.trim(),price:Number($('#editPrice').value),compare_at_price:($('#editComparePrice').value.trim()?Number($('#editComparePrice').value):null),stock:Number($('#editStock').value),status:$('#editStatus').value,description:$('#editDescription').value.trim(),image,visible:$('#editVisible').checked,featured:$('#editFeatured').checked};if(oldId)p.id=oldId;const savedId=Number(await saveProduct(p)||oldId);if(p.featured)await keepOnlyFeatured(savedId);const extraFiles=[...$('#editMediaUpload').files];if(extraFiles.length){const existing=oldId?(products.find(x=>x.id===oldId)?.media||[]):[];let position=existing.length;for(const file of extraFiles){submit.textContent=`Subiendo ${position-existing.length+1}/${extraFiles.length}…`;await uploadProductMedia(file,savedId,position++)}}editorModal.close();await reloadProducts()}catch(err){console.error(err);alert(`No se pudo guardar el producto: ${err.message}`)}finally{busy=false;submit.disabled=false;submit.textContent='Guardar cambios'}});
$('#exportDb').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:2,source:'supabase',exportedAt:new Date().toISOString(),products},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='tiendamatetp-copia-productos.json';a.click();URL.revokeObjectURL(a.href)});
$('#importDb').addEventListener('change',async e=>{const file=e.target.files[0];if(!file||!requireAdmin())return;try{const data=JSON.parse(await file.text()),list=Array.isArray(data)?data:data.products;if(!Array.isArray(list))throw new Error('Formato inválido');if(!confirm(`¿Importar ${list.length} productos? Se agregarán a los existentes.`))return;await importProducts(list);await reloadProducts();alert('Productos importados correctamente.')}catch(err){alert(`No se pudo importar: ${err.message}`)}finally{e.target.value=''}});

const menuBtn=$('.menu-toggle'),nav=$('.nav');menuBtn.addEventListener('click',()=>{nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',nav.classList.contains('open'))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
window.addEventListener('scroll',()=>{$('.site-header').classList.toggle('scrolled',scrollY>40);const hero=$('.hero-image');if(hero&&scrollY<innerHeight*1.2)hero.style.transform=`translateY(${scrollY*.12}px) scale(1.02)`},{passive:true});
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('visible')}),{threshold:.1});$$('.reveal').forEach(el=>observer.observe(el));
const themeToggle=$('#themeToggle');themeToggle.addEventListener('click',()=>{const night=document.documentElement.dataset.theme!=='noche';document.documentElement.dataset.theme=night?'noche':'campo';themeToggle.classList.toggle('active',night);themeToggle.setAttribute('aria-pressed',night);themeToggle.querySelector('span').textContent=night?'☀':'☾';themeToggle.querySelector('small').textContent=night?'Campo':'Noche';localStorage.setItem('tp-theme',night?'noche':'campo')});if(localStorage.getItem('tp-theme')==='noche')themeToggle.click();
$$('.tilt-card').forEach(card=>{card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(1000px) rotateY(${x*7}deg) rotateX(${-y*7}deg)`});card.addEventListener('mouseleave',()=>card.style.transform='')});
window.addEventListener('load',()=>setTimeout(()=>$('#intro').classList.add('hidden'),7200));$('#year').textContent=new Date().getFullYear();
const craftDetail=$('#craftDetail');$$('.hotspot').forEach(btn=>btn.addEventListener('click',()=>{$$('.hotspot').forEach(x=>x.classList.remove('active'));btn.classList.add('active');craftDetail.innerHTML=`<strong>${btn.dataset.title}</strong><span>${btn.dataset.copy}</span>`}));
$$('.gift-card').forEach(card=>card.addEventListener('click',e=>{e.preventDefault();window.open(wa(`Hola Tiago, estoy buscando un regalo para ${card.dataset.occasion}. Vi la sección "Regalá un mate" en la página de tiendamatetp y quiero conocer las opciones disponibles.`),'_blank','noopener')}));$('#businessWhatsapp').href=wa('Hola Tiago, quiero consultar por un pedido personalizado para una empresa, club o evento que vi en la página de tiendamatetp. Quisiera conocer opciones, cantidades y tiempos de entrega.');

(async()=>{
 try{await reloadProducts();await refreshSession()}
 catch(err){
  console.error(err);cloudOnline=false;products=[];
  render();renderFeatured();buildCombo();renderAdmin();updateStoreStatus();renderProductRiver();renderReadyCombos();
  setConnectionStatus('error','No pudimos cargar el catálogo en este momento.');
 }
})();


function initScrollFx(){const progress=$('#scrollProgress'),backTop=$('#backTop'),sectionLinks=[...document.querySelectorAll('.nav a[href^="#"]')],sections=[...document.querySelectorAll('main section[id]')];const update=()=>{const max=document.documentElement.scrollHeight-window.innerHeight,percent=max>0?window.scrollY/max*100:0;if(progress)progress.style.width=`${percent}%`;backTop?.classList.toggle('visible',window.scrollY>560);let current='';const marker=window.scrollY+window.innerHeight*.32;sections.forEach(sec=>{if(sec.offsetTop<=marker)current=sec.id});sectionLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${current}`));};window.addEventListener('scroll',update,{passive:true});backTop?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));update()}
function initCursorGlow(){const glow=$('#cursorGlow');if(!glow||window.matchMedia('(pointer:coarse)').matches)return;let x=window.innerWidth/2,y=window.innerHeight/2,targetX=x,targetY=y;const loop=()=>{x+=(targetX-x)*.16;y+=(targetY-y)*.16;glow.style.left=`${x}px`;glow.style.top=`${y}px`;requestAnimationFrame(loop)};window.addEventListener('mousemove',e=>{targetX=e.clientX;targetY=e.clientY;glow.classList.add('active')},{passive:true});window.addEventListener('mouseout',()=>glow.classList.remove('active'));document.querySelectorAll('a,button,input,select,.product-card,.combo-option,.vibe-card').forEach(el=>{el.addEventListener('mouseenter',()=>glow.classList.add('hover'));el.addEventListener('mouseleave',()=>glow.classList.remove('hover'))});loop()}
function initMagnetic(){if(window.matchMedia('(pointer:coarse)').matches)return;document.querySelectorAll('.magnetic').forEach(el=>{el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;el.style.transform=`translate(${x*.08}px,${y*.08}px)`});el.addEventListener('mouseleave',()=>el.style.transform='')})}
function initHeroParticles(){const wrap=$('#heroParticles');if(!wrap||wrap.childElementCount)return;const count=window.innerWidth<760?14:26;for(let i=0;i<count;i++){const p=document.createElement('span');p.className='hero-particle';p.style.setProperty('--left',`${Math.random()*100}%`);p.style.setProperty('--size',`${4+Math.random()*12}px`);p.style.setProperty('--dur',`${10+Math.random()*8}s`);p.style.setProperty('--delay',`${Math.random()*-18}s`);p.style.setProperty('--drift',`${-30+Math.random()*60}px`);wrap.appendChild(p)}}

initScrollFx();initCursorGlow();initMagnetic();initHeroParticles();

function renderReadyCombos(){
 const wrap=$('#readyCombosGrid');if(!wrap)return;
 const combos=products.filter(p=>p.visible!==false&&p.category==='combos').sort((a,b)=>Number(b.featured)-Number(a.featured)||Number(a.status==='out')-Number(b.status==='out')||a.id-b.id);
 if(!combos.length){wrap.innerHTML='<div class="ready-combos-empty">Todavía no hay combos preparados publicados.</div>';return}
 wrap.innerHTML=combos.map(p=>{const stock=p.status==='order'?'Por encargo':p.status==='out'?'Sin stock':p.stock===1?'Última unidad':`${p.stock} unidades`;return `<article class="ready-combo-card" data-ready-id="${p.id}"><button class="ready-combo-media" type="button" data-open="${p.id}"><img src="${p.image}" alt="${p.name}" loading="lazy"><span class="ready-combo-stock">${stock}</span>${hasSale(p)?`<span class="ready-combo-sale">-${discountPct(p)}%</span>`:''}</button><div class="ready-combo-copy"><span>${p.label||'Combo'}</span><h3>${p.name}</h3><div class="ready-combo-bottom"><strong>${priceMarkup(p)}</strong><div><button type="button" data-open="${p.id}">Ver combo</button><button type="button" data-cart-add="${p.id}" ${p.status==='out'?'disabled':''}>${p.status==='out'?'Sin stock':'Agregar'}</button></div></div></div></article>`}).join('');
 wrap.querySelectorAll('img').forEach(safeImage);
}
$('#readyCombosGrid')?.addEventListener('click',e=>{const add=e.target.closest('[data-cart-add]');if(add){addToCart(Number(add.dataset.cartAdd),1);return}const open=e.target.closest('[data-open]');if(open)openProduct(Number(open.dataset.open))});

function renderProductRiver(){
 const track=$('#productRiverTrack');if(!track)return;
 const list=products.filter(p=>p.visible!==false);
 if(!list.length){track.innerHTML='';return}
 const card=p=>{const meta=categoryStyles[p.category]||{tag:'TP'};const stock=p.status==='order'?'Por encargo':p.status==='out'?'Sin stock':`${p.stock} ${p.stock===1?'unidad':'unidades'}`;return `<button class="river-card" type="button" data-category="${p.category}" data-river-id="${p.id}"><span class="river-media"><img src="${p.image}" alt="${p.name}" loading="lazy"><span class="river-hover">Ver producto</span></span><span class="river-card-copy"><small>${meta.tag} · ${p.label}</small><strong>${p.name}</strong><span class="river-meta"><b>${priceMarkup(p,{compact:true})}</b><em>${stock}</em></span></span></button>`};
 const html=list.map(card).join('');
 // Duplicamos el conjunto completo para que el loop sea continuo. Todo producto nuevo cargado desde Supabase entra automáticamente acá.
 track.innerHTML=html+html;
 const duration=Math.max(34,list.length*3.2);
 track.style.setProperty('--river-duration',`${duration}s`);
 track.querySelectorAll('[data-river-id]').forEach(btn=>btn.addEventListener('click',()=>openProduct(Number(btn.dataset.riverId))));
}
function initMoodShortcuts(){
 document.querySelectorAll('[data-jump-filter]').forEach(btn=>btn.addEventListener('click',()=>{
  const target=btn.dataset.jumpFilter,filter=[...document.querySelectorAll('.filter')].find(x=>x.dataset.filter===target);if(filter)filter.click();
  document.querySelector('#productos')?.scrollIntoView({behavior:'smooth',block:'start'});
 }));
}
function initCardParallax(){
 if(window.matchMedia('(pointer:coarse)').matches)return;
 document.addEventListener('mousemove',e=>{
  const card=e.target.closest('.product-card,.mood-card');if(!card)return;
  const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  card.style.transform=`perspective(1100px) rotateX(${-y*2.8}deg) rotateY(${x*2.8}deg) translateY(-4px)`;
 });
 document.addEventListener('mouseout',e=>{const card=e.target.closest?.('.product-card,.mood-card');if(card)card.style.transform=''});
}

const originalReloadProducts=reloadProducts;
reloadProducts=async function(){await originalReloadProducts();renderProductRiver();renderReadyCombos()};
initMoodShortcuts();initCardParallax();
if(products.length){renderProductRiver();renderReadyCombos()}

function initHeroWords(){const el=document.querySelector('#heroWord');if(!el)return;const words=['el momento','la ronda','la ruta','el regalo','la previa'];let i=0;setInterval(()=>{i=(i+1)%words.length;el.classList.add('swap');setTimeout(()=>{el.textContent=words[i];el.classList.remove('swap')},240)},2600)}
initHeroWords();


function initHeroSpotlight(){const hero=document.querySelector('.hero-v2');if(!hero||window.matchMedia('(pointer:coarse)').matches)return;hero.addEventListener('mousemove',e=>{const r=hero.getBoundingClientRect();const x=((e.clientX-r.left)/r.width*100).toFixed(2)+'%';const y=((e.clientY-r.top)/r.height*100).toFixed(2)+'%';hero.style.setProperty('--mx',x);hero.style.setProperty('--my',y)},{passive:true});hero.addEventListener('mouseleave',()=>{hero.style.setProperty('--mx','50%');hero.style.setProperty('--my','38%')})}
function initRevealStagger(){document.querySelectorAll('.product-grid .product-card,.trust-strip>div,.gift-card,.combo-step,.mood-card').forEach((el,i)=>el.style.setProperty('--stagger',`${(i%4)*.06}s`))}
initHeroSpotlight();initRevealStagger();


let cart=(()=>{try{return JSON.parse(localStorage.getItem('tp-cart')||'[]')}catch{return []}})();
function saveCart(){localStorage.setItem('tp-cart',JSON.stringify(cart));renderCart()}
function addToCart(id,qty=1){const p=products.find(x=>x.id===id);if(!p||p.status==='out')return;const max=p.status==='order'?99:Math.max(1,p.stock);const row=cart.find(x=>x.id===id);if(row)row.qty=Math.min(max,row.qty+qty);else cart.push({id,qty:Math.min(max,qty)});saveCart();document.querySelector('#cartFloat')?.classList.add('pulse');setTimeout(()=>document.querySelector('#cartFloat')?.classList.remove('pulse'),420)}
function removeFromCart(id){cart=cart.filter(x=>x.id!==id);saveCart()}
function changeCartQty(id,delta){const row=cart.find(x=>x.id===id);const p=products.find(x=>x.id===id);if(!row||!p)return;const max=p.status==='order'?99:Math.max(1,p.stock);row.qty=Math.max(1,Math.min(max,row.qty+delta));saveCart()}
function renderCart(){const box=$('#cartDrawerItems'),count=$('#cartCountFloat'),totalEl=$('#cartDrawerTotal');if(!box||!count||!totalEl)return;const detailed=cart.map(row=>{const p=products.find(x=>x.id===row.id);return p?{...row,p}:null}).filter(Boolean);count.textContent=detailed.reduce((s,x)=>s+x.qty,0);const total=detailed.reduce((s,x)=>s+x.p.price*x.qty,0);totalEl.textContent=money(total);if(!detailed.length){box.innerHTML='<div class="cart-empty-state"><strong>Tu carrito está vacío.</strong><span>Elegí algo del catálogo y aparece acá.</span></div>';return}box.innerHTML=detailed.map(({p,qty})=>`<article class="cart-line"><img src="${p.image}" alt="${p.name}"><div><span>${p.label}</span><strong>${p.name}</strong><small>${money(p.price)} c/u</small><div class="cart-qty"><button data-cart-dec="${p.id}" type="button">−</button><b>${qty}</b><button data-cart-inc="${p.id}" type="button">+</button></div></div><button class="cart-remove" data-cart-remove="${p.id}" type="button" aria-label="Quitar">×</button></article>`).join('')}
function openCart(){const d=$('#cartDrawer'),b=$('#cartBackdrop');if(!d||!b)return;d.classList.add('open');b.classList.add('open');d.setAttribute('aria-hidden','false');document.body.classList.add('cart-open')}
function closeCart(){const d=$('#cartDrawer'),b=$('#cartBackdrop');d?.classList.remove('open');b?.classList.remove('open');d?.setAttribute('aria-hidden','true');document.body.classList.remove('cart-open')}
$('#cartFloat')?.addEventListener('click',openCart);$('#cartClose')?.addEventListener('click',closeCart);$('#cartBackdrop')?.addEventListener('click',closeCart);$('#cartDrawerItems')?.addEventListener('click',e=>{const rm=e.target.closest('[data-cart-remove]'),inc=e.target.closest('[data-cart-inc]'),dec=e.target.closest('[data-cart-dec]');if(rm)removeFromCart(Number(rm.dataset.cartRemove));if(inc)changeCartQty(Number(inc.dataset.cartInc),1);if(dec)changeCartQty(Number(dec.dataset.cartDec),-1)});
$('#cartWhatsapp')?.addEventListener('click',()=>{const rows=cart.map(row=>{const p=products.find(x=>x.id===row.id);return p?`${row.qty} x ${p.name} (${money(p.price*row.qty)})`:null}).filter(Boolean);if(!rows.length)return;const total=cart.reduce((s,row)=>{const p=products.find(x=>x.id===row.id);return s+(p?p.price*row.qty:0)},0);window.open(wa(`Hola Tiago, armé este pedido desde la web:\n\n${rows.map(x=>'• '+x).join('\n')}\n\nTotal estimado: ${money(total)}\n\nQuiero confirmar stock y coordinar la compra.`),'_blank','noopener')});
const originalUpdateStoreStatusV15=updateStoreStatus;updateStoreStatus=function(){originalUpdateStoreStatusV15();renderCart()};renderCart();

window.addEventListener('DOMContentLoaded',()=>bindImageFallbacks(document));

const primaryUpload=$('#editUpload');if(primaryUpload)primaryUpload.addEventListener('change',()=>{const file=primaryUpload.files?.[0];if(!file)return;const url=URL.createObjectURL(file);updatePrimaryImagePreview(url);});const editImageInput=$('#editImage');if(editImageInput)editImageInput.addEventListener('input',()=>{if(!primaryUpload?.files?.length)updatePrimaryImagePreview(editImageInput.value.trim())});
