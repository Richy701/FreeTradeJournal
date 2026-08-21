// Pre-paint theme bootstrap. Loaded as a blocking external script (not inline)
// so the CSP can drop 'unsafe-inline' from script-src.
(function(){try{var t=localStorage.getItem('ftj-theme')||localStorage.getItem('vite-ui-theme');if(t==='dark'||!t||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();
// Apply the cached color-theme variables before first paint so themed
// users don't see the default amber flash. Only app routes are themed —
// kept in sync with the app path list + cache written by
// src/contexts/theme-presets.tsx.
(function(){try{
  var p=['/dashboard','/coach','/trades','/goals','/journal','/ideas','/settings','/profile','/prop-tracker'];
  var ok=false;for(var j=0;j<p.length;j++){if(location.pathname===p[j]||location.pathname.indexOf(p[j]+'/')===0){ok=true;break}}
  if(!ok)return;
  var c=JSON.parse(localStorage.getItem('theme-vars-cache')||'null');if(!c)return;
  var v=document.documentElement.classList.contains('dark')?c.dark:c.light;if(!v)return;
  var k=Object.keys(v),s=document.documentElement.style,i=0;
  for(;i<k.length;i++)s.setProperty(k[i],v[k[i]]);
  window.__ftjThemeVars=k;
}catch(e){}})();

// Signed-in users refreshing at "/" get the prerendered landing page painted
// before React can redirect them — the React-side guard in LandingPage runs
// far too late to help. Hide the page pre-paint when we already know a session
// exists; auth-context clears the attribute the moment auth resolves, and the
// timeout is a safety net so a JS failure reveals the page instead of leaving
// it blank. Logged-out visitors and crawlers never have the marker, so LCP and
// prerendered SEO content are untouched.
(function(){try{
  if(location.pathname!=='/')return;
  if(localStorage.getItem('ftj-had-session')!=='1')return;
  document.documentElement.setAttribute('data-auth-hold','1');
  setTimeout(function(){document.documentElement.removeAttribute('data-auth-hold')},2000);
}catch(e){}})();
