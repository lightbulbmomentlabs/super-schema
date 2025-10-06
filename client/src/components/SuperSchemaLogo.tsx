interface SuperSchemaLogoProps {
  className?: string
}

export default function SuperSchemaLogo({ className = "h-6 w-6" }: SuperSchemaLogoProps) {
  return (
    <img
      src="/superschema-logo.svg"
      alt="SuperSchema Logo"
      className={className}
    />
  )
}
