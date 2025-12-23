'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async ( e: React.FormEvent<HTMLFormElement>) => {
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
    <div className="min-h-screen flex bg-orange-400">
      {/* KIRI */}
      <div className="w-3/5 flex flex-col justify-center items-center text-white">
        <img src="/gambar/logo.png" className="w-70" />
        <p className="text-2xl font-bold text-center">
          Selamat Datang <br/> Silahkan Login
        </p>
      </div>

      {/* KANAN */}
      <div className="w-2/5 flex justify-center items-center">
        <form
          onSubmit={handleLogin}
          className="w-[420px] rounded-3xl p-10 bg-white/20 backdrop-blur-lg border border-white/30 shadow-xl"
        >
          <h2 className="text-black text-2xl font-bold text-center mb-8">
            Login Ke Akun Anda
          </h2>

          {error && (
            <p className="text-red-700 text-center font-semibold mb-4">{error}</p>
          )}

          <label className="text-white">Email</label>
          <input
            type="email"
            className="w-full mt-2 mb-4 px-5 py-3 rounded-full outline-none bg-white text-gray-800 placeholder-gray-400"
            placeholder="Masukkan email Anda"
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="text-white">Password</label>
          <input
            type="password"
            className="w-full mt-2 mb-6 px-5 py-3 rounded-full outline-none bg-white text-gray-800 placeholder-gray-400"
            placeholder="Masukkan password Anda"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="w-full bg-yellow-400 hover:bg-yellow-300 py-3 rounded-full font-bold text-lg">
            Masuk
          </button>
        </form>
      </div>

    </div>
  )
}
