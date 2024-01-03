import { type DataFunctionArgs } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import { invariantResponse } from '~/utils/misc'

export async function loader({ params }: DataFunctionArgs) {
	invariantResponse(params.imageId, 'Image ID is required', { status: 400 })
	const image = await prisma.userImage.findUnique({
		where: { id: params.imageId },
		select: { contentType: true, blob: true, cloudinaryurl: true },
	})

	invariantResponse(image, 'Not found', { status: 404 })

	// Check if image.cloudinaryurl is not null
	if (image.cloudinaryurl) {
		// Return a redirect response to the cloudinaryurl
		return new Response(null, {
			status: 302,
			headers: {
				Location: image.cloudinaryurl,
			},
		})
	} else {
		// Return a 404 Not Found response if image.cloudinaryurl is null
		return new Response('Not found', { status: 404 })
	}
}
