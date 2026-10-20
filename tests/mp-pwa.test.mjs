import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import vm from 'node:vm'
const require=createRequire(import.meta.url),ts=require('typescript')
const storeEnabled = !/store:\s*\{\s*enabled:\s*false/.test(readFileSync(new URL('../src/client/config/site.config.ts',import.meta.url),'utf8'))
let rules
const module={exports:{}}
const source=readFileSync(new URL('../src/app/sw.ts',import.meta.url),'utf8')
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const provider={NetworkOnly:class{},Serwist:class{constructor(options){rules=options.runtimeCaching}addEventListeners(){}}}
vm.runInNewContext(`(function(require,module,exports,self){${code}\n})`,{URL})(name=>name==='serwist'?provider:name==='@/core/lib/store'?{isStoreEnabled:()=>storeEnabled,isStorefrontPath:path=>['/loja','/carrinho','/checkout','/pedido','/minha-conta'].some(prefix=>path===prefix||path.startsWith(prefix+'/'))}:{defaultCache:[]},module,module.exports,{location:{origin:'https://dev.example.invalid'},addEventListener(){}})
test('PWA never caches checkout, buyer orders, admin, APIs or Mercado Pago',()=>{
 for(const path of ['/loja/pedido/id/pagamento','/loja/checkout','/loja/carrinho','/loja/meus-pedidos','/minha-conta','/admin','/api/mercado-pago/payment']){
  const url=new URL(path,'https://dev.example.invalid');assert.equal(rules[0].matcher({url,request:new Request(url)}),true,path)
 }
 for(const host of ['sdk.mercadopago.com','api.mercadopago.com','www.mercadopago.com.br']){
  const url=new URL('https://'+host+'/path');assert.equal(rules[0].matcher({url,request:new Request(url)}),true,host)
 }
 const url=new URL('/loja/categoria/catalogo','https://dev.example.invalid')
 assert.equal(rules[0].matcher({url,request:new Request(url)}),!storeEnabled)
 assert.equal(rules[0].matcher({url,request:new Request(url,{referrer:'https://dev.example.invalid/loja/pedido/id'})}),true)
})
