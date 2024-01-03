import { Link } from '@remix-run/react'

export async function loader() {
	return null
}

export default function Index() {
	return (
		<div className="mb-auto">
			<div>
				<h1 className="text-lg font-semibold">Welcome to marta Blog & Notes</h1>
			</div>
		</div>
	)
}
