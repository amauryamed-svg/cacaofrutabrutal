# Software Requirements Specification (SRS) - Cacao Fruta Brutal

## 1. Visión General y Estrategia de Negocio (El Modelo 1-1-1-1)
**Cacao Fruta Brutal** es una plataforma web gamificada que conecta "eco-inversores" globales con el ecosistema del Cacao Criollo colombiano, generando triple impacto y economía circular.
*   **1 Framework Escalable:** Next.js (App Router) para el Frontend + Supabase (PostgreSQL) para el Backend + Python para el microservicio de Machine Learning.
*   **1 Target:** Eco-inversores y consumidores conscientes (EE. UU. / Europa) mediante un modelo de suscripción de $10/año.
*   **1 Canal:** Gamificación social en videos cortos (TikTok/Reels) mostrando el impacto real.
*   **1 Feature Poderoso:** El "Gemelo Digital" (Cacao-gotchi). Seguimiento de la salud del árbol, absorción de CO2 y predicción de cosechas utilizando Machine Learning.

**Meta Operativa:** Alcanzar $1M USD en ingresos (100.000 usuarios) con un costo de mantenimiento anual menor a $10.000 USD mediante optimización obsesiva de consultas y uso eficiente de LLMs.

---

## 2. Arquitectura de Software y Stack Tecnológico

### 2.1. Frontend (Next.js + FSD + Design System)
*   **Patrón Arquitectónico:** Feature-Sliced Design (FSD) para garantizar que el código se mantenga modular y escalable.
*   **Design System Code-First:** En lugar de depender de flujos lentos de diseño visual (Figma), se utilizará un enfoque "developer-first" basado en un sistema de diseño de componentes preconstruidos (Tailwind / shadcn/ui). Esto acelera la creación de interfaces (dashboards, onboarding, gamificación) manteniendo consistencia y reduciendo la deuda técnica.

### 2.2. Backend y Base de Datos (Supabase / PostgreSQL)
La base de datos debe soportar 100.000 usuarios recurrentes sin generar cuellos de botella.
*   **Optimización de Row Level Security (RLS):** 
    *   Cualquier llamada RLS debe envolver funciones como `auth.uid()` en un bloque `select` (ej. `(select auth.uid()) = user_id`) para permitir que PostgreSQL almacene el resultado en caché.
    *   Se deben agregar índices `btree` a todas las columnas utilizadas en las políticas RLS que no sean llaves primarias, logrando mejoras de rendimiento de hasta 100x.
    *   El filtrado de datos se hará siempre explícitamente desde el frontend (ej. `.eq('user_id', userId)`), usando RLS **únicamente** como capa de seguridad, no de filtrado.
*   **Security Definer en Joins:** Para consultas complejas de RLS que involucren otras tablas, se usarán funciones *security definer* que devuelvan arrays, utilizando la sintaxis `ANY(ARRAY(select mi_funcion()))` para reducir los tiempos de consulta de minutos a milisegundos.

### 2.3. Microservicio de Machine Learning (Python)
Para las predicciones del Gemelo Digital (salud de planta, clima, CO2), se desplegará un microservicio aislado del frontend.
*   **Stack ML:** Uso de bibliotecas líderes y eficientes de Python como `FastAPI` para la API, `pandas` para análisis de datos, y `scikit-learn`, `TensorFlow` o `PyTorch` para el modelado predictivo.
*   **Privacidad y Seguridad de Datos (Canalización ML):** 
    1.  **Filtro de Pseudonimización/Tokenización:** Los datos de los usuarios y parcelas se tokenizan antes de entrar al *feature store* para separar la identidad del usuario de los atributos del cultivo.
    2.  **Privacidad por Agregación:** Se usarán técnicas estadísticas y de privacidad diferencial durante el entrenamiento para evitar la reidentificación y fuga de datos en el modelo.
    3.  **Aislamiento y Defensa:** El entorno de entrenamiento debe estar aislado y los despliegues de modelos deben auditarse para mitigar ataques de envenenamiento o inyección.

---

## 3. Flujo de Trabajo y Orquestación IA (Vibe Coding)

Para evitar el agotamiento del contexto de IA y minimizar los costos de tokens (evitando el "Tutorial Hell" o sobre-consumo), el desarrollo se realizará bajo el framework de **Claude Code** utilizando un ecosistema Multi-Agente:

### 3.1. Estructura de Configuración de IA (`.claude/`)
*   **`CLAUDE.md` (Global):** Ubicado en la raíz, contiene las reglas inmutables del proyecto, comandos frecuentes (build, test) y convenciones base de código. Se mantendrá estricto y conciso para no inflar el consumo de tokens y maximizar el *Prompt Caching*.
*   **`memory.md`:** Archivo para documentar decisiones arquitectónicas y reglas de negocio. Claude debe consultarlo antes de codificar y actualizarlo de forma persistente tras cada decisión clave.
*   **Subagentes (`.claude/agents/`):** Tareas complejas de investigación o de escritura en áreas críticas se delegarán a subagentes con contexto limitado y herramientas específicas (ej. un subagente revisor, un codificador de ML, un auditor de RLS) usando el patrón *Fan-Out / Fan-In*.
*   **Skills y SOPs (`.claude/skills/`):** Creación de archivos `SKILL.md` con Procedimientos Operativos Estándar para tareas recurrentes (ej. `/crear-modulo-fsd`, `/auditar-seguridad-ml`). Esto estandariza la salida de los agentes sin saturar el contexto general.

### 3.2. Estrategia de Contexto y MCP (Model Context Protocol)
*   **Uso de MCP:** Conexión a servidores MCP para que Claude actúe sobre la base de datos (PostgreSQL MCP), controle GitHub/Vercel (GitHub MCP) y pueda testear las vistas con navegación web automática.
*   **Higiene de Sesión:** Uso constante del comando `/clear` para resetear la ventana de contexto entre tareas no relacionadas y del comando `/compact` para resumir flujos extensos.
*   **Explorar y Planear:** Se usará a Claude en **Modo Plan (Plan Mode)** para que lea los archivos y responda dudas arquitectónicas (sin escribir código) antes de pasar a la implementación en **Modo Normal**.

---

## 4. MVP y Criterios de Aceptación Iniciales
1.  **Autenticación y Setup:** Registro de usuarios funcional validado por las políticas TO AUTHENTICATED en RLS.
2.  **Dashboard "Cacao-gotchi":** UI fluida (Next.js) que consuma datos del árbol a través de una API con caché.
3.  **Pipeline ML Conectado:** API en Python (`FastAPI`) consumiendo datos seudonimizados y devolviendo predicciones de salud y cosecha a la BD.
4.  **Despliegue Continuo (CI/CD):** Revisiones automáticas en Github Actions donde Claude ejecute revisiones no interactivas (`claude -p "/review"`) verificando vulnerabilidades OWASP y fugas de datos.
