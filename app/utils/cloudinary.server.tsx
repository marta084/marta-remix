import cloudinary, { UploadApiResponse } from 'cloudinary'
import { writeAsyncIterableToWritable } from '@remix-run/node'
import { PassThrough } from 'stream'

cloudinary.v2.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.API_SECRET,
})

interface UploadResult {
	secure_url: string
	[key: string]: any
}

async function uploadImage(
	data: AsyncIterable<Uint8Array>,
): Promise<UploadResult> {
	const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
		const uploadStream = cloudinary.v2.uploader.upload_stream(
			{ folder: 'marta-remix' },
			(error, result: UploadApiResponse | undefined) => {
				if (error) {
					console.error('Cloudinary upload error:', error) // log the error
					reject(error)
					return
				}
				if (!result) {
					const noResultError = new Error('Upload failed with no result')
					console.error('Cloudinary upload error:', noResultError) // log the error
					reject(noResultError)
					return
				}
				console.log('Cloudinary upload successful:', result) // log the success
				resolve(result)
			},
		)

		const passThrough = new PassThrough()
		passThrough.pipe(uploadStream)
		writeAsyncIterableToWritable(data, passThrough).catch(error => {
			console.error('Error writing to PassThrough stream:', error) // log the error
			reject(error)
		})
	})

	return uploadPromise
}

export { uploadImage }
