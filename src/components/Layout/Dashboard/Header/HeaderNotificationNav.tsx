import HeaderTheme from '@/components/Layout/Dashboard/Header/HeaderTheme'
import { getPreferredTheme } from '@/themes/theme'

export default function HeaderNotificationNav() {
  return (
    <HeaderTheme currentPreferredTheme={getPreferredTheme()} />
  )
}
