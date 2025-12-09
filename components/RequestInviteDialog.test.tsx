// @ts-nocheck
import React from 'react'
import { MockedProvider } from '@apollo/client/testing'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { RequestInviteDialog } from '@/components/RequestInviteDialog'
import { GET_CHECK_DUPLICATE_EMAIL, REQUEST_USER_ACCESS_MUTATION } from '@/graphql/auth'

const mocks = [
  {
    request: {
      query: GET_CHECK_DUPLICATE_EMAIL,
      variables: {
        email: 'test@example.com',
      },
    },
    result: {
      data: {
        checkDuplicateEmail: [],
      },
    },
  },
  {
    request: {
      query: REQUEST_USER_ACCESS_MUTATION,
      variables: {
        requestUserAccessInput: {
          email: 'test@example.com',
        },
      },
    },
    result: {
      data: {
        requestUserAccess: {
          _id: 'test-id',
          email: 'test@example.com',
        },
      },
    },
  },
]

describe('RequestInviteDialog', () => {
  it('renders the dialog when open is true', () => {
    const mockOnClose = vi.fn()

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <RequestInviteDialog open={true} onClose={mockOnClose} />
      </MockedProvider>
    )

    expect(screen.getByPlaceholderText('Enter your email address')).toBeTruthy()
  })

  it('does not render form when open is false', () => {
    const mockOnClose = vi.fn()

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <RequestInviteDialog open={false} onClose={mockOnClose} />
      </MockedProvider>
    )

    expect(screen.queryByPlaceholderText('Enter your email address')).toBeNull()
  })

  it('shows success state after submitting a valid email', async () => {
    const mockOnClose = vi.fn()

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <RequestInviteDialog open={true} onClose={mockOnClose} />
      </MockedProvider>
    )

    fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
      target: { value: 'test@example.com' },
    })

    fireEvent.click(screen.getByText('Request Invite'))

    await waitFor(() => {
      expect(screen.getByText(/Thank you for joining us/i)).toBeTruthy()
    })
  })

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn()

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <RequestInviteDialog open={true} onClose={mockOnClose} />
      </MockedProvider>
    )

    fireEvent.click(screen.getByLabelText('Close'))

    expect(mockOnClose).toHaveBeenCalled()
  })
})
