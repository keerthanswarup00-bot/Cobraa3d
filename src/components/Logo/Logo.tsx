import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { className } = props

  return (
    <span className={clsx('cobraa-admin-logo', className)} aria-label="Cobraa 3D">COBRAA <i>3D</i></span>
  )
}
