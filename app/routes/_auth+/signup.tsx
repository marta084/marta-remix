import {
	redirect,
	type MetaFunction,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { Form } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { checkHoneypot } from '~/utils/honeypot.server'
import { z } from 'zod'

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	checkHoneypot(formData)
	// we'll implement signup later
	return redirect('/')
}

export default function SignupRoute() {
	return (
		<div className="container flex min-h-full flex-col justify-center pb-32 pt-20">
			<div className="mx-auto w-full max-w-lg">
				<div className="flex flex-col gap-3 text-center">
					<h1 className="text-h1">Welcome aboard!</h1>
					<p className="text-body-md text-muted-foreground">
						Please enter your details.
					</p>
				</div>
				<Form
					method="POST"
					className="mx-auto flex min-w-[368px] max-w-sm flex-col gap-4"
				>
					<HoneypotInputs />
					<div>
						<Label htmlFor="email-input">Email</Label>
						<Input
							id="email-input"
							name="email"
							type="email"
							className="text-black"
						/>
					</div>
					<Button className="w-full bg-gray-800 text-gray-100" type="submit">
						Create an account
					</Button>
				</Form>
			</div>
		</div>
	)
}

export const meta: MetaFunction = () => {
	return [{ title: 'Sign up' }]
}
