import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../utils/api";
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
      // Verificar que la respuesta contiene los datos esperados
      if (!data.user || !data.token) {
        throw new Error(data.message || "Respuesta inválida del servidor");
      }
      // El backend no devuelve 'rol', usamos un valor por defecto
      const role = data.user.rol || data.user.rol_usuario || "usuario";
      dispatch({ type: "SET_USER", payload: { user: data.user, token: data.token, role } });
      notify("Bienvenido de nuevo", "success");
    } catch (err) {
      // Mensajes de error personalizados según el tipo de error
      const errorMessage = err.message?.toLowerCase() || "";
      if (errorMessage.includes("invalid credentials") || errorMessage.includes("credenciales")) {
        notify("Correo o contraseña incorrectos. Por favor verifica tus datos.", "error");
      } else if (errorMessage.includes("verify") || errorMessage.includes("verific")) {
        notify("Tu cuenta no está verificada. Revisa tu correo electrónico.", "error");
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
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
        <div className="flex justify-end">
          <button type="button" onClick={() => onNavigate("forgot")}
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <Button type="submit" loading={loading} className="w-full mt-2">Ingresar</Button>
        <p className="text-center text-sm text-slate-400">
          ¿No tienes cuenta?{" "}
          <button type="button" onClick={() => onNavigate("register")} className="text-teal-400 hover:text-teal-300">
            Regístrate
          </button>
        </p>
      </form>
    </AuthCard>
  );
}

export function RegisterPage({ onNavigate }) {
  const { notify } = useApp();
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Nombre requerido";
    if (!form.email.includes("@")) e.email = "Correo inválido";
    if (form.password.length < 8) e.password = "Mínimo 8 caracteres";
    if (form.password !== form.confirm) e.confirm = "Las contraseñas no coinciden";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.register({ nombre: form.nombre, email: form.email, telefono: form.telefono, password: form.password });
      notify("Cuenta creada. Verifica tu correo.", "success");
      onNavigate("login");
    } catch (err) {
      notify(err.message || "Error al registrar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Crear Cuenta" subtitle="Únete a InmoLotes hoy">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre completo" placeholder="Juan Pérez" error={errors.nombre}
          value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        <Input label="Correo electrónico" type="email" placeholder="tu@correo.com" error={errors.email}
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <Input label="Teléfono" type="tel" placeholder="+57 300 000 0000"
          value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
        <Input label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" error={errors.password}
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <Input label="Confirmar contraseña" type="password" placeholder="••••••••" error={errors.confirm}
          value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
        <Button type="submit" loading={loading} className="w-full mt-2">Registrarme</Button>
        <p className="text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <button type="button" onClick={() => onNavigate("login")} className="text-teal-400 hover:text-teal-300">Inicia sesión</button>
        </p>
      </form>
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
      notify("Revisa tu correo para el enlace de recuperación", "success");
    } catch (err) {
      notify(err.message || "Error al enviar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Recuperar Contraseña" subtitle="Te enviaremos un enlace de recuperación">
      {sent ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-4">📧</div>
          <p className="text-slate-300 text-sm mb-6">Hemos enviado un enlace a <strong className="text-white">{email}</strong>. Revisa tu bandeja de entrada.</p>
          <Button variant="outline" onClick={() => onNavigate("login")}>Volver al inicio de sesión</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Correo electrónico" type="email" placeholder="tu@correo.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" loading={loading} className="w-full">Enviar enlace</Button>
          <p className="text-center text-sm text-slate-400">
            <button type="button" onClick={() => onNavigate("login")} className="text-teal-400 hover:text-teal-300">← Volver</button>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
