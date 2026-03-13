import { Badge, Card, PageHeader } from "../ui";

const ETAPAS = [
  {
    key: "Lanzamiento",
    icon: "🚀",
    color: "from-sky-600/20 to-sky-800/10 border-sky-700/30",
    accent: "text-sky-400",
    desc: "El proyecto se presenta oficialmente al mercado. Se definen los lotes disponibles, precios iniciales y condiciones de preventa.",
    puntos: ["Presentación oficial del proyecto", "Registro de interesados", "Definición de tipologías", "Precios de lanzamiento"],
  },
  {
    key: "Preventa",
    icon: "📋",
    color: "from-violet-600/20 to-violet-800/10 border-violet-700/30",
    accent: "text-violet-400",
    desc: "Fase de comercialización anticipada donde los clientes pueden reservar y comprar lotes con condiciones especiales.",
    puntos: ["Descuentos exclusivos de preventa", "Separación de lotes disponibles", "Firma de promesas de compraventa", "Planes de financiación personalizados"],
  },
  {
    key: "Construcción",
    icon: "🏗️",
    color: "from-amber-600/20 to-amber-800/10 border-amber-700/30",
    accent: "text-amber-400",
    desc: "Inicio de obras e infraestructura. Se desarrollan las vías internas, redes de servicios públicos y urbanismo.",
    puntos: ["Preparación del terreno", "Instalación de servicios públicos", "Construcción de vías internas", "Supervisión técnica y legal"],
  },
  {
    key: "Entrega",
    icon: "🏡",
    color: "from-emerald-600/20 to-emerald-800/10 border-emerald-700/30",
    accent: "text-emerald-400",
    desc: "Entrega formal de los lotes a los propietarios con escrituración y entrega de planos habitacionales gratuitos.",
    puntos: ["Escrituración ante notaría", "Entrega física del lote", "Planos habitacionales gratuitos", "Bienvenida a la comunidad"],
  },
];

const PLANOS = [
  { id: 1, nombre: "Plano Casa Tipo A", area: "90 m²", hab: 3, desc: "Diseño familiar con 3 habitaciones y sala-comedor integrado.", file: "#" },
  { id: 2, nombre: "Plano Casa Tipo B", area: "120 m²", hab: 4, desc: "Vivienda espaciosa con jardín trasero y garaje cubierto.", file: "#" },
  { id: 3, nombre: "Plano Loft Moderno", area: "70 m²", hab: 2, desc: "Concepto abierto ideal para parejas o inversionistas.", file: "#" },
  { id: 4, nombre: "Plano Casa Esquinera", area: "150 m²", hab: 4, desc: "Máximo aprovechamiento de lote esquinero con doble fachada.", file: "#" },
];

export function InformacionProyecto() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Proyecto Habitacional" subtitle="Conoce las etapas y beneficios del proyecto InmoLotes" />

      {/* Hero */}
      <div className="relative mb-10 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-900/40 to-slate-900 border border-teal-800/30 p-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,#14b8a6,transparent)]" />
        <div className="relative">
          <Badge variant="success" className="mb-4">Proyecto Activo</Badge>
          <h2 className="text-3xl font-bold text-white mb-3">InmoLotes — Vive donde sueñas</h2>
          <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
            Lotes de terreno entre <strong className="text-teal-400">100 y 200 m²</strong> destinados a construcción de vivienda. Cada lote incluye modelos de planos habitacionales de forma completamente gratuita.
          </p>
          <div className="flex gap-6 mt-6">
            {[["100–200 m²", "Por lote"], ["4 Etapas", "Del proyecto"], ["Planos gratis", "Con tu compra"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-xl font-bold text-teal-400">{val}</p>
                <p className="text-xs text-slate-400">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Etapas */}
      <h2 className="text-lg font-bold text-white mb-4">Etapas del Proyecto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {ETAPAS.map((etapa, i) => (
          <div key={etapa.key} className={`bg-gradient-to-br ${etapa.color} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{etapa.icon}</span>
              <div>
                <span className={`text-xs font-bold ${etapa.accent} uppercase tracking-wider`}>Etapa {i + 1}</span>
                <h3 className="text-white font-bold text-lg leading-none">{etapa.key}</h3>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">{etapa.desc}</p>
            <ul className="space-y-1.5">
              {etapa.puntos.map(p => (
                <li key={p} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${etapa.accent} shrink-0`} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Planos */}
      <h2 className="text-lg font-bold text-white mb-2">Modelos de Planos Habitacionales</h2>
      <p className="text-slate-400 text-sm mb-6">Incluidos sin costo con la compra de tu lote. Descarga y personaliza el diseño que más se adapte a tu familia.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANOS.map(plano => (
          <Card key={plano.id} className="p-5 hover:border-teal-700/50 transition-all">
            <div className="w-full h-28 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl mb-4 flex items-center justify-center text-4xl">
              🏠
            </div>
            <h4 className="text-white font-bold text-sm mb-1">{plano.nombre}</h4>
            <div className="flex gap-2 mb-2">
              <Badge variant="info">{plano.area}</Badge>
              <Badge variant="default">{plano.hab} hab.</Badge>
            </div>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">{plano.desc}</p>
            <a href={plano.file}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-teal-700/30 hover:bg-teal-700/50 text-teal-400 text-sm font-semibold rounded-xl border border-teal-700/30 transition-all">
              ⬇ Descargar Plano
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
