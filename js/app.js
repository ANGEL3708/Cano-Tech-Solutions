/* ============ UTILIDADES ============ */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cop = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n||0);
const waUrl = t => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const safeImg = u => /^https?:\/\//i.test(u||'') ? u : 'https://placehold.co/400x300/e3eaee/52666e?text=Sin+imagen';
function toast(t){const e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',2600)}
function bindWa(){document.querySelectorAll('.wa-link').forEach(a=>a.href=waUrl(a.dataset.msg||'Hola Cano Tech Solutions'))}

const configured = !SUPABASE_URL.startsWith('TU_') && !SUPABASE_KEY.startsWith('TU_');
const libOk = typeof window.supabase !== 'undefined';
if(configured && !libOk) console.error('No cargó la librería de Supabase (CDN).');
const sb = (configured && libOk) ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/* ============ SITIO PÚBLICO ============ */
const COLORS = ['var(--orange)','var(--blue)','var(--green)','var(--brown)'];
const DEFAULT_SERVICES = [
  {title:'Soporte y reparación de cómputo',icon:'pc',description:'Formateo, limpieza, cambio de piezas, virus y optimización de PC y portátiles.'},
  {title:'Reparación de impresoras',icon:'printer',description:'Atascos, cabezales, sistemas de tinta continua y mantenimiento de láser e inyección.'},
  {title:'Cámaras de seguridad CCTV/IP',icon:'cam',description:'Instalación, configuración y acceso remoto desde tu celular.'},
  {title:'Cableado estructurado y redes',icon:'net',description:'Cableado, puntos de red, WiFi, racks y rotulado profesional.'}
];
const ICONS={
 pc:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
 printer:'<svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7"/></svg>',
 cam:'<svg viewBox="0 0 24 24"><path d="M3 8h13a2 2 0 0 1 2 2v1H3zM18 10l3-1v6l-3-1M6 11v5M6 16h6"/></svg>',
 net:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/></svg>',
 tool:'<svg viewBox="0 0 24 24"><path d="M14 6a4 4 0 0 0 5 5l-9 9a2.100 2.100 0 0 1-3-3l9-9z"/></svg>'};
function renderServices(list){
  $('servicesGrid').innerHTML = list.map((s,i)=>`
    <article class="svc" style="--c:${COLORS[i%4]}">
      <div class="ic" aria-hidden="true">${ICONS[s.icon]||ICONS.tool}</div>
      <h3>${esc(s.title)}</h3><p>${esc(s.description)}</p>
    </article>`).join('');
}
let PRODUCTS = [], FILTER = 'Todos';
function renderProducts(){
  const cats = ['Todos', ...new Set(PRODUCTS.map(p=>p.category))];
  $('chips').innerHTML = cats.map(c=>`<button class="chip" aria-pressed="${c===FILTER}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
  const list = PRODUCTS.filter(p=>FILTER==='Todos'||p.category===FILTER);
  $('productsGrid').innerHTML = list.length ? list.map(p=>`
    <article class="prod">
      <img src="${esc(safeImg(p.image_url))}" alt="${esc(p.name)}" loading="lazy">
      <h3>${esc(p.name)}</h3>
      <div class="sku">REF: CT-${String(p.id).padStart(4,'0')}</div>
      <div class="meta">✓ ${esc(p.category)} · Disponible</div>
      <p class="desc">${esc(p.description)}</p>
      <div class="price">${cop(p.price)}</div>
      <a class="btn btn-navy" target="_blank" rel="noopener" href="${waUrl('Hola Cano Tech Solutions, me interesa: '+p.name+' (REF CT-'+String(p.id).padStart(4,'0')+', '+cop(p.price)+')')}">Consultar</a>
    </article>`).join('') : '<p class="empty">Aún no hay productos disponibles. Escríbenos y te ayudamos a conseguirlo.</p>';
}
$('chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){FILTER=b.dataset.c;renderProducts()}});

async function loadPublic(){
  renderServices(DEFAULT_SERVICES);
  if(!sb){ $('productsGrid').innerHTML='<p class="empty">Configura SUPABASE_URL y SUPABASE_KEY para mostrar el catálogo.</p>'; return; }
  const [s,p] = await Promise.all([
    sb.from('services').select('*').order('sort_order'),
    sb.from('products').select('*').eq('active',true).order('created_at',{ascending:false})
  ]);
  if(!s.error && s.data.length) renderServices(s.data);
  if(p.error){ $('productsGrid').innerHTML='<p class="empty">No pudimos cargar el catálogo. Intenta de nuevo más tarde.</p>'; return; }
  PRODUCTS = p.data; renderProducts();
}

/* ============ ADMIN ============ */
const admin = $('admin');
let idle;
function armIdle(){ clearTimeout(idle); idle=setTimeout(async()=>{ await sb.auth.signOut(); refreshAuthUI(); toast('Sesión cerrada por inactividad'); },15*60*1000); }
['click','keydown'].forEach(ev=>admin.addEventListener(ev,()=>{ if(!$('dash').hidden) armIdle(); }));
function showAdmin(open){
  admin.classList.toggle('open',open);
  document.body.style.overflow = open ? 'hidden' : '';
  if(open){ history.replaceState(null,'',location.pathname+location.search); refreshAuthUI(); }
}
async function refreshAuthUI(){
  let session = null;
  if(sb){ session = (await sb.auth.getSession()).data.session; }
  $('loginForm').hidden = !!session;
  $('dash').hidden = !session;
  $('logoutBtn').hidden = !session;
  if(session){ armIdle(); loadAdminData(); }
}
$('closeAdmin').onclick = ()=>showAdmin(false);
const checkHash = ()=>{ if(location.hash==='#'+ADMIN_HASH) showAdmin(true); };
checkHash(); addEventListener('hashchange',checkHash);
let fails=0, lockUntil=0;

$('loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const m=$('loginMsg'); m.className='msg';
  if(Date.now()<lockUntil){ m.textContent='Demasiados intentos. Espera 1 minuto.'; m.classList.add('err'); return; }
  if(!sb){ m.textContent=libOk?'Configura primero SUPABASE_URL y SUPABASE_KEY.':'No cargó la librería de Supabase. Recarga con Ctrl+F5 o desactiva el bloqueo de Brave Shields.'; m.classList.add('err'); return; }
  m.textContent='Verificando…';
  const {error}=await sb.auth.signInWithPassword({email:$('lEmail').value.trim(),password:$('lPass').value});
  if(error){ if(++fails>=5){ lockUntil=Date.now()+60000; fails=0; } m.textContent='No se pudo entrar: '+error.message; m.classList.add('err'); return; }
  fails=0;
  $('lPass').value=''; m.textContent=''; refreshAuthUI();
});
$('logoutBtn').onclick = async ()=>{ await sb.auth.signOut(); refreshAuthUI(); };

/* --- Productos --- */
let ADM_P = [], ADM_S = [];
async function loadAdminData(){
  const [p,s] = await Promise.all([
    sb.from('products').select('*').order('created_at',{ascending:false}),
    sb.from('services').select('*').order('sort_order')
  ]);
  if(p.error||s.error){ toast('Error al cargar datos'); return; }
  ADM_P=p.data; ADM_S=s.data;
  $('pRows').innerHTML = ADM_P.map(x=>`<tr>
    <td><img src="${esc(safeImg(x.image_url))}" alt=""></td>
    <td>${esc(x.name)}</td><td>${esc(x.category)}</td><td>${cop(x.price)}</td>
    <td><span class="tag ${x.active?'':'off'}">${x.active?'Activo':'Inactivo'}</span></td>
    <td><div class="acts"><button class="btn btn-sm btn-line" data-pe="${x.id}">Editar</button><button class="btn btn-sm btn-red" data-pd="${x.id}">Eliminar</button></div></td></tr>`).join('')
    || '<tr><td colspan="6">Sin productos. Agrega el primero arriba.</td></tr>';
  $('sRows').innerHTML = ADM_S.map(x=>`<tr>
    <td>${esc(x.title)}</td><td>${x.sort_order}</td>
    <td><div class="acts"><button class="btn btn-sm btn-line" data-se="${x.id}">Editar</button><button class="btn btn-sm btn-red" data-sd="${x.id}">Eliminar</button></div></td></tr>`).join('')
    || '<tr><td colspan="3">Sin servicios propios: el sitio muestra los servicios por defecto.</td></tr>';
}
function resetP(){ $('pForm').reset(); $('pId').value=''; $('pActive').checked=true; $('pFormTitle').textContent='Agregar nuevo producto'; $('pCancel').hidden=true; }
function resetS(){ $('sForm').reset(); $('sId').value=''; $('sIcon').value='pc'; $('sFormTitle').textContent='Agregar servicio'; $('sCancel').hidden=true; }
$('pCancel').onclick=resetP; $('sCancel').onclick=resetS;

$('pForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const row={name:$('pName').value.trim(),category:$('pCat').value,price:Number($('pPrice').value),
    description:$('pDesc').value.trim(),image_url:$('pImg').value.trim()||null,active:$('pActive').checked};
  const id=$('pId').value;
  const {error}= id ? await sb.from('products').update(row).eq('id',id) : await sb.from('products').insert(row);
  if(error){ toast('No se pudo guardar: '+error.message); return; }
  toast(id?'Producto actualizado':'Producto agregado'); resetP(); loadAdminData(); loadPublic();
});
$('sForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const row={title:$('sTitle').value.trim(),icon:$('sIcon').value,description:$('sDesc').value.trim(),sort_order:Number($('sOrder').value)||0};
  const id=$('sId').value;
  const {error}= id ? await sb.from('services').update(row).eq('id',id) : await sb.from('services').insert(row);
  if(error){ toast('No se pudo guardar: '+error.message); return; }
  toast(id?'Servicio actualizado':'Servicio agregado'); resetS(); loadAdminData(); loadPublic();
});

$('dash').addEventListener('click', async e=>{
  const b=e.target.closest('button'); if(!b) return;
  const d=b.dataset;
  if(d.pe){ const x=ADM_P.find(p=>p.id==d.pe); $('pId').value=x.id;$('pName').value=x.name;$('pCat').value=x.category;$('pPrice').value=x.price;$('pImg').value=x.image_url||'';$('pDesc').value=x.description||'';$('pActive').checked=x.active;$('pFormTitle').textContent='Editar producto';$('pCancel').hidden=false;$('pForm').scrollIntoView({behavior:'smooth'}); }
  if(d.pd && confirm('¿Eliminar este producto? No se puede deshacer.')){ const {error}=await sb.from('products').delete().eq('id',d.pd); toast(error?'Error al eliminar':'Producto eliminado'); loadAdminData(); loadPublic(); }
  if(d.se){ const x=ADM_S.find(s=>s.id==d.se); $('sId').value=x.id;$('sTitle').value=x.title;$('sIcon').value=x.icon||'tool';$('sDesc').value=x.description||'';$('sOrder').value=x.sort_order;$('sFormTitle').textContent='Editar servicio';$('sCancel').hidden=false;$('sForm').scrollIntoView({behavior:'smooth'}); }
  if(d.sd && confirm('¿Eliminar este servicio?')){ const {error}=await sb.from('services').delete().eq('id',d.sd); toast(error?'Error al eliminar':'Servicio eliminado'); loadAdminData(); loadPublic(); }
});

/* ============ INICIO ============ */
$('yr').textContent = new Date().getFullYear();
bindWa();
loadPublic();

/* Flechas del carrusel */
document.querySelectorAll('.car-btn').forEach(b=>b.addEventListener('click',()=>{
  const t=$('productsGrid'); t.scrollBy({left:(b.classList.contains('next')?1:-1)*(t.clientWidth*.8),behavior:'smooth'});
}));
