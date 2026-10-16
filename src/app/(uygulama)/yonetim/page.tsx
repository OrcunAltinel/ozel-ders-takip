import { notFound } from "next/navigation";
import { oturumGetir } from "@/lib/auth/oturum";
import { SayfaBasligi } from "@/components/yerlesim/sayfa-basligi";
import { Yakinda } from "@/components/yerlesim/yakinda";

export default async function YonetimSayfasi() {
  const { profil } = await oturumGetir();
  // Yönetim paneli gizlidir: yönetici olmayan kullanıcı için sayfa yokmuş gibi davranılır.
  if (profil.rol !== "yonetici") notFound();

  return (
    <>
      <SayfaBasligi baslik="Yönetim" />
      <Yakinda asama={9} />
    </>
  );
}
