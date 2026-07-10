import { Badge } from 'react-bootstrap'

const STATUS_MAP: Record<string, { bg: string; label: string }> = {
  active: { bg: 'success', label: 'Active' },
  inactive: { bg: 'secondary', label: 'Inactive' },
  pending: { bg: 'warning', label: 'Pending' },
  confirmed: { bg: 'success', label: 'Confirmed' },
  completed: { bg: 'primary', label: 'Completed' },
  cancelled: { bg: 'danger', label: 'Cancelled' },
  expired: { bg: 'secondary', label: 'Expired' },
  paid: { bg: 'success', label: 'Paid' },
  unpaid: { bg: 'warning', label: 'Unpaid' },
  refunded: { bg: 'info', label: 'Refunded' },
  approved: { bg: 'success', label: 'Approved' },
  rejected: { bg: 'danger', label: 'Rejected' },
  unverified: { bg: 'secondary', label: 'Unverified' },
  basic: { bg: 'info', label: 'Basic' },
  verified: { bg: 'success', label: 'Verified' },
}

export default function StatusBadge({ status }: { status: string }) {
  const { bg, label } = STATUS_MAP[status.toLowerCase()] ?? { bg: 'light', label: status }
  return <Badge bg={bg}>{label}</Badge>
}
