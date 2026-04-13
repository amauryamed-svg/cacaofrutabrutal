import type { Lang } from '../context/LangContext'

const translations = {
  // ── NavBar ─────────────────────────────────────────────────────────────────
  nav_home:      { es: 'INICIO',   en: 'HOME'   },
  nav_market:    { es: 'MERCADO',  en: 'MARKET' },
  nav_blog:      { es: 'BLOG',     en: 'BLOG'   },
  nav_ritual:    { es: 'RITUAL',   en: 'RITUAL' },
  nav_adoptar:   { es: 'ADOPTAR',  en: 'ADOPT'  },
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
  auth_tagline:  { es: '', en: '' },
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

  // ── Blog ──────────────────────────────────────────────────────────────────
  blog_eyebrow:  { es: 'CAUA CULTURA · Ciencia · Territorio · Salud',
                   en: 'CAUA CULTURE · Science · Territory · Health'          },
  blog_title:    { es: 'EL BLOG',                   en: 'THE BLOG'            },
  blog_read:     { es: 'LEER →',                    en: 'READ →'              },
  blog_by:       { es: 'por',                       en: 'by'                  },
  blog_min_read: { es: 'min de lectura',            en: 'min read'            },

  // ── Tokens ────────────────────────────────────────────────────────────────
  tok_beans:     { es: 'Granos',                    en: 'Beans'               },
  tok_mazorcas:  { es: 'Mazorcas',                  en: 'Mazorcas'            },
  tok_earned:    { es: '¡Ganaste',                  en: 'You earned'          },
  rit_tokens:    { es: 'Tu balance de fidelidad',   en: 'Your loyalty balance' },

  // ── Tarot Cards (22 Arcanas) ──────────────────────────────────────────────
  card_0_name:    { es: 'LA SEMILLA',              en: 'THE SEED'            },
  card_0_meaning: { es: 'Nuevo comienzo. El cacao que aún no germina guarda todo el potencial del bosque.',          en: 'New beginning. The cacao not yet germinated holds the forest\'s full potential.'      },
  card_0_advice:  { es: 'Planta una intención hoy. No la juzgues, solo siémbrala.',                                 en: 'Plant an intention today. Don\'t judge it, just sow it.'                             },

  card_1_name:    { es: 'EL CACAOTIER',            en: 'THE CACAOTIER'       },
  card_1_meaning: { es: 'Dominio del oficio. Tus manos ya conocen el camino — confía en tu proceso.',                 en: 'Mastery of craft. Your hands already know the way—trust your process.'                },
  card_1_advice:  { es: 'Dedica 30 minutos a tu craft sin distracción. La maestría es repetición consciente.',       en: 'Dedicate 30 minutes to your craft without distraction. Mastery is conscious repetition.' },

  card_2_name:    { es: 'LA GUARDIANA',            en: 'THE GUARDIAN'        },
  card_2_meaning: { es: 'Sabiduría ancestral susurra. Escucha lo que ya sabes pero has olvidado.',                    en: 'Ancestral wisdom whispers. Listen to what you know but have forgotten.'                },
  card_2_advice:  { es: 'Siéntate en silencio con una taza de cacao. La respuesta ya está en ti.',                   en: 'Sit in silence with a cup of cacao. The answer is already within you.'                },

  card_3_name:    { es: 'LA MADRE TIERRA',         en: 'MOTHER EARTH'        },
  card_3_meaning: { es: 'Abundancia que nutre. Todo lo que necesitas ya crece a tu alrededor.',                       en: 'Nourishing abundance. All you need already grows around you.'                        },
  card_3_advice:  { es: 'Camina descalzo. Toca la tierra. Agradece lo que tienes antes de pedir más.',               en: 'Walk barefoot. Touch the earth. Gratitude before asking for more.'                    },

  card_4_name:    { es: 'EL ANCESTRO',             en: 'THE ANCESTOR'        },
  card_4_meaning: { es: 'Estructura y tradición. Los que vinieron antes dejaron el mapa.',                            en: 'Structure and tradition. Those before left the map.'                                  },
  card_4_advice:  { es: 'Honra una tradición familiar hoy. Cocina algo que te conecte con tu origen.',               en: 'Honor a family tradition today. Cook something that connects you with your roots.'     },

  card_5_name:    { es: 'EL PENTÁMERO',            en: 'THE PENTAMER'        },
  card_5_meaning: { es: 'Los cinco guardianes. La comunidad es tu fuerza — ninguna flor poliniza sola.',              en: 'The five guardians. Community is your strength—no flower pollinates alone.'            },
  card_5_advice:  { es: 'Contacta a 5 personas importantes en tu vida. Sé el guardián de alguien hoy.',             en: 'Contact 5 important people in your life. Be someone\'s guardian today.'               },

  card_6_name:    { es: 'LA POLINIZACIÓN',         en: 'THE POLLINATION'     },
  card_6_meaning: { es: 'Conexión profunda. Dos mundos se encuentran y crean algo nuevo.',                            en: 'Deep connection. Two worlds meet and create something new.'                          },
  card_6_advice:  { es: 'Busca una colaboración inesperada. La magia está en el cruce.',                             en: 'Seek an unexpected collaboration. Magic lives in the crossing.'                      },

  card_7_name:    { es: 'EL CARRO DE COSECHA',     en: 'THE HARVEST CART'    },
  card_7_meaning: { es: 'Victoria por acción. Muévete con determinación — el fruto ya está maduro.',                  en: 'Victory through action. Move with determination—the fruit is already ripe.'            },
  card_7_advice:  { es: 'Toma una decisión que has estado postergando. El momento es ahora.',                        en: 'Make a decision you\'ve been postponing. The moment is now.'                          },

  card_8_name:    { es: 'LA FERMENTACIÓN',         en: 'FERMENTATION'        },
  card_8_meaning: { es: 'Fuerza en la quietud. Lo que parece caos interno es transformación.',                        en: 'Strength in stillness. What seems like inner chaos is transformation.'                },
  card_8_advice:  { es: 'Abraza la incomodidad. El cacao más fino pasa por la fermentación más intensa.',           en: 'Embrace discomfort. The finest cacao goes through the most intense fermentation.'      },

  card_9_name:    { es: 'EL ERMITAÑO DEL PÁRAMO', en: 'THE HERMIT OF THE MOORLAND' },
  card_9_meaning: { es: 'Soledad necesaria. Sube al páramo interior — la claridad vive en la altura.',                en: 'Necessary solitude. Climb the inner moorland—clarity lives at the heights.'            },
  card_9_advice:  { es: 'Retírate del ruido por una hora. Medita. Escribe. Solo tú y el silencio.',                 en: 'Retreat from noise for an hour. Meditate. Write. Just you and silence.'               },

  card_10_name:   { es: 'LA MAZORCA',              en: 'THE CACAO POD'       },
  card_10_meaning:{ es: 'Ciclos y abundancia. Lo que sembraste está volviendo — recíbelo.',                           en: 'Cycles and abundance. What you planted is returning—receive it.'                      },
  card_10_advice: { es: 'Celebra un logro reciente. La gratitud amplifica la abundancia.',                           en: 'Celebrate a recent achievement. Gratitude amplifies abundance.'                       },

  card_11_name:   { es: 'EL EQUILIBRIO',           en: 'EQUILIBRIUM'          },
  card_11_meaning:{ es: 'Justicia natural. El bosque siempre se regula — tú también puedes.',                         en: 'Natural justice. The forest always regulates itself—so can you.'                      },
  card_11_advice: { es: 'Revisa dónde estás dando de más y recibiendo de menos. Ajusta.',                            en: 'Check where you\'re giving more than receiving. Adjust.'                             },

  card_12_name:   { es: 'LA LIOFILIZACIÓN',        en: 'FREEZE-DRYING'       },
  card_12_meaning:{ es: 'Pausa sagrada. A veces hay que congelar para preservar lo esencial.',                        en: 'Sacred pause. Sometimes you must freeze to preserve what\'s essential.'                 },
  card_12_advice: { es: 'Pausa un proyecto. Consérvalo. No todo necesita avanzar al mismo tiempo.',                  en: 'Pause a project. Preserve it. Not everything must advance at once.'                   },

  card_13_name:   { es: 'LA TRANSFORMACIÓN',       en: 'TRANSFORMATION'      },
  card_13_meaning:{ es: 'Muerte del viejo proceso. Lo que ya no sirve se composta para nutrir lo nuevo.',             en: 'Death of the old way. What no longer serves becomes compost for what\'s new.'         },
  card_13_advice: { es: 'Suelta algo hoy: una creencia, un hábito, una relación que ya cumplió su ciclo.',           en: 'Release something today: a belief, habit, or relationship that\'s completed its cycle.' },

  card_14_name:   { es: 'LA DESTILACIÓN',          en: 'DISTILLATION'        },
  card_14_meaning:{ es: 'Paciencia alquímica. Gota a gota, la esencia se revela.',                                   en: 'Alchemical patience. Drop by drop, essence reveals itself.'                           },
  card_14_advice: { es: 'Reduce. Simplifica. ¿Cuál es la esencia de lo que intentas comunicar?',                    en: 'Reduce. Simplify. What is the essence of what you\'re trying to communicate?'         },

  card_15_name:   { es: 'EL THEOBROMA',            en: 'THEOBROMA'           },
  card_15_meaning:{ es: 'Alimento de dioses. Lo divino habita en lo terrenal — busca lo sagrado en lo cotidiano.',   en: 'Food of gods. The divine dwells in the earthly—find the sacred in the everyday.'      },
  card_15_advice: { es: 'Prepara cacao ceremonial. Bébelo con intención. Ofrece una porción a alguien.',            en: 'Prepare ceremonial cacao. Drink it with intention. Offer a portion to someone.'       },

  card_16_name:   { es: 'LA TORMENTA',             en: 'THE STORM'           },
  card_16_meaning:{ es: 'Destrucción creativa. El rayo que cae fertiliza el suelo.',                                  en: 'Creative destruction. Lightning that falls fertilizes the soil.'                      },
  card_16_advice: { es: 'No temas el conflicto de hoy. Está limpiando el camino.',                                   en: 'Fear not today\'s conflict. It\'s clearing the way.'                                  },

  card_17_name:   { es: 'THEOBROMA ESTELAR',       en: 'STELLAR THEOBROMA'   },
  card_17_meaning:{ es: 'Esperanza cósmica. El cacao conecta la tierra con las estrellas.',                          en: 'Cosmic hope. Cacao connects the earth with the stars.'                                },
  card_17_advice: { es: 'Sueña en grande hoy. Escribe tu visión más ambiciosa sin filtro.',                         en: 'Dream big today. Write your most ambitious vision without filter.'                    },

  card_18_name:   { es: 'LA LUNA DE COSECHA',      en: 'THE HARVEST MOON'    },
  card_18_meaning:{ es: 'Ilusiones y sombras. No todo lo que brilla en la noche es verdad.',                         en: 'Illusions and shadows. Not everything that shines at night is truth.'                  },
  card_18_advice: { es: 'Cuestiona una certeza. ¿Y si lo que crees saber es solo la cáscara?',                      en: 'Question a certainty. What if what you think you know is just the shell?'             },

  card_19_name:   { es: 'EL SOL DEL TRÓPICO',     en: 'THE TROPICAL SUN'    },
  card_19_meaning:{ es: 'Alegría radiante. La energía solar del cacao te llena de vitalidad.',                        en: 'Radiant joy. Cacao\'s solar energy fills you with vitality.'                          },
  card_19_advice: { es: 'Sal al sol. Mueve el cuerpo. Ríe. La salud empieza con la alegría.',                       en: 'Go into the sun. Move your body. Laugh. Health begins with joy.'                      },

  card_20_name:   { es: 'EL DESPERTAR',            en: 'AWAKENING'           },
  card_20_meaning:{ es: 'Juicio y renacimiento. Lo que estaba dormido despierta con fuerza.',                         en: 'Judgment and rebirth. What was asleep awakens with strength.'                        },
  card_20_advice: { es: 'Es momento de actuar sobre esa idea que has guardado. El mundo la necesita.',               en: 'It\'s time to act on that idea you\'ve kept hidden. The world needs it.'               },

  card_21_name:   { es: 'LA COSECHA',              en: 'THE HARVEST'         },
  card_21_meaning:{ es: 'Plenitud total. El ciclo se completa. Todo el fruto ha sido aprovechado.',                   en: 'Complete fullness. The cycle is complete. All fruit has been used.'                   },
  card_21_advice: { es: 'Celebra. Comparte. El éxito verdadero es el que se redistribuye.',                         en: 'Celebrate. Share. True success is what redistributes itself.'                        },
} as const

export type TKey = keyof typeof translations

export function t(key: TKey, lang: Lang): string {
  return translations[key][lang]
}

/** Hook-friendly helper — returns a translator bound to current lang */
export function makeT(lang: Lang) {
  return (key: TKey) => translations[key][lang]
}
