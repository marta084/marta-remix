import { json, type DataFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { prisma } from '~/utils/db.server'
import { getUserImgSrc, invariantResponse } from '~/utils/misc'

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
	const user = data.user
	const userDisplayName = user.name ?? user.username
	return (
		<div className="mb-auto">
			<div>
				<h1 className="m-4">profile:</h1>
				<div className="relative">
					<img
						src={getUserImgSrc(data.user.image?.id)}
						alt={userDisplayName}
						className="h-52 w-52 rounded-full object-cover"
					/>
				</div>

				<Link
					to={`/users/${data.user.username}`}
					className=" px-4 shadow-sm rounded-lg overflow-hidden text-lg font-bold bg-gray-600 text-gray-100 transition duration-200 ease-in-out"
				>
					{userDisplayName}
				</Link>
				<p className="mt-2 text-muted-foreground">
					Joined {data.userJoinedDisplay}
				</p>
			</div>
			<div className="m-8 pt-8">
				<div className="pb-4">
					<Link
						to={`/users/${data.user.username}/notes`}
						className="p-8 mr-4 shadow-sm rounded-lg overflow-hidden bg-white text-lg font-bold hover:bg-gray-600 hover:text-gray-100 transition duration-200 ease-in-out"
					>
						{userDisplayName} Notes
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
