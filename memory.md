# Documento de Memoria y Decisiones Arquitectónicas (memory.md)

Este documento es el cerebro de contexto para Cacao Fruta Brutal. Todo agente y subagente debe leer este archivo antes de comenzar a codificar para asegurar que las decisiones tomadas previamente se respetan.

## 1. Decisiones Base
- **Frontend**: Next.js App Router, Tailwind CSS, shadcn/ui.
- **Backend/DB**: Supabase (PostgreSQL).
- **ML**: Python (FastAPI/Scikit-learn/TensorFlow).
- **Arquitectura de UI**: Feature-Sliced Design (FSD). Componentes aislados y reutilizables.

## 2. Registro de Decisiones Importantes
*(Agrega nuevas decisiones arquitectónicas aquí con fecha, contexto y la decisión tomada)*

- **[2026-04-13]**: Creado el documento `SRS.md` definiendo el ecosistema Multi-Agente ("Vibe Coding") usando Claude Code para Backend/ML/RLS y Antigravity para el maquetado Front-End y gamificación. El modelo de negocio se enfoca en "1-1-1-1" apuntando a Eco-inversores.

## 3. Tareas Críticas Pendientes
- Levantar el Dashboard MVP "Cacao-gotchi".
- Construir el Pipeline ML Python y la API de conexión.
- Definir de manera exhaustiva las políticas RLS para autenticación segura en Supabase.
- Crear primeros `SKILLS` dentro de `.claude/skills/`.
