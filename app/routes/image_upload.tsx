import {
	json,
	unstable_composeUploadHandlers as composeUploadHandlers,
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { uploadImage } from '~/utils/cloudinary.server'

interface ActionData {
	imgSource?: string
	imgDescription?: string
	errorMsg?: string
}

export default function Index() {
	const data = useActionData<ActionData>()
	return (
		<>
			<Form method="post" encType="multipart/form-data" id="upload-form">
				<div>
					<label htmlFor="img"> Image: </label>
					<input id="img" type="file" name="img" accept="image/*" />
				</div>

				<div>
					<label htmlFor="description"> Image description: </label>
					<input id="description" type="text" name="description" />
				</div>

				<div>
					<button type="submit"> Upload to Cloudinary </button>
				</div>
			</Form>

			{data?.errorMsg && <h3>{data.errorMsg}</h3>}
			{data?.imgSource && (
				<>
					<h2>Uploaded Image: </h2>
					<img
						src={data.imgSource}
						alt={data.imgDescription || 'Upload result'}
					/>
					<p>{data.imgDescription}</p>
					<p>Image URL: {data.imgSource}</p> {/* Display the image URL */}
					<p>image id: {}</p>
				</>
			)}
		</>
	)
}

export const action = async ({
	request,
}: {
	request: Request
}): Promise<Response> => {
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
		createMemoryUploadHandler(),
	)

	const formData = await parseMultipartFormData(request, uploadHandler)
	const imgSource = formData.get('img')
	const imgDescription = formData.get('description')
	console.log(imgSource)
	if (!imgSource) {
		return json({
			error: 'something is wrong',
		})
	}
	return json({
		imgSource,
		imgDescription,
	})
}

interface ErrorProps {
	error: Error
}

export function ErrorBoundary({ error }: ErrorProps) {
	return (
		<div className="error-container">
			<pre>{error.message}</pre>
		</div>
	)
}
