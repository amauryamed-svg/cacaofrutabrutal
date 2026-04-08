import type { Lang } from '../context/LangContext'

const translations = {
  // ── NavBar ─────────────────────────────────────────────────────────────────
  nav_home:      { es: 'INICIO',   en: 'HOME'   },
  nav_market:    { es: 'MERCADO',  en: 'MARKET' },
  nav_ritual:    { es: 'RITUAL',   en: 'RITUAL' },
  nav_impact:    { es: 'IMPACTO',  en: 'IMPACT' },
  nav_enter:     { es: 'ENTRAR',   en: 'SIGN IN' },
  nav_exit:      { es: 'Salir',    en: 'Sign out' },

  // ── Landing ────────────────────────────────────────────────────────────────
  land_eyebrow:  { es: 'AgriFoodTech · Biotecnología Ancestral',
                   en: 'AgriFoodTech · Ancestral Biotechnology' },
  land_sub:      { es: 'El primer sistema biotecnológico de cacao funcional.',
                   en: 'The first functional cacao biotechnology system.' },
  land_sub2:     { es: 'Del genoma colombiano al mundo.',
                   en: 'From the Colombian genome to the world.' },
  land_cta1:     { es: 'EXPLORAR PRODUCTOS', en: 'EXPLORE PRODUCTS' },
  land_cta2:     { es: 'RITUAL DEL DÍA',     en: 'DAILY RITUAL'    },
  land_cta3:     { es: '↗ ABRIR APP',        en: '↗ OPEN APP'      },
  land_petals:   { es: 'Los 5 Pétalos de la Flor del Cacao',
                   en: 'The 5 Petals of the Cacao Flower' },
  land_guardians:{ es: 'NUESTROS GUARDIANES', en: 'OUR GUARDIANS'  },
  land_join:     { es: 'Únete al Círculo',   en: 'Join the Circle' },
  land_scroll:   { es: 'SCROLL',             en: 'SCROLL'          },

  land_v1_title: { es: 'BIOACTIVOS CERTIFICADOS', en: 'CERTIFIED BIOACTIVES' },
  land_v1_desc:  { es: 'Epicatequina, teobromina y mucílago fermentado. Novel Food aprobado para el mercado europeo.',
                   en: 'Epicatechin, theobromine and fermented mucilage. Novel Food approved for the European market.' },
  land_v2_title: { es: 'AGROFORESTERÍA VIVA',    en: 'LIVING AGROFORESTRY'  },
  land_v2_desc:  { es: 'Cacao criollo en sistemas regenerativos. 100% del fruto aprovechado, cero desperdicio.',
                   en: 'Criollo cacao in regenerative systems. 100% of the fruit used, zero waste.' },
  land_v3_title: { es: 'IMPACTO VERIFICADO',     en: 'VERIFIED IMPACT'      },
  land_v3_desc:  { es: '+180% ingreso directo a las familias Guardianas. Trazabilidad completa de origen a taza.',
                   en: '+180% direct income to Guardian families. Full traceability from origin to cup.' },

  // ── Auth ───────────────────────────────────────────────────────────────────
  auth_tagline:  { es: 'With Nature We Walk',     en: 'With Nature We Walk'  },
  auth_continue: { es: 'Continuar con',           en: 'Continue with'        },
  auth_email:    { es: 'correo@ejemplo.com',      en: 'email@example.com'    },
  auth_pass:     { es: 'Contraseña',              en: 'Password'             },
  auth_login:    { es: 'INICIAR SESIÓN',          en: 'SIGN IN'              },
  auth_register: { es: 'CREAR CUENTA',            en: 'CREATE ACCOUNT'       },
  auth_no_acct:  { es: '¿No tienes cuenta?',      en: 'No account?'          },
  auth_yes_acct: { es: '¿Ya tienes cuenta?',      en: 'Already have one?'    },
  auth_signup:   { es: 'Regístrate',              en: 'Sign up'              },
  auth_signin:   { es: 'Inicia sesión',           en: 'Sign in'              },
  auth_confirm:  { es: '¡Cuenta creada! Revisa tu correo para confirmar.',
                   en: 'Account created! Check your email to confirm.'       },

  // ── Marketplace ────────────────────────────────────────────────────────────
  mkt_eyebrow:   { es: 'Ediciones limitadas · Novel Foods · Regenerativo',
                   en: 'Limited Editions · Novel Foods · Regenerative'       },
  mkt_title:     { es: 'MERCADO CAUA',            en: 'CAUA MARKET'          },
  mkt_desc:      { es: 'Cacao colombiano de origen verificado. Cada compra redistribuye directamente a los Guardianes. Certificado para mercados europeos de Novel Foods.',
                   en: 'Colombian cacao of verified origin. Each purchase redistributes directly to the Guardians. Certified for European Novel Foods markets.' },
  mkt_all:       { es: 'TODOS',                   en: 'ALL'                  },
  mkt_preorder:  { es: 'PRE-ORDER',               en: 'PRE-ORDER'            },
  mkt_auction:   { es: 'SUBASTA',                 en: 'AUCTION'              },
  mkt_sub:       { es: 'SUSCRIPCIÓN',             en: 'SUBSCRIPTION'         },
  mkt_mult_label:{ es: 'TU MULTIPLICADOR',        en: 'YOUR MULTIPLIER'      },
  mkt_mult_desc: { es: 'Basado en referidos y lotes previos',
                   en: 'Based on referrals and previous lots'                },
  mkt_mult_how:  { es: '¿Cómo aumentarlo?',       en: 'How to increase it?'  },
  mkt_empty:     { es: 'No hay productos en esta categoría.',
                   en: 'No products in this category.'                       },

  // ── Ritual ────────────────────────────────────────────────────────────────
  rit_eyebrow:   { es: 'Ritual del Cacao · 22 Arcanas',
                   en: 'Cacao Ritual · 22 Arcanas'                          },
  rit_title1:    { es: 'TU LECTURA',              en: "TODAY'S"              },
  rit_title2:    { es: 'DE HOY',                  en: 'READING'              },
  rit_desc:      { es: 'El cacao como espejo. Una práctica diaria de presencia, conexión con la naturaleza y el origen de lo que consumes.',
                   en: 'Cacao as a mirror. A daily practice of presence, connection with nature and the origin of what you consume.' },
  rit_streak:    { es: 'DÍAS DE PRÁCTICA CONTINUA', en: 'DAYS OF CONTINUOUS PRACTICE' },
  rit_intention: { es: 'Cierra los ojos. Respira. Piensa en tu intención para hoy.\nCuando estés lista, toca la carta.',
                   en: 'Close your eyes. Breathe. Think about your intention for today.\nWhen ready, touch the card.' },
  rit_reveal:    { es: 'REVELAR MI ARCANA',       en: 'REVEAL MY ARCANA'     },
  rit_start:     { es: 'INICIAR RITUAL',          en: 'START RITUAL'         },
  rit_anon:      { es: 'Crea tu cuenta gratuita para guardar tu racha diaria',
                   en: 'Create a free account to save your daily streak'     },
  rit_listening: { es: 'el cacao te escucha…',   en: 'the cacao listens…'   },
  rit_invitation:{ es: 'INVITACIÓN DEL DÍA',     en: "TODAY'S INVITATION"   },
  rit_ceremony:  { es: 'CEREMONIA DE CACAO GUIADA', en: 'GUIDED CACAO CEREMONY' },
  rit_cer_desc:  { es: '15 minutos · Taza caliente · Espacio sagrado para ti',
                   en: '15 minutes · Hot cup · Your sacred space'           },
  rit_spotify:   { es: '🎵 Abrir meditación en Spotify', en: '🎵 Open meditation on Spotify' },
  rit_share:     { es: 'Compartir ↗',            en: 'Share ↗'              },
  rit_new_draw:  { es: 'Nueva tirada',            en: 'New draw'             },
  rit_upsell:    { es: 'Potencia tu ritual con cacao real',
                   en: 'Elevate your ritual with real cacao'                },
  rit_upsell_cta:{ es: 'Ver Cacao Ceremonial Criollo →',
                   en: 'See Ceremonial Criollo Cacao →'                     },
  rit_el_tierra: { es: '◈ Tierra · Arraigo',     en: '◈ Earth · Grounding'  },
  rit_el_fuego:  { es: '◆ Fuego · Transformación',en: '◆ Fire · Transformation' },
  rit_el_agua:   { es: '◉ Agua · Intuición',     en: '◉ Water · Intuition'  },
  rit_el_aire:   { es: '◇ Aire · Claridad',      en: '◇ Air · Clarity'      },
  rit_share_text:{ es: '🫘 Mi arcana de hoy',    en: '🫘 My arcana today'    },

  // ── Fund ──────────────────────────────────────────────────────────────────
  nav_fund:           { es: 'FONDO',                    en: 'FUND'                   },
  fund_eyebrow:       { es: 'Crowdfunding · Biotecnología · Lotes',
                        en: 'Crowdfunding · Biotechnology · Lots'                    },
  fund_title:         { es: 'FINANCIA\nLA CIENCIA',     en: 'FUND\nTHE SCIENCE'      },
  fund_sub:           { es: '$250K para Novel Food EU · Ingrediente como Servicio · Mucílago de cacao criollo',
                        en: '$250K for EU Novel Food · Ingredient as a Service · Elite criollo cacao mucilage' },
  fund_role_label:    { es: 'TU ROL EN EL ECOSISTEMA',  en: 'YOUR ROLE IN THE ECOSYSTEM' },
  fund_raised:        { es: 'RECAUDADO',                en: 'RAISED'                 },
  fund_goal:          { es: 'META',                     en: 'GOAL'                   },
  fund_backers:       { es: 'RESPALDANTES',             en: 'BACKERS'                },
  fund_lots_label:    { es: 'LOTES FINANCIADOS',        en: 'LOTS FUNDED'            },
  fund_lot_price:     { es: 'PRECIO POR LOTE',          en: 'PRICE PER LOT'          },
  fund_invest_cta:    { es: 'INVERTIR EN LOTES',        en: 'INVEST IN LOTS'         },
  fund_prebuy_cta:    { es: 'PRE-COMPRAR',              en: 'PRE-BUY'                },
  fund_supply_input:  { es: 'ENTRADA',                  en: 'INPUT'                  },
  fund_supply_output: { es: 'SALIDA',                   en: 'OUTPUT'                 },
  fund_supply_process:{ es: 'PROCESO',                  en: 'PROCESS'                },
  fund_modal_title:   { es: 'INVERSIÓN POR LOTES',      en: 'LOT INVESTMENT'         },
  fund_modal_lots:    { es: 'NÚMERO DE LOTES',          en: 'NUMBER OF LOTS'         },
  fund_modal_total:   { es: 'TOTAL',                    en: 'TOTAL'                  },
  fund_pay_stripe:    { es: 'Pagar con Tarjeta (USD/EUR)', en: 'Pay by Card (USD/EUR)' },
  fund_pay_mp:        { es: 'Pagar con MercadoPago (COP)', en: 'Pay with MercadoPago (COP)' },
  fund_login_required:{ es: 'Inicia sesión para invertir', en: 'Sign in to invest'   },
  fund_eu_badge:      { es: 'APROBACIÓN EU',            en: 'EU APPROVAL'            },
  fund_iaas:          { es: 'Ingrediente como Servicio', en: 'Ingredient as a Service' },
  fund_supply_chain:  { es: 'CADENA DE SUMINISTRO',     en: 'SUPPLY CHAIN'           },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dash_eyebrow:  { es: 'Triple Impacto · Transparencia Total',
                   en: 'Triple Impact · Full Transparency'                  },
  dash_title:    { es: 'IMPACTO REAL',            en: 'REAL IMPACT'          },
  dash_roadmap:  { es: 'HOJA DE RUTA 2026–2029',  en: 'ROADMAP 2026–2029'   },
  dash_distrib:  { es: 'DISTRIBUCIÓN DEL VALOR · POR CADA $1 USD',
                   en: 'VALUE DISTRIBUTION · PER $1 USD'                    },
  dash_whatsapp: { es: '💬 ÚNETE A LA COMUNIDAD WHATSAPP',
                   en: '💬 JOIN THE WHATSAPP COMMUNITY'                     },
} as const

export type TKey = keyof typeof translations

export function t(key: TKey, lang: Lang): string {
  return translations[key][lang]
}

/** Hook-friendly helper — returns a translator bound to current lang */
export function makeT(lang: Lang) {
  return (key: TKey) => translations[key][lang]
}
