import { createContext, useContext, useReducer, useEffect } from "react";

const AppContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  role: null, // 'admin' | 'cliente'
  lotes: [],
  compras: [],
  pagos: [],
  pqrs: [],
  loading: false,
  notification: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload.user, token: action.payload.token, role: action.payload.role };
    case "LOGOUT":
      return { ...initialState };
    case "SET_LOTES":
      return { ...state, lotes: action.payload };
    case "ADD_LOTE":
      return { ...state, lotes: [...state.lotes, action.payload] };
    case "UPDATE_LOTE":
      return { ...state, lotes: state.lotes.map(l => l.id === action.payload.id ? action.payload : l) };
    case "DELETE_LOTE":
      return { ...state, lotes: state.lotes.filter(l => l.id !== action.payload) };
    case "SET_COMPRAS":
      return { ...state, compras: action.payload };
    case "ADD_COMPRA":
      return { ...state, compras: [...state.compras, action.payload] };
    case "SET_PAGOS":
      return { ...state, pagos: action.payload };
    case "ADD_PAGO": {
      const newPagos = [...state.pagos, action.payload];
      // Recalculate saldo pendiente for affected compra
      const updatedCompras = state.compras.map(c => {
        if (c.id === action.payload.compra_id) {
          const pagosCompra = newPagos.filter(p => p.compra_id === c.id);
          const totalPagado = pagosCompra.reduce((sum, p) => sum + Number(p.monto), 0);
          return { ...c, saldo_pendiente: Number(c.valor_total) - totalPagado };
        }
        return c;
      });
      return { ...state, pagos: newPagos, compras: updatedCompras };
    }
    case "SET_PQRS":
      return { ...state, pqrs: action.payload };
    case "ADD_PQRS":
      return { ...state, pqrs: [...state.pqrs, action.payload] };
    case "UPDATE_PQRS":
      return { ...state, pqrs: state.pqrs.map(p => p.id === action.payload.id ? action.payload : p) };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_NOTIFICATION":
      return { ...state, notification: action.payload };
    case "CLEAR_NOTIFICATION":
      return { ...state, notification: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (init) => {
    const saved = localStorage.getItem("inmolotes_session");
    if (saved) {
      try {
        const { user, token, role } = JSON.parse(saved);
        return { ...init, user, token, role };
      } catch { return init; }
    }
    return init;
  });

  useEffect(() => {
    if (state.user) {
      localStorage.setItem("inmolotes_session", JSON.stringify({
        user: state.user, token: state.token, role: state.role
      }));
    } else {
      localStorage.removeItem("inmolotes_session");
    }
  }, [state.user, state.token, state.role]);

  const notify = (message, type = "success") => {
    dispatch({ type: "SET_NOTIFICATION", payload: { message, type } });
    setTimeout(() => dispatch({ type: "CLEAR_NOTIFICATION" }), 4000);
  };

  return (
    <AppContext.Provider value={{ state, dispatch, notify }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
