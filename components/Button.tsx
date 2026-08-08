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
  type?: 'button' | 'submit'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'lg',
  href,
  onClick,
  disabled = false,
  type = 'button',
}: ButtonProps) {
  const variantClass = variant === 'ghost' ? styles.ghost : styles.primary
  const sizeClass = size === 'sm' ? styles.sm : styles.lg

  const classNames = [variantClass, sizeClass]
  if (disabled) classNames.push(styles.disabled)
  const className = classNames.join(' ')

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
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
