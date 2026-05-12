import { useState } from "react"
import { auth } from "../firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export default function Login({ onAuthChange }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState("login") // login | register
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const currentUser = auth.currentUser

  const handleLogin = async () => {
    setError(""); setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      onAuthChange?.()
      navigate("/")
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(" (auth/invalid-credential).", "Invalid email or password."))
    } finally { setLoading(false) }
  }

  const handleRegister = async () => {
    setError(""); setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      if (name) await updateProfile(user, { displayName: name })
      onAuthChange?.()
      navigate("/")
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""))
    } finally { setLoading(false) }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    onAuthChange?.()
  }

  if (currentUser) {
    return (
      <div className="login-wrap">
        <motion.div className="login-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="login-logo">
            <div className="logo-icon">⚡</div> TaskFlow
          </div>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div className="avatar" style={{ width: 52, height: 52, fontSize: 20, margin: "0 auto 10px" }}>
              {currentUser.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{currentUser.displayName || "User"}</div>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>{currentUser.email}</div>
          </div>
          <button className="login-btn" style={{ marginBottom: 10 }} onClick={() => navigate("/")}>Go to Boards</button>
          <button className="login-btn" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1.5px solid var(--danger-border)" }} onClick={handleSignOut}>
            Sign out
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="login-wrap">
      <motion.div className="login-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="login-logo">
          <div className="logo-icon">⚡</div> TaskFlow
        </div>

        <div className="login-tabs">
          <button className={`login-tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>Sign in</button>
          <button className={`login-tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>Register</button>
        </div>

        {tab === "register" && (
          <div className="login-field">
            <div className="login-label">Name</div>
            <input className="login-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="login-field">
          <div className="login-label">Email</div>
          <input className="login-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())} />
        </div>
        <div className="login-field">
          <div className="login-label">Password</div>
          <input className="login-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())} />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="login-btn" disabled={loading}
          onClick={tab === "login" ? handleLogin : handleRegister}>
          {loading ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
        </button>
      </motion.div>
    </div>
  )
}
