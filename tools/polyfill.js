// Old Android System WebView (Chrome < 84) lacks FinalizationRegistry/WeakRef; three.js only uses it for cleanup hints.
if(typeof FinalizationRegistry==='undefined'){ window.FinalizationRegistry=function(){ this.register=function(){}; this.unregister=function(){}; }; }
if(typeof WeakRef==='undefined'){ window.WeakRef=function(o){ this.deref=function(){ return o; }; }; }
