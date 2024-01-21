import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
	try {
		// Fetch all existing users
		const users = await prisma.user.findMany()

		// Iterate over each user
		for (const user of users) {
			// Generate 10 notes for the user
			const notes = Array.from({ length: 10 }, (_, index) => ({
				title: `Note ${index + 1} for User ${user.id}`,
				content: `This is the content for Note ${index + 1} for User ${user.id}`,
				createdAt: new Date(),
				updatedAt: new Date(),
				ownerId: user.id,
			}))

			// Create the notes in the database
			await prisma.note.createMany({
				data: notes,
			})

			console.log(`Created 10 notes for User ${user.id}`)
		}
	} catch (error) {
		console.error(error)
	} finally {
		await prisma.$disconnect()
	}
}

seed()
