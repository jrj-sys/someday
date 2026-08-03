'use client'

import Link from 'next/link'
import styles from './Button.module.css'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'ghost'
  size?: 'sm' | 'lg'
  href?: string
  onClick?: () => void
  disabled?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'lg',
  href,
  onClick,
  disabled = false,
}: ButtonProps) {
  const variantClass = variant === 'ghost' ? styles.ghost : styles.primary
  const sizeClass = size === 'sm' ? styles.sm : styles.lg
  const className = `${variantClass} ${sizeClass}${disabled ? ` ${styles.disabled}` : ''}`

  // a disabled link isn't a thing in html, so render the span version instead
  // of a Link that still navigates
  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
