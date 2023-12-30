import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Spacer } from '~/components/spacer'
import { prisma } from '~/utils/db.server'
import { cn, getUserImgSrc, useDelayedIsPending } from '~/utils/misc'

const UserSearchResultSchema = z.object({
	id: z.string(),
	username: z.string(),
	name: z.string().nullable(),
	imageId: z.string().nullable(),
})

const UserSearchResultsSchema = z.array(UserSearchResultSchema)

export async function loader({ request }: DataFunctionArgs) {
	const searchTerm = new URL(request.url).searchParams.get('search')
	if (searchTerm === '') {
		return redirect('/users')
	}

	const like = `%${searchTerm ?? ''}%`
	const rawUsers = await prisma.$queryRaw`
  SELECT "User"."id", "User"."username", "User"."name", "UserImage"."id" AS "imageId", MAX("Note"."updatedAt") AS "latestNoteUpdateTime"
  FROM "User"
  LEFT JOIN "UserImage" ON "UserImage"."userId" = "User"."id"
  LEFT JOIN "Note" ON "Note"."ownerId" = "User"."id"
  WHERE "User"."username" LIKE ${like}
  OR "User"."name" LIKE ${like}
  GROUP BY "User"."id", "User"."username", "User"."name", "UserImage"."id"
  ORDER BY "latestNoteUpdateTime" DESC
  LIMIT 50
`

	const result = UserSearchResultsSchema.safeParse(rawUsers)
	if (!result.success) {
		return json({ status: 'error', error: result.error.message } as const, {
			status: 400,
		})
	}
	return json({ status: 'idle', users: result.data } as const)
}

export default function UsersRoute() {
	const data = useLoaderData<typeof loader>()

	//data is loading ui
	const fetcher = useFetcher()
	const isLoadingData = fetcher.state === 'loading'

	// when search a use show pending ui
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/users',
	})

	return (
		<div className="mb-auto">
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
										className="flex h-36 w-44 flex-col items-center justify-center rounded-lg bg-white px-5 py-3"
									>
										<img
											alt={user.name ?? user.username}
											src={getUserImgSrc(user.imageId)}
											className="h-16 w-16 rounded-full"
										/>
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

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
