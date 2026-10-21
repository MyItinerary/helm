'use client'

import { Button, FormControl, InputGroup } from 'react-bootstrap'
import type { FormControlProps } from 'react-bootstrap'
import InputGroupText from 'react-bootstrap/InputGroupText'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash, faLock } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'

type Props = Omit<FormControlProps & InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Show the lock icon in front, as on the login screens. */
  withLockIcon?: boolean
  className?: string
}

/** A password field that starts hidden, with an eye button to show or hide what was typed. */
export default function PasswordInput({ withLockIcon, className, ...props }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <InputGroup className={className}>
      {withLockIcon && (
        <InputGroupText>
          <FontAwesomeIcon icon={faLock} fixedWidth />
        </InputGroupText>
      )}
      <FormControl {...props} type={visible ? 'text' : 'password'} />
      <Button
        variant="outline-secondary"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        disabled={props.disabled}
      >
        <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} fixedWidth />
      </Button>
    </InputGroup>
  )
}
