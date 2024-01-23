import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { prisma } from '~/utils/db.server'
import { invariantResponse } from '~/utils/misc'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export async function loader({ params }: LoaderFunctionArgs) {
	const note = await prisma.note.findFirst({
		where: { id: params.noteId },
		select: {
			id: true,
			title: true,
			content: true,
		},
	})
	invariantResponse(note, 'Note not found', { status: 404 })
	return json({
		note,
	})
}

export default function NoteTestId() {
	const data = useLoaderData<typeof loader>()

	return (
		<div>
			<h1 className="text-bold text-lg bg-headertext text-white text-header">
				Title: {data.note.title}
			</h1>
			<div>Content: {data.note.content}</div>
		</div>
	)
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
