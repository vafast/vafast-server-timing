import { Server, createRouteHandler } from 'vafast'
import { serverTiming } from '../src/index'

describe('Vafast Server Timing Plugin', () => {
	it('should create server timing middleware', () => {
		const timingMiddleware = serverTiming({
			enabled: true,
			trace: { handle: true, total: true }
		})

		expect(timingMiddleware).toBeDefined()
		expect(typeof timingMiddleware).toBe('function')
	})

	it('should add Server-Timing header when enabled', async () => {
		const timingMiddleware = serverTiming({
			enabled: true,
			trace: { handle: true, total: true }
		})

		const app = new Server([
			{
				method: 'GET',
				path: '/',
				handler: createRouteHandler(() => {
					return 'Hello, Server Timing!'
				})
			}
		])

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return timingMiddleware(req, () => app.fetch(req))
		}

		const res = await wrappedFetch(new Request('http://localhost/'))
		const data = await res.text()

		expect(data).toBe('Hello, Server Timing!')
		expect(res.status).toBe(200)

		// 检查 Server-Timing 头部
		const timingHeader = res.headers.get('Server-Timing')
		expect(timingHeader).toBeDefined()
		expect(timingHeader).toContain('handle;dur=')
		expect(timingHeader).toContain('total;dur=')
	})

	it('should not add Server-Timing header when disabled', async () => {
		const timingMiddleware = serverTiming({
			enabled: false,
			trace: { handle: true, total: true }
		})

		const app = new Server([
			{
				method: 'GET',
				path: '/',
				handler: createRouteHandler(() => {
					return 'Hello, No Timing!'
				})
			}
		])

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return timingMiddleware(req, () => app.fetch(req))
		}

		const res = await wrappedFetch(new Request('http://localhost/'))
		const data = await res.text()

		expect(data).toBe('Hello, No Timing!')
		expect(res.status).toBe(200)

		// 检查 Server-Timing 头部不应该存在
		const timingHeader = res.headers.get('Server-Timing')
		expect(timingHeader).toBeNull()
	})

	it('should respect allow function for adding headers', async () => {
		const timingMiddleware = serverTiming({
			enabled: true,
			allow: (ctx) => ctx.request.url.includes('/allow'),
			trace: { handle: true, total: true }
		})

		const app = new Server([
			{
				method: 'GET',
				path: '/allow',
				handler: createRouteHandler(() => {
					return 'Allowed with timing'
				})
			},
			{
				method: 'GET',
				path: '/deny',
				handler: createRouteHandler(() => {
					return 'Denied timing'
				})
			}
		])

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return timingMiddleware(req, () => app.fetch(req))
		}

		// 允许的路径应该有 Server-Timing 头部
		const allowedRes = await wrappedFetch(
			new Request('http://localhost/allow')
		)
		expect(allowedRes.status).toBe(200)
		expect(allowedRes.headers.get('Server-Timing')).toBeDefined()

		// 拒绝的路径不应该有 Server-Timing 头部
		const deniedRes = await wrappedFetch(
			new Request('http://localhost/deny')
		)
		expect(deniedRes.status).toBe(200)
		expect(deniedRes.headers.get('Server-Timing')).toBeNull()
	})

	it('should respect boolean allow setting', async () => {
		const timingMiddleware = serverTiming({
			enabled: true,
			allow: false, // 禁用所有头部
			trace: { handle: true, total: true }
		})

		const app = new Server([
			{
				method: 'GET',
				path: '/',
				handler: createRouteHandler(() => {
					return 'No timing allowed'
				})
			}
		])

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return timingMiddleware(req, () => app.fetch(req))
		}

		const res = await wrappedFetch(new Request('http://localhost/'))
		expect(res.status).toBe(200)

		// 即使启用了，allow: false 也应该阻止头部
		const timingHeader = res.headers.get('Server-Timing')
		expect(timingHeader).toBeNull()
	})

	it('should handle custom trace configuration', async () => {
		const timingMiddleware = serverTiming({
			enabled: true,
			trace: { handle: false, total: true } // 只追踪总数
		})

		const app = new Server([
			{
				method: 'GET',
				path: '/',
				handler: createRouteHandler(() => {
					return 'Custom trace config'
				})
			}
		])

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return timingMiddleware(req, () => app.fetch(req))
		}

		const res = await wrappedFetch(new Request('http://localhost/'))
		expect(res.status).toBe(200)

		// 检查 Server-Timing 头部
		const timingHeader = res.headers.get('Server-Timing')
		expect(timingHeader).toBeDefined()
		expect(timingHeader).not.toContain('handle;dur=')
		expect(timingHeader).toContain('total;dur=')
	})

	it('should work with async operations', async () => {
		const timingMiddleware = serverTiming({
			enabled: true,
			trace: { handle: true, total: true }
		})

		const app = new Server([
			{
				method: 'GET',
				path: '/',
				handler: createRouteHandler(async () => {
					// 模拟异步操作
					await new Promise((resolve) => setTimeout(resolve, 10))
					return 'Async operation completed'
				})
			}
		])

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return timingMiddleware(req, () => app.fetch(req))
		}

		const res = await wrappedFetch(new Request('http://localhost/'))
		const data = await res.text()

		expect(data).toBe('Async operation completed')
		expect(res.status).toBe(200)

		// 检查 Server-Timing 头部
		const timingHeader = res.headers.get('Server-Timing')
		expect(timingHeader).toBeDefined()

		// 解析持续时间值
		const handleMatch = timingHeader?.match(/handle;dur=(\d+\.?\d*)/)
		const totalMatch = timingHeader?.match(/total;dur=(\d+\.?\d*)/)

		expect(handleMatch).toBeDefined()
		expect(totalMatch).toBeDefined()

		// 异步操作应该有合理的持续时间
		const handleDuration = parseFloat(handleMatch![1])
		const totalDuration = parseFloat(totalMatch![1])

		expect(handleDuration).toBeGreaterThan(0)
		expect(totalDuration).toBeGreaterThan(0)
		expect(totalDuration).toBeGreaterThanOrEqual(handleDuration)
	})

	it('should handle different HTTP methods', async () => {
		const timingMiddleware = serverTiming({
			enabled: true,
			trace: { handle: true, total: true }
		})

		const app = new Server([
			{
				method: 'GET',
				path: '/',
				handler: createRouteHandler(() => {
					return { method: 'GET' }
				})
			},
			{
				method: 'POST',
				path: '/',
				handler: createRouteHandler(() => {
					return { method: 'POST' }
				})
			}
		])

		// 应用中间件
		const wrappedFetch = (req: Request) => {
			return timingMiddleware(req, () => app.fetch(req))
		}

		// GET 请求
		const getRes = await wrappedFetch(new Request('http://localhost/'))
		expect(getRes.status).toBe(200)
		const getData = await getRes.json()
		expect(getData.method).toBe('GET')
		expect(getRes.headers.get('Server-Timing')).toBeDefined()

		// POST 请求
		const postRes = await wrappedFetch(
			new Request('http://localhost/', { method: 'POST' })
		)
		expect(postRes.status).toBe(200)
		const postData = await postRes.json()
		expect(postData.method).toBe('POST')
		expect(postRes.headers.get('Server-Timing')).toBeDefined()
	})
})
