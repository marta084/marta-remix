import {
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	return null
}

export const action = async ({ request }: ActionFunctionArgs) => {
	return null
}

export default function Test() {
	return <div></div>
}
