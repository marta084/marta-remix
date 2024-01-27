import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'

import { json, redirect } from '@remix-run/node'
import type { ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'

import { HoneypotInputs } from 'remix-utils/honeypot/react'

import { Field } from '~/components/forms'
import { validateCSRF } from '~/utils/csrf.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import { StatusButton } from '~/components/ui/status-button'
import { useIsPending } from '~/utils/misc'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { PasswordSchema, UsernameSchema } from '~/utils/user-validation'
import { Form, Link, useActionData } from '@remix-run/react'

const LoginFormSchema = z.object({
	username: UsernameSchema,
	password: PasswordSchema,
})

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	checkHoneypot(formData)

	const submission = await parse(formData, {
		schema: intent =>
			LoginFormSchema.transform(async (data, ctx) => {
				if (intent !== 'submit') return { ...data, user: null }

				return data
			}),

		async: true,
	})

	// get the password off the payload that's sent back
	delete submission.payload.password

	if (submission.intent !== 'submit') {
		// @ts-expect-error - conform should probably have support for doing this
		delete submission.value?.password
		return json({ status: 'idle', submission } as const)
	}
	// ?? you can change this check to !submission.value?.user
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	// Do something with the data
	return redirect('/')
}

export default function LoginPage() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getFieldsetConstraint(LoginFormSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: LoginFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container flex min-h-full flex-col justify-center pb-32 pt-20">
			<div className="mx-auto w-full max-w-lg">
				<div className="flex flex-col gap-3 text-center">
					<h1 className="text-h1">Welcome aboard!</h1>
					<p className="text-body-md text-muted-foreground">
						Please enter your details to login.
					</p>
				</div>
				<Form
					method="POST"
					className="mx-auto flex min-w-[368px] max-w-sm flex-col gap-4"
					{...form.props}
				>
					<AuthenticityTokenInput />
					<HoneypotInputs />
					<div>
						<Field
							labelProps={{ children: 'Username' }}
							inputProps={{
								autoFocus: true,
								...conform.input(fields.username),
							}}
							errors={fields.username.errors}
						/>
						<Field
							labelProps={{ children: 'Password' }}
							inputProps={{
								...conform.input(fields.password),
							}}
							errors={fields.password.errors}
						/>
					</div>
					<div className="flex justify-between">
						<div />
						<div>
							<Link
								to="/forgot-password"
								className="text-body-xs font-semibold"
							>
								Forgot password?
							</Link>
						</div>
					</div>
					<StatusButton
						className="w-full"
						status={isPending ? 'pending' : actionData?.status ?? 'idle'}
						type="submit"
						disabled={isPending}
					>
						Log in
					</StatusButton>
				</Form>
			</div>
		</div>
	)
}
