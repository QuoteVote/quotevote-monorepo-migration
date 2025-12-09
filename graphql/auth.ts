import { gql } from '@apollo/client'

export const REQUEST_USER_ACCESS_MUTATION = gql`
  mutation requestUserAccess($requestUserAccessInput: RequestUserAccessInput!) {
    requestUserAccess(requestUserAccessInput: $requestUserAccessInput) {
      _id
      email
    }
  }
`

export const GET_CHECK_DUPLICATE_EMAIL = gql`
  query checkDuplicateEmail($email: String!) {
    checkDuplicateEmail(email: $email)
  }
`
