// Pre-paint theme bootstrap. Loaded as a blocking external script (not inline)
// so the CSP can drop 'unsafe-inline' from script-src.
(function(){try{var t=localStorage.getItem('ftj-theme')||localStorage.getItem('vite-ui-theme');if(t==='dark'||!t||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();
// Apply the cached color-theme variables before first paint so themed
// users don't see the default amber flash. Kept in sync with the public
// path list + cache written by src/contexts/theme-presets.tsx.
(function(){try{
  var p=['/','/privacy','/terms','/cookies','/documentation','/login','/signup','/onboarding'];
  if(p.indexOf(location.pathname)>-1)return;
  var c=JSON.parse(localStorage.getItem('theme-vars-cache')||'null');if(!c)return;
  var v=document.documentElement.classList.contains('dark')?c.dark:c.light;if(!v)return;
  var k=Object.keys(v),s=document.documentElement.style,i=0;
  for(;i<k.length;i++)s.setProperty(k[i],v[k[i]]);
  window.__ftjThemeVars=k;
}catch(e){}})();
