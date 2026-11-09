(()=>{
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const touchInterface=window.matchMedia('(hover: none)');
// Native selects may keep :focus-visible after a mouse click; distinguish input modes.
document.addEventListener('pointerdown',()=>{document.documentElement.dataset.inputMode='pointer';},{capture:true});
document.addEventListener('keydown',()=>{document.documentElement.dataset.inputMode='keyboard';},{capture:true});
const ICONS={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',plus:'<path d="M12 5v14M5 12h14"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',shuffle:'<path d="m3 5 3 0c5 0 7 14 12 14h3m-4-4 4 4-4 4M3 19h3c2 0 4-4 5-7m3-5c1-1 2-2 4-2h3m-4-4 4 4-4 4"/>',grid:'<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>',compact:'<path d="M4 4h3v3H4zm6 0h3v3h-3zm6 0h3v3h-3zM4 10h3v3H4zm6 0h3v3h-3zm6 0h3v3h-3zM4 16h3v3H4zm6 0h3v3h-3zm6 0h3v3h-3z"/>',copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v12h5"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',unlock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.8-1M12 14v3"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',undo:'<path d="M4 9h10a6 6 0 0 1 0 12M4 9l5-5M4 9l5 5"/>',check:'<path d="m5 12 4 4L19 6"/>',swap:'<path d="M3 7h18l-4-4M21 17H3l4 4"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>'};
ICONS.moon='<path d="M20.9 13.1A9 9 0 0 1 10.9 3.1 9 9 0 1 0 20.9 13.1Z"/>';
ICONS.edit='<path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6Z"/>';
ICONS.close='<path d="m6 6 12 12M18 6 6 18"/>';
const icon=n=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||ICONS.plus}</svg>`;
function syncThemeToggle(){const dark=document.body.classList.contains('dark'),button=$('#theme-toggle');button.setAttribute('aria-pressed',String(dark));button.title=dark?'切换为浅色':'切换为深色';button.innerHTML=icon(dark?'sun':'moon');}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function shortColorName(name,maxLength){
  const shortened=Array.from(name).slice(0,maxLength).join('');
  return shortened.replace(/[（(][^（）()]*$/u,'')||shortened;
}
const validHex=v=>/^#[0-9a-f]{6}$/i.test(v);
const rgb=h=>h.slice(1).match(/../g).map(v=>parseInt(v,16));
function hsl(h){let [r,g,b]=rgb(h).map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,d=max-min,s=d?d/(1-Math.abs(2*l-1)):0,hue=0;if(d){hue=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;hue=(hue*60+360)%360}return [hue,s*100,l*100]}
function luminance(h){return rgb(h).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)}
const ratio=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
const ink=h=>ratio(h,'#FFFFFF')>=4.5?'#FFFFFF':ratio(h,'#17221B')>=4.5?'#17221B':'#000000';
function load(key,fallback){try{return JSON.parse(localStorage.getItem('guanse-'+key))??fallback}catch{return fallback}}
let storageAvailable=true;function persist(key,value){try{localStorage.setItem('guanse-'+key,JSON.stringify(value))}catch{if(storageAvailable)toast('浏览器存储不可用，本次修改仅在当前页面保留');storageAvailable=false}}
let colors=[],favorites=new Set(load('favorites',[]).filter(Number.isInteger)),saved=load('palettes',[]),draft=load('draft',[]),studio=load('studio',[]),history=[],page='explore',filter='all',query='',sort='curated',harmony='curated',limit=36,compact=false,collectionTab='colors',themeFilter='all',extracted=[],imageURL='',extractBusy=false;
if(!Array.isArray(saved))saved=[]; saved=saved.filter(p=>p&&typeof p.name==='string'&&Array.isArray(p.colors)&&p.colors.length>=2&&p.colors.length<=8&&p.colors.every(c=>c&&validHex(c.hex)&&typeof c.name==='string'));
const cleanPalette=p=>Array.isArray(p)?p.filter(c=>c&&validHex(c.hex)&&typeof c.name==='string').slice(0,8):[];draft=cleanPalette(draft);studio=cleanPalette(studio);
let pureColors=load('pure-colors',false)===true;
let hideDetailName=load('hide-detail-name',false)===true;
let fg='#304758',bg='#CADDD5',timer,colorLoader=null;
const families=[['all','全部','#242c28'],['red','赤','#c43739'],['orange','橙','#e67a2a'],['yellow','黄','#e1bd45'],['green','绿','#6d9173'],['cyan','青','#46817e'],['blue','蓝','#3c5e91'],['purple','紫','#8b658b'],['brown','褐','#896c50'],['pink','粉','#e5b8c3'],['gray','素','#929b95']];
const themes=[{name:'松风入墨',tag:'山野',desc:'松色、青瓷与纸白，留住山间的一缕风。',names:['老绿','青虾色','龙泉青瓷釉色','银白色','油烟墨']},{name:'春水煎茶',tag:'四时',desc:'一盏春茶，把江南的温柔收进日常。',names:['茶绿', '青豆色', '淡米色', '乳白色']},{name:'朱墙听雪',tag:'建筑',desc:'朱红与素白相遇，静静落下一场雪。',names:['猩红','砖红','石黄','银白色','百草霜']},{name:'远山来信',tag:'山野',desc:'远山淡影，暮色与云，层层递进的蓝。',names:['黛蓝','玉石蓝','蟹蓝','银蓝','雪灰']},{name:'桃花小笺',tag:'四时',desc:'轻粉点染枝头，写一封关于春天的信。',names:['曙红','肉红','浅粉','甘石粉','春绿']},{name:'大漠余晖',tag:'山野',desc:'落日、岩壁与金砂，暖意自土地生长。',names:['赭石色', '骆驼色', '乳黄色', '深褐色']},{name:'青瓷有声',tag:'器物',desc:'青釉上的细微变化，也是一整个世界。',names:['沙绿','湖绿','浅松绿','浅青瓷釉色','月白色']},{name:'一纸烟云',tag:'器物',desc:'从浓墨到纸白，留下恰到好处的呼吸。',names:['百草霜', '承德灰', '米灰', '立德粉']},{name:'紫藤旧梦',tag:'四时',desc:'藤花的微紫，沉在安静的灰调里。',names:['丁香紫','紫藤灰','莲灰','浅藤紫','胡粉']},{name:'秋窗疏影',tag:'建筑',desc:'秋叶、木窗与琉璃，一室温润的光。',names:['枣红','桂皮色','土黄','甘草黄','油绿']},{name:'荷塘月色',tag:'四时',desc:'浅粉与水绿，让夏夜清凉一点。',names:['荷花红', '淡粉', '荷茎绿', '鸭蛋青', '黛蓝', '月白色']},{name:'琉璃映日',tag:'建筑',desc:'瓦檐之间，黄与蓝有了明快的节奏。',names:['孔雀蓝', '青金色', '黄琉璃', '石黄', '乳白色', '绿琉璃色']},
  {name:'柳岸新晴',tag:'四时',desc:'淡青、嫩绿与鹅黄，像雨后刚放晴的柳岸。',names:['奶绿','嫩葱绿','鹅黄','月白色','苍绿']},
  {name:'潮汐入夜',tag:'山野',desc:'深海、暮潮和浪尖的薄白，蓝绿由浓转淡。',names:['藏黑蓝', '海蓝', '蟹青', '浅水绿', '蛤粉', '深松绿']},
  {name:'金线织花',tag:'器物',desc:'金地织出蓝花、粉瓣和绿叶，几笔深红压住浓彩。',names:['蛋黄', '钴蓝', '浅粉', '橄榄绿', '殷红', '库金']},
  {name:'青砖黛瓦',tag:'建筑',desc:'黛色瓦面、青灰砖墙与白墙，留一抹湿苔。',names:['元青', '深瓦灰', '立德粉', '墨绿']},
  {name:'初夏枇杷',tag:'四时',desc:'熟果的橙黄，衬着枝叶的绿和果肉的浅金。',names:['柿子色','向日黄','果肉色','枝绿','乳白色']},
  {name:'丹霞叠嶂',tag:'山野',desc:'红岩和黄砂沿山脊铺开，远处留一抹灰青。',names:['深釉红', '赭红', '雄黄', '灰米', '青灰色', '浅驼色']},
  {name:'漆器描金',tag:'器物',desc:'乌漆衬出朱红与金线，淡色留给细小纹饰。',names:['百草霜', '硃砂', '库金', '深栗色', '牙黄', '殷红']},
  {name:'园门竹影',tag:'建筑',desc:'粉墙上的竹影，和一扇被阳光照亮的红门。',names:['砖红', '松绿色', '冬绿', '胡粉', '大理石色', '暗苔绿']},
  {name:'霜林落照',tag:'四时',desc:'霜染过的红叶、金黄的落叶和树干的深褐。',names:['榴花红', '棕红', '姜黄', '浅驼色', '焦茶色', '橄榄灰']},
  {name:'苔径听泉',tag:'山野',desc:'阴处深苔、水边浅绿，再添一块湿润的灰石。',names:['暗苔绿','深松绿','苔灰','淡灰绿','石板灰']},
  {name:'素陶拾光',tag:'器物',desc:'陶坯、窑火与泥土，叠出由浅到深的暖调。',names:['土布色','肉棕','浅棕灰','乳棕','酱色']},
  {name:'廊灯初上',tag:'建筑',desc:'暮色落进回廊，灯笼把木梁照成暖红与金黄。',names:['深烟','棕红','章丹','金黄','真丝绸色']},
  {name:'冬日梅信',tag:'四时',desc:'冷灰的冬日里，梅红与柔粉先一步入春。',names:['胭脂','深烟红','粉凤仙','雪青灰','蝋白']},
  {name:'雾岭紫岚',tag:'山野',desc:'雾后山影由暗紫过渡到灰蓝，最后化成淡白。',names:['黑紫', '龙胆紫', '灰蓝', '淡藕合', '银白色', '雪青灰']},
  {name:'青花落笔',tag:'器物',desc:'一笔钴蓝在白瓷上晕开，浓处深，边缘浅。',names:['钴蓝', '群青', '浅土蓝', '月白色', '立德粉', '银蓝']},
  {name:'藻井流彩',tag:'建筑',desc:'青蓝与朱红交错，金黄勾出藻井的层层纹饰。',names:['琉璃蓝', '三绿', '银朱', '明黄', '藏蓝', '胡粉']},
  {name:'麦浪初黄',tag:'四时',desc:'麦穗初黄，田埂还留着一层未退的青。',names:['槐黄', '蛋黄', '真丝绸色', '枯绿', '浅棕茶', '枝绿']},
  {name:'芦汀飞鹭',tag:'山野',desc:'芦苇、浅滩与白鹭，沿水边铺开一组轻灰色。',names:['芦灰','青虾色','灰米','雪灰','蛤粉']},
  {name:'铜镜生绿',tag:'器物',desc:'旧铜的暖底透出深浅铜绿，边沿留着一线金光。',names:['库金','浅黄棕','铜绿色','锈绿','铁青']},
  {name:'海棠漏窗',tag:'建筑',desc:'深色窗格间透出粉墙与海棠，窗下还带一点青苔。',names:['墨绿','月季红','淡粉','胡粉','苔灰']},
  {name:'晚菊照霜',tag:'四时',desc:'秋菊的暖黄映着晚霜，一点绛紫留住花影。',names:['藤黄','乳黄色','紫绛色','浅藤紫','银白色']},
  {name:'火山余烬',tag:'山野',desc:'冷却的黑岩包着暗红裂缝，缝中透出一线橙光。',names:['承德皂','深银灰','深釉红','血红','金红']},
  {name:'胭脂小匣',tag:'器物',desc:'深漆小匣盛着浅粉与胭脂，匣边泛一点旧金。',names:['深烟红','银红','粉凤仙','甘石粉','选金']},
  {name:'水榭浮光',tag:'建筑',desc:'池水把青蓝倒映在木栏下，白石接住一片天光。',names:['湖绿','春蓝','大理石色','檀香色','深褐色']},
];
function resolveColorName(c){
  const match=colors.find(x=>x.hex===c.hex.toUpperCase()&&x.aliases?.includes(c.name));
  return match?{...c,name:match.name}:c;
}
function colorProvenance(c){
  const parts=[];
  if(c.note)parts.push(`${esc(c.note)} <a href="${c.referenceUrl}" target="_blank" rel="noopener" style="text-decoration:underline">核对记录 ↗</a>`);
  return parts.length?`<p class="notice">${parts.join('<br>')}</p>`:'';
}

const byName=n=>colors.find(c=>c.name===n)||colors[0];
const themeColors=t=>t.names.map(n=>({...byName(n),locked:false}));
function toast(s){clearTimeout(timer);$('#toast').textContent=s;$('#toast').classList.add('show');timer=setTimeout(()=>$('#toast').classList.remove('show'),2300)}
async function copy(s){try{await navigator.clipboard.writeText(s);toast('已复制 '+(s.length<35?s:'全部色值'))}catch{const t=document.createElement('textarea');t.value=s;document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();toast(ok?'已复制到剪贴板':'复制失败，请手动选择色值复制')}}
function sync(){persist('favorites',[...favorites]);persist('palettes',saved);persist('draft',draft);persist('studio',studio);$('#saved-count').textContent=favorites.size+saved.length;renderTray()}
function setNav(){ $$('[data-nav]').forEach(a=>{const active=a.dataset.nav===page;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});}
const pageHead=(title,desc,actions='')=>`<div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div>${actions}</div>`;
const backToTop=$('#back-to-top');
function updateBackToTop(){
  backToTop.toggleAttribute('hidden',page!=='explore'||window.scrollY<window.innerHeight);
}
window.addEventListener('scroll',updateBackToTop,{passive:true});
window.addEventListener('resize',updateBackToTop);
function render(){stopColorLoader();clearInterval(featureTimer);page=location.hash.slice(1).split('?')[0]||'explore';if(!['explore','palettes','studio','extract','contrast','collection'].includes(page))page='explore';setNav();const renders={explore:renderExplore,palettes:renderPalettes,studio:renderStudio,extract:renderExtract,contrast:renderContrast,collection:renderCollection};renders[page]();renderTray();updateBackToTop();}
function colorCard(c){return `<article class="color-card"><div class="swatch" style="background:${c.hex};color:${ink(c.hex)}"><button class="swatch-open" data-action="detail" data-id="${c.id}" aria-label="查看${esc(c.name)}色彩详情"><span class="color-glyph">${esc(shortColorName(c.name,3))}</span></button><span class="card-top">${String(c.id+1).padStart(3,'0')}</span></div><div class="card-meta"><button class="card-name" data-action="detail" data-id="${c.id}">${esc(c.name)}</button><button class="hex-button" data-action="copy" data-value="${c.hex}" aria-label="复制${c.name}色值">${c.hex}</button></div><div class="card-actions"><button data-action="add" data-id="${c.id}" aria-label="将${esc(c.name)}加入配色">${icon('plus')}</button><button data-action="favorite" data-id="${c.id}" class="${favorites.has(c.id)?'selected':''}" aria-label="${favorites.has(c.id)?'取消收藏':'收藏'}${esc(c.name)}" aria-pressed="${favorites.has(c.id)}">${icon('heart')}</button></div></article>`}
const featuredThemes=[
  {name:'松风入墨',surface:'#E2E9DF',darkSurface:'#29362E'},
  {name:'桃花小笺',surface:'#F3E5E6',darkSurface:'#3A2C32'},
  {name:'大漠余晖',surface:'#EFE3D3',darkSurface:'#3A3028'},
  {name:'青花落笔',surface:'#E1EAF2',darkSurface:'#27343E'},
  {name:'藻井流彩',surface:'#F1EBD6',darkSurface:'#3B3424'},
].map(feature=>({...feature,index:themes.findIndex(theme=>theme.name===feature.name)}));
const featuredColorCount=4;
let featuredSlide=0;
let featureTimer;

function renderFeatureCarousel(){
  return `<section class="feature" id="feature-carousel" aria-label="本期灵感轮播">
    <div id="feature-slide" class="feature-slide" aria-live="off"></div>
    <div class="feature-controls" aria-label="轮播控制">
      <button type="button" class="icon-button feature-prev" data-action="feature-prev" aria-label="上一组灵感" title="上一组灵感">${icon('arrow')}</button>
      <span id="feature-count" class="feature-count"></span>
      <button type="button" class="icon-button" data-action="feature-next" aria-label="下一组灵感" title="下一组灵感">${icon('arrow')}</button>
    </div>
  </section>`;
}

function updateFeatureSlide(announce=false){
  const {index,surface,darkSurface}=featuredThemes[featuredSlide];
  const carousel=$('#feature-carousel');
  carousel.style.setProperty('--feature-surface',surface);
  carousel.style.setProperty('--feature-dark-surface',darkSurface);
  const theme=themes[index];
  const slide=$('#feature-slide');
  slide.setAttribute('aria-live',announce?'polite':'off');
  slide.innerHTML=`<div class="feature-copy">
    <div class="eyebrow">本期灵感 · ${theme.tag}</div>
    <h2>${esc(theme.name)}</h2>
    <p>${esc(theme.desc)}</p>
    <button type="button" class="text-button" data-action="use-feature-theme" data-index="${index}">探索这组配色 &nbsp; ↗</button>
  </div><div class="feature-art">${themeColors(theme).slice(0,featuredColorCount).map(color=>`<div style="background:${color.hex};color:${ink(color.hex)}"><span>${esc(color.name==='龙泉青瓷釉色'?'青瓷':shortColorName(color.name,4))}</span></div>`).join('')}</div>`;
  $('#feature-count').textContent=`${featuredSlide+1} / ${featuredThemes.length}`;
}

function moveFeatureSlide(step,announce){
  const count=featuredThemes.length;
  featuredSlide=(featuredSlide+step+count)%count;
  updateFeatureSlide(announce);
}

function scheduleFeatureRotation(){
  clearInterval(featureTimer);
  const carousel=$('#feature-carousel');
  if(!carousel||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;
  featureTimer=setInterval(()=>{
    const hovered=!touchInterface.matches&&carousel.matches(':hover');
    const focused=carousel.matches(':focus-within')&&document.documentElement.dataset.inputMode!=='pointer';
    if(document.hidden||!carousel.isConnected||hovered||focused||$('#dialog').open)return;
    moveFeatureSlide(1,false);
  },4000);
}

function renderExplore(){
  const filterScroll=$('#main .filters[aria-label="按色系筛选"]')?.scrollLeft??0;
  $('#main').innerHTML=`<section class="hero"><div class="hero-copy"><div class="eyebrow">中国传统色谱</div><h1>万物有色，<br><span>观之有趣。</span></h1><p>从山川草木，到器物日常。<br>在细微的色彩之间，找到属于你的东方灵感。</p><div class="hero-actions"><a class="btn primary" href="#studio">开始一场配色 ${icon('arrow')}</a><button class="btn" data-action="random-detail">${icon('shuffle')} 遇见一色</button></div></div>${renderFeatureCarousel()}</section><section aria-labelledby="library-title"><div class="section-head"><div class="section-title"><h2 id="library-title">中国色彩档案</h2><span class="meta">${colors.length} 色 · 十种色系</span></div><label class="searchbox">${icon('search')}<input id="search" aria-label="搜索颜色名称或色值" placeholder="搜索色名或色值，如：青" value="${esc(query)}"></label></div><div class="filters" aria-label="按色系筛选">${families.map(([id,label,hex])=>`<button class="filter ${filter===id?'active':''}" data-action="filter" data-family="${id}" aria-pressed="${filter===id}">${id==='all'?'':`<span class="dot" style="background:${hex}"></span>`}${label}${id==='all'?'色彩':''}</button>`).join('')}</div><div class="resultbar"><span id="result-count"></span><div class="resultbar-right"><button class="filter pure-mode ${pureColors?'active':''}" data-action="pure-mode" aria-pressed="${pureColors}" title="隐藏色卡名称、编号和色值">纯色模式</button><label>排序 <select id="sort" aria-label="颜色排序"><option value="curated">编辑精选</option><option value="hue">按色相</option><option value="light">由浅入深</option><option value="dark">由深至浅</option><option value="name">按名称</option></select></label><div class="toggle"><button class="icon-button ${!compact?'active':''}" data-action="density" data-value="normal" aria-label="舒展布局" aria-pressed="${!compact}">${icon('grid')}</button><button class="icon-button ${compact?'active':''}" data-action="density" data-value="compact" aria-label="紧凑布局" aria-pressed="${compact}">${icon('compact')}</button></div></div></div><div id="color-grid" class="color-grid ${compact?'compact':''} ${pureColors?'pure-colors':''}"></div><div class="loadmore" id="load-more"></div></section>`;$('#sort').value=sort;updateFeatureSlide();scheduleFeatureRotation();renderColorGrid();
  $('#main .filters[aria-label="按色系筛选"]').scrollLeft=filterScroll;
}
function setColorFamily(family){
  filter=family;
  limit=36;
  $$('#main [data-action="filter"]').forEach(button=>{
    const active=button.dataset.family===filter;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  renderColorGrid();
}
function filteredColors(){let a=colors.filter(c=>(filter==='all'||c.family===filter)&&(!query||c.name.toLowerCase().includes(query.toLowerCase())||c.hex.toLowerCase().includes(query.toLowerCase())));if(sort==='curated'){const first=['老绿','青虾色','龙泉青瓷釉色','浅青瓷釉色','鸭蛋青','银白色','猩红','硃砂','赭红','金黄','石黄','乳黄色','黛蓝','玉石蓝','蟹蓝','银蓝','浅藤紫','丁香紫','枣红','肉红','浅粉','甘石粉','茶绿','浅草绿','桂皮色','骆驼色','米灰','雪灰','油烟墨','百草霜'];a.sort((x,y)=>(first.includes(x.name)?first.indexOf(x.name):-1+1000)-(first.includes(y.name)?first.indexOf(y.name):-1+1000))}if(sort==='hue')a.sort((x,y)=>hsl(x.hex)[0]-hsl(y.hex)[0]);if(sort==='light')a.sort((x,y)=>luminance(y.hex)-luminance(x.hex));if(sort==='dark')a.sort((x,y)=>luminance(x.hex)-luminance(y.hex));if(sort==='name')a.sort((x,y)=>x.name.localeCompare(y.name,'zh'));return a}
function stopColorLoader(){
  if(colorLoader){colorLoader.disconnect();colorLoader=null;}
}
function updateColorLoader(total){
  stopColorLoader();
  const sentinel=$('#load-more');
  if(!sentinel)return;
  sentinel.setAttribute('role','status');
  sentinel.setAttribute('aria-live','polite');
  sentinel.innerHTML=total>limit
    ?`<span class="meta">已显示 ${limit} / ${total} 色 · 向下滚动，继续探索</span>`
    :total?`<span class="meta">已显示全部 ${total} 色 · 每一种颜色，都值得被看见。</span>`:'';
  if(total<=limit)return;
  if(!('IntersectionObserver' in window)){
    const a=filteredColors();
    $('#color-grid').insertAdjacentHTML('beforeend',a.slice(limit).map(colorCard).join(''));
    limit=a.length;
    updateColorLoader(a.length);
    return;
  }
  const observer=new IntersectionObserver(entries=>{
    if(colorLoader!==observer||page!=='explore'||$('#load-more')!==sentinel||!entries.some(entry=>entry.isIntersecting))return;
    stopColorLoader();
    const a=filteredColors(),start=limit;
    limit=Math.min(limit+36,a.length);
    // Append only new cards so existing focus, scroll position and card nodes stay intact.
    $('#color-grid').insertAdjacentHTML('beforeend',a.slice(start,limit).map(colorCard).join(''));
    updateColorLoader(a.length);
  },{rootMargin:'0px 0px 400px 0px',threshold:0});
  colorLoader=observer;
  observer.observe(sentinel);
}
function renderColorGrid(){
  stopColorLoader();
  const a=filteredColors();
  const resultCount=$('#result-count');
  resultCount.textContent=`${query?'搜索结果':'正在探索'} ${a.length} 种颜色`;
  if(filter!=='all'){
    const familyLabel=document.createElement('span');
    familyLabel.className='result-family';
    familyLabel.textContent=` · ${families.find(f=>f[0]===filter)[1]}色系`;
    resultCount.append(familyLabel);
  }
  $('#color-grid').innerHTML=a.length?a.slice(0,limit).map(colorCard).join(''):`<div class="empty"><h3>还没有遇见这抹颜色</h3><p>试试其他色名、HEX 色值，或清除筛选。</p><button class="btn" data-action="reset-filter">查看全部色彩</button></div>`;
  updateColorLoader(a.length);
}

function matchesTheme(palette,theme,themeColors){
  return palette.name===theme.name&&palette.colors.length===themeColors.length&&
    palette.colors.every((color,index)=>color.hex.toUpperCase()===themeColors[index].hex);
}
function paletteCard(t,i,isSaved=false){
  const cs=isSaved?t.colors:themeColors(t);
  const collected=isSaved||saved.some(palette=>matchesTheme(palette,t,cs));
  const label=(collected?'取消收藏':'收藏')+t.name;
  return `<article class="palette-card"><button class="palette-strip" data-action="${isSaved?'load-saved':'use-theme'}" data-index="${i}" aria-label="使用${esc(t.name)}配色">${cs.map(c=>`<span style="background:${c.hex};color:${ink(c.hex)}"><i>${esc(shortColorName(c.name,3))}</i></span>`).join('')}</button><div class="palette-caption"><div><h3>${esc(t.name)} <span class="palette-count">${cs.length} 色</span></h3><p>${esc(t.desc||'我的配色')}</p></div><button class="icon-button" data-action="${isSaved?'unfavorite-palette':'favorite-theme'}" data-index="${i}" aria-pressed="${collected}" aria-label="${esc(label)}" title="${esc(label)}">${icon('heart')}</button></div></article>`;
}
function renderPalettes(){$('#main').innerHTML=pageHead('配色灵感','从四时风物中，借一组恰到好处的颜色。',`<a class="btn primary" href="#studio">自定义配色 ${icon('arrow')}</a>`)+`<div class="filters">${['all','四时','山野','器物','建筑'].map(v=>`<button class="filter ${themeFilter===v?'active':''}" data-action="theme-filter" data-value="${v}">${v==='all'?'全部灵感':v}</button>`).join('')}</div><div class="section-head"><span class="meta">${themes.filter(t=>themeFilter==='all'||t.tag===themeFilter).length} 组原创搭配 · 点击色带进入工作台</span></div><div class="palette-grid">${themes.map((t,i)=>themeFilter==='all'||t.tag===themeFilter?paletteCard(t,i):'').join('')}</div>`}
function pushHistory(){history.push(studio.map(c=>({...c})));if(history.length>30)history.shift()}
function moveStudioColor(index,step){
  const count=studio.length;
  if(count<2||!Number.isInteger(index)||![-1,1].includes(step)||index<0||index>=count)return;
  const target=(index+step+count)%count;
  const keyboard=document.documentElement.dataset.inputMode==='keyboard';
  swapStudioColors(index,target);
  if(keyboard)$(`[data-action="move"][data-index="${target}"][data-step="${step}"]`)?.focus({preventScroll:true});
}
function swapStudioColors(index,target){
  if(index===target||!studio[index]||!studio[target])return;
  pushHistory();
  [studio[index],studio[target]]=[studio[target],studio[index]];
  sync();
  renderStudio();
}
function renderStudio(){if(studio.length<2)studio=themeColors(themes[0]);$('#main').innerHTML=pageHead('配色工作台','让一抹心动，变成一组好颜色。锁定喜欢的颜色，再探索新的可能。',`<button class="btn primary" data-action="save-studio">${icon('heart')} 保存配色</button>`)+`<div class="studio-toolbar"><button class="btn" data-action="generate">${icon('shuffle')} 生成配色 <span class="meta keyboard-hint">空格键</span></button><select id="harmony" aria-label="配色生成规则"><option value="curated">灵感组合</option><option value="analogous">相近色相</option><option value="complement">互补色相</option><option value="random">自由随机</option></select><button class="btn" data-action="undo" ${history.length?'':'disabled'}>${icon('undo')} 撤销</button><button class="btn" data-action="add-studio" ${studio.length>=8?'disabled':''}>${icon('plus')} 添加颜色</button><span class="meta">${studio.length} / 8 色</span></div><div class="studio-colors">${studio.map((c,i)=>`<div class="studio-color" data-draft-studio="${i}" draggable="true" style="background:${c.hex};color:${ink(c.hex)}"><button class="icon-button remove-color" data-action="remove-studio" data-index="${i}" aria-label="移除${esc(c.name)}" ${studio.length<=2?'disabled':''}>×</button><button class="icon-button move-arrow move-prev" data-action="move" data-index="${i}" data-step="-1" aria-label="${i===0?'与最后一张色卡交换':`将${esc(c.name)}前移一位`}" title="${i===0?'与最后一张交换':'前移一位'}">${icon('arrow')}</button><button class="icon-button move-arrow move-next" data-action="move" data-index="${i}" data-step="1" aria-label="${i===studio.length-1?'与第一张色卡交换':`将${esc(c.name)}后移一位`}" title="${i===studio.length-1?'与第一张交换':'后移一位'}">${icon('arrow')}</button><h2 title="${esc(c.name)}" style="--studio-name-length:${Math.max(1,Array.from(c.name).length)}">${esc(c.name)}</h2><input class="color-edit" data-edit="${i}" value="${c.hex}" aria-label="第${i+1}色HEX" spellcheck="false" maxlength="7"><div class="swatch-tools"><button class="icon-button ${c.locked?'locked':''}" data-action="lock" data-index="${i}" aria-label="${c.locked?'解锁':'锁定'}第${i+1}色" aria-pressed="${!!c.locked}">${icon(c.locked?'lock':'unlock')}</button><button class="icon-button" data-action="copy" data-value="${c.hex}" aria-label="复制第${i+1}色">${icon('copy')}</button><label class="icon-button color-picker-control" title="调色">${icon('edit')}<input type="color" value="${c.hex}" data-picker="${i}" aria-label="调整第${i+1}色：${esc(c.name)}"></label></div></div>`).join('')}</div><div class="studio-bottom"><span class="meta"><span class="desktop-move-hint">拖动色卡交换位置</span><span class="touch-move-hint">用箭头交换色卡位置</span> · 点击色值或调色图标可编辑 · 随机生成时保留锁定色 · 支持 2–8 色</span><div class="export-menu"><button class="btn small" data-action="copy-all">${icon('copy')} 复制全部</button>${['PNG','SVG','CSS','JSON'].map(v=>`<button class="btn small" data-action="export" data-format="${v}">${icon('download')} ${v}</button>`).join('')}</div></div><div class="preview-row"><section class="panel"><h3>配色应用示意</h3>${designPreview(studio)}</section>${renderStudioContrast()}</div>`;$('#harmony').value=harmony}
let studioTextIndex=0;
let studioBackgroundIndex=1;

function studioContrastResult(){
  const textColor=studio[studioTextIndex].hex;
  const backgroundColor=studio[studioBackgroundIndex].hex;
  const score=ratio(textColor,backgroundColor);
  return `<div class="studio-contrast-sample" style="color:${textColor};background:${backgroundColor}" aria-hidden="true">山川入画 · 文字预览</div>
    <div class="studio-contrast-summary">
      <div>
        <span class="studio-contrast-score-label">对比度</span>
        <div class="contrast-score">${score.toFixed(2)} <span class="meta">: 1</span></div>
      </div>
      <div class="studio-contrast-status">
        ${[['普通文字',4.5],['大号文字',3]].map(([label,minimum])=>{
          const passed=score>=minimum;
          return `<div class="studio-contrast-status-row"><span>${label} AA</span><strong class="studio-contrast-badge ${passed?'is-pass':'is-fail'}">${passed?'通过':'未通过'}</strong></div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderStudioContrast(){
  if(!studio[studioTextIndex])studioTextIndex=0;
  if(!studio[studioBackgroundIndex])studioBackgroundIndex=studioTextIndex===0?1:0;
  const selectColor=(id,label,selected)=>`<label class="field" for="${id}">${label}
    <span class="studio-contrast-select">
      <select id="${id}">${studio.map((color,index)=>`<option value="${index}" ${index===selected?'selected':''}>第 ${index+1} 色 · ${esc(color.name)}</option>`).join('')}</select>
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </span>
  </label>`;
  return `<section class="panel studio-contrast" aria-labelledby="studio-contrast-title">
    <h3 id="studio-contrast-title">文字对比度</h3>
    <div class="studio-contrast-fields">
      ${selectColor('studio-contrast-text','文字色',studioTextIndex)}
      ${selectColor('studio-contrast-background','背景色',studioBackgroundIndex)}
    </div>
    <div id="studio-contrast-result" aria-live="polite">${studioContrastResult()}</div>
    <div class="studio-contrast-footer">
      <button type="button" class="text-button" data-action="test-studio">用这两色查看完整检测 →</button>
    </div>
  </section>`;
}

function designPreview(cs){const [a,b,c,d]=[cs[0],cs[1],cs[2]||cs[0],cs[3]||cs[1]];return `<div class="design-preview" style="background:${b.hex};color:${ink(b.hex)}"><div class="design-copy"><small>观色 · 配色雅集</small><h4>山川入画<br>日常成诗</h4><span style="background:${a.hex};color:${ink(a.hex)};padding:7px 13px;border-radius:3px;font-size:11px">发现生活之美 ↗</span></div><div class="design-art" style="background:${d.hex}"><span style="background:${c.hex}"></span><span style="background:${a.hex}"></span><span style="background:${b.hex}"></span></div></div>`}
function generate(){if(studio.every(c=>c.locked)){toast('所有颜色都已锁定，请先解锁一色');return}pushHistory();const mode=harmony;let base=studio.find(c=>c.locked)||colors[Math.floor(Math.random()*colors.length)],h=hsl(base.hex)[0],pool=colors;if(mode==='analogous')pool=colors.filter(c=>Math.min(Math.abs(hsl(c.hex)[0]-h),360-Math.abs(hsl(c.hex)[0]-h))<30);if(mode==='complement')pool=colors.filter(c=>{const d=Math.abs(hsl(c.hex)[0]-h);return d<25||(d>155&&d<205)});const preset=themeColors(themes[Math.floor(Math.random()*themes.length)]),used=new Set(studio.filter(c=>c.locked).map(c=>c.hex));studio=studio.map((c,i)=>{if(c.locked)return c;let candidates=pool.filter(x=>!used.has(x.hex));if(mode==='complement'){const target=(h+(i%2?180:0))%360;const paired=candidates.filter(x=>Math.min(Math.abs(hsl(x.hex)[0]-target),360-Math.abs(hsl(x.hex)[0]-target))<35);if(paired.length)candidates=paired;}if(!candidates.length)candidates=colors.filter(x=>!used.has(x.hex));let next=mode==='curated'&&!used.has(preset[i%preset.length].hex)?preset[i%preset.length]:candidates[Math.floor(Math.random()*candidates.length)];used.add(next.hex);return {...next,locked:false}});sync();renderStudio();$('#harmony').value=mode;toast('新配色已生成，锁定色已保留')}
let pickedPixel=null;
let pickerEnabled=true;
ICONS.eyedropper='<path d="m14 7 3 3m-7 5-4 4H4v-2l4-4m0 0 8-8a2.1 2.1 0 0 1 3 3l-8 8-3-3Z"/>';

function renderPickedPixel(){
  const result=$('#extract-picked');
  if(!pickedPixel){
    result.innerHTML='<p class="extract-muted">用取色笔点一下图片，查看该位置的色值。</p>';
    return;
  }
  const {hex,channels,nearest,x,y}=pickedPixel;
  result.innerHTML=`<div class="extract-pixel-result">
    <span class="extract-pixel-swatch" style="background:${hex}" aria-hidden="true"></span>
    <div><strong>${hex}</strong><span>RGB ${channels.join(', ')}</span></div>
    <button type="button" class="icon-button" data-action="copy" data-value="${hex}" aria-label="复制取色点的色值" title="复制色值">${icon('copy')}</button>
  </div><p class="extract-pixel-meta">接近 ${esc(nearest.name)} <span>像素位置 ${x}, ${y}</span></p>`;
}

function pickImagePixel(img,x,y){
  if(!img.naturalWidth||!img.naturalHeight)return;
  x=Math.max(0,Math.min(img.naturalWidth-1,Math.floor(x)));
  y=Math.max(0,Math.min(img.naturalHeight-1,Math.floor(y)));
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=1;
  const ctx=canvas.getContext('2d');
  // Use the same white backing as the image preview and palette extraction.
  ctx.fillStyle='#fff';
  ctx.fillRect(0,0,1,1);
  ctx.drawImage(img,x,y,1,1,0,0,1,1);
  const channels=Array.from(ctx.getImageData(0,0,1,1).data.slice(0,3));
  const hex='#'+channels.map(value=>value.toString(16).padStart(2,'0')).join('').toUpperCase();
  const distance=color=>rgb(color.hex).reduce((sum,value,index)=>sum+(value-channels[index])**2,0);
  const nearest=colors.reduce((best,color)=>distance(color)<distance(best)?color:best);
  pickedPixel={x,y,hex,channels,nearest};
  renderPickedPixel();
  const marker=$('#extract-marker');
  marker.style.left=`${(x+.5)/img.naturalWidth*100}%`;
  marker.style.top=`${(y+.5)/img.naturalHeight*100}%`;
  marker.hidden=false;
}

const extractExamples=[
  {id:'landscape',title:'千里江山图（局部）',caption:'石青 · 石绿',credit:'故宫博物院',url:'https://www.dpm.org.cn/collection/paint/228354.html'},
  {id:'ladies',title:'簪花仕女图',caption:'朱红 · 赭黄',credit:'辽宁省博物馆藏',url:'https://whly.ln.gov.cn/whly/tpxw/2025041514123084428/index.shtml'},
  {id:'peony-brocade',title:'缠枝牡丹金宝地锦',caption:'金地 · 牡丹红 · 叶绿 · 花青',credit:'故宫博物院',url:'https://www.dpm.org.cn/collection/embroider/234645.html'},
];
let activeExtractExample=null;

function extractExampleCredit(example){
  if(!example.url)return esc(example.credit);
  return `<a href="${example.url}" target="_blank" rel="noopener" aria-label="查看《${example.title}》中文资料">${example.credit} ↗</a>${example.license?` · <a href="${example.license.url}" target="_blank" rel="noopener">${example.license.label}</a>`:''}`;
}

function renderExtractExamples(){
  const samples=extractExamples.filter(({id})=>window.GUANSE_EXAMPLES?.[id]);
  if(!samples.length)return '';
  return `<section class="extract-examples" aria-labelledby="extract-examples-title">
    <div class="extract-examples-head">
      <h2 id="extract-examples-title">示例图片</h2>
      <p>选一张，试试取色笔</p>
    </div>
    <div class="extract-example-grid">${samples.map(example=>`<article class="extract-example">
      <button type="button" data-action="extract-example" data-id="${example.id}" aria-label="用《${example.title}》试取色" ${extractBusy?'disabled':''}>
        <img src="${window.GUANSE_EXAMPLES[example.id]}" alt="" loading="lazy" decoding="async" draggable="false">
        <span class="extract-example-title">${example.title}</span>
        <span class="extract-example-caption">${example.caption}</span>
      </button>
      <p class="extract-example-credit">${extractExampleCredit(example)}</p>
    </article>`).join('')}</div>
  </section>`;
}

async function openExtractExample(id){
  const example=extractExamples.find(item=>item.id===id);
  const source=window.GUANSE_EXAMPLES?.[id];
  if(extractBusy||!example||!source)return;
  const [,type,encoded]=source.match(/^data:(image\/(?:jpeg|png));base64,(.+)$/)||[];
  if(!type)return;
  const bytes=Uint8Array.from(atob(encoded),character=>character.charCodeAt(0));
  const extension=type==='image/png'?'png':'jpg';
  const loaded=await extractImage(new File([bytes],`${id}.${extension}`,{type}),example);
  if(loaded&&page==='extract'){
    $('#extract-source-title').scrollIntoView({block:'start'});
    $('#extract-image-target').focus({preventScroll:true});
  }
}

function clearExtractImage(){
  if(extractBusy||!imageURL)return;
  URL.revokeObjectURL(imageURL);
  imageURL='';
  extracted=[];
  pickedPixel=null;
  activeExtractExample=null;
  renderExtract();
  $('#extract-choose').focus();
}

function renderExtract(){
  const hasImage=Boolean(imageURL);
  $('#main').innerHTML=`<div class="${hasImage?'extract-screen':'extract-screen extract-start'}">
    ${pageHead('图片取色','点取图片上的一处颜色，或从整张图片提取主色。')}
    <div class="image-workspace extract-workspace">
      <section class="extract-source" aria-labelledby="extract-source-title">
        ${hasImage?`<div class="extract-section-head">
          <h2 id="extract-source-title">图片预览</h2>
          <div class="extract-actions">
            <button id="extract-picker" type="button" class="btn small" aria-pressed="${pickerEnabled}" ${extractBusy?'disabled':''}>${icon('eyedropper')} 取色笔</button>
            <button id="extract-choose" type="button" class="btn small" ${extractBusy?'disabled':''}>更换图片</button>
            <button type="button" class="btn small" data-action="clear-extract" ${extractBusy?'disabled':''}>清除图片</button>
          </div>
        </div>`:''}
        <div id="dropzone" class="extract-stage ${hasImage?'has-image':''}" aria-busy="${extractBusy}">
          ${hasImage?`<button type="button" class="extract-image-target" id="extract-image-target" ${pickerEnabled&&!extractBusy?'':'disabled'} aria-label="在图片上取色，可用方向键移动取色点">
            <img id="extract-image" src="${imageURL}" alt="待取色的图片" draggable="false">
            <span id="extract-marker" class="extract-marker" aria-hidden="true" ${pickedPixel?'':'hidden'}></span>
          </button>`:`<div class="extract-empty">
            <h2 id="extract-source-title">${extractBusy?'正在读取图片…':touchInterface.matches?'选一张图片，开始取色':'拖入图片，开始取色'}</h2>
            <button id="extract-choose" type="button" class="btn primary" ${extractBusy?'disabled':''}>选择图片 ${icon('plus')}</button>
            <p class="extract-footnote">JPG、PNG 或 WebP，最大 20 MB。图片仅在本地处理。</p>
          </div>`}
        </div>
        <input type="file" id="image-input" accept="image/jpeg,image/png,image/webp" aria-label="选择取色图片" hidden>
        ${hasImage?'<p class="extract-footnote">开启取色笔后，点击图片上的任意位置。图片仅在本地处理。</p>':''}
        ${activeExtractExample?`<p class="extract-footnote extract-example-credit">${activeExtractExample.title} · ${extractExampleCredit(activeExtractExample)}</p>`:''}
      </section>
      ${hasImage?`<div class="extract-results">
        <section class="extract-result-panel" aria-labelledby="extract-point-title">
          <h2 id="extract-point-title">取色点</h2>
          <div id="extract-picked" aria-live="polite"></div>
        </section>
        <section class="extract-result-panel" aria-labelledby="extract-colors-title">
          <h2 id="extract-colors-title">图片主色</h2>
          ${extracted.length?`
            <div class="extract-palette" aria-hidden="true">${extracted.map(c=>`<span style="background:${c.hex};flex-grow:${c.share}"></span>`).join('')}</div>
            <div id="extracted-colors" class="extract-list">${extracted.map(c=>`<div class="extract-row">
              <span class="extract-swatch" style="background:${c.hex}" aria-hidden="true"></span>
              <div><strong>${c.hex}</strong><span class="meta">接近 ${esc(c.nearest.name)}</span></div>
              <span class="extract-share">${c.share}%</span>
              <button type="button" class="icon-button" data-action="copy" data-value="${c.hex}" aria-label="复制 ${c.hex}" title="复制色值">${icon('copy')}</button>
            </div>`).join('')}</div>
            <button class="btn extract-to-studio" data-action="use-extracted">用这组颜色配色 ${icon('arrow')}</button>
            <p class="extract-footnote">占比根据图片采样估算。</p>`:'<p class="extract-muted">选择图片后，这里会自动列出最多 6 个主色。</p>'}
        </section>
      </div>`:''}
    </div>
    ${hasImage?'':renderExtractExamples()}
  </div>`;
  if(hasImage)renderPickedPixel();
  $('#extract-choose').addEventListener('click',()=>$('#image-input').click());
  const drop=$('#dropzone');
  drop.addEventListener('dragover',event=>{event.preventDefault();if(!extractBusy)drop.classList.add('dragging')});
  drop.addEventListener('dragleave',event=>{if(!drop.contains(event.relatedTarget))drop.classList.remove('dragging')});
  drop.addEventListener('drop',event=>{
    event.preventDefault();
    drop.classList.remove('dragging');
    const file=event.dataTransfer.files[0];
    if(file)extractImage(file);
  });
  if(!hasImage)return;

  const img=$('#extract-image');
  const surface=$('#extract-image-target');
  const toggle=$('#extract-picker');
  if(pickedPixel){
    const positionMarker=()=>{
      const marker=$('#extract-marker');
      marker.style.left=`${(pickedPixel.x+.5)/img.naturalWidth*100}%`;
      marker.style.top=`${(pickedPixel.y+.5)/img.naturalHeight*100}%`;
    };
    if(img.naturalWidth)positionMarker();
    else img.addEventListener('load',positionMarker,{once:true});
  }
  toggle.addEventListener('click',()=>{
    pickerEnabled=!pickerEnabled;
    toggle.setAttribute('aria-pressed',String(pickerEnabled));
    surface.disabled=!pickerEnabled;
  });
  surface.addEventListener('click',event=>{
    const rect=img.getBoundingClientRect();
    if(event.detail===0){
      pickImagePixel(img,pickedPixel?.x??img.naturalWidth/2,pickedPixel?.y??img.naturalHeight/2);
    }else if(rect.width&&rect.height){
      pickImagePixel(img,(event.clientX-rect.left)/rect.width*img.naturalWidth,(event.clientY-rect.top)/rect.height*img.naturalHeight);
    }
  });
  surface.addEventListener('keydown',event=>{
    const offset={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(!offset)return;
    event.preventDefault();
    const step=event.shiftKey?10:1;
    pickImagePixel(img,(pickedPixel?.x??img.naturalWidth/2)+offset[0]*step,(pickedPixel?.y??img.naturalHeight/2)+offset[1]*step);
  });
}
async function extractImage(file,example=null){if(extractBusy)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){toast('请选择 JPG、PNG 或 WebP 图片');return}if(file.size>20*1024*1024){toast('图片超过 20 MB，请选择较小的文件');return}extractBusy=true;renderExtract();const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();const can=document.createElement('canvas'),scale=Math.min(1,160/Math.max(img.width,img.height));can.width=Math.max(1,Math.round(img.width*scale));can.height=Math.max(1,Math.round(img.height*scale));const cx=can.getContext('2d',{willReadFrequently:true});cx.fillStyle='#fff';cx.fillRect(0,0,can.width,can.height);cx.drawImage(img,0,0,can.width,can.height);const px=cx.getImageData(0,0,can.width,can.height).data,bins=new Map();for(let i=0;i<px.length;i+=4){let v=[px[i],px[i+1],px[i+2]],key=v.map(n=>Math.floor(n/24)).join(',');let b=bins.get(key)||{sum:[0,0,0],n:0};b.n++;v.forEach((n,j)=>b.sum[j]+=n);bins.set(key,b)}let ranked=[...bins.values()].sort((a,b)=>b.n-a.n),centers=[];const dist=(a,b)=>a.reduce((s,n,i)=>s+(n-b[i])**2,0);for(const bin of ranked){let v=bin.sum.map(n=>n/bin.n);if(centers.every(c=>dist(c,v)>1500))centers.push(v);if(centers.length===6)break}while(centers.length<6&&centers.length<ranked.length){const bin=ranked[centers.length];centers.push(bin.sum.map(n=>n/bin.n))}let counts;for(let iter=0;iter<8;iter++){let sums=centers.map(()=>[0,0,0]);counts=centers.map(()=>0);for(let i=0;i<px.length;i+=4){let v=[px[i],px[i+1],px[i+2]],idx=0,best=Infinity;centers.forEach((c,j)=>{let d=dist(v,c);if(d<best){best=d;idx=j}});counts[idx]++;v.forEach((n,j)=>sums[idx][j]+=n)}centers=centers.map((c,j)=>counts[j]?sums[j].map(n=>n/counts[j]):c)}let total=counts.reduce((a,b)=>a+b,0);extracted=centers.map((v,i)=>{let hex='#'+v.map(n=>Math.round(n).toString(16).padStart(2,'0')).join('').toUpperCase(),nearest=colors.reduce((a,c)=>dist(v,rgb(c.hex))<dist(v,rgb(a.hex))?c:a);return {name:nearest.name,hex,nearest,share:Math.round(counts[i]/total*1000)/10}}).filter((c,i)=>counts[i]>0).sort((a,b)=>b.share-a.share);if(extracted.length){const diff=Math.round((100-extracted.reduce((sum,c)=>sum+c.share,0))*10)/10;extracted[0].share=Math.round((extracted[0].share+diff)*10)/10;}if(imageURL)URL.revokeObjectURL(imageURL);imageURL=url;activeExtractExample=example;pickedPixel=null;pickerEnabled=true;toast(`已提取 ${extracted.length} 个主要颜色`);return true}catch{URL.revokeObjectURL(url);toast('无法读取这张图片，请换一张重试')}finally{extractBusy=false;if(page==='extract')renderExtract()}}
function renderContrast(){$('#main').innerHTML=pageHead('对比度检测','让色彩表达情绪，也让文字被清楚看见。')+`<div class="contrast-layout"><section><div class="contrast-inputs">${[['fg','文字颜色',fg],['bg','背景颜色',bg]].map(([id,label,val])=>`<div class="field" data-draft-contrast="${id}"><label for="${id}">${label}</label><div class="color-input-row"><input type="color" id="${id}-picker" value="${val}" aria-label="选择${label}"><div class="contrast-hex-field"><input type="text" id="${id}" value="${val}" maxlength="7" spellcheck="false" aria-label="${label}HEX" aria-describedby="${id}-color-name"><span class="contrast-color-name" id="${id}-color-name" aria-live="polite"></span></div></div></div>`).join('')}</div><div id="contrast-preview"></div><button class="btn" data-action="swap-contrast" style="margin-top:16px">${icon('swap')} 交换前景与背景</button></section><section class="panel"><h2 style="font:24px var(--serif);margin-top:0">文字可读性</h2><div id="contrast-results"></div><p class="notice">按 WCAG 对比度公式计算。普通文字 AA ≥ 4.5:1、AAA ≥ 7:1；大号文字 AA ≥ 3:1、AAA ≥ 4.5:1。大号文字指至少 24px，或至少 18.67px 的粗体。</p><a class="text-button" href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" target="_blank" rel="noopener">阅读 W3C 对比度说明 ↗</a></section></div>`;updateContrast()}
function updateContrastColorName(id){
  const hex=$('#'+id).value.toUpperCase();
  const name=colors.find(color=>color.hex===hex)?.name??'';
  const label=$('#'+id+'-color-name');
  if(label.textContent!==name)label.textContent=name;
}
function updateContrast(){updateContrastColorName('fg');updateContrastColorName('bg');let r=ratio(fg,bg);$('#contrast-preview').innerHTML=`<div class="contrast-sample" data-draft-contrast="bg" style="background:${bg};color:${fg}"><span style="font-size:11px;letter-spacing:2px">浓淡相宜，字字清晰</span><h2 data-draft-contrast="fg">色彩有温度<br>文字有回响。</h2><p data-draft-contrast="fg">好的配色，让每一个字都被看见。</p><span style="font-size:12px">普通文字预览 · 12px / 15px</span></div>`;$('#contrast-results').innerHTML=`<div class="contrast-score">${r.toFixed(2)} <span class="meta">: 1</span></div>${[['普通文字 AA',4.5],['普通文字 AAA',7],['大号文字 AA',3],['大号文字 AAA',4.5]].map(([n,v])=>`<div class="check-row"><span>${n}</span><span class="${r>=v?'pass':'fail'}">${r>=v?'通过':'未通过'}</span></div>`).join('')}`}
function renderCollection(){$('#main').innerHTML=pageHead('我的收藏','把喜欢的颜色留在这里，下一次灵感就从这里开始。',`<div class="studio-toolbar"><button class="btn" data-action="backup">${icon('download')} 备份收藏</button><button class="btn" data-action="import">导入备份</button><input class="hidden" type="file" accept="application/json" id="import-input"></div>`)+`<div class="tabs"><button class="${collectionTab==='colors'?'active':''}" data-action="collection-tab" data-value="colors">单色收藏 ${favorites.size}</button><button class="${collectionTab==='palettes'?'active':''}" data-action="collection-tab" data-value="palettes">配色方案 ${saved.length}</button></div>${collectionTab==='colors'?`<div class="color-grid">${colors.filter(c=>favorites.has(c.id)).map(colorCard).join('')||'<div class="empty"><h3>从一抹心动开始</h3><p>在色卡上点击爱心，把喜欢的颜色收藏到这里。</p><a class="btn primary" href="#explore">去探索中国色 →</a></div>'}</div>`:`<div class="palette-grid">${saved.map((p,i)=>paletteCard(p,i,true)).join('')||'<div class="empty"><h3>你的配色故事，还未开始</h3><p>收藏一组灵感，或在工作台保存自己的配色。</p><a class="btn primary" href="#palettes">寻找配色灵感 →</a></div>'}</div>`}<p class="notice" style="margin-top:28px">收藏保存在此浏览器中。导出备份后，可以在其他设备导入；清除浏览器数据会移除本地收藏。</p>`}
const tray=$('#tray');
new ResizeObserver(()=>{
  document.documentElement.style.setProperty('--tray-height',`${tray.getBoundingClientRect().height}px`);
}).observe(tray,{box:'border-box'});

function renderTray(){
  const canReplace=page==='studio'||page==='contrast';
  const inColorCollection=page==='collection'&&collectionTab==='colors';
  if(!draft.length||!(page==='explore'||canReplace||inColorCollection)){
    tray.replaceChildren();
    return;
  }
  const tapToReplace=canReplace&&touchInterface.matches;
  const hint=canReplace
    ? (tapToReplace?'点按色块替换或移除':page==='studio'?'拖到色卡上替换颜色':'拖到文字色或背景色上替换')
    : '轻点色块可移除';
  tray.innerHTML=`<div class="tray-label">配色草稿 <strong>${draft.length}/8</strong><span class="tray-hint${canReplace?'':' tray-hint-mobile'}">${hint}</span></div>
    <div class="tray-swatches">${draft.map((c,i)=>{
      const name=esc(c.name);
      const label=tapToReplace?`选择草稿色${name}`:`从草稿移除${name}`;
      return `<button style="background:${c.hex}" data-action="${tapToReplace?'choose-draft-target':'remove-draft'}" data-index="${i}" aria-label="${label}" title="${name} ${c.hex}" ${tapToReplace?'aria-haspopup="dialog"':canReplace?'draggable="true"':''}>${tapToReplace?'':`<span class="tray-remove-mark">${icon('close')}</span>`}</button>`;
    }).join('')}</div>
    <button class="text-button tray-clear" data-action="clear-draft">清空</button>
    <button class="btn primary small" data-action="draft-to-studio">${page==='studio'?'载入草稿':'继续配色'} →</button>`;
}
touchInterface.addEventListener('change',renderTray);

function chooseDraftTarget(index){
  const color=draft[index];
  if(!color)return;
  const targets=page==='studio'
    ?studio.map((c,i)=>[i,`第 ${i+1} 色 · ${c.name}`])
    :[['fg','文字颜色'],['bg','背景颜色']];
  openDialog(`<form class="dialog-padded" id="draft-apply-form" data-index="${index}">
    <h2>使用草稿色</h2>
    <p class="draft-choice"><span style="background:${color.hex}" aria-hidden="true"></span>${esc(color.name)} · ${color.hex}</p>
    <div class="field">
      <label for="draft-target">替换位置</label>
      <select id="draft-target" name="target">${targets.map(([value,label])=>`<option value="${value}">${esc(label)}</option>`).join('')}</select>
    </div>
    <div class="draft-dialog-actions">
      <button class="btn primary" type="submit">替换颜色</button>
      <button class="btn" type="button" data-action="remove-draft" data-index="${index}">移除草稿色</button>
    </div>
  </form>`);
}

let draggedDraftColor=null;
let draggedStudioCard=null;
let activeColorDropTarget=null;

function highlightColorDropTarget(target){
  if(activeColorDropTarget===target)return;
  activeColorDropTarget?.classList.remove('color-drop-active');
  activeColorDropTarget=target;
  activeColorDropTarget?.classList.add('color-drop-active');
}

function getColorDropTarget(element){
  if(draggedStudioCard&&(!draggedStudioCard.isConnected||page!=='studio'))return null;
  if(page==='studio'){
    const target=element.closest('[data-draft-studio]');
    return target===draggedStudioCard?null:target;
  }
  if(page==='contrast')return element.closest('[data-draft-contrast]');
  return null;
}

function replaceWithDraft(target,color){
  if(page==='studio'){
    const index=Number(target.dataset.draftStudio);
    if(!studio[index])return;
    pushHistory();
    studio[index]={...color,locked:studio[index].locked};
    sync();
    renderStudio();
  }else if(page==='contrast'){
    const channel=target.dataset.draftContrast;
    if(channel==='fg')fg=color.hex;
    else if(channel==='bg')bg=color.hex;
    else return;
    renderContrast();
  }
  toast('已应用 '+color.name);
}

document.addEventListener('pointerdown',event=>{
  const card=event.target.closest('.studio-color');
  // Keep text selection and button interactions native within each card.
  if(card)card.draggable=event.pointerType!=='touch'&&!event.target.closest('input,button,label');
});

document.addEventListener('dragstart',event=>{
  if(event.target.closest('a[href],button:not([draggable="true"])')){
    event.preventDefault();
    return;
  }
  if(!event.dataTransfer)return;
  const card=event.target.closest('.studio-color[draggable="true"]');
  if(card&&page==='studio'){
    draggedStudioCard=card;
    event.dataTransfer.setData('application/x-guanse-studio-color',card.dataset.draftStudio);
    event.dataTransfer.effectAllowed='move';
    return;
  }
  const swatch=event.target.closest('#tray [data-action="remove-draft"][draggable="true"]');
  if(!swatch)return;
  const color=draft[Number(swatch.dataset.index)];
  if(!color)return;
  draggedDraftColor=color;
  event.dataTransfer.setData('application/x-guanse-draft-color',color.hex);
  event.dataTransfer.effectAllowed='copy';
});

document.addEventListener('dragover',event=>{
  if(!draggedDraftColor&&!draggedStudioCard)return;
  const target=getColorDropTarget(event.target);
  highlightColorDropTarget(target);
  if(!target)return;
  event.preventDefault();
  event.dataTransfer.dropEffect=draggedStudioCard?'move':'copy';
});

document.addEventListener('dragleave',event=>{
  if(activeColorDropTarget?.contains(event.target)&&!activeColorDropTarget.contains(event.relatedTarget))highlightColorDropTarget(null);
});

function clearColorDrag(){
  draggedDraftColor=null;
  draggedStudioCard=null;
  highlightColorDropTarget(null);
}

document.addEventListener('drop',event=>{
  if(!draggedDraftColor&&!draggedStudioCard)return;
  const color=draggedDraftColor;
  const source=draggedStudioCard;
  const target=getColorDropTarget(event.target);
  clearColorDrag();
  if(!target)return;
  event.preventDefault();
  if(source)swapStudioColors(Number(source.dataset.draftStudio),Number(target.dataset.draftStudio));
  else replaceWithDraft(target,color);
});

document.addEventListener('dragend',clearColorDrag);

const dialog=$('#dialog');
let dialogScrollY=null;
function openDialog(html){
  $('#dialog-content').innerHTML=html;
  if(dialog.open)return;
  dialogScrollY=window.scrollY;
  document.documentElement.style.setProperty('--dialog-offset',`${-dialogScrollY}px`);
  dialog.showModal();
}
function restoreDialogScroll(){
  if(dialog.open||dialogScrollY===null)return;
  const top=dialogScrollY;
  dialogScrollY=null;
  document.documentElement.style.removeProperty('--dialog-offset');
  window.scrollTo({top,behavior:'instant'});
}
function closeDialog(){
  dialog.close();
  restoreDialogScroll();
}
dialog.addEventListener('close',restoreDialogScroll);
dialog.addEventListener('cancel',event=>{
  event.preventDefault();
  closeDialog();
});
function showDetail(id){const c=colors[id];if(!c)return;const [h,s,l]=hsl(c.hex),[r,g,b]=rgb(c.hex);const near=colors.filter(x=>x.id!==c.id).sort((a,b)=>rgb(a.hex).reduce((s,v,i)=>s+(v-rgb(c.hex)[i])**2,0)-rgb(b.hex).reduce((s,v,i)=>s+(v-rgb(c.hex)[i])**2,0)).slice(0,5);openDialog(`<div class="detail"><div class="detail-color" style="background:${c.hex};color:${ink(c.hex)}"><h2 id="detail-swatch-name" ${hideDetailName?'hidden':''}>${esc(c.aliases?.[0]||c.name)}</h2></div><div class="detail-body"><span class="eyebrow">中国色彩档案 / ${String(id+1).padStart(3,'0')}</span><h3>${esc(c.name)}</h3><p class="meta">${families.find(f=>f[0]===c.family)[1]}色系 · ${l>75?'轻盈浅调':l<35?'沉静深调':'柔和中调'}</p>${colorProvenance(c)}<div class="values">${[['HEX',c.hex],['RGB',`rgb(${r}, ${g}, ${b})`],['HSL',`hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`]].map(([n,v])=>`<div class="value-row"><span>${n}</span><div class="value-actions"><span>${v}</span><button type="button" class="icon-button value-copy" data-action="copy" data-value="${v}" title="复制 ${n} 色值" aria-label="复制 ${n} 色值">${icon('copy')}</button></div></div>`).join('')}</div><div class="hero-actions"><button class="btn primary" data-action="add" data-id="${id}">${icon('plus')} 加入配色</button><button class="btn" data-action="favorite" data-id="${id}" aria-pressed="${favorites.has(id)}">${icon('heart')} ${favorites.has(id)?'已收藏':'收藏'}</button><button type="button" class="btn" data-action="toggle-detail-name" aria-controls="detail-swatch-name" aria-expanded="${!hideDetailName}">${hideDetailName?'显示色名':'隐藏色名'}</button></div><p class="meta" style="margin:23px 0 7px">相近色彩</p><div class="related">${near.map(n=>`<button style="background:${n.hex}" data-action="detail" data-id="${n.id}" aria-label="查看${esc(n.name)}" title="${esc(n.name)}"></button>`).join('')}</div></div></div>`)}
function savePalette(cs,name){saved.unshift({id:Date.now(),name,colors:cs.map(c=>({name:c.name,hex:c.hex})),created:new Date().toISOString()});sync();toast('配色已保存到我的收藏')}
function askSave(){openDialog(`<form class="dialog-padded" id="save-form"><h2>给这组颜色起个名字</h2><div class="field"><label for="palette-name">配色名称</label><input id="palette-name" maxlength="30" required value="未命名配色 ${saved.length+1}"></div><button class="btn primary" type="submit">保存到我的收藏</button></form>`);$('#palette-name').select()}
function download(content,name,type){const blob=content instanceof Blob?content:new Blob([content],{type});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000);toast('已导出 '+name)}
function exportPalette(fmt){const name='观色-配色';if(fmt==='CSS')return download(`/* 观色配色 */\n:root {\n${studio.map((c,i)=>`  --color-${i+1}: ${c.hex}; /* ${c.name} */`).join('\n')}\n}\n`,name+'.css','text/css');if(fmt==='JSON')return download(JSON.stringify({name,colors:studio.map(({name,hex})=>({name,hex}))},null,2),name+'.json','application/json');const w=1200,h=720,n=studio.length;if(fmt==='SVG'){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="1200" height="720" fill="#f7f8f5"/><text x="48" y="70" font-family="serif" font-size="30" fill="#242c28">观色 · 中国色彩工作台</text>${studio.map((c,i)=>`<rect x="${i*w/n}" y="110" width="${w/n+1}" height="490" fill="${c.hex}"/><text x="${(i+.5)*w/n}" y="340" text-anchor="middle" font-family="serif" font-size="${n>6?22:30}" fill="${ink(c.hex)}">${esc(c.name)}</text><text x="${(i+.5)*w/n}" y="380" text-anchor="middle" font-family="sans-serif" font-size="18" fill="${ink(c.hex)}">${c.hex}</text>`).join('')}<text x="48" y="665" font-family="sans-serif" font-size="16" fill="#68706b">一色一境，万物有情。</text></svg>`;download(svg,name+'.svg','image/svg+xml');return}const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f8f5';ctx.fillRect(0,0,w,h);ctx.fillStyle='#242c28';ctx.font='30px "Songti SC", serif';ctx.fillText('观色 · 中国色彩工作台',48,70);studio.forEach((c,i)=>{ctx.fillStyle=c.hex;ctx.fillRect(i*w/n,110,w/n+1,490);ctx.fillStyle=ink(c.hex);ctx.textAlign='center';ctx.font=`${n>6?22:30}px "Songti SC", serif`;ctx.fillText(c.name,(i+.5)*w/n,340,w/n-16);ctx.font='18px sans-serif';ctx.fillText(c.hex,(i+.5)*w/n,380)});ctx.textAlign='left';ctx.font='16px sans-serif';ctx.fillStyle='#68706b';ctx.fillText('一色一境，万物有情。',48,665);canvas.toBlob(blob=>{if(blob)download(blob,name+'.png','image/png');else toast('图片导出失败，请重试')})}
async function importBackup(file){if(!file)return;if(file.size>2*1024*1024){toast('备份文件过大，最大支持 2 MB');return}try{const x=JSON.parse(await file.text());if(x.app!=='guanse'||!Array.isArray(x.favorites)||!Array.isArray(x.palettes))throw Error();if(x.palettes.length>500||x.favorites.length>colors.length)throw Error();if(!x.palettes.every(p=>typeof p.name==='string'&&p.name.length<=60&&Array.isArray(p.colors)&&p.colors.length>=2&&p.colors.length<=8&&p.colors.every(c=>typeof c.name==='string'&&c.name.length<=40&&validHex(c.hex))))throw Error();x.favorites.filter(i=>Number.isInteger(i)&&colors[i]).forEach(i=>favorites.add(i));let keys=new Set(saved.map(p=>p.name+JSON.stringify(p.colors)));for(const entry of x.palettes){const p={...entry,colors:entry.colors.map(resolveColorName)};const key=p.name+JSON.stringify(p.colors);if(!keys.has(key)){saved.push(p);keys.add(key)}}sync();renderCollection();toast('备份已合并导入，原有收藏已保留')}catch{toast('文件格式不正确，请选择观色导出的收藏备份')}}
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action,id=Number(el.dataset.id),i=Number(el.dataset.index),c=colors[id];switch(a){case 'extract-example':openExtractExample(el.dataset.id);break;
case 'back-to-top':
  $('.header .brand').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  break;
case 'clear-extract':clearExtractImage();break;
case 'feature-prev':moveFeatureSlide(-1,true);scheduleFeatureRotation();break;
case 'feature-next':moveFeatureSlide(1,true);scheduleFeatureRotation();break;
case 'copy':copy(el.dataset.value);break;case 'detail':showDetail(id);break;case 'close':closeDialog();break;case 'random-detail':showDetail(Math.floor(Math.random()*colors.length));break;
case 'toggle-detail-name':
  hideDetailName=!hideDetailName;
  $('#detail-swatch-name').hidden=hideDetailName;
  el.textContent=hideDetailName?'显示色名':'隐藏色名';
  el.setAttribute('aria-expanded',String(!hideDetailName));
  persist('hide-detail-name',hideDetailName);
  break;
case 'favorite': {
  const selected=!favorites.has(id);
  if(selected)favorites.add(id);
  else favorites.delete(id);
  sync();
  if(page==='explore'){
    const cardButton=$(`#color-grid [data-action="favorite"][data-id="${id}"]`);
    if(cardButton){
      cardButton.classList.toggle('selected',selected);
      cardButton.setAttribute('aria-pressed',String(selected));
      cardButton.setAttribute('aria-label',(selected?'取消收藏':'收藏')+c.name);
    }
  }else if(page==='collection')renderCollection();
  if(el.closest('#dialog')){
    el.setAttribute('aria-pressed',String(selected));
    el.innerHTML=icon('heart')+(selected?' 已收藏':' 收藏');
  }
  toast((selected?'已收藏 ':'已取消收藏 ')+c.name);
  break;
}
case 'add':if(draft.length>=8){toast('草稿最多 8 色，可先移除一色');break}if(draft.some(x=>x.hex===c.hex)){toast('这抹颜色已在草稿里');break}draft.push({...c,locked:false});sync();toast(c.name+' 已加入配色草稿');break;case 'choose-draft-target':chooseDraftTarget(i);break;
case 'remove-draft':
  if(el.closest('#draft-apply-form'))closeDialog();
  draft.splice(i,1);
  sync();
  break;
case 'clear-draft':draft=[];sync();break;case 'draft-to-studio':
  if(draft.length<2){toast('再添加一色，就能开始配色');break}
  pushHistory();
  studio=draft.map(c=>({...c}));
  sync();
  if(page==='studio')renderStudio();
  else location.hash='studio';
  break;
case 'filter':setColorFamily(el.dataset.family);break;
case 'reset-filter':
  query='';
  $('#search').value='';
  setColorFamily('all');
  break;
case 'pure-mode':pureColors=!pureColors;persist('pure-colors',pureColors);$('#color-grid').classList.toggle('pure-colors',pureColors);el.classList.toggle('active',pureColors);el.setAttribute('aria-pressed',String(pureColors));break;case 'density':compact=el.dataset.value==='compact';renderExplore();break;case 'theme-filter':themeFilter=el.dataset.value;renderPalettes();break;case 'use-feature-theme':
case 'use-theme':
  pushHistory();
  studio=themeColors(themes[i]);
  if(a==='use-feature-theme')studio=studio.slice(0,featuredColorCount);
  sync();location.hash='studio';break;
case 'favorite-theme': {
  const theme=themes[i], palette=themeColors(theme);
  const remaining=saved.filter(entry=>!matchesTheme(entry,theme,palette));
  const collected=remaining.length===saved.length;
  if(collected)savePalette(palette,theme.name);
  else{
    saved=remaining;
    sync();
    toast('已取消收藏 '+theme.name);
  }
  const label=(collected?'取消收藏':'收藏')+theme.name;
  el.setAttribute('aria-pressed',String(collected));
  el.setAttribute('aria-label',label);
  el.title=label;
  break;
}
case 'generate':generate();break;case 'undo':if(history.length){studio=history.pop();sync();renderStudio();toast('已恢复上一组配色')}break;case 'lock':studio[i].locked=!studio[i].locked;sync();renderStudio();break;case 'move':moveStudioColor(i,Number(el.dataset.step));break;case 'remove-studio':if(studio.length>2){pushHistory();studio.splice(i,1);sync();renderStudio()}break;case 'add-studio':if(studio.length<8){pushHistory();studio.push({...colors[Math.floor(Math.random()*colors.length)],locked:false});sync();renderStudio()}break;case 'copy-all':copy(studio.map(c=>c.hex).join(', '));break;case 'save-studio':askSave();break;case 'export':exportPalette(el.dataset.format);break;case 'test-studio':fg=studio[studioTextIndex].hex;bg=studio[studioBackgroundIndex].hex;location.hash='contrast';break;case 'swap-contrast':[fg,bg]=[bg,fg];renderContrast();break;case 'use-extracted':if(extracted.length<2){toast('图片颜色较单一，请选择更丰富的画面');break}pushHistory();studio=extracted.map(c=>({name:c.name,hex:c.hex,locked:false}));sync();location.hash='studio';break;
case 'collection-tab':
  collectionTab=el.dataset.value;
  renderCollection();
  renderTray();
  break;
case 'load-saved':pushHistory();studio=saved[i].colors.map(c=>({...c,locked:false}));sync();location.hash='studio';break;
case 'unfavorite-palette': {
  const [removed]=saved.splice(i,1);
  sync();
  renderCollection();
  toast('已取消收藏 '+removed.name);
  break;
}
case 'backup':download(JSON.stringify({app:'guanse',version:1,favorites:[...favorites],palettes:saved},null,2),'观色-收藏备份.json','application/json');break;case 'import':$('#import-input').click();break;case 'toggle-theme':document.body.classList.toggle('dark');persist('dark',document.body.classList.contains('dark'));syncThemeToggle();break;}});
document.addEventListener('input',e=>{const el=e.target;if(el.id==='search'){query=el.value.trim();limit=36;renderColorGrid()}if(el.id==='fg-picker'||el.id==='bg-picker'){const id=el.id.slice(0,2);if(id==='fg')fg=el.value.toUpperCase();else bg=el.value.toUpperCase();$('#'+id).value=el.value.toUpperCase();$('#'+id).removeAttribute('aria-invalid');updateContrast()}if(el.id==='fg'||el.id==='bg'){const v=el.value.toUpperCase();el.setAttribute('aria-invalid',String(!validHex(v)));if(validHex(v)){if(el.id==='fg')fg=v;else bg=v;$('#'+el.id+'-picker').value=v;updateContrast()}else updateContrastColorName(el.id)}});
document.addEventListener('change',e=>{
const el=e.target;
if(el.id==='studio-contrast-text'||el.id==='studio-contrast-background'){
  const index=Number(el.value);
  if(!studio[index])return;
  if(el.id==='studio-contrast-text')studioTextIndex=index;
  else studioBackgroundIndex=index;
  $('#studio-contrast-result').innerHTML=studioContrastResult();
  return;
}
if(el.id==='sort'){sort=el.value;renderColorGrid()}if(el.id==='harmony')harmony=el.value;if(el.dataset.edit!==undefined||el.dataset.picker!==undefined){const i=Number(el.dataset.edit??el.dataset.picker),v=el.value.toUpperCase();if(!validHex(v)){toast('请输入完整的 HEX 色值，例如 #3D6E53');el.value=studio[i].hex;return}pushHistory();studio[i]={...studio[i],hex:v,name:colors.find(c=>c.hex===v)?.name||'自定义色'};sync();renderStudio()}if(el.id==='image-input'&&el.files[0])extractImage(el.files[0]);if(el.id==='import-input')importBackup(el.files[0])});
document.addEventListener('submit',e=>{
  if(e.target.id==='draft-apply-form'){
    e.preventDefault();
    const color=draft[Number(e.target.dataset.index)];
    const value=e.target.elements.target.value;
    const selector=page==='studio'?`.studio-color[data-draft-studio="${value}"]`:`.field[data-draft-contrast="${value}"]`;
    const target=$(selector);
    if(!target||!color)return;
    closeDialog();
    replaceWithDraft(target,color);
    $(selector)?.scrollIntoView({block:'nearest'});
  }else if(e.target.id==='save-form'){
    e.preventDefault();
    const name=$('#palette-name').value.trim();
    if(!name){toast('请为这组配色输入名称');return}
    savePalette(studio,name);
    closeDialog();
  }
});
document.addEventListener('keydown',e=>{const editing=/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable;if(e.key==='/'&&!editing&&!$('#dialog').open&&page==='explore'){e.preventDefault();$('#search').focus()}if(e.code==='Space'&&!editing&&e.target.tagName!=='BUTTON'&&e.target.tagName!=='A'&&!$('#dialog').open&&page==='studio'){e.preventDefault();generate()}});
$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=$('#dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog()}});
window.addEventListener('hashchange',()=>{if($('#dialog').open)closeDialog();render();window.scrollTo({top:0,behavior:'instant'})});
$$('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));if(load('dark',false))document.body.classList.add('dark');syncThemeToggle();
try{colors=window.GUANSE_COLORS;if(!Array.isArray(colors)||!colors.length)throw Error('missing colors');draft=draft.map(resolveColorName);studio=studio.map(resolveColorName);saved=saved.map(p=>({...p,colors:p.colors.map(resolveColorName)}));favorites=new Set([...favorites].filter(i=>colors[i]));if(!studio.length)studio=themeColors(themes[0]);sync();render()}catch{$('#main').innerHTML='<div class="empty"><h1>色库暂时没有加载成功</h1><p>色库数据未能读取，请重新打开完整的 HTML 文件。</p><button class="btn primary" id="retry">重新加载</button></div>';$('#retry').onclick=()=>location.reload()}

})();
