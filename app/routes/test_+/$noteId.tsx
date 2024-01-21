import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { prisma } from '~/utils/db.server'
import { invariantResponse } from '~/utils/misc'

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
			<h1>title: {data.note.title}</h1>
			<h5>noteid: {data.note.id}</h5>
			<div>content: {data.note.content}</div>
		</div>
	)
}
