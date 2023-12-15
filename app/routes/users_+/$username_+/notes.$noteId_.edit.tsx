import {
	type DataFunctionArgs,
	json,
	redirect,
	type MetaFunction,
} from '@remix-run/node'
import {
	Form,
	useFormAction,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { StatusButton } from '~/components/ui/status-button'
import { Textarea } from '~/components/ui/textarea'
import { db } from '~/utils/db.server'
import { invariantResponse } from '~/utils/misc'

export async function loader({ params }: DataFunctionArgs) {
	const note = db.note.findFirst({
		where: {
			id: {
				equals: params.noteId,
			},
		},
	})

	invariantResponse(note, 'Note not found', { status: 404 })

	return json({
		note: { title: note.title, content: note.content },
	})
}

export async function action({ params, request }: DataFunctionArgs) {
	invariantResponse(params.noteId, 'Note id is required', { status: 400 })
	const formData = await request.formData()
	const title = formData.get('title')
	const content = formData.get('content')

	invariantResponse(
		typeof title === 'string' && title.trim() !== '',
		'Title must be a string and not empty',
	)
	invariantResponse(
		typeof content === 'string' && content.trim() !== '',
		'Content must be a string and not empty',
	)

	db.note.update({
		where: {
			id: {
				equals: params.noteId,
			},
		},
		data: { title, content },
	})
	return redirect(`/users/${params.username}/notes/${params.noteId}`)
}

export default function SingleNoteEdit() {
	const data = useLoaderData<typeof loader>()
	const navigation = useNavigation()
	const formAction = useFormAction()
	const isPending =
		navigation.state !== 'idle' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

	return (
		<div>
			<h1 className="text-lg font-semibold mb-4 mx-8">Edit :</h1>
			<Form
				method="POST"
				className="flex h-full flex-col gap-y-4 overflow-x-hidden px-8"
			>
				<div className="flex flex-col gap-1">
					<div>
						<Label>
							Title
							<Input
								className="text-black"
								name="title"
								defaultValue={data.note.title}
							/>
						</Label>
					</div>
					<div>
						<Label>
							Content
							<Textarea
								className="text-black"
								name="content"
								defaultValue={data.note.content}
							/>
						</Label>
					</div>
				</div>
				<StatusButton
					type="submit"
					className="bg-gray-900 text-white hover:bg-gray-700"
					disabled={isPending}
					status={isPending ? 'pending' : 'idle'}
				>
					Submit
				</StatusButton>
				<Button
					type="reset"
					className="bg-gray-500 text-white hover:bg-gray-400"
				>
					Reset
				</Button>
			</Form>
		</div>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: `Edit - ${data?.note.title}` },
		{
			description: `${data?.note.content}`,
		},
		{
			charSet: 'utf-8',
		},
	]
}
