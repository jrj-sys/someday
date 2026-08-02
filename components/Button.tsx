'use client'

import Link from 'next/link'
import styles from './Button.module.css'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'ghost'
  size?: 'sm' | 'lg'
  href?: string
  onClick?: () => void
}

export default function Button({
  children,
  variant = 'primary',
  size = 'lg',
  href,
  onClick,
}: ButtonProps) {
  const variantClass = variant === 'ghost' ? styles.ghost : styles.primary
  const sizeClass = size === 'sm' ? styles.sm : styles.lg
  const className = `${variantClass} ${sizeClass}`

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  )
}
