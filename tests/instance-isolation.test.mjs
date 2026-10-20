import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
const require=createRequire(import.meta.url),ts=require('typescript')
const source=readFileSync(new URL('../src/core/lib/mp/security.ts',import.meta.url),'utf8')
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
function instance(id,enabled=true){
 const module={exports:{}}
 const env={MP_INSTANCE_ID:id,MP_CLIENT_ID:'123',MP_CLIENT_SECRET:'synthetic',MP_TOKEN_ENCRYPTION_KEY:Buffer.alloc(32,7).toString('base64'),MP_BASE_URL:'https://dev.example.invalid',MP_ENVIRONMENT:'test',MP_PAYMENTS_ENABLED:'false'}
 vm.runInNewContext(`(function(require,module,exports,process,Buffer,URL){${code}\n})`,{})(name=>name==='@/core/lib/modules'?{isModuleEnabled:()=>enabled}:require(name),module,module.exports,{env},Buffer,URL)
 return module.exports
}
test('Same application/key cannot decrypt another installation token envelope',()=>{
 const a=instance('store-a-dev'),b=instance('store-b-dev'),encrypted=a.encrypt('synthetic-token')
 assert.equal(a.decrypt(encrypted),'synthetic-token');assert.throws(()=>b.decrypt(encrypted))
 const tampered=Buffer.from(encrypted,'base64');tampered[tampered.length-1]^=1
 assert.throws(()=>a.decrypt(tampered.toString('base64')))
})
test('Configuration alone never activates payments or a disabled store',()=>{
 assert.equal(instance('store-dev').oauthReady(),true)
 assert.equal(instance('store-dev').checkoutReady(),false)
 assert.equal(instance('store-dev',false).oauthReady(),false)
 assert.equal(instance('unconfigured').oauthReady(),false)
})
