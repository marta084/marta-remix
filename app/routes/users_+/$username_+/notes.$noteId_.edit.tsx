import { type DataFunctionArgs, json, redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { StatusButton } from '~/components/ui/status-button'
import { Textarea } from '~/components/ui/textarea'
import { db, updateNote } from '~/utils/db.server'
import { invariantResponse, useIsSubmitting } from '~/utils/misc'

export async function loader({ params }: DataFunctionArgs) {
	const note = db.note.findFirst({
		where: {
			id: {
				equals: params.noteId,
			},
		},
	})

	if (!note) {
		throw new Response('Note not found', { status: 404 })
	}
	return json({
		note: { title: note.title, content: note.content },
	})
}

const titleMaxLength = 100
const contentMaxLength = 10000

export async function action({ params, request }: DataFunctionArgs) {
	invariantResponse(params.noteId, 'Note id is required', { status: 400 })
	const formData = await request.formData()
	const title = formData.get('title')
	const content = formData.get('content')

	invariantResponse(typeof title === 'string', 'title must be a string')
	invariantResponse(typeof content === 'string', 'content must be a string')

	const errors = {
		formErrors: [] as Array<string>,
		fieldErrors: {
			title: [] as Array<string>,
			content: [] as Array<string>,
		},
	}
	if (title === '') {
		errors.fieldErrors.title.push('Title is required')
	}
	if (title.length > titleMaxLength) {
		errors.fieldErrors.title.push(
			`Title must be less than ${titleMaxLength} characters`,
		)
	}
	if (content === '') {
		errors.fieldErrors.content.push('Content is required')
	}
	if (content.length > contentMaxLength) {
		errors.fieldErrors.content.push(
			`Content must be less than ${contentMaxLength} characters`,
		)
	}
	const hasErrors =
		errors.formErrors.length ||
		Object.values(errors.fieldErrors).some(fieldErrors => fieldErrors.length)
	if (hasErrors) {
		return json({ status: 'error', errors } as const, { status: 400 })
	}
	await updateNote({ id: params.noteId, title, content })

	return redirect(`/users/${params.username}/notes/${params.noteId}`)
}

function ErrorList({ errors }: { errors?: Array<string> | null }) {
	return errors?.length ? (
		<ul className="flex flex-col gap-1">
			{errors.map((error, i) => (
				<li key={i} className="text-[10px] text-red-800">
					{error}
				</li>
			))}
		</ul>
	) : null
}

export default function SingleNoteEdit() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const isSubmitting = useIsSubmitting()
	const formId = 'note-editor'

	const fieldErrors =
		actionData?.status === 'error' ? actionData.errors.fieldErrors : null
	const formErrors =
		actionData?.status === 'error' ? actionData.errors.formErrors : null

	return (
		<div>
			<h1 className="text-lg font-semibold mb-4 mx-8">Edit :</h1>

			<Form
				id={formId}
				method="post"
				className="flex h-full text-lg flex-col gap-y-4 overflow-x-hidden px-8 "
			>
				<div className="flex flex-col gap-1">
					<div>
						{/* 🦉 NOTE: this is not an accessible label, we'll get to that in the accessibility exercises */}
						<Label>Title</Label>
						<Input
							className="text-black"
							name="title"
							defaultValue={data.note.title}
						/>
						<div className="min-h-[32px] px-4 pb-3 pt-1">
							<ErrorList errors={fieldErrors?.title} />
						</div>
					</div>
					<div>
						{/* 🦉 NOTE: this is not an accessible label, we'll get to that in the accessibility exercises */}
						<Label>Content</Label>
						<Textarea
							className="text-black"
							name="content"
							defaultValue={data.note.content}
						/>
						<div className="min-h-[32px] px-4 pb-3 pt-1">
							<ErrorList errors={fieldErrors?.content} />
						</div>
					</div>
				</div>
				<ErrorList errors={formErrors} />
			</Form>
			<div>
				<Button
					className="bg-gray-500 text-white hover:bg-gray-400"
					variant="destructive"
					type="reset"
				>
					{/* 🦉 NOTE: this button doesn't work right now, we'll get to that in the accessibility exercise */}
					Reset
				</Button>
				<StatusButton
					form={formId}
					className="bg-gray-900 text-white hover:bg-gray-700"
					type="submit"
					disabled={isSubmitting}
					status={isSubmitting ? 'pending' : 'idle'}
				>
					Submit
				</StatusButton>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => <p>No note with the id {params.noteId} exists</p>,
			}}
		/>
	)
}
