import Image from "next/image";

export function SystemLogo() {
  return (
    <div className="flex justify-center">
      <div className="relative aspect-square w-full max-w-[460px]">
        <Image
          src="/logo.png"
          alt="Eagle Eyes CCTV Solutions logo"
          fill
          priority
          className="object-contain drop-shadow-[0_14px_24px_rgba(34,56,111,0.14)]"
          sizes="(max-width: 640px) 280px, (max-width: 1024px) 360px, 460px"
        />
      </div>
    </div>
  );
}