import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewPicture, setPreviewPicture] = useState(null);
  const navigate = useNavigate();

  const redirectToLogin = () => {
    navigate("/login");
  };

  // Validación de contraseñas
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (confirmPassword && e.target.value !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (password && e.target.value !== password) {
      setPasswordError("Las contraseñas no coinciden");
    } else {
      setPasswordError("");
    }
  };

  // Convertir imagen a Base64
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewPicture(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1]; // quitar encabezado data:image/jpeg;base64,
        setProfilePicture(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Enviar datos al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Usuario: username,
          Nombre: fullName,
          Contrasena: password,
          Foto: profilePicture,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Usuario registrado exitosamente");
        navigate("/login");
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error en registro:", error);
      alert("Hubo un problema con el servidor");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* Fondo */}
      <img
        src="https://wallpapers.com/images/hd/museum-background-zwem0wdjqomsm6lm.jpg"
        alt="Background"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black/40"></div>

      {/* Formulario */}
      <div className="relative z-10 bg-white/90 p-10 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-6 text-center">Registrarse</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700">Nombre Completo</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-gray-700">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              required
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="profilePicture" className="block text-gray-700">Foto de Perfil</label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              required
            />
            {previewPicture && (
              <img
                src={previewPicture}
                alt="Profile Preview"
                className="mt-2 w-24 h-24 object-cover rounded-full"
              />
            )}
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md py-2 px-4 w-full"
          >
            Registrarse
          </button>
        </form>
        <div className="mt-6 text-center">
          <a className="text-blue-500 hover:underline" onClick={redirectToLogin}>
            Ya tienes una cuenta? Inicia sesión
          </a>
        </div>
      </div>
    </div>
  );
}

export default Register;
