"use client";

import { useActionState } from "react";

type State = { error?: string; ok?: string };

/** Formulaire relié à une server action renvoyant { error | ok }, avec message accessible. */
export function ActionForm({
  action,
  children,
  submitLabel,
  className = "space-y-3",
  encType,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  encType?: "multipart/form-data";
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className} encType={encType}>
      {children}
      {state.error ? <p role="alert" className="text-sm text-red-700">{state.error}</p> : null}
      {state.ok ? <p role="status" className="text-sm text-green-800">{state.ok}</p> : null}
      <button disabled={pending} className="btn-primary w-full sm:w-auto">{pending ? "Enregistrement…" : submitLabel}</button>
    </form>
  );
}
