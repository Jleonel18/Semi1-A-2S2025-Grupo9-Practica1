import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [photoBase64, setPhotoBase64] = useState(null); // solo la parte base64 (sin encabezado)
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  // Utilidad por si tu backend guarda solo el "filename" en S3
  const buildPhotoUrl = (foto) => {
    if (!foto) return "";
    // Si ya es URL completa:
    if (typeof foto === "string" && (foto.startsWith("http://") || foto.startsWith("https://"))) {
      return foto;
    }
    // Ajusta este host si tienes un endpoint que sirve archivos de S3 vía backend.
    // Mientras tanto, evita romper la UI:
    return `/uploads/${foto}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://BalanceadorSemisG9-1373300024.us-east-2.elb.amazonaws.com/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
          setUsername(data.usuario);
          setFullName(data.nombre);
          setPreviewPhoto(buildPhotoUrl(data.foto));
        } else {
          toast.error(data.error || "Error al cargar perfil");
        }
      } catch (err) {
        toast.error("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Convierte a Base64 (sin encabezado) y muestra preview
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreviewPhoto(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result -> "data:image/jpeg;base64,AAAA..."
      const result = reader.result || "";
      const parts = result.split(",");
      const onlyBase64 = parts.length > 1 ? parts[1] : result; // quitar encabezado
      setPhotoBase64(onlyBase64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!password) {
      toast.error("Ingresa tu contraseña para confirmar cambios");
      return;
    }

    try {
      const res = await fetch("http://BalanceadorSemisG9-1373300024.us-east-2.elb.amazonaws.com/api/profile", {
        method: "PUT", // El backend espera PUT
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Usuario: username,
          Nombre: fullName,
          Contrasena: password,     // el backend valida MD5 internamente
          Foto: photoBase64 || null // manda null si no cambiaste la foto
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Perfil actualizado correctamente");
        // Opcional: refrescar user en estado
        if (data.usuario) {
          setUser(data.usuario);
          setUsername(data.usuario.usuario);
          setFullName(data.usuario.nombre);
          setPreviewPhoto(buildPhotoUrl(data.usuario.foto));
        }
        setPassword("");
        // Redirigir al perfil
        navigate("/profile");
      } else {
        toast.error(data.error || "Error al actualizar perfil");
      }
    } catch (err) {
      console.error("Error en el servidor:", err);
      toast.error("Error en el servidor");
    }
  };

  if (loading) return <div className="text-center mt-10">Cargando perfil...</div>;
  if (!user) return <div className="text-center mt-10">Error cargando perfil</div>;

  return (
    <div className="min-h-screen relative">
      <ToastContainer />
      {/* Fondo */}
      <img
        src="https://st4.depositphotos.com/20659180/40404/i/450/depositphotos_404040348-stock-photo-gray-plaster-wall-texture-structure.jpg"
        alt="Background"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black/30"></div>

      <div className="relative z-10 min-h-screen">
        {/* Navbar estilo Dashboard */}
        <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">ArtGalleryCloud</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")} className="hover:underline">
              Dashboard
            </button>
            <button onClick={() => navigate("/profile")} className="hover:underline">
              Perfil
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        </nav>

        {/* Formulario */}
        <div className="flex justify-center mt-10">
          <div className="bg-white/90 p-8 rounded-2xl shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
              Editar Perfil
            </h2>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Foto de Perfil</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              />
              {previewPhoto && (
                <img
                  src={previewPhoto}
                  alt="Preview"
                  className="mt-2 w-24 h-24 object-cover rounded-full mx-auto"
                />
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña para confirmar"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
