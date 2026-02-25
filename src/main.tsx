import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SocketProvider } from '@trustgraph/react-provider'
import { NotificationProvider, NotificationHandler } from '@trustgraph/react-state'
import './index.css'
import App from './App'

const queryClient = new QueryClient()

const notificationHandler: NotificationHandler = {
  success: (title: string) => console.log('[SUCCESS]', title),
  error: (error: string) => console.error('[ERROR]', error),
  warning: (warning: string) => console.warn('[WARNING]', warning),
  info: (info: string) => console.info('[INFO]', info),
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NotificationProvider handler={notificationHandler}>
        <SocketProvider user="trustgraph">
          <App />
        </SocketProvider>
      </NotificationProvider>
    </QueryClientProvider>
  </StrictMode>,
)
