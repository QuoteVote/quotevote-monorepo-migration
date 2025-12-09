'use client'

import * as React from 'react'
import { useApolloClient, useMutation } from '@apollo/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { GET_CHECK_DUPLICATE_EMAIL, REQUEST_USER_ACCESS_MUTATION } from '@/graphql/auth'
import { cn } from '@/lib/utils'

const EMAIL_VALIDATION_PATTERN =
  /^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i

interface RequestInviteDialogProps {
  open: boolean
  onClose?: () => void
}

export function RequestInviteDialog({ open, onClose }: RequestInviteDialogProps) {
  const [email, setEmail] = React.useState('')
  const [error, setError] = React.useState('')
  const [submitted, setSubmitted] = React.useState(false)
  const [currentPath, setCurrentPath] = React.useState('')
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const client = useApolloClient()
  const [requestUserAccess, { loading }] = useMutation(REQUEST_USER_ACCESS_MUTATION)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(`${window.location.pathname}${window.location.search}${window.location.hash}`)
    }
  }, [])

  const handleClose = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setEmail('')
    setError('')
    setSubmitted(false)
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const handleSubmit = React.useCallback(async () => {
    setError('')

    if (!EMAIL_VALIDATION_PATTERN.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      const checkDuplicate = await client.query({
        query: GET_CHECK_DUPLICATE_EMAIL,
        variables: { email },
        fetchPolicy: 'network-only',
      })

      const isDuplicate = checkDuplicate && checkDuplicate.data
        ? (checkDuplicate.data as { checkDuplicateEmail?: boolean | unknown[] }).checkDuplicateEmail
        : undefined
      if ((Array.isArray(isDuplicate) && isDuplicate.length > 0) || isDuplicate === true) {
        setError('This email address has already been used to request an invite.')
        return
      }

      await requestUserAccess({ variables: { requestUserAccessInput: { email } } })
      setSubmitted(true)
      timeoutRef.current = setTimeout(() => handleClose(), 3000)
    } catch (mutationError) {
      const fallbackMessage = 'An unexpected error occurred. Please try again later.'
      if (mutationError instanceof Error) {
        setError(mutationError.message || fallbackMessage)
      } else {
        setError(fallbackMessage)
      }
    }
  }, [client, email, handleClose, requestUserAccess])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const loginUrl = React.useMemo(() => {
    if (!currentPath) return '/auth/login'
    return `/auth/login?redirect=${encodeURIComponent(currentPath)}`
  }, [currentPath])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="relative overflow-hidden">
        <DialogCloseButton onClick={handleClose} />
        <DialogHeader className="pb-4 text-center">
          <DialogTitle>Request an invite</DialogTitle>
          <DialogDescription>
            You need an account to contribute. Viewing is public, but posting, voting, and quoting require an invite.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-lg font-semibold text-foreground">Thank you for joining us</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                When an account becomes available, an invite will be sent to the email provided.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="invite-email">
                  Email address
                </label>
                <div
                  className={cn(
                    'rounded-xl border-2 border-border bg-gradient-to-br from-muted/70 to-background p-4 shadow-inner transition focus-within:border-primary focus-within:bg-background focus-within:shadow-[0_0_0_4px_rgba(82,178,116,0.12)]',
                  )}
                >
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
                    className="bg-transparent text-base font-medium text-foreground"
                  />
                </div>
                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                )}
              </div>

              <div className="text-center text-sm font-medium text-primary">
                <a href="/auth/request-access#mission" className="transition hover:underline">
                  Learn more about our mission here
                </a>
              </div>

              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
                {loading ? 'Submitting…' : 'Request Invite'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <a className="font-semibold text-primary hover:underline" href={loginUrl}>
                  Login
                </a>
              </p>
            </div>
          )}
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  )
}
