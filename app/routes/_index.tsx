import { Link } from '@remix-run/react'

export default function index() {
	return (
		<main className=" flex-grow py-4 px-4 sm:px-6 lg:px-8 bg-gray-100 ">
			<div>
				<div className="bg-white shadow-sm rounded-lg overflow-hidden m-4 p-8 text-lg  font-bold w-48">
					<Link to="/users/marta">User: marta</Link>
				</div>
			</div>

			<form action="/login" method="POST" className="hidden">
				<label>
					{' '}
					Username:
					<input
						className="border-2 border-gray-400"
						placeholder="username"
						name="username"
					/>
				</label>
				<label>
					Password:
					<input
						className="border-2 border-gray-400"
						placeholder="password"
						name="password"
						type="password"
					/>
				</label>
				<button type="submit">Login</button>
			</form>

			<div className="hidden max-w-3xl mx-auto">
				<h1 className="text-2xl font-bold text-gray-900 mb-8 mx-2">Posts</h1>
				<div className="bg-white shadow-sm rounded-lg overflow-hidden mt-4">
					<div className="p-2">
						<div className="flex justify-between items-center">
							<h1 className="text-xl font-bold text-gray-900">
								Title of the Blog Post
							</h1>
							<p className="text-gray-600">2 hours ago</p>
						</div>
					</div>
				</div>
				<div className="bg-white shadow-sm rounded-lg overflow-hidden mt-4">
					<div className="p-2">
						<div className="flex justify-between items-center">
							<h1 className="text-xl font-bold text-gray-900">
								Title of the Blog Post
							</h1>
							<p className="text-gray-600">2 hours ago</p>
						</div>
					</div>
				</div>
				<div className="bg-white shadow-sm rounded-lg overflow-hidden mt-4">
					<div className="p-2">
						<div className="flex justify-between items-center">
							<h1 className="text-xl font-bold text-gray-900">
								Title of the Blog Post
							</h1>
							<p className="text-gray-600">2 hours ago</p>
						</div>
					</div>
				</div>
				<div className="bg-white shadow-sm rounded-lg overflow-hidden mt-4">
					<div className="p-2">
						<div className="flex justify-between items-center">
							<h1 className="text-xl font-bold text-gray-900">
								Title of the Blog Post
							</h1>
							<p className="text-gray-600">2 hours ago</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
