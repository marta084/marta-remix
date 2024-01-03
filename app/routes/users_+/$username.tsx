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
import { getUserImgSrc, invariantResponse, useIsPending } from '~/utils/misc'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { validateCSRF } from '~/utils/csrf.server'
import { Button } from '~/components/ui/button'
import { uploadImage } from '~/utils/cloudinary.server'
import { useState } from 'react'
import { StatusButton } from '~/components/ui/status-button'
import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { z } from 'zod'

// --------------- loader -----------------

export async function loader({ params }: DataFunctionArgs) {
	const user = await prisma.user.findFirst({
		select: {
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true, cloudinaryurl: true } },
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

// Client-side schema
const formSchema = z.object({
	img: z.instanceof(File, { message: 'Image is required' }).refine(
		file => {
			// Check that the file type is an image
			const fileType = file.type
			return fileType.startsWith('image/')
		},
		{
			message: 'File must be an image',
		},
	),
})

// Server-side schema
const actionSchema = z.object({
	img: z.string().url(),
})

const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

// --------------- action -----------------

export const action = async ({ request, params }: DataFunctionArgs) => {
	console.log('------------------------------ started action -----------------')

	invariantResponse(params.username, 'Username is required', { status: 400 })

	const uploadHandler = composeUploadHandlers(
		async ({ name, data, filename }) => {
			if (name !== 'img') {
				return undefined
			}
			console.log(filename)
			const uploadedImage = await uploadImage(data)
			console.log(uploadedImage)
			return uploadedImage.secure_url
		},
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	)

	const formData = await parseMultipartFormData(request, uploadHandler)
	await validateCSRF(formData, request.headers)

	const imgFile = formData.get('img')

	const submission = actionSchema.safeParse({
		img: imgFile,
	})

	if (!submission.success) {
		console.log('imgFile:', imgFile)
		console.log('Validation errors:', submission.error.flatten())
		return json(
			{ status: 'error', errors: submission.error.flatten() },
			{ status: 400 },
		)
	}

	const { img } = submission.data

	// Continue with your existing code
	console.log('------------------------------ 1-----------------')
	if (!img) {
		return json({
			error: 'something is wrong',
		})
	}
	console.log('------------------------------ 2 -----------------')
	const retrievedUser = await prisma.user.findUnique({
		where: {
			username: params.username,
		},
	})

	await prisma.userImage.update({
		where: {
			userId: retrievedUser?.id,
		},
		data: {
			cloudinaryurl: img,
		},
	})
	console.log(
		'------------------------------ ended action -----------------',
		img,
	)

	return redirect(`/users/${params.username}`)
}

// --------------- component -----------------

export default function UserRoute() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const user = data.user
	const userDisplayName = user.name ?? user.username
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'img-upload',
		constraint: getFieldsetConstraint(formSchema),
		lastSubmission: (actionData as { submission?: any })?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: formSchema })
		},
	})

	return (
		<div className="">
			<div className="my-8 flex justify-end">
				<Form method="post" encType="multipart/form-data" {...form.props}>
					<AuthenticityTokenInput />
					<label htmlFor={fields.img.id}></label>
					<input type="file" {...conform.input(fields.img)} />

					{fields.img.errors ? (
						<div className="text-red-400" role="alert">
							{fields.img.errors[0]}
						</div>
					) : null}

					<StatusButton
						className="bg-slate-500 p-4 text-white mt-2"
						type="submit"
						disabled={isPending}
						status={isPending ? 'pending' : 'idle'}
					>
						Upload
					</StatusButton>
					<div>{form.error}</div>
				</Form>
			</div>

			<div className="w-full mb-auto flex items-center">
				{/* <h1 className="m-4">
					user profile: {data.user.name ?? data.user.username}
				</h1> */}
				<div className="relative">
					<img
						src={data.user.image?.cloudinaryurl ?? ''}
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
