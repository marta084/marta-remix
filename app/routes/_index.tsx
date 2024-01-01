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
			<Link
				to="image_upload"
				className="font-semibold underline flex justify-end m-4"
			>
				image_upload
			</Link>
			<div>
				<h1 className="text-lg font-semibold">Welcome to marta Blog & Notes</h1>
			</div>
		</div>
	)
}
