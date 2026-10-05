import { Lock, Package, RotateCcw, Truck } from "lucide-react";

const items = [
  { icon: Truck, label: "Free delivery", sub: "Mainland UK" },
  { icon: RotateCcw, label: "14-day returns", sub: "Unused items" },
  { icon: Lock, label: "Secure payment", sub: "Woo checkout" },
  { icon: Package, label: "Tracked orders", sub: "Furniture carriers" },
] as const;

export function ProductTrustGrid() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 border-t border-foreground/10 pt-8">
      {items.map(({ icon: Icon, label, sub }) => (
        <div key={label} className="flex gap-3">
          <Icon className="mt-0.5 size-5 shrink-0 text-foreground/45" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-foreground/55">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
