import { Outlet } from 'react-router-dom'
import Header from '../components/Header.jsx'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header mode="landing" showAuthButtons={false} />
      <main className="flex-1">{children || <Outlet />}</main>
    </div>
  )
}
