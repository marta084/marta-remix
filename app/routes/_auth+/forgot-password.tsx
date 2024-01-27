import type { ActionFunctionArgs } from '@remix-run/node'
import { Label } from '@radix-ui/react-label'
import { Form, useActionData } from '@remix-run/react'
import { Input } from '~/components/ui/input'
import { StatusButton } from '~/components/ui/status-button'
import { useIsPending } from '~/utils/misc'
import { Spacer } from '~/components/spacer'

export const action = async ({ request }: ActionFunctionArgs) => {
	return null
}

export default function ForgetPasswordComp() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	return (
		<div className="container pt-20 pb-32">
			<div className="flex flex-col justify-center">
				<div className="text-center">
					<h1 className="text-h1">Forgot Password</h1>
					<p className="mt-3 text-body-md text-muted-foreground">
						No worries, shoot support an email and we ll get you fixed up.
					</p>
				</div>
			</div>
			<Spacer size="3xs" />
			<Form
				method="POST"
				className="mx-auto flex min-w-[368px] max-w-sm flex-col gap-4"
			>
				<Label>Email</Label>
				<Input type="email" name="email"></Input>
				<StatusButton
					className="w-full"
					status={isPending ? 'pending' : actionData?.status ?? 'idle'}
					type="submit"
					disabled={isPending}
				>
					Submit
				</StatusButton>
			</Form>
		</div>
	)
}
