import {
	json,
	type DataFunctionArgs,
	type MetaFunction,
	redirect,
	unstable_composeUploadHandlers as composeUploadHandlers,
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { prisma } from '~/utils/db.server'
import { getUserImgSrc, invariantResponse } from '~/utils/misc'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { validateCSRF } from '~/utils/csrf.server'
import { Button } from '~/components/ui/button'
import { uploadImage } from '~/utils/cloudinary.server'

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

	return json({
		user,
		userJoinedDisplay: user.createdAt.toLocaleDateString(),
	})
}

export const action = async ({ request, params }: DataFunctionArgs) => {
	invariantResponse(params.username, 'Username is required', { status: 400 })

	const uploadHandler = composeUploadHandlers(
		async ({ name, data, filename }) => {
			if (name !== 'profile') {
				return undefined
			}
			console.log(filename)
			const uploadedImage = await uploadImage(data)
			console.log(uploadedImage)
			return uploadedImage.secure_url
		},
		createMemoryUploadHandler(),
	)

	const formData = await parseMultipartFormData(request, uploadHandler)
	await validateCSRF(formData, request.headers)
	const intent = formData.get('intent')

	invariantResponse(intent === 'upload', 'Invalid intent')

	const imgSource = formData.get('img')
	const imgDescription = formData.get('description')
	console.log(imgSource)
	if (!imgSource) {
		return json({
			error: 'something is wrong',
		})
	}
	return json({
		imgSource,
		imgDescription,
	})
}

export default function UserRoute() {
	const data = useLoaderData<typeof loader>()
	const user = data.user
	const userDisplayName = user.name ?? user.username

	return (
		<div className="mb-auto flex items-center">
			<div className="flex">
				<Form method="post" encType="multipart/form-data">
					<AuthenticityTokenInput />
					<input type="file" name="profile" />
					<Button
						className="bg-slate-500 p-4 text-white mt-2"
						name="intent"
						value="upload"
						type="submit"
					>
						Upload
					</Button>
				</Form>
			</div>

			<div className="w-full">
				{/* <h1 className="m-4">
					user profile: {data.user.name ?? data.user.username}
				</h1> */}
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
			<div>
				<div className="pb-4">
					<Link
						to={`/users/${data.user.username}/notes`}
						className="shadow-sm rounded-lg overflow-hidden bg-white text-lg font-bold hover:bg-gray-600 hover:text-gray-100 transition duration-200 ease-in-out"
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
