import {
	type DataFunctionArgs,
	json,
	type MetaFunction,
	redirect,
} from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { validateCSRF } from '~/utils/csrf.server.ts'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { Button } from '~/components/ui/button.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { prisma } from '~/utils/db.server.ts'
import { invariantResponse, useIsPending } from '~/utils/misc.tsx'
import { type loader as NoteLoader } from './notes.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const note = await prisma.note.findFirst({
		where: { id: params.noteId },
		select: {
			title: true,
			content: true,
			images: {
				select: { id: true, altText: true },
			},
		},
	})

	invariantResponse(note, 'Note not found', { status: 404 })
	return json({
		note,
	})
}

export async function action({ request, params }: DataFunctionArgs) {
	invariantResponse(params.noteId, 'noteId param is required')

	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	const intent = formData.get('intent')

	invariantResponse(intent === 'delete', 'Invalid intent')

	await prisma.note.delete({ where: { id: params.noteId } })
	return redirect(`/users/${params.username}/notes`)
}

export default function SingleNoteRoute() {
	const data = useLoaderData<typeof loader>()
	const isPending = useIsPending()

	return (
		<div className=" flex-col px-8">
			<h2 className="mb-2 pt-2 text-h2 lg:mb-6">{data.note.title}</h2>
			<div className="overflow-y-auto pb-24">
				<p className="whitespace-break-spaces text-sm md:text-lg">
					{data.note.content}
				</p>

				<div className="mt-4 w-48 flex justify-between">
					<div>
						<Button
							className="px-6 bg-gray-600 text-gray-100 rounded-lg"
							asChild
						>
							<Link to="edit">Edit</Link>
						</Button>
					</div>
					<div>
						<Form method="POST">
							<AuthenticityTokenInput />
							<StatusButton
								className="px-6 bg-red-800 text-gray-100 rounded-lg"
								type="submit"
								variant="destructive"
								name="intent"
								value="delete"
								disabled={isPending}
								status={isPending ? 'pending' : 'idle'}
							>
								Delete
							</StatusButton>
						</Form>
					</div>
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction<
	typeof loader,
	{ 'routes/users_+/$username_+/notes': typeof NoteLoader }
> = ({ data, params, matches }) => {
	const NoteMatch = matches.find(
		m => m.id === 'routes/users_+/$username_+/notes',
	)

	const displayName = NoteMatch?.data.owner.name ?? params.username
	const noteTitle = data?.note.title ?? 'Note'
	return [
		{ title: `${noteTitle} - ${displayName}'s note` },
		{
			description: `${data?.note.content}`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => {
					return <p>No note with the id {params.noteId} exists</p>
				},
			}}
		/>
	)
}
