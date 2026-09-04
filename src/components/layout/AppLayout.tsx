/**
 * AppLayout — main application shell (Navbar + outlet + Theme & Role Providers)
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { ThemeProvider } from '@/context/ThemeContext'
import { UserRoleProvider } from '@/context/UserRoleContext'
import { ChatbotProvider } from '@/context/ChatbotContext'

export function AppLayout() {
  return (
    <ThemeProvider>
      <UserRoleProvider>
        <ChatbotProvider>
          <div className="flex h-dvh flex-col overflow-hidden bg-[var(--color-surface-base)] text-[var(--color-text-primary)] transition-colors duration-200">
            <Navbar />
            <main id="main-content" className="flex flex-1 flex-col overflow-hidden min-h-0">
              <Outlet />
            </main>
          </div>
        </ChatbotProvider>
      </UserRoleProvider>
    </ThemeProvider>
  )
}
