import { json, redirect } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Spacer } from '~/components/spacer'
import prisma from '~/utils/db.server'
import { cn, useDelayedIsPending } from '~/utils/misc'
import { formatDistanceToNow } from 'date-fns'

// Define the schema for a user search result
const UserSearchResultSchema = z.object({
	id: z.string(),
	username: z.string(),
	name: z.string().nullable(),
	imageId: z.string().nullable(),
	cloudinaryurl: z.string().nullable(),
	updatedAt: z.date().nullable(),
})

// Define the schema for an array of user search results
const UserSearchResultsSchema = z.array(UserSearchResultSchema)

// Loader function to fetch user search results
export async function loader({ request }: LoaderFunctionArgs) {
	const searchTerm = new URL(request.url).searchParams.get('search')
	if (searchTerm === '') {
		return redirect('/users')
	}
	const like = `%${searchTerm ?? ''}%`

	// Fetch user data from the database
	const rawUsers = await prisma.$queryRaw`
    SELECT
      User.id,
      User.username,
      User.name,
      UserImage.id AS imageId,
      UserImage.cloudinaryurl AS cloudinaryurl,
      UserImage.updatedAt
    FROM
      User
    LEFT JOIN
      UserImage ON UserImage.id = User.userImageid
    LEFT JOIN
      Note ON Note.ownerId = User.id
    WHERE
      User.username LIKE ${like}
      OR User.name LIKE ${like}
    GROUP BY
      User.id, User.username, User.name, UserImage.id, UserImage.cloudinaryurl, UserImage.updatedAt
    ORDER BY
      UserImage.cloudinaryurl IS NULL, UserImage.cloudinaryurl
    LIMIT
      50
  `

	// Validate and parse the fetched user data
	const result = UserSearchResultsSchema.safeParse(rawUsers)
	if (!result.success) {
		return json({ status: 'error', error: result.error.message } as const, {
			status: 400,
		})
	}

	// Return the parsed user data as JSON response
	return json({ status: 'idle', users: result.data } as const)
}

// Component to render the user search results
export default function UsersRoute() {
	const data = useLoaderData<typeof loader>()
	const fetcher = useFetcher()
	const isLoadingData = fetcher.state === 'loading'
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/users',
	})

	return (
		<div>
			<Spacer size="4xs" />
			<div className="flex justify-between">
				<h1 className="text-lg">Users:</h1>
			</div>
			<Spacer size="4xs" />
			<main>
				{isLoadingData ? (
					<p>Loading...</p>
				) : data.status === 'idle' ? (
					data.users.length ? (
						<ul
							className={cn(
								'flex w-full flex-wrap items-center justify-center gap-4 delay-200',
								{ 'opacity-50': isPending },
							)}
						>
							{data.users.map(user => (
								<li key={user.id}>
									<Link
										to={user.username}
										className="bg-secondary flex w-44 flex-col items-center justify-center rounded-lg px-5 py-3"
									>
										<img
											alt={user.name ?? user.username}
											src={user.cloudinaryurl ?? ''}
											className="h-16 w-16 rounded-full"
										/>
										{user.updatedAt ? (
											<p className="text-sm">
												{user.updatedAt
													? formatDistanceToNow(new Date(user.updatedAt)) +
														' ago'
													: 'N/A'}
											</p>
										) : null}

										{user.name ? (
											<span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
												{user.name}
											</span>
										) : null}
										<span className="w-full overflow-hidden text-ellipsis text-center text-body-sm text-muted-foreground">
											{user.username}
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p>No users found</p>
					)
				) : (
					<p>Something went wrong</p>
				)}
			</main>
		</div>
	)
}
