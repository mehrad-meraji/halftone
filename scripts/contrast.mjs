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
 light:{bg:[.96,.007,305],surface:[.995,.003,305],muted:[.97,.006,305],sunken:[.945,.009,305],text:[.2,.02,300],tmuted:[.45,.02,300],tsub:[.5,.02,300],accent:[.68,.25,328],accentInk:[.18,.03,320],accentText:[.42,.17,320],accentSoft:[.94,.04,325],danger:[.56,.18,30],dangerInk:[.99,0,0],dangerText:[.45,.17,28],dangerSoft:[.95,.03,25],success:[.55,.13,150],warning:[.7,.13,65],info:[.55,.1,220],border:[.8,.016,305],borderInput:[.64,.02,305],inverse:[.26,.015,295],inverseInk:[.97,.003,300]},
 dark:{bg:[.14,.02,295],surface:[.18,.02,295],muted:[.21,.022,295],sunken:[.12,.018,295],text:[.94,.008,300],tmuted:[.74,.015,300],tsub:[.68,.02,300],accent:[.68,.25,328],accentInk:[.18,.03,320],accentText:[.82,.13,328],accentSoft:[.28,.08,325],danger:[.65,.19,25],dangerInk:[.18,.03,25],dangerText:[.78,.14,25],dangerSoft:[.27,.07,25],success:[.55,.13,150],warning:[.7,.13,65],info:[.55,.1,220],border:[.38,.03,295],borderInput:[.52,.03,295],inverse:[.94,.008,300],inverseInk:[.2,.02,300]}};
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
 add('focus ring vs surface (non-text)',[th==='light'?.5:.75,th==='light'?.12:.14,295],t.surface,3);
 add('field border vs surface (non-text)',t.borderInput,t.surface,3);
}
for(const r of rows)console.log(r.join(' | '));

console.log('sanity (axe measured 3.43 for #fcfcfc on #ed5350):', ratio([.99,0,0],[.65,.19,25]).toFixed(2));
