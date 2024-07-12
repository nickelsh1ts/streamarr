import { DocumentTextIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

const PopularTopics = () => {
  return (
    <div className="bg-zinc-100 text-black p-4">
		  <div className="container max-w-screen-xl mx-auto border-b-2">
			  <h4 className="text-2xl font-extrabold mb-1">Popular topics</h4>
				<div className="mb-8 flex flex-wrap gap-2">
				  <Link href="/help/become-a-member" className="btn rounded-none bg-zinc-50 border-0 text-black hover:bg-zinc-50 hover:brightness-95 max-md:btn-block lg:w-1/4 shadow-xl justify-start md:justify-center min-h-16 "><DocumentTextIcon className="w-5" /> How to become a member</Link>
				  <Link href="/help/devices" className="btn rounded-none max-md:btn-block lg:w-1/4 bg-zinc-50 border-0 text-black hover:bg-zinc-50 hover:brightness-95 shadow-xl justify-start md:justify-center min-h-16"><DocumentTextIcon className="w-5" /> Supported devices</Link>
				  <Link href="/help/requesting" className="btn rounded-none max-md:btn-block lg:w-1/4 bg-zinc-50 border-0 text-black hover:bg-zinc-50 hover:brightness-95 shadow-xl justify-start md:justify-center min-h-16"><DocumentTextIcon className="w-5" /> Requesting new media</Link>
				</div>
			  <p className="mb-4 text-sm">Having issues connecting? Check out our <Link href="//status.nickflixtv.com" className="link-primary font-extrabold mb-4">Status Page</Link></p>
			</div>
    </div>
  )
}

export default PopularTopics
