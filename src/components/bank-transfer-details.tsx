import { payee } from "@/lib/payee";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-foreground/10 bg-bone/40 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground/50">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium tabular-nums leading-snug">{value}</p>
    </div>
  );
}

export function BankTransferDetails({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "grid gap-2 text-sm" : "mt-6 grid gap-3"}>
      <Row label="Account name" value={payee.name} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Row label="Sort code" value={payee.sortCode} />
        <Row label="Account number" value={payee.accountNumber} />
      </div>
      <Row label="Bank" value={payee.bankName} />
      {!compact && (
        <>
          <Row label="Bank address" value={payee.bankAddress} />
          <Row label="IBAN" value={payee.iban} />
        </>
      )}
      <Row label="SWIFT / BIC" value={payee.bic} />
    </div>
  );
}
