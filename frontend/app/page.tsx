'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:8000/api/login/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_users: email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Login gagal')
        return
      }

      // simpan token & user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('role', data.role)

      router.push('/dashboard')
    } catch (err) {
      setError('Server error')
    }
  }

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-[#FAF5ED]">
      <div className="w-[450px] bg-white p-12 shadow-sm border border-gray-100 rounded-sm">
        <h2 className="text-[38px] font-bold text-black text-center mb-8 font-inter tracking-tight">
          Login
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg text-center font-medium font-inter">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[14px] font-semibold text-black mb-2 font-inter">
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-inter text-sm"
              placeholder="nama@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-black mb-2 font-inter">
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-inter text-sm"
              placeholder="........."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3 rounded-lg font-semibold text-[15px] font-inter mt-6 tracking-wide transition duration-200"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  )
}
