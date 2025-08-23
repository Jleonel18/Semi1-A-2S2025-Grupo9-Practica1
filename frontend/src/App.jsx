import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login from './pages/login'
import Register from './pages/register'
import Dashboard from './pages/Dashboard'  // Importa el nuevo componente
import Profile from "./pages/Profile"
import EditProfile from './pages/editProfile'



function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />  // Nueva ruta
          <Route path="/profile" element={<Profile />} />  // Nueva ruta
          <Route path="/edit-profile" element={<EditProfile />} />  // Nueva ruta
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App