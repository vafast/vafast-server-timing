import { Server, createRouteHandler } from 'vafast'
import { serverTiming } from '../src/index'

const delay = (time = 1000) => new Promise((r) => setTimeout(r, time))

const timing = serverTiming()

const routes = [
	{
		method: 'GET',
		path: '/',
		middleware: [timing],
		handler: createRouteHandler(async () => {
			await delay(1)
			return 'Server Timing'
		})
	}
]

const server = new Server(routes)

// 导出 fetch 函数，应用中间件
export default {
	fetch: (req: Request) => {
		// 应用 Server-Timing 中间件
		return timing(req, () => server.fetch(req))
	}
}

// 测试代码
const req = (path: string) => new Request(`http://localhost:8080${path}`)

// 测试请求
const testRequest = async () => {
	const res = await server.fetch(req('/'))
	const timingHeader = res.headers.get('Server-Timing')
	console.log('Server-Timing header:', timingHeader)
	return res
}

// 如果直接运行此文件，执行测试
if (import.meta.main) {
	testRequest()
}
