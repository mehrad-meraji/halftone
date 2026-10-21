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
// mix two oklch/oklab colours roughly in linear-light for tinted fills
const T={
 light:{bg:[0.955,0.006,283],surface:[0.995,0.003,283],muted:[0.965,0.005,283],sunken:[0.94,0.008,283],text:[0.2,0.018,278],tmuted:[0.45,0.018,278],tsub:[0.5,0.018,278],accent:[0.54,0.212,300],accentInk:[0.99,0,0],accentText:[0.378,0.145,292],accentSoft:[0.94,0.034,297],danger:[0.56,0.153,25],dangerInk:[0.99,0,355],dangerText:[0.45,0.145,23],dangerSoft:[0.95,0.025,20],success:[0.55,0.111,160],warning:[0.7,0.111,75],info:[0.55,0.085,235],border:[0.797,0.014,283],borderInput:[0.64,0.018,283],inverse:[0.26,0.013,273],inverseInk:[0.97,0.003,278]},
 dark:{bg:[0.16,0.016,273],surface:[0.2,0.016,273],muted:[0.23,0.018,273],sunken:[0.14,0.015,273],text:[0.94,0.006,278],tmuted:[0.74,0.012,278],tsub:[0.68,0.016,278],accent:[0.54,0.212,300],accentInk:[0.99,0,0],accentText:[0.89,0.111,300],accentSoft:[0.28,0.068,297],danger:[0.65,0.162,25],dangerInk:[0.18,0.025,25],dangerText:[0.78,0.119,25],dangerSoft:[0.27,0.06,25],success:[0.55,0.111,160],warning:[0.7,0.111,75],info:[0.55,0.085,235],border:[0.4,0.024,273],borderInput:[0.52,0.024,273],inverse:[0.94,0.006,278],inverseInk:[0.2,0.016,278]}};
const rows=[];
for(const th of ['light','dark']){const t=T[th];
 const add=(name,fg,bg,min=4.5)=>{const r=ratio(fg,bg);rows.push([th,name,r.toFixed(2),r>=min?'ok':'FAIL (<'+min+')'])};
 add('button primary text',t.accentInk,t.accent);
 add('button danger text',t.dangerInk,t.danger);
 add('button default text',t.text,t.surface);
 add('button quiet text (on bg)',t.tmuted,t.bg);
 add('button quiet hover (text on bg)',t.text,t.bg);
 add('nav-item / tab text on bg',t.text,t.bg);
 add('placeholder subtle on surface',t.tsub,t.surface);
 add('input text on sunken-ish bg',t.text,t.sunken);
 add('accent-text on accent-soft',t.accentText,t.accentSoft);
 add('danger-text on danger-soft',t.dangerText,t.dangerSoft);
 add('tooltip text',t.inverseInk,t.inverse);
 add('neutral toast text',t.inverseInk,t.inverse);
 add('switch icon (non-text) on surface',t.tmuted,t.surface,3);
 add('switch on track vs page bg (non-text)',t.accent,t.bg,3);
 add('switch knob vs on track (non-text)',t.surface,t.accent,3);
 add('switch tick on knob (non-text)',t.accentText,t.surface,3);
 add('focus ring vs surface (non-text)',(th==='light'?[0.5,0.108,273]:[0.75,0.113,273]),t.surface,3);
 add('field border vs surface (non-text)',t.borderInput,t.surface,3);
}
for(const r of rows)console.log(r.join(' | '));

console.log('sanity (axe measured 3.43 for #fcfcfc on #ed5350):', ratio([.99,0,0],[.65,.19,25]).toFixed(2));
