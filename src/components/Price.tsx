import { formatPrice } from "@/lib/format";

export function Price({ price, compareAt, from, className = "" }: { price: number; compareAt?: number | null; from?: boolean; className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className="font-bold text-stone-900">
        {from ? "À partir de " : ""}
        {formatPrice(price)}
      </span>
      {compareAt ? (
        <s className="text-sm text-stone-600" aria-label={`Ancien prix ${formatPrice(compareAt)}`}>
          {formatPrice(compareAt)}
        </s>
      ) : null}
    </span>
  );
}
