import { createRequestHandler } from '@remix-run/express'
import { broadcastDevReady, installGlobals } from '@remix-run/node'
import chokidar from 'chokidar'
import compression from 'compression'
import express from 'express'
import morgan from 'morgan'
import * as fs from 'node:fs'
import sourceMapSupport from 'source-map-support'

sourceMapSupport.install()
installGlobals()

const BUILD_PATH = './build/index.js'

let build = await import(BUILD_PATH)
let devBuild = build
let devToolsConfig = null

if (process.env.NODE_ENV === 'development') {
	const { withServerDevTools, defineServerConfig } = await import(
		'remix-development-tools/server'
	)
	devToolsConfig = defineServerConfig({
		// ... your config here ...
	})
	devBuild = withServerDevTools(build, devToolsConfig)
}

const app = express()

app.use(compression())
app.disable('x-powered-by')

app.use(
	'/build',
	express.static('public/build', { immutable: true, maxAge: '1y' }),
)

app.use(express.static('public', { maxAge: '1h' }))

app.use(morgan('tiny'))

app.all(
	'*',
	process.env.NODE_ENV === 'development'
		? createDevRequestHandler()
		: createRequestHandler({
				build,
				mode: process.env.NODE_ENV,
			}),
)

const port = process.env.PORT || 3000
app.listen(
	port,
	process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0',
	() => {
		console.log(
			`Server is listening on ${
				process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0'
			}:${port}`,
		)
	},
)

function createDevRequestHandler() {
	const watcher = chokidar.watch(BUILD_PATH, { ignoreInitial: true })

	watcher.on('all', async () => {
		const stat = fs.statSync(BUILD_PATH)
		devBuild = import(BUILD_PATH + '?t=' + stat.mtimeMs)
		devBuild = withServerDevTools(devBuild, devToolsConfig)
		broadcastDevReady(await devBuild)
	})

	return async (req, res, next) => {
		try {
			return createRequestHandler({
				build: await devBuild,
				mode: 'development',
			})(req, res, next)
		} catch (error) {
			next(error)
		}
	}
}
