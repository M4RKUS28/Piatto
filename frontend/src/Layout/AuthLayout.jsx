import { Outlet } from 'react-router-dom'
import Header from '../components/Header'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header showAuthButtons={false} />
      <main className="flex-1">{children || <Outlet />}</main>
    </div>
  )
}
