# @vafast/server-timing
基于 [`tirne`](https://tirne.dev/) 的 Server-Timing 中间件，用于性能追踪与调试。

## 安装
```bash
bun add @vafast/server-timing tirne
```

## 使用
```ts
import { Server, json } from 'tirne'
import { serverTiming } from '@vafast/server-timing'

const timing = serverTiming()

const routes = [
  {
    method: 'GET',
    path: '/limited',
    middleware: [timing],
    handler: () => json({ ok: true })
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

更多 tirne 中间件示例参考官方文档：[Rate Limit Middleware](https://tirne.dev/docs/rate-Limit-Middleware)
