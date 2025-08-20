import React from "react";
import { useNavigate } from "react-router-dom";

function Login() {    

    const navigate = useNavigate();

    function redirectToRegister() {
        navigate("/register");
    }

  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* Imagen de fondo */}
      <img
        src="https://p4.wallpaperbetter.com/wallpaper/827/515/785/arte-cuadros-esculturas-interior-wallpaper-preview.jpg"
        alt="Background"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* Overlay oscuro opcional */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/30"></div>

      {/* Contenedor del formulario */}
      <div className="relative z-10 bg-white/90 p-10 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-6 text-center">Iniciar Sesión</h1>
        <form action="#" method="POST">
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              autoComplete="off"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
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
        <div className="mt-6 text-center">
          <a className="text-blue-500 hover:underline" onClick={redirectToRegister}>
            Registrarse aquí
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;