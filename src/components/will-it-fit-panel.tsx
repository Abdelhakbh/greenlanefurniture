import Link from "next/link";

const steps = [
  {
    title: "Measure your space",
    body: "Measure the room where the bed will go, including clearance around light fittings, radiators and shelving.",
  },
  {
    title: "Check all pathways",
    body: "Measure doorways, hallways and stairs from the delivery point to the bedroom.",
  },
  {
    title: "Will packaging fit?",
    body: "Compare box dimensions (in the product details) with your narrowest doorway. Allow 5–10 cm extra for safe manoeuvring.",
  },
  {
    title: "Plan for assembly",
    body: "Leave enough floor space to unpack and assemble before the bed is in its final position.",
  },
];

export function WillItFitPanel() {
  return (
    <section aria-labelledby="will-it-fit-heading" className="max-w-[72ch]">
      <h2
        id="will-it-fit-heading"
        className="font-display text-[1.45rem] font-medium text-pine-deep"
      >
        Will it fit?
      </h2>
      <p className="mt-2 text-[1.05rem] leading-relaxed text-foreground/75">
        Check measurements before you order. Use the dimensions table in the description for
        width, depth and height by bed size.
      </p>
      <ul className="mt-6 space-y-4">
        {steps.map((step) => (
          <li
            key={step.title}
            className="rounded-md border border-foreground/15 bg-bone-dim/40 p-4"
          >
            <h3 className="font-semibold text-foreground">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground/75">{step.body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-foreground/60">
        Need help?{" "}
        <Link href="/contact" className="underline">
          Contact our Birmingham team
        </Link>{" "}
        with your room measurements and chosen bed size.
      </p>
    </section>
  );
}
