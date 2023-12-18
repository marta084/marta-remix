import error404Image from '../assets/error-404.png'

export default function errpage() {
	return (
		<div className="m-8">
			<h1 className="m-4 text-3xl text-white"> Page not exist</h1>

			<img src={error404Image} alt="" />
		</div>
	)
}
