import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/scripts/lead-analytics.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2022, moduleDetection: ts.ModuleDetectionKind.Legacy },
}).outputText;

test('GA4 loads only on confirmed success with consent and stops after withdrawal', () => {
  const events = new Map<string, (event: unknown) => void>();
  const storage = new Map<string, string>();
  const scripts: { src: string }[] = [];
  let onChange: (() => void) | undefined;
  const checkbox = { checked: true, addEventListener: (_name: string, callback: () => void) => { onChange = callback; } };
  const window = {
    dataLayer: [] as ArrayLike<unknown>[],
    addEventListener: (name: string, callback: (event: unknown) => void) => events.set(name, callback),
  };

  runInNewContext(compiled, {
    window,
    localStorage: {
      getItem: (key: string) => storage.get(key),
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    location: { origin: 'https://www.ashbi.ca', pathname: '/contact/' },
    document: {
      querySelector: (selector: string) => selector === '[data-analytics-choice]'
        ? checkbox
        : { dataset: { measurementId: 'G-TEST123' }, removeAttribute() {} },
      createElement: () => ({}),
      head: { append: (script: { src: string }) => scripts.push(script) },
    },
  });

  const emit = (event: string) => events.get('ashbi:analytics')?.({ detail: { event, email: 'test@example.com' } });
  assert.equal(checkbox.checked, false);
  emit('brief_success');
  assert.equal(scripts.length, 0);
  assert.equal(window.dataLayer.length, 0);

  checkbox.checked = true;
  onChange?.();
  for (const event of ['page_view', 'brief_start', 'brief_failure', 'email_click']) emit(event);
  assert.equal(scripts.length, 0);
  emit('brief_success');
  assert.equal(scripts.length, 1);
  const commands = window.dataLayer.map(command => Array.from(command));
  assert.equal(commands[1][0], 'config');
  assert.equal((commands[1][2] as { send_page_view: boolean }).send_page_view, false);
  assert.equal(JSON.stringify(commands[2]), JSON.stringify(['event', 'generate_lead', { send_to: 'G-TEST123' }]));

  checkbox.checked = false;
  onChange?.();
  emit('brief_success');
  assert.equal(window.dataLayer.length, 3);
  assert.equal(Reflect.get(window, 'ga-disable-G-TEST123'), true);
});
