import { Link, useLoaderData } from '@remix-run/react'
import { json } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import { getUserImgSrc } from '~/utils/misc'

export async function loader() {
	const users = await prisma.user.findMany({
		select: {
			name: true,
			username: true,
			image: { select: { id: true } },
		},
	})

	return json(users)
}

export default function Index() {
	const users =
		useLoaderData<
			{ username: string; name: string | null; image: { id: string } | null }[]
		>()

	return (
		<main className="flex-grow py-4 px-4 sm:px-6 lg:px-8 bg-gray-100 ">
			<Link to="users">
				<h1 className="flex text-lg font-semibold justify-end underline">
					Users Page
				</h1>
			</Link>
			<div>
				{users.map(user => (
					<div
						key={user.name}
						className="bg-white shadow-sm rounded-lg overflow-hidden m-4 p-8 text-lg font-bold w-48"
					>
						<img src={getUserImgSrc(user.image?.id)} alt={user.name || ''} />
						<Link to={`/users/${user.username}`}>User: {user.name}</Link>
					</div>
				))}
			</div>
		</main>
	)
}
