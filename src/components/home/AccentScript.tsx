// Server component. Render as first child of <body> (before <Splash />) so the saved
// colour is applied before first paint: no orange-then-cyan flash.
const SCRIPT = `(function(){try{var a=localStorage.getItem('cobraa-accent');if(!/^#[0-9a-f]{6}$/i.test(a||''))return;var n=parseInt(a.slice(1),16),l=(0.2126*(n>>16)+0.7152*((n>>8)&255)+0.0722*(n&255))/255,s=document.documentElement.style;s.setProperty('--accent',a);s.setProperty('--accent-ink',l>0.55?'#0b0b0c':'#ffffff')}catch(e){}})();`;
export function AccentScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
