import { useState } from 'react'

const LoginPage = () => {
	const [darkMode, setDarkMode] = useState(false)

	const toggleDarkMode = () => {
		setDarkMode(!darkMode)
	}

	return (
		<div
			className={`flex items-center justify-center min-h-screen bg-${
				darkMode ? 'black' : 'white'
			} text-white`}
		>
			<div
				className={`bg-${
					darkMode ? 'gray-800' : 'gray-200'
				} rounded-lg shadow-lg p-8`}
			>
				<h1
					className={`text-3xl font-bold mb-4 ${
						darkMode ? 'text-white' : 'text-gray-800'
					}`}
				>
					Login Page
				</h1>
				<div className="flex items-center mb-4">
					<label
						htmlFor="darkModeToggle"
						className={`mr-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}
					>
						Dark Mode
					</label>
					<input
						type="checkbox"
						id="darkModeToggle"
						checked={darkMode}
						onChange={toggleDarkMode}
						className="form-checkbox h-5 w-5 text-yellow-400"
					/>
				</div>
				<form className="space-y-4">
					<div>
						<label
							htmlFor="email"
							className={`block mb-2 ${
								darkMode ? 'text-white' : 'text-gray-800'
							}`}
						>
							Email
						</label>
						<input
							type="email"
							id="email"
							name="email"
							className={`w-full bg-${
								darkMode ? 'gray-700' : 'gray-100'
							} text-${
								darkMode ? 'white' : 'gray-800'
							} py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-${
								darkMode ? 'yellow-400' : 'blue-500'
							} focus:border-transparent`}
							placeholder="Enter your email"
						/>
					</div>
					<div>
						<label
							htmlFor="password"
							className={`block mb-2 ${
								darkMode ? 'text-white' : 'text-gray-800'
							}`}
						>
							Password
						</label>
						<input
							type="password"
							id="password"
							name="password"
							className={`w-full bg-${
								darkMode ? 'gray-700' : 'gray-100'
							} text-${
								darkMode ? 'white' : 'gray-800'
							} py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-${
								darkMode ? 'yellow-400' : 'blue-500'
							} focus:border-transparent`}
							placeholder="Enter your password"
						/>
					</div>
					<button
						type="submit"
						className={`w-full bg-${
							darkMode ? 'yellow-400' : 'blue-500'
						} text-white py-2 px-4 rounded-lg font-bold transition-colors hover:bg-${
							darkMode ? 'yellow-500' : 'blue-600'
						}`}
					>
						Login
					</button>
				</form>
			</div>
		</div>
	)
}

export default LoginPage
