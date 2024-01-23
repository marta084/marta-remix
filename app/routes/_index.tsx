import { Link } from '@remix-run/react'
import { Button } from '~/components/ui/button'

export async function loader() {
	return null
}

export default function Index() {
	return (
		<div className="mb-auto">
			<div>
				<h1 className="text-lg font-semibold">Welcome to marta Blog & Notes</h1>
				<div></div>
				<Link to="https://google.com">text go to google</Link>
				<a href="http://"> link</a>
			</div>
		</div>
	)
}
