import os from 'node:os'
import { cssBundleHref } from '@remix-run/css-bundle'
import {
	type DataFunctionArgs,
	json,
	type LinksFunction,
	type MetaFunction,
} from '@remix-run/node'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useMatches,
} from '@remix-run/react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react'
import MartaBlogFavicon from './assets/favicon.ico'
import { GeneralErrorBoundary } from './components/error-boundary'
import { csrf } from '~/utils/csrf.server'
// icon, styles, components
import tailwindStyleSheet from './styles/tailwind.css'
import './styles/global.css'
import Footer from './components/site/footer'
import Header from './components/site/header'
import { getEnv } from './utils/env.server'
import { honeypot } from './utils/honeypot.server'

export const links: LinksFunction = () => {
	return [
		{ rel: 'icon', href: MartaBlogFavicon, type: 'image/x-icon' },
		{ rel: 'stylesheet', href: tailwindStyleSheet },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export async function loader({ request }: DataFunctionArgs) {
	const honeyProps = honeypot.getInputProps()
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request)
	return json(
		{ username: os.userInfo().username, ENV: getEnv(), honeyProps, csrfToken },
		{
			headers: csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : {},
		},
	)
}

function Document({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full overflow-x-hidden">
			<head>
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Links />
			</head>
			<body className="max-w-4xl mx-auto flex flex-col min-h-screen">
				{children}
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	)
}
function App() {
	return (
		<Document>
			<Header />
			<div className="bg-gray-100 px-4 py-2">
				<Outlet />
			</div>
			<Footer />
		</Document>
	)
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<AuthenticityTokenProvider token={data.csrfToken}>
			<HoneypotProvider {...data.honeyProps}>
				<App />
			</HoneypotProvider>
		</AuthenticityTokenProvider>
	)
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Marta Blog' },
		{
			name: 'description',
			description: 'Marta Blog',
		},
	]
}

export function ErrorBoundary() {
	return (
		<Document>
			<GeneralErrorBoundary />
		</Document>
	)
}
