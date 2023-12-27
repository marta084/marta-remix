import { Link } from '@remix-run/react'

export default function Header() {
	return (
		<header className="bg-white py-4 px-8">
			<div className="flex justify-between items-center">
				<h1 className=" text-black font-semibold font-sans text-lg">
					<Link to="/">Marta</Link>
				</h1>
				<div>
					<Link className="underline" to="/signup">
						Singup
					</Link>
				</div>
			</div>
		</header>
	)
}
