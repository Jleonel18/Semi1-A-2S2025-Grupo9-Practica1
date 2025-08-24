import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
        } else {
          toast.error(data.error || "Error al cargar el perfil");
        }
      } catch (err) {
        toast.error("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleAddBalance = async () => {
    const token = localStorage.getItem("token");
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      const res = await fetch("http://localhost:5000/api/user/balance", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ monto: amount }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Saldo actualizado");
        // setUser({ ...user, saldo: data.nuevoSaldo });
        setUser({ ...user, saldo: Number(data.nuevoSaldo) });
        setAmount("");
      } else {
        toast.error(data.error || "Error al actualizar saldo");
      }
    } catch (err) {
      toast.error("Error en el servidor");
    }
  };

  if (loading)
    return <div className="flex items-center justify-center min-h-screen">Cargando perfil...</div>;
  if (!user)
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error cargando perfil</div>;

  return (
    <div className="min-h-screen bg-blue-100">
      <ToastContainer />

      {/* Navbar */}
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ArtGalleryCloud</h1>
        <div className="flex items-center">
          <button onClick={() => navigate("/dashboard")} className="mr-4 hover:underline">
            Dashboard
          </button>
          <button onClick={() => navigate("/profile")} className="mr-4 underline font-bold">
            Perfil
          </button>
          <button onClick={handleLogout} className="hover:underline">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Contenido */}
      <div className="container mx-auto p-6">
        {/* Información del usuario */}
        <div className="flex flex-col md:flex-row items-center md:items-start bg-white rounded-xl shadow p-6 mb-8 max-w-4xl mx-auto">
          <img
            src={user.foto.startsWith("http") ? user.foto : `/uploads/${user.foto}`}
            alt="Perfil"
            className="w-32 h-32 rounded-full mr-6 object-cover mb-4 md:mb-0"
          />
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-blue-700">{user.nombre}</h2>
            <p className="text-gray-700 mt-1">Usuario: {user.usuario}</p>
            <p className="text-gray-700 mt-1">
              Saldo: ${user.saldo !== undefined && user.saldo !== null ? Number(user.saldo).toFixed(2) : "0.00"}
            </p>

            {/* <p className="text-gray-700 mt-1">Saldo: ${user.saldo.toFixed(2)}</p> */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              <input
                type="number"
                placeholder="Monto"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border p-2 rounded w-28"
              />
              <button
                onClick={handleAddBalance}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Aumentar Saldo
              </button>
              <button
                onClick={() => navigate("/edit-profile")}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Obras adquiridas */}
        <h3 className="text-2xl font-semibold mb-6 text-center text-blue-700">Obras Adquiridas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center max-w-6xl mx-auto">
          {user.obras && user.obras.length > 0 ? (
            user.obras.map((obra) => (
              <div key={obra.id} className="bg-white rounded-2xl shadow-md p-4 w-64 flex flex-col items-center">
                <img
                  src={obra.imagen.startsWith("http") ? obra.imagen : `/uploads/${obra.imagen}`}
                  alt={obra.titulo}
                  className="w-full h-40 object-cover rounded mb-3"
                />
                <h4 className="font-semibold text-center text-blue-800">{obra.titulo}</h4>
                <p className="text-gray-600 text-center">Autor: {obra.autor}</p>
                <p className="text-gray-600 text-center">Fecha: {obra.fecha_adquisicion}</p>
                <p className="text-gray-600 text-center">Precio: ${obra.precio.toFixed(2)}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-700 col-span-full">No has adquirido ninguna obra aún.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
