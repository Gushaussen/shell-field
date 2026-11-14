const css=`:root{--button-bg:white;--button-hover:#edf2ff;--button-border:var(--b);--button-text:var(--b);--primary-bg:var(--b);--primary-text:white;--primary-hover:#0540d9;--field-bg:white;--field-border:var(--l);--field-text:var(--b);--surface-bg:white;--surface-border:var(--l);--surface-text:var(--b)}
[data-theme=dark]{--button-bg:#0b1530;--button-hover:#132247;--button-border:#3d5cff;--button-text:#dce5ff;--primary-bg:#0540d9;--primary-text:#f4f7ff;--primary-hover:#0648ff;--field-bg:#0b1530;--field-border:#33447a;--field-text:#dce5ff;--surface-bg:#081026;--surface-border:#33447a;--surface-text:#dce5ff}
[data-theme=white-cobalt]{--button-bg:white;--button-hover:#eef3ff;--button-border:#0648ff;--button-text:#0648ff;--primary-bg:#0648ff;--primary-text:white;--primary-hover:#0540d9;--field-bg:white;--field-border:#c9d6ff;--field-text:#0648ff;--surface-bg:white;--surface-border:#c9d6ff;--surface-text:#0648ff}
button{background:var(--button-bg)!important;color:var(--button-text)!important;border-color:var(--button-border)!important}
button:hover{background:var(--button-hover)!important;color:var(--button-text)!important}
button:disabled{background:var(--button-bg)!important;color:var(--button-text)!important;opacity:.4}
button.primary{background:var(--primary-bg)!important;color:var(--primary-text)!important;border-color:var(--primary-bg)!important}
button.primary:hover{background:var(--primary-hover)!important;color:var(--primary-text)!important}
button.selected{background:var(--primary-bg)!important;color:var(--primary-text)!important;border-color:var(--primary-bg)!important}
button.selected:hover{background:var(--primary-hover)!important;color:var(--primary-text)!important}
input[type=number],select{background:var(--field-bg)!important;color:var(--field-text)!important;border-color:var(--field-border)!important}
.card,.card-title,.badge,aside{background:var(--surface-bg)!important;color:var(--surface-text)!important;border-color:var(--surface-border)!important}
.section-nav-button{background:var(--button-bg)!important;color:var(--button-text)!important;border-color:var(--button-border)!important}
.section-nav-button:hover{background:var(--button-hover)!important;color:var(--button-text)!important}
.section-nav-button.active{background:var(--primary-bg)!important;color:var(--primary-text)!important;border-color:var(--primary-bg)!important}
`;const style=document.createElement('style');style.id='theme-button-overrides';style.textContent=css;document.getElementById('theme-button-overrides')?.remove();document.head.append(style);
function syncTheme(){const theme=document.documentElement.dataset.theme||document.body.dataset.theme||'';if(!theme)return;document.documentElement.dataset.theme=theme}
new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});new MutationObserver(syncTheme).observe(document.body,{attributes:true,attributeFilter:['data-theme']});syncTheme();