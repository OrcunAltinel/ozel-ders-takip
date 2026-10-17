"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { kullaniciOlustur } from "@/actions/yonetim";
import {
  kullaniciOlusturSemasi,
  ROLLER,
  type KullaniciOlusturGirdisi,
} from "@/lib/validasyon/yonetim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SifreAlani } from "./sifre-alani";

const ROL_OGELERI = Object.entries(ROLLER).map(([value, label]) => ({
  value,
  label,
}));

const VARSAYILANLAR: KullaniciOlusturGirdisi = {
  kullaniciAdi: "",
  adSoyad: "",
  sifre: "",
  rol: "hoca",
};

export function KullaniciOlusturDialog() {
  const [acik, setAcik] = useState(false);
  const [beklemede, baslatGecisi] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<KullaniciOlusturGirdisi>({
    resolver: zodResolver(kullaniciOlusturSemasi),
    defaultValues: VARSAYILANLAR,
  });

  function acikligiDegistir(yeniDurum: boolean) {
    if (yeniDurum) reset(VARSAYILANLAR);
    setAcik(yeniDurum);
  }

  function gonder(girdi: KullaniciOlusturGirdisi) {
    baslatGecisi(async () => {
      const sonuc = await kullaniciOlustur(girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Hesap oluşturuldu.");
      setAcik(false);
    });
  }

  return (
    <Dialog open={acik} onOpenChange={acikligiDegistir}>
      <DialogTrigger
        render={
          <Button>
            <UserPlusIcon />
            Yeni hesap
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni hesap</DialogTitle>
          <DialogDescription>
            Kullanıcı adı ve şifreyi hocaya siz iletin; hesap oluşturulduğu anda
            giriş yapılabilir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(gonder)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.adSoyad}>
              <FieldLabel htmlFor="yeni-ad">Ad soyad</FieldLabel>
              <Input id="yeni-ad" autoFocus {...register("adSoyad")} />
              <FieldError errors={[errors.adSoyad]} />
            </Field>
            <Field data-invalid={!!errors.kullaniciAdi}>
              <FieldLabel htmlFor="yeni-kullanici">Kullanıcı adı</FieldLabel>
              <Input
                id="yeni-kullanici"
                autoComplete="off"
                autoCapitalize="none"
                placeholder="örn. ayse.hoca"
                {...register("kullaniciAdi")}
              />
              <FieldDescription>
                Küçük harf, rakam, nokta ve alt çizgi; Türkçe karakter
                kullanmayın.
              </FieldDescription>
              <FieldError errors={[errors.kullaniciAdi]} />
            </Field>
            <SifreAlani
              id="yeni-sifre"
              kayit={register("sifre")}
              hata={errors.sifre}
              uret={(sifre) =>
                setValue("sifre", sifre, { shouldValidate: true })
              }
            />
            <Controller
              control={control}
              name="rol"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Rol</FieldLabel>
                  <Select
                    items={ROL_OGELERI}
                    value={field.value}
                    onValueChange={(deger) => field.onChange(deger ?? "hoca")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROL_OGELERI.map((oge) => (
                        <SelectItem key={oge.value} value={oge.value}>
                          {oge.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Yönetici, bu paneli görür ve tüm hocaların verilerini salt
                    okunur inceleyebilir.
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAcik(false)}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={beklemede}>
              {beklemede ? "Oluşturuluyor…" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
