if ('Bun' in globalThis) {
  throw new Error('❌ Use Node.js to run this test!');
}

import { serverTiming } from '@vafast/server-timing';

if (typeof serverTiming !== 'function') {
  throw new Error('❌ ESM Node.js failed');
}

console.log('✅ ESM Node.js works!');
