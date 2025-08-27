import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [Usuario, setUsuario] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const [message, setMessage] = useState("");

  function redirectToRegister() {
    navigate("/register");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://BalanceadorSemisG9-1373300024.us-east-2.elb.amazonaws.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Usuario, Contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Inicio de sesión correcto");
        // Guarda el token en localStorage
        localStorage.setItem("token", data.token); // Asegúrate de que la API devuelva un token
        // Redirige inmediatamente (sin setTimeout por ahora para testing)
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500); // Mantiene el delay de 1.5 segundos por diseño
      } else {
        setMessage("❌ " + (data.error || "Credenciales incorrectas"));
      }
    } catch (error) {
      console.error("Error en login:", error);
      setMessage("⚠️ Error en el servidor");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <img
        src="https://p4.wallpaperbetter.com/wallpaper/827/515/785/arte-cuadros-esculturas-interior-wallpaper-preview.jpg"
        alt="Background"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black/30"></div>
      <div className="relative z-10 bg-white/90 p-10 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-6 text-center">Iniciar Sesión</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="usuario" className="block text-gray-700">
              Usuario
            </label>
            <input
              type="text"
              id="usuario"
              value={Usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="contrasena" className="block text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              id="contrasena"
              value={Contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md py-2 px-4 w-full mt-6"
          >
            Iniciar Sesión
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center font-semibold text-gray-700">{message}</p>
        )}

        <div className="mt-6 text-center">
          <a
            className="text-blue-500 hover:underline cursor-pointer"
            onClick={redirectToRegister}
          >
            Registrarse aquí
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;