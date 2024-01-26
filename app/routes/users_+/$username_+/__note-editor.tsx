import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type Note } from '@prisma/client'
import {
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	json,
	unstable_parseMultipartFormData as parseMultipartFormData,
	redirect,
	type SerializeFrom,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { Form, useFetcher } from '@remix-run/react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { floatingToolbarClassName } from '~/components/floating-toolbar'
import { ErrorList, Field, TextareaField } from '~/components/forms'
import { Button } from '~/components/ui/button'
import { StatusButton } from '~/components/ui/status-button'
import { validateCSRF } from '~/utils/csrf.server'
import prisma from '~/utils/db.server'
import { useIsPending } from '~/utils/misc'
import { toastSessionStorage } from '~/utils/toast.server'

const titleMinLength = 1
const titleMaxLength = 100
const contentMinLength = 1
const contentMaxLength = 10000

const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

const NoteEditorSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(titleMinLength).max(titleMaxLength),
	content: z.string().min(contentMinLength).max(contentMaxLength),
})

export async function action({ request, params }: ActionFunctionArgs) {
	const formData = await parseMultipartFormData(
		request,
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	)
	await validateCSRF(formData, request.headers)

	const submission = await parse(formData, {
		schema: NoteEditorSchema.transform(async ({ ...data }) => {
			return {
				...data,
			}
		}),
		async: true,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}

	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { id: noteId, title, content } = submission.value

	const updatedNote = await prisma.note.upsert({
		select: { id: true, owner: { select: { username: true } } },
		where: { id: noteId ?? '__new_note__' },
		create: {
			owner: { connect: { username: params.username } },
			title,
			content,
			createdAt: new Date(), // Add this line to provide a value for createdAt
		},
		update: {
			title,
			content,
		},
	})

	const toastCookieSession = await toastSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	toastCookieSession.flash('toast', {
		id: noteId,
		type: 'success',
		title: 'Add success',
		description: 'Your note has been add/updated',
	})

	return redirect(
		`/users/${updatedNote.owner?.username}/notes/${updatedNote.id}`,
		{
			headers: {
				'set-cookie':
					await toastSessionStorage.commitSession(toastCookieSession),
			},
		},
	)
}

export function NoteEditor({
	note,
}: Readonly<{
	note?: SerializeFrom<Pick<Note, 'id' | 'title' | 'content'>>
}>) {
	const noteFetcher = useFetcher<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'note-editor',
		constraint: getFieldsetConstraint(NoteEditorSchema),
		lastSubmission: noteFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: NoteEditorSchema })
		},
		defaultValue: {
			title: note?.title ?? '',
			content: note?.content ?? '',
		},
	})

	return (
		<div className="">
			<Form
				method="post"
				className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12"
				{...form.props}
				encType="multipart/form-data"
			>
				<AuthenticityTokenInput />
				{/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				*/}
				<button type="submit" className="hidden" />
				{note ? <input type="hidden" name="id" value={note.id} /> : null}
				<div className="flex flex-col gap-1">
					<Field
						labelProps={{ children: 'Title' }}
						inputProps={{
							autoFocus: true,
							...conform.input(fields.title),
						}}
						errors={fields.title.errors}
					/>
					<TextareaField
						labelProps={{ children: 'Content' }}
						textareaProps={{
							...conform.textarea(fields.content),
						}}
						errors={fields.content.errors}
					/>
				</div>
				<ErrorList id={form.errorId} errors={form.errors} />
			</Form>
			<div className={floatingToolbarClassName}>
				<Button form={form.id} variant="destructive" type="reset">
					Reset
				</Button>
				<StatusButton
					form={form.id}
					type="submit"
					disabled={isPending}
					status={isPending ? 'pending' : 'idle'}
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
