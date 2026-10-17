"use client";

import { useState } from "react";
import type {
  FieldError as RhfAlanHatasi,
  UseFormRegisterReturn,
} from "react-hook-form";
import { EyeIcon, EyeOffIcon, WandSparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

// Karışabilecek karakterler (0/O, 1/l/I) çıkarıldı; şifre karşıya söylenecek.
const KARAKTERLER = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function rastgeleSifre(uzunluk = 10): string {
  const sayilar = crypto.getRandomValues(new Uint32Array(uzunluk));
  return Array.from(sayilar, (n) => KARAKTERLER[n % KARAKTERLER.length]).join(
    "",
  );
}

export function SifreAlani({
  id,
  etiket = "Şifre",
  kayit,
  hata,
  uret,
}: {
  id: string;
  etiket?: string;
  kayit: UseFormRegisterReturn;
  hata?: RhfAlanHatasi;
  /** Üretilen şifreyi forma yazar. */
  uret: (sifre: string) => void;
}) {
  const [gorunur, setGorunur] = useState(false);

  return (
    <Field data-invalid={!!hata}>
      <FieldLabel htmlFor={id}>{etiket}</FieldLabel>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            type={gorunur ? "text" : "password"}
            autoComplete="new-password"
            className="pr-9"
            {...kayit}
          />
          <button
            type="button"
            onClick={() => setGorunur((g) => !g)}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={gorunur ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {gorunur ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            uret(rastgeleSifre());
            setGorunur(true);
          }}
        >
          <WandSparklesIcon />
          Üret
        </Button>
      </div>
      <FieldError errors={[hata]} />
    </Field>
  );
}
