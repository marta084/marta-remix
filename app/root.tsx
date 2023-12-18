import os from 'node:os'
import { cssBundleHref } from '@remix-run/css-bundle'
import { json, type LinksFunction, type MetaFunction } from '@remix-run/node'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react'
import MartaBlogFavicon from './assets/favicon.ico'
import { GeneralErrorBoundary } from './components/error-boundary'

// icon, styles, components
import tailwindStyleSheet from './styles/tailwind.css'
import globalStyleSheet from './styles/global.css'
import fontStyleSheet from './styles/font.css'
import Footer from './components/footer'
import Header from './components/header'
import { getEnv } from './utils/env.server'

export const links: LinksFunction = () => {
	return [
		{ rel: 'icon', href: MartaBlogFavicon, type: 'image/x-icon' },
		{ rel: 'stylesheet', href: tailwindStyleSheet },
		{ rel: 'stylesheet', href: globalStyleSheet },
		{ rel: 'stylesheet', href: fontStyleSheet },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export async function loader() {
	return json({ username: os.userInfo().username, ENV: getEnv() })
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
			<body className="max-w-3xl mx-auto bg-gray-100 flex flex-col w-full h-full">
				{children}
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	)
}

export default function App() {
	return (
		<Document>
			<Header />
			<Outlet />
			<Footer />
		</Document>
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
