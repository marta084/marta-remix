import {
	type DataFunctionArgs,
	json,
	type MetaFunction,
	redirect,
} from '@remix-run/node'
import {
	Form,
	Link,
	useFormAction,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Button } from '~/components/ui/button'
import { StatusButton } from '~/components/ui/status-button'
import { db } from '~/utils/db.server'
import { invariantResponse } from '~/utils/misc'
import { type loader as NoteLoader } from './notes'

export async function loader({ params }: DataFunctionArgs) {
	const { noteId } = params
	const note = db.note.findFirst({
		where: {
			id: { equals: noteId },
		},
	})

	invariantResponse(note, 'Note not found', { status: 404 })
	return json({
		note: {
			title: note.title,
			content: note.content,
		},
	})
}

export async function action({ params, request }: DataFunctionArgs) {
	const formData = await request.formData()
	const intent = formData.get('intent')
	switch (intent) {
		case 'delete': {
			db.note.delete({ where: { id: { equals: params.noteId } } })
			return redirect(`/users/${params.username}/notes`)
		}
		default: {
			throw new Response(`Invalid intent: ${intent}`, { status: 400 })
		}
	}
}

export default function SingleNoteRoute() {
	const data = useLoaderData<typeof loader>()
	const navigation = useNavigation()
	const formAction = useFormAction()
	const isPending =
		navigation.state !== 'idle' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

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
