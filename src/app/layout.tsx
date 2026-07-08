import '@/styles/globals.scss'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import ProgressBar from '@/components/ProgressBar/ProgressBar'
import getTheme from '@/themes/theme'
import Providers from '@/components/providers'

config.autoAddCss = false

export const metadata = {
  title: 'Helm — MyJourny Admin',
  description: 'Admin portal for MyJourny platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-bs-theme={getTheme()}>
      <body>
        <Providers>
          <ProgressBar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
