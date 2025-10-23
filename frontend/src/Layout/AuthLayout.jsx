import { Outlet } from 'react-router-dom'
import Header from '../components/Header'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header showAuthButtons={false} />
      <main className="flex-1 bg-gradient-to-br from-[#FFF8F0] via-white to-[#F5F5F5] relative overflow-hidden flex justify-center">
        {/* Decorative background elements */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-[#A8C9B8] opacity-10 blur-3xl"></div>
        <div className="absolute bottom-40 left-10 w-80 h-80 rounded-full bg-[#FF9B7B] opacity-10 blur-3xl"></div>
        {children || <Outlet />}
      </main>
    </div>
  )
}
