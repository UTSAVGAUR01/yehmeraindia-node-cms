import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext'
import { AuthorProvider } from './context/AuthorContext'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <AuthProvider>
      <LanguageProvider>
        <AuthorProvider>
          <App />
        </AuthorProvider>
      </LanguageProvider>
    </AuthProvider>
  </HashRouter>,
)
