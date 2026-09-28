import type { SVGProps } from "react";

export type UiIconName = "learning" | "recall" | "dictionary" | "menu" | "close" | "audio" | "settings" | "stats" | "mnemonic" | "writing" | "grammar" | "reading" | "previous" | "next" | "user" | "eye" | "eyeOff";

const paths: Record<UiIconName, string[]> = {
  learning:["M4 5h16","M4 10h16","M4 15h10","M4 20h7"],
  recall:["M12 3a9 9 0 1 0 9 9","M12 7v5l3 2"],
  dictionary:["M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z","M8 20V7.5a3 3 0 0 0-3-3"],
  menu:["M4 6h16","M4 12h16","M4 18h16"],
  close:["M6 6l12 12","M18 6 6 18"],
  audio:["M5 10v4h3l4 4V6l-4 4H5Z","M16 9.5a4 4 0 0 1 0 5","M18.5 7a7 7 0 0 1 0 10"],
  settings:["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z","M4 12h2","M18 12h2","M12 4v2","M12 18v2","m6.3 6.3 1.4 1.4","m16.3 16.3 1.4 1.4","m6.3 17.7 1.4-1.4","m16.3 7.7 1.4-1.4"],
  stats:["M5 19V9","M12 19V5","M19 19v-7"],
  mnemonic:["M5 19 19 5","M14 5h5v5","M5 14v5h5"],
  writing:["M4 20h5l10-10-5-5L4 15v5Z","m13 6 5 5"],
  grammar:["M5 4h14v16H5z","M8 8h8","M8 12h8","M8 16h5"],
  reading:["M4 5h16v14H4z","M7 9h10","M7 13h7"],
  previous:["m15 18-6-6 6-6"],
  next:["m9 18 6-6-6-6"],
  user:["M20 21a8 8 0 0 0-16 0","M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
  eye:["M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z","M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
  eyeOff:["M3 3l18 18","M10.6 10.6a2 2 0 0 0 2.8 2.8","M9.9 5.2A10.6 10.6 0 0 1 12 5c6 0 9.5 7 9.5 7a17.8 17.8 0 0 1-3.1 4.1","M6.2 6.2C3.9 7.8 2.5 12 2.5 12a17.7 17.7 0 0 0 5.8 5.8"
};

export function UiIcon({ name, size = 20, ...props }: { name: UiIconName; size?: number } & SVGProps<SVGSVGElement>) {
  return <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {paths[name].map((d,index)=><path key={index} d={d} />)}
  </svg>;
}
