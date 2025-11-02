import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold">Mood Travel</Link>
        <nav>
          <Link href="/" className="mr-4 text-sm text-gray-600">Home</Link>
          <Link href="/recommend" className="text-sm text-gray-600">Recommend</Link>
        </nav>
      </div>
    </header>
  );
}
