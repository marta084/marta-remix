import { Link } from '@remix-run/react'

export async function loader() {
	return null
}

export default function Index() {
	return (
		<div className="mb-auto">
			<Link to="users" className="font-semibold underline flex justify-end m-4">
				Users List
			</Link>
			<div>
				<h1 className="text-lg font-semibold">Welcome to marta Blog & Notes</h1>
			</div>
		</div>
	)
}
