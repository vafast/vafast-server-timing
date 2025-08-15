type MaybePromise<T> = T | Promise<T>

export interface ServerTimingOptions {
	/**
	 * 是否启用 Server-Timing 中间件
	 * @default NODE_ENV !== 'production'
	 */
	enabled?: boolean
	/**
	 * 允许/拒绝写入响应头
	 * - boolean: 是否允许
	 * - function: 基于上下文动态判断
	 */
	allow?: MaybePromise<boolean> | ((context: any) => MaybePromise<boolean>)
	/**
	 * 追踪开关（tirne 不暴露细粒度生命周期，这里仅保留 handle/total）
	 */
	trace?: {
		handle?: boolean
		total?: boolean
	}
}

const now = () =>
	typeof performance !== 'undefined' && typeof performance.now === 'function'
		? performance.now()
		: Date.now()

export const serverTiming = ({
	enabled = process.env.NODE_ENV !== 'production',
	allow,
	trace: { handle: traceHandle = true, total: traceTotal = true } = {}
}: ServerTimingOptions = {}) => {
	return async (context: any, next: () => Promise<Response>) => {
		if (!enabled) return next()

		const start = now()
		const beforeHandle = now()
		const response = await next()
		const end = now()

		let label = ''
		if (traceHandle) label += `handle;dur=${end - beforeHandle},`
		if (traceTotal) label += `total;dur=${end - start}`
		else label = label.slice(0, -1)

		let isAllowed = true
		const req: Request =
			(context && (context.request as Request)) ||
			(context && (context.req as Request)) ||
			context

		const allowCtx = { request: req }

		switch (typeof allow) {
			case 'boolean':
				isAllowed = allow
				break
			case 'function':
				isAllowed = await allow(allowCtx)
				break
			default:
				isAllowed = true
		}

		if (isAllowed && response && 'headers' in response) {
			try {
				response.headers.set('Server-Timing', label)
			} catch {}
		}

		return response
	}
}

export default serverTiming
