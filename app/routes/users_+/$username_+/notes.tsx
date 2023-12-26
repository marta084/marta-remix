import { json, type DataFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Link, NavLink, Outlet, useLoaderData } from '@remix-run/react'
import { prisma } from '~/utils/db.server'
import { cn, getUserImgSrc, invariantResponse } from '~/utils/misc'

export async function loader({ params }: DataFunctionArgs) {
	const owner = await prisma.user.findFirst({
		select: {
			name: true,
			username: true,
			image: { select: { id: true } },
			notes: { select: { id: true, title: true } },
		},
		where: {
			username: params.username,
		},
	})
	invariantResponse(owner, 'User not found', { status: 404 })
	return json({ owner })
}

export default function NotesRoute() {
	const data = useLoaderData<typeof loader>()
	const user = data.owner
	const userDisplayName = data.owner.name ?? data.owner.username

	return (
		<div>
			<div className="w-60">
				<Link to={`/users/${user.username}/`}>
					<div className="p-8 m-4 shadow-sm rounded-lg overflow-hidden bg-white text-lg font-bold hover:bg-gray-600 hover:text-gray-100 transition duration-200 ease-in-out w-60">
						<img
							src={getUserImgSrc(data.owner.image?.id)}
							alt={userDisplayName}
							className="h-24 w-24 rounded-full object-cover"
						/>
						{userDisplayName}s Profile
					</div>
				</Link>
			</div>

			<h1 className="m-4 text-lg font-medium bg-white">
				<Link to="/users/kody/notes" relative="path">
					Notes
				</Link>
			</h1>
			<div className="grid w-full grid-cols-4 bg-muted pl-2 md:container md:rounded-3xl md:pr-0">
				<div className="relative col-span-1 border-2 mr-2 border-gray-450">
					<ul className="overflow-y-auto overflow-x-hidden pb-12">
						{data.owner.notes.length > 0 ? (
							data.owner.notes.map(note => (
								<li key={note.id} className="m-1 p-4 border-2 border-gray-300">
									<NavLink
										to={note.id}
										className={({ isActive }) =>
											cn(isActive && 'bg-black text-white')
										}
										preventScrollReset
									>
										{note.title}
									</NavLink>
								</li>
							))
						) : (
							<p>No notes yet</p>
						)}
					</ul>
				</div>
				<div className="relative col-span-3 bg-accent border-2 border-red-500 p-4 mr-2">
					<Outlet />
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [{ title: `${data?.owner.name} Notes` }]
}
