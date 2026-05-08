import type { Product, TarotCard, Guardian } from '../types'
import type { CauaRole, RoleConfig } from '../types/fund.types'

export const ROLE_CONFIG: Record<CauaRole, RoleConfig> = {
  investor: {
    label: 'Investor',  labelEs: 'Inversor',
    icon: '💼', color: '#00A3CD',
    desc: 'Angel capital + returns',   descEs: 'Capital ángel + retornos',
    minUsd: 1000, discount: 0.5, canPost: false, canVend: false, isSuperAdmin: false,
  },
  founder: {
    label: 'Founder',   labelEs: 'Fundador',
    icon: '⚡', color: '#F7F1EE',
    desc: 'Core team + equity',        descEs: 'Equipo fundador + equity',
    minUsd: 0, discount: 0, canPost: true, canVend: true, isSuperAdmin: true,
  },
  creyente: {
    label: 'Believer',  labelEs: 'Creyente',
    icon: '🌱', color: '#91A63B',
    desc: 'Community early adopter',   descEs: 'Early adopter comunitario',
    minUsd: 20, discount: 0.15, canPost: false, canVend: false, isSuperAdmin: false,
  },
  nativo: {
    label: 'Native',    labelEs: 'Nativo',
    icon: '🌿', color: '#8D2679',
    desc: 'Heritage guardian',         descEs: 'Guardián del territorio',
    minUsd: 10, discount: 0.25, canPost: false, canVend: false, isSuperAdmin: false,
  },
  farmer: {
    label: 'Farmer',    labelEs: 'Guardián',
    icon: '🫘', color: '#DB5527',
    desc: 'Supplies fresh mucilage',   descEs: 'Proveedor de mucílago fresco',
    minUsd: 0, discount: 0, canPost: true, canVend: true, isSuperAdmin: false,
  },
}

/**
 * Precio único de adopción por árbol (USD).
 * Al pagar via Coinbase onramp, el monto se deploya inmediatamente en el
 * esquema 60/30/10 — no retenemos fondos en custodia.
 *
 * USD 5 alineado al cap por-tx del sandbox Coinbase CDP (USD 5 × 25 tx)
 * para que onramp → adopción sea una sola operación monetaria.
 */
export const TREE_ADOPTION_PRICE_USD = 5

export const BRAND = {
  heirloom:   '#F7F1EE',
  amazon:     '#1C3B26',
  pod:        '#91A63B',
  mazorca:    '#F1A91E',
  criollo:    '#8D2679',
  theobroma:  '#DB5527',
  muisca:     '#004E64',
  brown:      '#583915',
  heroic:     '#00A3CD',
  bgDeep:     '#040C06',
  bgDark:     '#0F2218',
  bgCard:     '#132B1C',
  // Extended palette
  leafy:      '#667039',
  radioRed:   '#8C201D',
  santaMaria: '#583915',
} as const

/** Typography stack — mirrors brand guidelines */
export const FONTS = {
  display: "'Barlow Condensed', Impact, sans-serif",
  body:    "'DM Sans', system-ui, -apple-system, sans-serif",
  serif:   "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
} as const

export const PRODUCTS: Product[] = [
  { id: 1, name: 'SUNRISE SOCIAL TONIC',  desc: 'Mucílago 20% · Epicatequina · Teobromina · Ritual matutino',      price:  600, type: 'preorder',      stock: 100, img: '🌅' },
  { id: 2, name: 'SUNSET SOCIAL TONIC',   desc: 'Mucílago 40% · Doble concentración · Adaptógeno vespertino',      price: 1000, type: 'preorder',      stock: 75,  img: '🌇' },
  { id: 3, name: 'CACAO CEREMONIAL',       desc: 'Fine-flavor criollo · Huila · 250g bloque puro',                 price: 3500, type: 'auction',       stock: 50,  timer: 172800, img: '🫘' },
  { id: 4, name: 'EDICIÓN GUARDIÁN',       desc: 'Kit numerado · 5 orígenes · Colección limitada',                 price: 8500, type: 'auction',       stock: 12,  timer: 259200, img: '🏛️' },
  { id: 5, name: 'CÍRCULO SUMAPAZ',        desc: 'Suscripción mensual · Cacao + Ritual + Comunidad',               price: 4500, type: 'subscription',  stock: 999, img: '🌿' },
  { id: 6, name: 'MIDNIGHT COLD BREW',     desc: 'Fermentado en frío 72h · Probióticos nativos · Teobromina',      price: 1200, type: 'preorder',      stock: 60,  img: '☕️' },
  { id: 7, name: 'HIDROSOL DE CACAO',      desc: 'Agua floral destilada · 500mL · Uso cosmético + alimentario',   price: 3500, type: 'preorder',      stock: 80,  img: '💧' },
  { id: 8, name: 'ACEITE ESENCIAL CACAO',  desc: 'Aceite esencial puro · 5mL · Aromaterapia · IaaS B2B',          price:  500, type: 'preorder',      stock: 200, img: '🌿' },
]

export const TAROT_CARDS: TarotCard[] = [
  { id: 0,  name: 'LA SEMILLA',          meaning: 'Nuevo comienzo. El cacao que aún no germina guarda todo el potencial del bosque.',          advice: 'Planta una intención hoy. No la juzgues, solo siémbrala.',                                           element: 'Tierra' },
  { id: 1,  name: 'EL CACAOTIER',        meaning: 'Dominio del oficio. Tus manos ya conocen el camino — confía en tu proceso.',                 advice: 'Dedica 30 minutos a tu craft sin distracción. La maestría es repetición consciente.',               element: 'Fuego'  },
  { id: 2,  name: 'LA GUARDIANA',        meaning: 'Sabiduría ancestral susurra. Escucha lo que ya sabes pero has olvidado.',                    advice: 'Siéntate en silencio con una taza de cacao. La respuesta ya está en ti.',                           element: 'Agua'   },
  { id: 3,  name: 'LA MADRE TIERRA',     meaning: 'Abundancia que nutre. Todo lo que necesitas ya crece a tu alrededor.',                       advice: 'Camina descalzo. Toca la tierra. Agradece lo que tienes antes de pedir más.',                       element: 'Tierra' },
  { id: 4,  name: 'EL ANCESTRO',         meaning: 'Estructura y tradición. Los que vinieron antes dejaron el mapa.',                            advice: 'Honra una tradición familiar hoy. Cocina algo que te conecte con tu origen.',                       element: 'Fuego'  },
  { id: 5,  name: 'EL PENTÁMERO',        meaning: 'Los cinco guardianes. La comunidad es tu fuerza — ninguna flor poliniza sola.',              advice: 'Contacta a 5 personas importantes en tu vida. Sé el guardián de alguien hoy.',                     element: 'Aire'   },
  { id: 6,  name: 'LA POLINIZACIÓN',     meaning: 'Conexión profunda. Dos mundos se encuentran y crean algo nuevo.',                            advice: 'Busca una colaboración inesperada. La magia está en el cruce.',                                   element: 'Aire'   },
  { id: 7,  name: 'EL CARRO DE COSECHA', meaning: 'Victoria por acción. Muévete con determinación — el fruto ya está maduro.',                  advice: 'Toma una decisión que has estado postergando. El momento es ahora.',                              element: 'Fuego'  },
  { id: 8,  name: 'LA FERMENTACIÓN',     meaning: 'Fuerza en la quietud. Lo que parece caos interno es transformación.',                        advice: 'Abraza la incomodidad. El cacao más fino pasa por la fermentación más intensa.',                   element: 'Agua'   },
  { id: 9,  name: 'EL ERMITAÑO DEL PÁRAMO', meaning: 'Soledad necesaria. Sube al páramo interior — la claridad vive en la altura.',            advice: 'Retírate del ruido por una hora. Medita. Escribe. Solo tú y el silencio.',                        element: 'Tierra' },
  { id: 10, name: 'LA MAZORCA',          meaning: 'Ciclos y abundancia. Lo que sembraste está volviendo — recíbelo.',                           advice: 'Celebra un logro reciente. La gratitud amplifica la abundancia.',                                  element: 'Tierra' },
  { id: 11, name: 'EL EQUILIBRIO',       meaning: 'Justicia natural. El bosque siempre se regula — tú también puedes.',                         advice: 'Revisa dónde estás dando de más y recibiendo de menos. Ajusta.',                                  element: 'Aire'   },
  { id: 12, name: 'LA LIOFILIZACIÓN',    meaning: 'Pausa sagrada. A veces hay que congelar para preservar lo esencial.',                        advice: 'Pausa un proyecto. Consérvalo. No todo necesita avanzar al mismo tiempo.',                        element: 'Agua'   },
  { id: 13, name: 'LA TRANSFORMACIÓN',   meaning: 'Muerte del viejo proceso. Lo que ya no sirve se composta para nutrir lo nuevo.',             advice: 'Suelta algo hoy: una creencia, un hábito, una relación que ya cumplió su ciclo.',                 element: 'Agua'   },
  { id: 14, name: 'LA DESTILACIÓN',      meaning: 'Paciencia alquímica. Gota a gota, la esencia se revela.',                                   advice: 'Reduce. Simplifica. ¿Cuál es la esencia de lo que intentas comunicar?',                           element: 'Fuego'  },
  { id: 15, name: 'EL THEOBROMA',        meaning: 'Alimento de dioses. Lo divino habita en lo terrenal — busca lo sagrado en lo cotidiano.',   advice: 'Prepara cacao ceremonial. Bébelo con intención. Ofrece una porción a alguien.',                  element: 'Fuego'  },
  { id: 16, name: 'LA TORMENTA',         meaning: 'Destrucción creativa. El rayo que cae fertiliza el suelo.',                                  advice: 'No temas el conflicto de hoy. Está limpiando el camino.',                                        element: 'Aire'   },
  { id: 17, name: 'THEOBROMA ESTELAR',   meaning: 'Esperanza cósmica. El cacao conecta la tierra con las estrellas.',                          advice: 'Sueña en grande hoy. Escribe tu visión más ambiciosa sin filtro.',                               element: 'Agua'   },
  { id: 18, name: 'LA LUNA DE COSECHA',  meaning: 'Ilusiones y sombras. No todo lo que brilla en la noche es verdad.',                         advice: 'Cuestiona una certeza. ¿Y si lo que crees saber es solo la cáscara?',                            element: 'Agua'   },
  { id: 19, name: 'EL SOL DEL TRÓPICO', meaning: 'Alegría radiante. La energía solar del cacao te llena de vitalidad.',                        advice: 'Sal al sol. Mueve el cuerpo. Ríe. La salud empieza con la alegría.',                             element: 'Fuego'  },
  { id: 20, name: 'EL DESPERTAR',        meaning: 'Juicio y renacimiento. Lo que estaba dormido despierta con fuerza.',                         advice: 'Es momento de actuar sobre esa idea que has guardado. El mundo la necesita.',                    element: 'Aire'   },
  { id: 21, name: 'LA COSECHA',          meaning: 'Plenitud total. El ciclo se completa. Todo el fruto ha sido aprovechado.',                   advice: 'Celebra. Comparte. El éxito verdadero es el que se redistribuye.',                               element: 'Tierra' },
]

export const GUARDIANS: Guardian[] = [
  {
    name: 'Lucho',
    region: 'Huila', town: 'Hobo',
    power: 'Mucílago Cítrico · Cremosidad · Agroforestería',
    varieties: ['Híbrido Acriollado'],
    companions: ['Plátano Dominico', 'Cedro Rosado', 'Guanábana'],
    character: 'El Maestro de la Sombra. Tercera generación de cacaocultores en el Huila. Lucho domina el arte del secado solar y la fermentación en cajones de madera. Su finca en Hobo es la más grande del colectivo — 4 ha de cacao bajo dosel de cedros.',
    emoji: '🌳',
    variety_benefit: 'Híbrido Acriollado — ideal para licor de cacao 100% por su potencial funcional y cremosidad. Su mucílago cítrico es perfecto para bebidas funcionales, hidrosoles y perfumes artesanales.',
    territory: 'El Huila como territorio es el beneficio. Altitud, microclima y tres generaciones de saber campesino hacen de este cacao un producto de origen irreplicable.',
    market_uses: ['Licor de Cacao 100%', 'Bebidas de Mucílago', 'Hidrosoles', 'Perfumería Artesanal', 'Chocolatería Funcional'],
    pods: '🟡 Vainas amarillas · interior cremoso',
    heritage: 'Agroforestería regenerativa en la línea del Ecuador — Fine-Flavor garantizado.',
    blogSlug: 'fermentaciones-huila-lucho',
  },
  {
    name: 'Marta',
    region: 'Arauca', town: 'Saravena',
    power: 'Fine-Flavor Floral · Modelo Araucano · Criollo Élite',
    varieties: ['Criollo Élite'],
    companions: ['Plátano Hartón', 'Mango Tommy', 'Aguacate Hass'],
    character: 'La Alquimista del Llano. Reconocida con el Modelo Araucano desde 2011. La sabana inundable del Arauca le da a su cacao un perfil floral único, con notas de maracuyá y flor blanca.',
    emoji: '🌸',
    variety_benefit: 'Criollo Élite — el 1% del cacao mundial. Ideal para barras de autor 100%, liofilizados y chocolatería funcional con notas florales y frutales únicas de la sabana araucana.',
    territory: 'Reconocida con el Modelo Araucano desde 2011. Variedades: Saravena 12 (mazorca verde), FEAR5 Arauquita (mazorca naranja) y Tame 2 (amarillo pequeño) — tipificadas y certificadas.',
    market_uses: ['Barras de Autor 100%', 'Liofilizados Premium', 'Chocolatería Funcional', 'Fine-Flavor Export'],
    pods: '🟢 Saravena 12 (verde) · 🟠 FEAR5 (naranja) · 🟡 Tame 2 (amarillo)',
    heritage: 'Modelo Araucano 2011 · FEAR5 · Saravena 12 · Tame 2 — variedades únicas en Colombia.',
    blogSlug: 'guardiana-marta-arauca',
  },
  {
    name: 'Rafael',
    region: 'Cundinamarca', town: 'Arbeláez',
    power: 'Polifenoles Diméricos · Cacao Altitudinal · Dulzor del Páramo',
    varieties: ['Criollo Élite'],
    companions: ['Plátano Dominico', 'Mango Tommy Técnico', 'Guayabo'],
    character: 'El Ingeniero del Sabor. Su cacao altitudinal capta los vientos del Magdalena y el páramo del Sumapaz, generando dulzor en el mucílago y un amargor fino por los polifenoles diméricos.',
    emoji: '🥭',
    variety_benefit: 'Criollo Élite altitudinal — amargor muy suave y fino por los polifenoles diméricos. Los vientos del Magdalena y el Sumapaz condensan dulzor en el mucílago. Ideal para barras de autor y chocolatería premium.',
    territory: 'Los vientos del río Magdalena que se condensan con los del páramo de Sumapaz generan un microclima único que produce dulzor natural en el mucílago y amargor fino. Variedades: FEAR5, Saravena 12, San Vicente 41 (morado-rojo), Bolívar 1, Gigante 4.',
    market_uses: ['Barras de Autor 100%', 'Chocolatería Premium', 'Polifenoles Funcionales', 'Fine-Flavor Altitudinal'],
    pods: '🟣 San Vicente 41 (morado-rojo) · 🟠 FEAR5 · 🟢 Saravena 12 · 🟡 Bolívar 1 · Gigante 4',
    heritage: 'Cacao altitudinal del Sumapaz — polifenoles diméricos premium para salud cardiovascular.',
    blogSlug: 'guardian-rafael-sumapaz',
  },
  {
    name: 'Fernando',
    region: 'Meta', town: 'Guamal',
    power: 'Medalla de Oro 2024 · Fine-Flavor Frutal · FEAR5 Élite',
    varieties: ['Criollo Élite'],
    companions: ['Plátano Hartón', 'Nogal Cafetero', 'Guamo'],
    character: 'El Explorador del Piedemonte. Su microclima en Guamal produce cacaos con perfil frutal único, casi vinoso. Medalla de Oro en Cacao de Excelencia 2024 con FEAR5 y San Vicente 41.',
    emoji: '🍇',
    variety_benefit: 'Criollo Élite premiado — Medalla de Oro 2024 (Cacao de Excelencia) con sus variedades FEAR5 y San Vicente 41. Ideal para barras de autor y liofilizados con notas frutales, vinosas y especiadas únicas.',
    territory: 'En la transición entre los Andes y el llano, el microclima del piedemonte meta produce los cacaos más expresivos del colectivo. Apoyo técnico de Fedecacao y Agrosavia. Variedades: FEAR5 + San Vicente 41 — los protagonistas del Criollo Élite en Colombia.',
    market_uses: ['Barras de Autor Premiadas', 'Liofilizados Gourmet', 'Fine-Flavor Export', 'Cacao de Excelencia'],
    pods: '🟠 FEAR5 (naranja) · 🟣 San Vicente 41 (morado) — variedades galardonadas',
    heritage: '🥇 Medalla de Oro · Cacao de Excelencia 2024 — el cacao criollo élite más premiado de Colombia.',
    blogSlug: 'guardian-fernando-meta-oro',
  },
  {
    name: 'Ricardo',
    region: 'Santander', town: 'Landázuri',
    power: 'Trinitario Robusto · Tradición Santandereana · Trazabilidad',
    varieties: ['Trinitario'],
    companions: ['Plátano Dominico', 'Caucho', 'Cedro Negro'],
    character: 'El Certificador. Ricardo une las fincas atomizadas en la montaña santandereana de Landázuri. Tradición cacaotera de Santander con trazabilidad lote a lote y cadena de frío.',
    emoji: '⚗️',
    variety_benefit: 'Trinitario — rendimiento y buen chocolate comercial con sabor a cacao profundo. Ideal para bombones, chocolatinas y tabletas de 70% hacia abajo. El Trinitario santandereano da robustez chocolatosa con acidez controlada.',
    territory: 'La tradición cacaotera de Santander concentrada en las fincas atomizadas de la montaña de Landázuri. Asociaciones entre productores, centro de acopio con cuartos de frío y laboratorio de Brix.',
    market_uses: ['Bombones y Chocolatinas', 'Tabletas 70%', 'Chocolate Comercial Premium', 'Coberturas Gourmet'],
    pods: '🟤 Vainas trinitarias robustas — perfil chocolatoso profundo',
    heritage: 'Tradición cacaotera santandereana — el Trinitario de Landázuri, unión de fincas de montaña.',
    blogSlug: 'guardian-ricardo-santander',
  },
]

export const TAROT_EMOJIS = [
  '🌱','✨','🌙','🔥','🌳','🌸','🦋','⚡','🫧','🏔️',
  '🌽','⚖️','❄️','🍂','🧪','☀️','🌩️','⭐','🌘','🌞','🌅','🌾',
]

export const ELEMENT_COLORS: Record<string, string> = {
  Tierra: '#91A63B',
  Fuego:  '#DB5527',
  Agua:   '#004E64',
  Aire:   '#00A3CD',
}

/**
 * Public Ethereum deposit addresses for receiving direct ETH from investors.
 * Custody differs per wallet — surfaced in the UI selector so investors know
 * exactly which platform receives the deposit.
 *
 * 🚨 CRITICAL UX RULE: These wallets accept **ETH on Ethereum mainnet ONLY**.
 * - USDC, USDT, MATIC, or ETH on Polygon/Base/Arbitrum sent here = PERMANENT LOSS.
 * - Neither Bitso nor Coinbase recover misdirected deposits to wrong network/asset.
 * - Always render the warning banner alongside these addresses.
 *
 * Private keys live in the respective custody platforms, never in this repo.
 */
export const INVESTOR_WALLETS = {
  cto: {
    name: 'Amaury Amed',
    role: 'CTO',
    eth:  '0x7Ca1624e534ebE18F46BBA56229981134945464e',
    network: 'Ethereum mainnet',
    custody: 'Bitso',
  },
  ceo: {
    name: 'David Montoya',
    role: 'CEO',
    eth:  '0x7E9E25cFfc8BC68Fb9E1f4708e761C68a37a846A',
    network: 'Ethereum mainnet',
    custody: 'Coinbase',
  },
} as const

export const INVESTOR_PACKAGES = {
  equity_5k: {
    label:   'Pre-Seed Equity',
    labelEs: 'Equity Pre-Semilla',
    amount_usd: 5000,
    desc:    'Premium equity tier — first round investors. Subject to subscription agreement.',
    descEs:  'Equity premium tier — primeros investors. Sujeto a acuerdo de suscripción.',
  },
  b2b_sponsorship: {
    label:   'B2B Sponsorship',
    labelEs: 'Patrocinio B2B',
    amount_usd: 0, // variable — investor sets amount
    desc:    'Direct funding of technology, lots, batches, and tastings. B2B integration.',
    descEs:  'Financiación directa de tecnología, lotes, baches y cataciones. Integración B2B.',
  },
} as const

export type InvestorPackageKind = keyof typeof INVESTOR_PACKAGES

export const TOKEN_RATES = {
  ritual_draw: { beans: 0.5, mazorcas: 0 },
  streak_7: { beans: 3.5, mazorcas: 1 },
  streak_30: { beans: 15, mazorcas: 5 },
  purchase_per_usd: { beans: 2, mazorcas: 0 },
  lot_per_lot: { beans: 5, mazorcas: 2 },
  blog_read: { beans: 0.2, mazorcas: 0 },
  blog_share: { beans: 1, mazorcas: 0 },
  referral: { beans: 10, mazorcas: 3 },
  tree_adoption: { beans: 10, mazorcas: 3 },
  tree_update_read: { beans: 0.5, mazorcas: 0 },
  // Base flat rate (instant-harvest skip path). The Fruit-Ninja minigame
  // path adds per-pod resources via per_pod_mucilage_g + per_pod_cacao_mass_g.
  tree_harvest_share: {
    beans: 5,
    mazorcas: 2,
    per_pod_mucilage_g: 60,
    per_pod_cacao_mass_g: 50,
    /** Combo bonus when all pods are sliced within COMBO_WINDOW_MS. */
    combo_bonus_pct: 20,
  },
  // Phase 2.5 — Labranza machete regenerative bonus (granos for the labor of
  // composting dead biomass back into the soil).
  tree_compost_regen: { beans: 10, mazorcas: 0 },
  // Phase 3+4 — chocolate-making consumes resources; the cost spec lives here
  // so /lab and the Edge Function agree on the recipe.
  chocolate_made: { mucilage_g: 300, cacao_mass_g: 250 },
}

/** Window (ms) in which the player must slice all pods to earn combo bonus. */
export const HARVEST_COMBO_WINDOW_MS = 6000

/** How often a tree can be harvested. Phase 1.5 — recurring, not one-time. */
export const HARVEST_INTERVAL_HOURS = 5

/** Below this %, a single vital qualifies the tree as "in danger" (orange
 *  banner copy in CauaGotchi/Dashboard). Death is server-side (cron sees
 *  vitals_critical_since > VITAL_GRACE_HOURS). */
export const VITAL_THRESHOLD = 30
export const VITAL_GRACE_HOURS = 24

// ─── Web3 constants ────────────────────────────────────────────────────────
// See docs/WEB3.md, docs/COMPLIANCE.md, docs/CHARTER.md.

/** Base mainnet (EIP-155). Multi-chain expansion requires Charter amendment. */
export const BASE_CHAIN_ID = 8453
export const BASE_SEPOLIA_CHAIN_ID = 84532

/** Default RPC. User-configurable via VITE_BASE_RPC_URL for paid tiers. */
export const BASE_RPC =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_BASE_RPC_URL) ||
  'https://mainnet.base.org'

/** Sanctioned jurisdictions — geo-block enforcement layer. See docs/COMPLIANCE.md. */
export const GEO_BLOCKED_COUNTRIES = [
  'IR', // Iran
  'KP', // North Korea
  'CU', // Cuba
  'SY', // Syria
  'RU', // Russia (sectoral)
  'BY', // Belarus (sectoral)
  'MM', // Myanmar (sectoral)
] as const

export type GeoBlockedCountry = typeof GEO_BLOCKED_COUNTRIES[number]

/** KYC tiers — see docs/KYC.md. Lifetime caps in USD. */
export const KYC_TIERS = {
  0: { label: 'Anonymous',  cap_usd: 0,        actions: ['browse'] },
  1: { label: 'Basic',      cap_usd: 1_000,    actions: ['browse','mint','redeem'] },
  2: { label: 'Enhanced',   cap_usd: 10_000,   actions: ['browse','mint','redeem','adopt_crypto'] },
  3: { label: 'Investor',   cap_usd: Infinity, actions: ['browse','mint','redeem','adopt_crypto','equity'] },
} as const

export type KycTier = keyof typeof KYC_TIERS

/** Minimum tier required for each gated action. */
export const KYC_TIER_REQUIREMENTS = {
  mint:         1,
  redeem:       1,
  adopt_crypto: 2,
  equity:       3,
} as const

export type GatedAction = keyof typeof KYC_TIER_REQUIREMENTS

/**
 * Smart contract addresses — Base Sepolia (chain 84532) deployment, 2026-04-28.
 * Source of truth: memory/project_web3_sepolia_deploy.md.
 *
 * Mainnet (chain 8453) deployment requires fresh wallets + Safe multisig + audit
 * (Phase 7). Until then these stay Sepolia-only and Web3 features run on testnet.
 */
export const WEB3_CONTRACTS = {
  cacaoTreeNFT:       '0xf5f2dE2237334680fC74cFD1dbCFaF5E5285ad23' as `0x${string}`,
  cacaoToken:         '0x8f5f9d696F8004b7d77c915c70569eec3234D7E1' as `0x${string}`,
  mazorcaRedemption:  '0x9Aa80f33067316De88757ff8c21660f5672644e6' as `0x${string}`,
  treeAdoption:       '0x1c6724cdfe8906ae5a2042c431169b6987755711' as `0x${string}`,
  iotAttestation:     '0x0077649ed45ce82225b3a3d5a364a4f804007e53' as `0x${string}`,
} as const

/** Active chain for Web3 user actions (mint, burn, adopt). Switch to BASE_CHAIN_ID post-audit. */
export const ACTIVE_CHAIN_ID = BASE_SEPOLIA_CHAIN_ID

/** SIWE message domain — must match `expectedDomain` in siwe-link-wallet Edge Function. */
export const SIWE_DOMAIN = 'cacaofrutabrutal.com'

/**
 * Mazorca → $CACAO redemption rate. Server-side default; on-chain is authoritative
 * (`MazorcaRedemption.mazorcasPerToken`). Update both when re-tuning game economy.
 */
export const MAZORCA_TO_CACAO_RATE = 1000

/** Server signs EIP-712 payloads with this 7-day deadline by default. */
export const REDEMPTION_DEADLINE_SECONDS = 7 * 24 * 60 * 60

/** $CACAO ERC-20 has 18 decimals (Bitcoin homage cap, not equivalence). */
export const CACAO_DECIMALS = 18
export const CACAO_TOTAL_SUPPLY_CAP = 21_000_000n

/** EIP-712 domain — must match `MazorcaRedemption.sol` constructor + sign-mazorca-burn. */
export const MAZORCA_REDEMPTION_DOMAIN = {
  name: 'CauaMazorcaRedemption',
  version: '1',
} as const

export const MAZORCA_REDEMPTION_TYPES = {
  MazorcaBurn: [
    { name: 'user',         type: 'address' },
    { name: 'mazorcaCount', type: 'uint256' },
    { name: 'nonce',        type: 'bytes32' },
    { name: 'deadline',     type: 'uint256' },
  ],
} as const

/**
 * Whitelisted ERC-20 assets accepted by `TreeAdoption.sol`. Addresses are
 * Base mainnet canonical contracts. Sepolia uses different addresses (set
 * via VITE_BASE_USDC etc env if needed for testing).
 */
export const BASE_ERC20 = {
  USDC:  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as const, // Base mainnet USDC
  cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as const, // Coinbase Wrapped BTC
} as const

/** Pseudo-address for native ETH in price/asset mappings. Mirrors TreeAdoption.sol. */
export const ETH_PSEUDO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

/**
 * Revenue split — hardcoded in TreeAdoption.sol per Charter principle I.1.
 * Replicated here for UI display only.
 */
export const ADOPTION_SPLIT_BPS = {
  guardian: 6000,
  treasury: 3000,
  protocol: 1000,
  total: 10000,
} as const

/**
 * IoT epoch-week index. Mirrors `compute_week_index(ts)` in migration 032
 * and `week_index(unix_ts)` in api/iot_verify.py. Used by IoTAttestation.
 */
export const IOT_WEEK_SECONDS = 604_800
export function iotWeekIndex(unixTs: number): number {
  return Math.floor(unixTs / IOT_WEEK_SECONDS)
}
