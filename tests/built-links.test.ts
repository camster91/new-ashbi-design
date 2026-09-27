import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const checker=fileURLToPath(new URL('../ops/check-built-links.mjs',import.meta.url));

test('built link check verifies local page fragments, including brief links with query context',async()=>{
  const root=await mkdtemp(join(tmpdir(),'ashbi-built-links-'));
  try{
    await mkdir(join(root,'contact'));
    await writeFile(join(root,'index.html'),'<a href="/contact/?service=web-design#project-brief">Send a brief</a>');
    await writeFile(join(root,'contact','index.html'),'<section id="project-brief">Brief</section>');

    const run=()=>spawnSync(process.execPath,[checker,root],{encoding:'utf8'});
    const valid=run();
    assert.equal(valid.status,0,valid.stderr);
    assert.match(valid.stdout,/1 local page fragments/);

    await writeFile(join(root,'contact','index.html'),'<section id="contact-title">Contact</section>');
    const missing=run();
    assert.equal(missing.status,1);
    assert.match(missing.stderr,/missing fragment/);
  }finally{
    await rm(root,{recursive:true,force:true});
  }
});
