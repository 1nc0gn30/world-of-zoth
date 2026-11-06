import { chromium } from 'playwright-core';
export async function open(file='index.html',{w=1920,h=1080,query='?capture=1'}={}){
  const browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({viewport:{width:w,height:h}});
  const errors=[]; page.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') errors.push(m.type()+': '+m.text()); }); page.on('pageerror',e=>errors.push('pageerror: '+e.message)); page.on('crash',()=>console.log('PAGE CRASHED')); browser.on('disconnected',()=>console.log('BROWSER DISCONNECTED'));
  await page.goto('file://'+process.cwd()+'/'+file+query);
  await page.waitForFunction(()=>window.WOZ&&window.G&&G.mode==='title',null,{timeout:60000});
  return {browser,page,errors};
}
export const st=(page)=>page.evaluate(()=>WOZ.state());
export const step=(page,n=1)=>page.evaluate(n=>WOZ.step(n),n);
export async function shot(page,name){ const d=await page.evaluate(()=>WOZ.frame()); const fs=await import('fs'); fs.writeFileSync(name,Buffer.from(d.split(',')[1],'base64')); }
