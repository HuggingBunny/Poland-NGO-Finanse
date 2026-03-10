import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LegalUpdatesProvider } from './contexts/LegalUpdatesContext'
import { LoginPage } from './components/Auth/LoginPage'
import { AppShell } from './components/Layout/AppShell'

function AppContent() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <AppShell /> : <LoginPage />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LegalUpdatesProvider>
          <AppContent />
        </LegalUpdatesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
