import {
	conform,
	list,
	useFieldList,
	useFieldset,
	useForm,
	type FieldConfig,
} from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { createId as cuid } from '@paralleldrive/cuid2'
import {
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	json,
	unstable_parseMultipartFormData as parseMultipartFormData,
	redirect,
	type DataFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { useRef, useState } from 'react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { ErrorList, Field, TextareaField } from '~/components/forms'
import { Button } from '~/components/ui/button'
import { Icon } from '~/components/ui/icon'
import { Label } from '~/components/ui/label'
import { StatusButton } from '~/components/ui/status-button'
import { Textarea } from '~/components/ui/textarea'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import {
	cn,
	getNoteImgSrc,
	invariantResponse,
	useIsPending,
} from '~/utils/misc'

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

	return json({ note })
}

const titleMinLength = 1
const titleMaxLength = 100
const contentMinLength = 1
const contentMaxLength = 10000

const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File)
		.optional()
		.refine(file => {
			return !file || file.size <= MAX_UPLOAD_SIZE
		}, 'File size must be less than 3MB'),
	altText: z.string().optional(),
})

type ImageFieldset = z.infer<typeof ImageFieldsetSchema>

function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size && image.file?.size > 0)
}

function imageHasId(
	image: ImageFieldset,
): image is ImageFieldset & { id: NonNullable<ImageFieldset['id']> } {
	return image.id != null
}

const NoteEditorSchema = z.object({
	title: z.string().min(titleMinLength).max(titleMaxLength),
	content: z.string().min(contentMinLength).max(contentMaxLength),
	images: z.array(ImageFieldsetSchema).max(5).optional(),
})

export async function action({ request, params }: DataFunctionArgs) {
	invariantResponse(params.noteId, 'noteId param is required')

	const formData = await parseMultipartFormData(
		request,
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	)
	await validateCSRF(formData, request.headers)

	const submission = await parse(formData, {
		schema: NoteEditorSchema.transform(async ({ images = [], ...data }) => {
			return {
				...data,
				imageUpdates: await Promise.all(
					images.filter(imageHasId).map(async i => {
						if (imageHasFile(i)) {
							return {
								id: i.id,
								altText: i.altText,
								contentType: i.file.type,
								blob: Buffer.from(await i.file.arrayBuffer()),
							}
						} else {
							return { id: i.id, altText: i.altText }
						}
					}),
				),
				newImages: await Promise.all(
					images
						.filter(imageHasFile)
						.filter(i => !i.id)
						.map(async image => {
							return {
								altText: image.altText,
								contentType: image.file.type,
								blob: Buffer.from(await image.file.arrayBuffer()),
							}
						}),
				),
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

	const { title, content, imageUpdates = [], newImages = [] } = submission.value

	await prisma.note.update({
		select: { id: true },
		where: { id: params.noteId },
		data: {
			title,
			content,
			images: {
				deleteMany: { id: { notIn: imageUpdates.map(i => i.id) } },
				updateMany: imageUpdates.map(updates => ({
					where: { id: updates.id },
					data: { ...updates, id: updates.blob ? cuid() : updates.id },
				})),
				create: newImages,
			},
		},
	})

	return redirect(`/users/${params.username}/notes/${params.noteId}`)
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'note-editor',
		constraint: getFieldsetConstraint(NoteEditorSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: NoteEditorSchema })
		},
		defaultValue: {
			title: data.note.title,
			content: data.note.content,
			images: data.note.images.length ? data.note.images : [{}],
		},
	})
	const imageList = useFieldList(form.ref, fields.images)

	return (
		<div>
			<Form
				method="post"
				className="flex h-full flex-col gap-y-4 "
				{...form.props}
				encType="multipart/form-data"
			>
				<AuthenticityTokenInput />

				<button type="submit" className="hidden" />
				<div className="flex flex-col gap-1">
					<Field
						labelProps={{ children: 'Title' }}
						inputProps={{
							autoFocus: true,
							className: 'text-black',
							...conform.input(fields.title),
						}}
						errors={fields.title.errors}
					/>
					<TextareaField
						labelProps={{ children: 'Content' }}
						textareaProps={{
							className: 'text-black',
							...conform.textarea(fields.content),
						}}
						errors={fields.content.errors}
					/>
					<div>
						<Label>Images</Label>
						<ul className="flex flex-col gap-4">
							{imageList.map((image, index) => (
								<li
									key={image.key}
									className="relative border-b-2 border-muted-foreground"
								>
									<button
										className="text-white bg-gray-400 absolute right-0 top-0 flex items-center justify-center px-2 mb-2"
										{...list.remove(fields.images.name, { index })}
									>
										X<span className="sr-only">Remove image {index + 1}</span>
									</button>
									<ImageChooser config={image} />
								</li>
							))}
						</ul>
					</div>
					<Button
						className="mt-3 mb-3 bg-gray-800 text-white"
						{...list.insert(fields.images.name, { defaultValue: {} })}
					>
						<span aria-hidden>
							<Icon name="plus" className="bg-gray-400 ">
								add Image
							</Icon>
						</span>
						<span className="sr-only">Add image</span>
					</Button>
				</div>
				<ErrorList id={form.errorId} errors={form.errors} />
			</Form>
			<div className="flex justify-end">
				<Button form={form.id} variant="destructive" type="reset">
					Reset
				</Button>
				<StatusButton
					form={form.id}
					type="submit"
					disabled={isPending}
					status={isPending ? 'pending' : 'idle'}
					className="bg-gray-900 text-white rounded ml-4"
				>
					Submit
				</StatusButton>
			</div>
		</div>
	)
}

function ImageChooser({
	config,
}: {
	config: FieldConfig<z.infer<typeof ImageFieldsetSchema>>
}) {
	const ref = useRef<HTMLFieldSetElement>(null)
	const fields = useFieldset(ref, config)
	const existingImage = Boolean(fields.id.defaultValue)
	const [previewImage, setPreviewImage] = useState<string | null>(
		fields.id.defaultValue ? getNoteImgSrc(fields.id.defaultValue) : null,
	)
	const [altText, setAltText] = useState(fields.altText.defaultValue ?? '')

	return (
		<fieldset
			ref={ref}
			aria-invalid={Boolean(config.errors?.length) || undefined}
			aria-describedby={config.errors?.length ? config.errorId : undefined}
		>
			<div className="flex gap-3">
				<div className="w-32">
					<div className="relative h-32 w-32">
						<label
							htmlFor={fields.file.id}
							className={cn('group absolute h-32 w-32 rounded-lg', {
								'bg-gray-200 opacity-40 focus-within:opacity-100 hover:opacity-100':
									!previewImage,
								'cursor-pointer focus-within:ring-4': !existingImage,
							})}
						>
							{previewImage ? (
								<div className="relative">
									<img
										src={previewImage}
										alt={altText ?? ''}
										className="h-32 w-32 rounded-lg object-cover"
									/>
									{existingImage ? null : (
										<div className="pointer-events-none absolute -right-0.5 -top-0.5 rotate-12 rounded-sm  py-1 text-xs text-black shadow-md">
											new
										</div>
									)}
								</div>
							) : (
								<div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-gray-400 text-4xl text-black">
									<Icon name="plus" />
								</div>
							)}
							{existingImage ? (
								<input {...conform.input(fields.id, { type: 'hidden' })} />
							) : null}
							<input
								aria-label="Image"
								className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
								onChange={event => {
									const file = event.target.files?.[0]

									if (file) {
										const reader = new FileReader()
										reader.onloadend = () => {
											setPreviewImage(reader.result as string)
										}
										reader.readAsDataURL(file)
									} else {
										setPreviewImage(null)
									}
								}}
								accept="image/*"
								{...conform.input(fields.file, { type: 'file' })}
							/>
						</label>
					</div>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
					</div>
				</div>
				<div className="flex-1">
					<Label htmlFor={fields.altText.id}>Alt Text</Label>
					<Textarea
						className="text-black"
						onChange={e => setAltText(e.currentTarget.value)}
						{...conform.textarea(fields.altText)}
					/>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList
							id={fields.altText.errorId}
							errors={fields.altText.errors}
						/>
					</div>
				</div>
			</div>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				<ErrorList id={config.errorId} errors={config.errors} />
			</div>
		</fieldset>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const noteTitle = data?.note.title ?? 'Note'
	return [{ title: `${noteTitle} - edit` }]
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
