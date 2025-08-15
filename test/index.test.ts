import { Server, json } from 'tirne'
import { serverTiming } from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string) => new Request(`http://localhost:8080${path}`)

const delay = (time = 1000) => new Promise((r) => setTimeout(r, time))

describe('Server Timing (tirne)', () => {
	it('report event to Server-Timing', async () => {
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
		const res = await server.fetch(req('/'))
		const timingHeader = res.headers.get('Server-Timing')

		expect(timingHeader).toContain('handle;dur=')
		expect(timingHeader).toContain('total;dur=')
	})

	it('verifies handler metric formatting', async () => {
		const timing = serverTiming()
		const server = new Server([
			{
				method: 'GET',
				path: '/',
				middleware: [timing],
				handler: () => json('ok')
			}
		])

		const res = await server.fetch(req('/'))
		const header = res.headers.get('Server-Timing')
		expect(header).not.toBeNull()

		const formatted = header!.split(',').map((part) => part.split(';'))
		expect(formatted).toHaveLength(2)
		expect(formatted[0][0]).toBe('handle')
		expect(formatted[0][1]).toMatch(/dur=\d+(\.\d+)?/)
		expect(formatted[1][0]).toBe('total')
		expect(formatted[1][1]).toMatch(/dur=\d+(\.\d+)?/)
	})

	it('verifies handler metric formatting without total', async () => {
		const timing = serverTiming({ trace: { total: false } })
		const server = new Server([
			{
				method: 'GET',
				path: '/',
				middleware: [timing],
				handler: () => json('ok')
			}
		])

		const res = await server.fetch(req('/'))
		const header = res.headers.get('Server-Timing')
		expect(header).not.toBeNull()

		const formatted = header!.split(',').map((part) => part.split(';'))
		expect(formatted).toHaveLength(1)
		expect(formatted[0][0]).toBe('handle')
		expect(formatted[0][1]).toMatch(/dur=\d+(\.\d+)?/)
	})

	it('respect allow', async () => {
		const timing = serverTiming({
			allow: async (ctx: any) =>
				new URL(ctx.request.url).pathname !== '/no-trace'
		})
		const server = new Server([
			{
				method: 'GET',
				path: '/',
				middleware: [timing],
				handler: () => json('ok')
			},
			{
				method: 'GET',
				path: '/no-trace',
				middleware: [timing],
				handler: () => json('hi')
			}
		])

		const res = await server.fetch(req('/no-trace'))
		const header = res.headers.get('Server-Timing')
		expect(header).toBeNull()
	})
})
