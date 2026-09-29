import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const fixture=join(process.cwd(),'local-verification-fixture');
await mkdir(fixture,{recursive:true});
const lines=Array.from({length:1500},(_,i)=>'INFO checkout request '+i+' completed with ordinary diagnostic information '.repeat(4));
lines.splice(710,0,'ERROR checkout initialization failed: MissingSigningKeyError','Required CHECKOUT_SIGNING_KEY is missing');
await writeFile(join(fixture,'checkout.log'),lines.join('\n').replaceAll('\\n','\n'));
for(const serverPath of [
'C:/Users/B00149614/.codex/plugins/cache/jev-codex-token-saver/jev-codex-token-saver/0.3.2+codex.20260920154434/dist/server.mjs',
'C:/Users/B00149614/Projects/jev-codex-token-saver/dist/server.mjs'
]){
 const client=new Client({name:'local-verification',version:'1.0.0'});
 const transport=new StdioClientTransport({command:process.execPath,args:[serverPath],env:{PATH:process.env.PATH??'',TYPESAFE_API_KEY:''}});
 try{
  await client.connect(transport);
  const tools=await client.listTools();
  assert.equal(tools.tools.length,3);
  const result=await client.callTool({name:'read_large_text_evidence',arguments:{workspaceRoot:fixture,path:'checkout.log',query:'checkout initialization failed MissingSigningKeyError CHECKOUT_SIGNING_KEY',resultLimit:2}});
  assert.ok(!result.isError,JSON.stringify(result));
  const data=result.structuredContent;
  assert.equal(data.mode,'local-fallback');
  assert.equal(data.metrics.jevRequests,0);
  assert.ok(data.evidence.some(e=>e.content?.includes('MissingSigningKeyError')||e.excerpt?.includes('MissingSigningKeyError')),JSON.stringify(data));
  console.log(JSON.stringify({server:serverPath,tools:tools.tools.length,mode:data.mode,metrics:data.metrics,errorRetained:true}));
 }finally{await client.close();}
}
