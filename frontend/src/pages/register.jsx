import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const navigate = useNavigate();

  const redirectToLogin = () => {
    navigate("/login");
  };

  // Handle password confirmation
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (confirmPassword && e.target.value !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (password && e.target.value !== password) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  // Handle profile picture selection
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(URL.createObjectURL(file)); // Preview image
    }
  };

  // Prevent form submission due to sandbox restrictions
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    // Add form submission logic here (e.g., API call)
    console.log("Form submitted:", { password, profilePicture });
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* Background image */}
      <img
        src="https://wallpapers.com/images/hd/museum-background-zwem0wdjqomsm6lm.jpg"
        alt="Background"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40"></div>

      {/* Form container */}
      <div className="relative z-10 bg-white/90 p-10 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-6 text-center">Registrarse</h1>
        <div>
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
            <label htmlFor="fullName" className="block text-gray-700">
              Nombre Completo
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
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
              value={password}
              onChange={handlePasswordChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-gray-700">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="off"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="profilePicture" className="block text-gray-700">
              Foto de Perfil
            </label>
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              accept="image/*"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              onChange={handleProfilePictureChange}
            />
            {profilePicture && (
              <img
                src={profilePicture}
                alt="Profile Preview"
                className="mt-2 w-24 h-24 object-cover rounded-full"
              />
            )}
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md py-2 px-4 w-full"
            onClick={handleSubmit}
          >
            Registrarse
          </button>
        </div>
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