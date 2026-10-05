import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-[#f7f5f0] text-[#1a2e1a]">
      <header className="border-b border-[#1a2e1a]/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">
            Green Lane Furniture
          </span>
          <nav className="flex gap-6 text-sm font-medium">
            <Link href="/" className="text-[#2d5a27]">
              Home
            </Link>
            <span className="text-black/40">Shop (soon)</span>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-1 flex-col justify-center px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#2d5a27]">
          Coming soon
        </p>
        <h1 className="mt-4 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
          Honest furniture, calm rooms.
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-black/70">
          Your storefront is wired to Vercel. Next we&apos;ll add the shop,
          products, and checkout — like a custom catalogue site, not a generic
          template.
        </p>
      </main>
    </div>
  );
}
