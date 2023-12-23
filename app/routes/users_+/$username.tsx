import { json, type DataFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { prisma } from '~/utils/db.server.ts'
import { invariantResponse } from '~/utils/misc.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const user = await prisma.user.findFirst({
		select: {
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true } },
		},
		where: {
			username: params.username,
		},
	})

	invariantResponse(user, 'User not found', { status: 404 })

	return json({ user, userJoinedDisplay: user.createdAt.toLocaleDateString() })
}

export default function UserRoute() {
	const data = useLoaderData<typeof loader>()
	const ownerDisplayName = data.user.name ?? data.user.username
	return (
		<div className="flex-grow">
			<h1 className="m-4 pb-8">{ownerDisplayName} profile:</h1>
			<div className="m-8">
				<div className="pb-4">
					<Link
						to={`/users/${data.user.username}`}
						className="p-8 mr-4 shadow-sm rounded-lg overflow-hidden text-lg font-bold bg-gray-600 text-gray-100 transition duration-200 ease-in-out"
					>
						{ownerDisplayName}
					</Link>

					<Link
						to={`/users/${data.user.username}/notes`}
						className="p-8 mr-4 shadow-sm rounded-lg overflow-hidden bg-white text-lg font-bold hover:bg-gray-600 hover:text-gray-100 transition duration-200 ease-in-out"
					>
						{ownerDisplayName} Notes
					</Link>
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction<typeof loader> = ({
	data,
	params,
	matches,
}) => {
	console.log(matches)
	const displayName = data?.user.name ?? params.username
	return [
		{ title: `${displayName} Profile` },
		{
			name: 'description',
			content: `Checkout ${displayName} Profile`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => {
					return <p>No user with the username {params.username} exists</p>
				},
			}}
		/>
	)
}
