"use client";

import { SubmitButton } from "@/components/submit-button";
import type { ButtonProps } from "@/components/ui/button";

/** Przycisk submit z potwierdzeniem (confirm) przed wysłaniem formularza. */
export function ConfirmSubmit({ message, ...props }: ButtonProps & { message: string }) {
  return (
    <SubmitButton
      {...props}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    />
  );
}
