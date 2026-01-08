# @vafast/server-timing

Server-Timing middleware for [Vafast](https://github.com/vafastjs/vafast) framework, used for performance tracking and debugging.

## Installation

```bash
npm install @vafast/server-timing
# or
npm install @vafast/server-timing
```

## Usage

```typescript
import { Server, createHandler } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const timing = serverTiming()

const routes = [
  {
    method: 'GET',
    path: '/',
    middleware: [timing],
    handler: createHandler(() => {
      return { ok: true }
    })
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => server.fetch(req)
}
```

## Configuration

### enabled

@default `NODE_ENV !== 'production'`

Whether to enable Server-Timing middleware

### allow

@default `true`

Allow/deny writing response headers
- `boolean` - Whether to allow
- `function` - Dynamic judgment based on context

### trace

@default `{ handle: true, total: true }`

Tracking options
- `handle` - Track handler execution time
- `total` - Track total request time

## License

MIT
