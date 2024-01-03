import { Link, NavLink, useMatches } from '@remix-run/react'
import { SearchBar } from '~/components/search-bar'
import { cn } from '~/utils/misc'

export default function Header() {
	const matches = useMatches()
	const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	return (
		<header className="bg-white py-4 px-4">
			<div className="flex justify-between items-center">
				<div className="flex items-center">
					<h1 className="text-black font-semibold font-sans text-lg mr-4">
						<Link to="/">Marta</Link>
					</h1>
					<NavLink
						to="users"
						className={({ isActive }) =>
							cn(isActive && 'underline', 'font-semibold font-sans text-sm')
						}
					>
						Users List
					</NavLink>
				</div>
				<div className="flex justify-center items-center">
					{isOnSearchPage ? null : (
						<div className="mr-4 max-w-sm flex-1">
							<SearchBar status="idle" />
						</div>
					)}
					{/* <Link className="text-lg mx-2" to="/signup">
                        Login
                    </Link>
                    <Link className="text-lg mx-2" to="/signup">
                        Sign up
                    </Link> */}
				</div>
			</div>
		</header>
	)
}
