import { type MetaFunction } from '@remix-run/node'
import { type loader as NoteLoader } from './notes'

export default function NotesRouteIndex() {
	return (
		<div className="container pt-12">
			<p className="text-body-md">Select a note</p>
		</div>
	)
}

export const meta: MetaFunction<
	null,
	{ 'routes/users_+/$username_+/notes': typeof NoteLoader }
> = ({ params, matches }) => {
	const NoteMatch = matches.find(
		m => m.id === 'routes/users_+/$username_+/notes',
	)

	const displayName = NoteMatch?.data.owner.name ?? params.username
	const noteCount = NoteMatch?.data.notes.length ?? 0
	const notesText = noteCount === 1 ? 'note' : 'notes'

	return [
		{ title: `${displayName}'s ${noteCount} ${notesText}` },
		{
			name: 'description',
			content: `${displayName} has ${noteCount} ${notesText}`,
		},
	]
}
