import { Link, useMatches } from '@remix-run/react'
import { SearchBar } from '~/components/search-bar'

export default function Header() {
	const matches = useMatches()
	const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	return (
		<header className="bg-white py-4 px-8">
			<div className="flex justify-between items-center">
				<h1 className=" text-black font-semibold font-sans text-lg">
					<Link to="/">Marta</Link>
				</h1>
				<div className="flex justify-center items-center">
					{isOnSearchPage ? null : (
						<div className="mr-4 max-w-sm flex-1">
							<SearchBar status="idle" />
						</div>
					)}
					<Link className="underline" to="/signup">
						Singup
					</Link>
				</div>
			</div>
		</header>
	)
}
