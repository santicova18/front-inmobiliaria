import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { api, decodeJWT } from "../../utils/api";
import { Button, Input } from "../ui";

function AuthCard({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.15),transparent)]" />
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold">IL</div>
          <span className="text-white font-bold text-xl">InmoLotes</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
          <p className="text-slate-400 text-sm mb-7">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage({ onNavigate }) {
  const { dispatch, notify } = useApp();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login(form);
      
      // El backend retorna: {"login successfuly": "token_aqui"}
      // También puede retornar: {"access_token": "token_aqui", "token_type": "bearer"}
      
      // Buscar el token en cualquier formato
      const token = data.token || data.access_token || data["login successfuly"];
      
      if (!token) {
        throw new Error(data.message || "El servidor no devolvió un token de acceso");
      }
      
      // Decodificar el JWT para obtener información del usuario
      const decoded = decodeJWT(token);
      
      // El backend usa rol_id: 1 = Administrador, 2 = Cliente (u otro)
      // También puede tener email en el token
      let role = "cliente";
      if (decoded && decoded.rol_id) {
        // Ajusta según tu lógica de roles
        // rol_id = 1 típicamente es admin
        role = decoded.rol_id === 1 ? "admin" : "cliente";
      }
      
      // Crear objeto de usuario con la información disponible
      const userData = {
        id: decoded?.sub || null,
        email: decoded?.email || form.email,
        nombre: decoded?.email?.split('@')[0] || "Usuario",
        correo: decoded?.email || form.email,
        rol_id: decoded?.rol_id || null,
      };
      
      dispatch({ type: "SET_USER", payload: { user: userData, token, role } });
      notify("Bienvenido de nuevo", "success");
    } catch (err) {
      // Mensajes de error personalizados según el tipo de error
      const errorMessage = err.message?.toLowerCase() || "";
      if (errorMessage.includes("invalid credentials") || errorMessage.includes("credenciales")) {
        notify("Correo o contraseña incorrectos. Por favor verifica tus datos.", "error");
      } else if (errorMessage.includes("verify") || errorMessage.includes("verific") || errorMessage.includes("not verified")) {
        notify("Tu cuenta no está verificada. Revisa tu correo electrónico.", "error");
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("token")) {
        notify("Error de conexión. Verifica tu internet.", "error");
      } else {
        notify(err.message || "Error al iniciar sesión. Intenta de nuevo.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Iniciar Sesión" subtitle="Accede a tu cuenta InmoLotes">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Correo electrónico" type="email" placeholder="tu@correo.com"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <Input label="Contraseña" type="password" placeholder="••••••••"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <Button className="w-full" loading={loading}>Iniciar Sesión</Button>
      </form>
      <div className="mt-5 text-center text-sm text-slate-400">
        ¿No tienes cuenta? <button onClick={() => onNavigate("register")} className="text-teal-400 hover:text-teal-300 font-medium">Regístrate</button>
      </div>
      <div className="mt-3 text-center">
        <button onClick={() => onNavigate("forgot")} className="text-xs text-slate-500 hover:text-slate-400">¿Olvidaste tu contraseña?</button>
      </div>
    </AuthCard>
  );
}

export function RegisterPage({ onNavigate }) {
  const { notify } = useApp();
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!form.nombre.trim()) e2.nombre = "Nombre requerido";
    if (!form.email.includes("@")) e2.email = "Correo inválido";
    if (form.password.length < 6) e2.password = "Mínimo 6 caracteres";
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setLoading(true);
    try {
      await api.register({ nombre: form.nombre, email: form.email, telefono: form.telefono, password: form.password });
      notify("Cuenta creada. Verifica tu correo.", "success");
      setSuccess(true);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard title="¡Cuenta Creada!" subtitle="Revisa tu correo para verificar tu cuenta">
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 text-2xl">✓</div>
          <p className="text-slate-300 mb-4">Hemos enviado un correo de verificación a <strong>{form.email}</strong></p>
          <Button variant="outline" onClick={() => onNavigate("login")}>Volver al Login</Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Crear Cuenta" subtitle="Únete a InmoLotes hoy">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre completo" placeholder="Juan Pérez" error={errors.nombre}
          value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        <Input label="Correo electrónico" type="email" placeholder="tu@correo.com" error={errors.email}
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <Input label="Teléfono (opcional)" placeholder="3001234567"
          value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
        <Input label="Contraseña" type="password" placeholder="••••••••" error={errors.password}
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <Button className="w-full" loading={loading}>Crear Cuenta</Button>
      </form>
      <div className="mt-5 text-center text-sm text-slate-400">
        ¿Ya tienes cuenta? <button onClick={() => onNavigate("login")} className="text-teal-400 hover:text-teal-300 font-medium">Inicia Sesión</button>
      </div>
    </AuthCard>
  );
}

export function ForgotPasswordPage({ onNavigate }) {
  const { notify } = useApp();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard title="Correo Enviado" subtitle="Hemos enviado instrucciones a tu correo">
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-900/30 flex items-center justify-center text-teal-400 text-2xl">✓</div>
          <p className="text-slate-300 mb-4">Si el correo <strong>{email}</strong> existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.</p>
          <Button variant="outline" onClick={() => onNavigate("login")}>Volver al Login</Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Recuperar Contraseña" subtitle="Ingresa tu correo electrónico">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Correo electrónico" type="email" placeholder="tu@correo.com"
          value={email} onChange={e => setEmail(e.target.value)} required />
        <Button className="w-full" loading={loading}>Enviar Instrucciones</Button>
      </form>
      <div className="mt-5 text-center text-sm text-slate-400">
        ¿Recordaste tu contraseña? <button onClick={() => onNavigate("login")} className="text-teal-400 hover:text-teal-300 font-medium">Inicia Sesión</button>
      </div>
    </AuthCard>
  );
}
