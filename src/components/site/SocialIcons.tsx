import { SVGProps } from "react";

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2H21.5l-7.41 8.466L22.7 22h-6.84l-5.36-7.01L4.4 22H1.14l7.93-9.062L1.5 2h7.01l4.85 6.41L18.244 2Zm-2.4 18h1.86L7.27 4H5.32l10.524 16Z" />
    </svg>
  );
}

export function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.62 7.13-1.55 7.32c-.12.51-.42.64-.86.4l-2.36-1.74-1.14 1.1c-.13.13-.24.24-.49.24l.17-2.41 4.4-3.97c.19-.17-.04-.27-.3-.1L9 13.27l-2.39-.74c-.52-.16-.53-.52.11-.77l9.34-3.6c.43-.16.81.1.66.97Z" />
    </svg>
  );
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M3 3v18h18" />
      <path d="M7 15l4-6 3 4 5-9" />
    </svg>
  );
}
