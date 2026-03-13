import { useApp } from "../context/AppContext";

/**
 * Renders `children` only if the current user has one of the allowed roles.
 * If `fallback` is provided, renders it when access is denied; otherwise renders null.
 *
 * Usage:
 *   <ProtectedSection roles={["admin"]}>
 *     <AdminOnlyComponent />
 *   </ProtectedSection>
 */
export function ProtectedSection({ roles = [], children, fallback = null }) {
  const { state } = useApp();
  if (!state.user) return fallback;
  if (roles.length > 0 && !roles.includes(state.role)) return fallback;
  return children;
}

/**
 * Higher-order component that wraps a page component and blocks
 * access unless the user has one of the specified roles.
 */
export function withRole(roles, Component, FallbackComponent = null) {
  return function RoleGuarded(props) {
    const { state } = useApp();
    if (!state.user || (roles.length > 0 && !roles.includes(state.role))) {
      return FallbackComponent ? <FallbackComponent /> : (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-white font-semibold mb-1">Acceso restringido</h3>
            <p className="text-slate-400 text-sm">No tienes permisos para ver esta sección.</p>
          </div>
        </div>
      );
    }
    return <Component {...props} />;
  };
}
