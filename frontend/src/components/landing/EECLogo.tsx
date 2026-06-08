import Image from 'next/image';

export default function EECLogo({ size = 44 }: { size?: number }) {
  return (
    <Image
      src="/logo-eec.png"
      alt="EEC Cameroun"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      className="logo-mark"
    />
  );
}
