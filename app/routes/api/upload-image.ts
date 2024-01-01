import { json, parseMultipartFormData, composeUploadHandlers, createMemoryUploadHandler } from '@remix-run/node';
import { prisma } from '~/utils/db.server';
import { uploadImage } from '~/utils/cloudinary'; // assuming you have a function to upload image to Cloudinary

const uploadHandler = composeUploadHandlers(
  async ({ name, data, filename }) => {
    if (name !== 'image') {
      return undefined;
    }
    const uploadedImage = await uploadImage(data);
    return uploadedImage.secure_url;
  },
  createMemoryUploadHandler(),
);

export async function action({ request }) {
  const formData = await parseMultipartFormData(request, uploadHandler);
  const imageUrl = formData.get('image');
  const username = formData.get('username');

  if (!imageUrl) {
    return json({ error: 'Image upload failed' }, { status: 400 });
  }
