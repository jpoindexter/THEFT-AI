export function JobStatusDot({ status }: { status: string }) {
  const colorClass =
    status === "success" || status === "succeeded"
      ? "bg-green-500"
      : status === "failed"
        ? "bg-red-500"
        : status === "running"
          ? "bg-blue-500 animate-pulse"
          : status === "cancelled"
            ? "bg-gray-400"
            : "bg-amber-500";

  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${colorClass}`}
      title={status}
    />
  );
}

export function DeliveryStatusDot({ status }: { status: string }) {
  const colorClass =
    status === "processed" || status === "success"
      ? "bg-green-500"
      : status === "failed"
        ? "bg-red-500"
        : status === "received"
          ? "bg-blue-500"
          : "bg-amber-500";

  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${colorClass}`}
      title={status}
    />
  );
}
