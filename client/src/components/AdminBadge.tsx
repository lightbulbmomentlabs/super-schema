interface AdminBadgeProps {
  count: number
}

export default function AdminBadge({ count }: AdminBadgeProps) {
  if (count === 0) return null

  const displayCount = count > 99 ? '99+' : count.toString()

  return (
    <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">
      {displayCount}
    </span>
  )
}
