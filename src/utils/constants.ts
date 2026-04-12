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
  { name: 'Lucho',           region: 'Huila',    power: 'Escala + Complejidad Aromática',    heritage: 'Campesina'              },
  { name: 'Familia Masmela', region: 'Arauca',   power: 'Floral Premium / Miel',             heritage: 'Indígena + Campesina'   },
  { name: 'Rafael',          region: 'Arbeláez', power: 'Polifenoles + Estabilidad',         heritage: 'Campesina'              },
  { name: 'Coy',             region: 'Meta',     power: 'Fruity / Wine-like',                heritage: 'Indígena'               },
  { name: 'Ricardo',         region: 'Santander',power: 'Procesamiento + Cadena de Frío',    heritage: 'Campesina'              },
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

export const TOKEN_RATES = {
  ritual_draw: { beans: 0.5, mazorcas: 0 },
  streak_7: { beans: 3.5, mazorcas: 1 },
  streak_30: { beans: 15, mazorcas: 5 },
  purchase_per_usd: { beans: 2, mazorcas: 0 },
  lot_per_lot: { beans: 5, mazorcas: 2 },
  blog_read: { beans: 0.2, mazorcas: 0 },
  blog_share: { beans: 1, mazorcas: 0 },
  referral: { beans: 10, mazorcas: 3 },
}
