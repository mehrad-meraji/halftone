// Usage: node scripts/contrast.mjs
// WCAG contrast for token pairs that axe cannot see (pseudo-element fills, borders, focus rings).
// Keep the T table in step with src/tokens/tokens.css. The last line cross-checks the maths against an axe reading.
const toLin=c=>c<=0.0031308?12.92*c:1.055*c**(1/2.4)-0.055;
function oklch([L,C,h]){const a=C*Math.cos(h*Math.PI/180),b=C*Math.sin(h*Math.PI/180);
 const l_=L+0.3963377774*a+0.2158037573*b,m_=L-0.1055613458*a-0.0638541728*b,s_=L-0.0894841775*a-1.2914855480*b;
 const l=l_**3,m=m_**3,s=s_**3;
 return [4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.7076147010*s].map(v=>Math.min(1,Math.max(0,v)))}
const lum=([r,g,b])=>{const f=v=>{const c=Math.min(1,Math.max(0,v));return c}; return 0.2126*r+0.7152*g+0.0722*b};
const ratio=(a,b)=>{const A=lum(oklch(a)),B=lum(oklch(b));const[x,y]=A>B?[A,B]:[B,A];return ((x+0.05)/(y+0.05))};
// color-mix(in oklab, a p, b): mix in oklab, return oklch so ratio() can read it
const mix=(a,p,b)=>{const lab=([L,C,h])=>[L,C*Math.cos(h*Math.PI/180),C*Math.sin(h*Math.PI/180)];
 const A=lab(a),B=lab(b),[L,x,y]=A.map((v,i)=>v*p+B[i]*(1-p));return [L,Math.hypot(x,y),Math.atan2(y,x)*180/Math.PI]};
const T={
 light:{bg:[0.955,0.006,283],surface:[0.995,0.003,283],raised:[0.995,0.003,283],muted:[0.965,0.005,283],sunken:[0.94,0.008,283],text:[0.2,0.018,278],tmuted:[0.45,0.018,278],tsub:[0.5,0.018,278],accent:[0.54,0.212,300],accentInk:[0.99,0,0],accentText:[0.378,0.145,292],accentSoft:[0.94,0.034,297],danger:[0.56,0.153,25],dangerInk:[0.99,0,355],dangerText:[0.45,0.145,23],dangerSoft:[0.95,0.025,20],success:[0.55,0.111,160],warning:[0.7,0.111,75],info:[0.55,0.085,235],border:[0.797,0.014,283],borderInput:[0.64,0.018,283],inverse:[0.26,0.013,273],inverseInk:[0.97,0.003,278]},
 dark:{bg:[0.16,0.016,273],surface:[0.2,0.016,273],raised:[0.26,0.018,273],muted:[0.23,0.018,273],sunken:[0.14,0.015,273],text:[0.94,0.006,278],tmuted:[0.74,0.012,278],tsub:[0.68,0.016,278],accent:[0.54,0.212,300],accentInk:[0.99,0,0],accentText:[0.89,0.111,300],accentSoft:[0.28,0.068,297],danger:[0.65,0.162,25],dangerInk:[0.18,0.025,25],dangerText:[0.78,0.119,25],dangerSoft:[0.27,0.06,25],success:[0.55,0.111,160],warning:[0.7,0.111,75],info:[0.55,0.085,235],border:[0.4,0.024,273],borderInput:[0.52,0.024,273],inverse:[0.94,0.006,278],inverseInk:[0.2,0.016,278]}};
const rows=[];
for(const th of ['light','dark']){const t=T[th];
 const add=(name,fg,bg,min=4.5)=>{const r=ratio(fg,bg);rows.push([th,name,r.toFixed(2),r>=min?'ok':'FAIL (<'+min+')'])};
 // Header strips: the eyebrow sits on --ht-halftone. Check it against the centre of a dot, the strongest point.
 // Keep the accent share in step with --ht-halftone in tokens.css (light 12%, dark 28%).
 const dot=mix(t.accent,th==='light'?.12:.28,t.muted);
 add('header eyebrow (text-subtle) on a dot',t.tsub,dot);
 add('header heading (text) on a dot',t.text,dot);
 add('button primary text',t.accentInk,t.accent);
 // Selected-item pip (non-text, 3:1): accent mixed 80% toward text, against the surface and the 7.5% row fill.
 const pip=mix(t.accent,.8,t.text);
 add('selected pip vs surface (non-text)',pip,t.surface,3);
 add('selected pip vs row fill (non-text)',pip,mix(t.text,.075,t.surface),3);
 add('selected pip vs row fill on muted (non-text)',pip,mix(t.text,.075,t.muted),3);
 add('button danger text',t.dangerInk,t.danger);
 add('button default text',t.text,t.raised);
 add('button quiet text (on bg)',t.tmuted,t.bg);
 add('button quiet hover (text on bg)',t.text,t.bg);
 add('nav-item / tab text on bg',t.text,t.bg);
 add('placeholder subtle on surface',t.tsub,t.surface);
 add('input text on sunken-ish bg',t.text,t.sunken);
 add('accent-text on accent-soft',t.accentText,t.accentSoft);
 add('danger-text on danger-soft',t.dangerText,t.dangerSoft);
 add('tooltip text',t.inverseInk,t.inverse);
 add('toast and alert text on surface',t.text,t.surface);
 add('toast and alert description on surface',t.tmuted,t.surface);
 add('toast action text',t.inverseInk,t.inverse);
 add('toast cancel text',t.text,t.sunken);
 add('rich toast info',mix(t.info,.55,t.text),mix(t.info,.10,t.surface));
 add('rich toast success',mix(t.success,.55,t.text),mix(t.success,.10,t.surface));
 add('rich toast warning',mix(t.warning,.40,t.text),mix(t.warning,.14,t.surface));
 add('rich toast danger',t.dangerText,t.dangerSoft);
 add('alert danger text on surface',t.dangerText,t.surface);
 add('alert danger description on surface',mix(t.dangerText,.9,t.surface),t.surface);
 add('toast/alert info icon (non-text)',mix(t.info,.8,t.text),t.surface,3);
 add('toast/alert success icon (non-text)',mix(t.success,.8,t.text),t.surface,3);
 add('toast/alert warning icon (non-text)',mix(t.warning,.55,t.text),t.surface,3);
 add('switch icon (non-text) on surface',t.tmuted,t.surface,3);
 add('switch on track vs page bg (non-text)',t.accent,t.bg,3);
 add('switch knob vs on track (non-text)',t.surface,t.accent,3);
 add('switch tick on knob (non-text)',t.accentText,t.surface,3);
 add('focus ring vs surface (non-text)',(th==='light'?[0.5,0.108,273]:[0.75,0.113,273]),t.surface,3);
 add('field border vs surface (non-text)',t.borderInput,t.surface,3);
}
// Generated avatar palette (PALETTE and INK in src/components/avatar/avatar.ts). Hex, not oklch, and theme-free, so one row per pair.
// Keep in step with the file. Non-text pairs need 3:1, eyes and mouth (ink on the mid tier) 4.5:1. Every hue against every hue.
const hexLum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]};
const hexRatio=(a,b)=>{const[x,y]=[hexLum(a),hexLum(b)].sort((p,q)=>q-p);return (x+0.05)/(y+0.05)};
const AV=[['#feebea','#dd5559','#791920'],['#feece1','#cb6800','#673200'],['#faefd6','#a27e03','#533f03'],['#e2f7e2','#229633','#025112'],['#d7f8f5','#06928c','#044d4a'],['#e6f2fe','#0986e4','#024478'],['#f1edfe','#916ee2','#492e7f'],['#feeaf2','#d15697','#711a4c']];
const AV_INK='#0b0c1a';
const avMin=(name,min,f,note='')=>{let m=Infinity;for(const a of AV)for(const b of AV)m=Math.min(m,f(a,b));rows.push(['avatar',name+note,m.toFixed(2),m>=min?'ok':'FAIL (<'+min+')'])};
avMin('deep on bg (non-text), worst hue pair',3,(a,b)=>hexRatio(b[2],a[0]));
avMin('mid on bg (non-text), worst hue pair',3,(a,b)=>hexRatio(b[1],a[0]));
avMin('ink on mid (eyes, mouth), worst hue',4.5,(a,b)=>hexRatio(AV_INK,b[1]));
avMin('mid vs deep in one figure, worst hue pair',1,(a,b)=>hexRatio(a[1],b[2]),' (informational, not held)');
for(const r of rows)console.log(r.join(' | '));

console.log('sanity (axe measured 3.43 for #fcfcfc on #ed5350):', ratio([.99,0,0],[.65,.19,25]).toFixed(2));
