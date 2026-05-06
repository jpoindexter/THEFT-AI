import Link from "next/link";

export default function OrgNotFound() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#f5f4f0] p-6">
      <div className="max-w-sm w-full text-center space-y-3">
        <CrossStitch />
        <h1 className="text-xl tracking-tight">Not here</h1>
        <p className="text-[13px] text-stone-500">
          Whatever you were looking for either moved, was removed, or never
          existed in this workspace.
        </p>
        <div className="pt-1">
          <Link
            href="/"
            className="inline-block rounded-md bg-stone-900 text-white px-3 py-1.5 text-[12px]"
          >
            Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}

function CrossStitch() {
  return (
    <svg viewBox="0 0 80 80" className="mx-auto size-16">
      <defs>
        <pattern
          id="stitch-404"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0 L6 6 M6 0 L0 6"
            stroke="#a8a29e"
            strokeWidth="1"
            fill="none"
          />
        </pattern>
      </defs>
      <rect
        x="10"
        y="10"
        width="60"
        height="60"
        fill="url(#stitch-404)"
        stroke="#1c1917"
        strokeWidth="1.5"
      />
    </svg>
  );
}
