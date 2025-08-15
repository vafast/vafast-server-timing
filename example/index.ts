import { Server, json } from 'tirne'
import { serverTiming } from '../src/index'

const delay = (time = 1000) => new Promise((r) => setTimeout(r, time))

const timing = serverTiming()

const routes = [
	{
		method: 'GET',
		path: '/',
		middleware: [timing],
		handler: async () => {
			await delay(1)
			return json('Server Timing')
		}
	}
]

const server = new Server(routes)

const req = (path: string) => new Request(`http://localhost:8080${path}`)

server.fetch(req('/'))

// const res = await server.fetch(req('/'))
// const timingHeader = res.headers.get('Server-Timing')
// console.log(timingHeader)
