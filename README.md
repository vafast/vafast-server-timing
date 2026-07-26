# @vafast/server-timing

Vafast Server-Timing 中间件：把 `handle` / `total` 耗时写入响应头，便于 DevTools 观察。

## Installation

```bash
npm install @vafast/server-timing
```

## Quick start

```typescript
import { Server, defineRoute, defineRoutes, json, serve } from 'vafast'
import { serverTiming } from '@vafast/server-timing'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => json({ ok: true }),
  }),
])

const server = new Server(routes)
server.use(serverTiming())
serve({ fetch: server.fetch, port: 3000 })
```

响应示例：`Server-Timing: handle;dur=1.23,total;dur=1.25`

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `NODE_ENV !== 'production'` | 是否启用；生产默认关闭 |
| `allow` | 允许写入 | `boolean` 或 `({ request }) => boolean \| Promise<boolean>` |
| `trace.handle` | `true` | 输出 `handle` 段 |
| `trace.total` | `true` | 输出 `total` 段 |

当前仅支持 `handle` / `total` 两段计时。

## Docs

See [Server Timing middleware docs](https://vafast.huyooo.com/middleware/server-timing.html).
