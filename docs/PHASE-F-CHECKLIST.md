# Phase F - CRM Upgrade - Implementation Checklist

## ✅ Database Schema
- [x] `003_blog_tokens_crm.sql` - blog_posts table con RLS
- [x] `003_blog_tokens_crm.sql` - token_events table con RLS
- [x] `003_blog_tokens_crm.sql` - email_log table con RLS
- [x] `003_blog_tokens_crm.sql` - Extensiones a user_profiles (lead_score, beans, mazorcas)
- [x] `004_user_profiles_rls.sql` - RLS policies para user_profiles

## ✅ Frontend Implementation

### AdminCRM.tsx
- [x] 4 tabs: Usuarios, Inversiones, Órdenes, Emails
- [x] Lead score (🫘) display como 5 mazorcas en Users table
- [x] Click handler en user rows para abrir edit panel
- [x] EditUserPanel component con form deslizable
- [x] EmailsTable component mostrando email_log
- [x] EmailTypeBadge y EmailStatusBadge components

### User Profile Types
- [x] Actualizado database.types.ts con lead_score
- [x] Actualizado database.types.ts con beans_balance, mazorcas_balance, beans_lifetime
- [x] Removido 'colono' de CauaRole type union
- [x] Actualizado fund.types.ts (ya estaba correcto)

## ✅ CRM Features

### Lead Scoring
- [x] lead_score (1-5) almacenado en user_profiles
- [x] UI con 5 🫘 clickeables en Users table
- [x] Click abre EditUserPanel con mazorca picker
- [x] Guardar actualiza Supabase via RLS

### Edit User Panel
- [x] Desliza desde derecha (position: fixed)
- [x] Campos editables: full_name, region, caua_role, lead_score
- [x] Campos read-only: email, created_at, ritual_streak, completed_orders
- [x] Botones: Cancelar y Guardar
- [x] Save invoca supabase.update() con RLS validation

### Email Log Tab
- [x] Nueva tabla email_log en DB
- [x] Columns: email, type, subject, status, created_at
- [x] EmailTypeBadge coloreado por tipo (order_created, payment_confirmed, etc)
- [x] EmailStatusBadge coloreado por status (sent, failed, bounced)

## ✅ RLS Policies

### blog_posts
- [x] SELECT: public_read para published = true
- [x] INSERT: solo farmers y founders
- [x] Indices en slug y published_at

### email_log
- [x] SELECT: users ven sus propios emails, founders ven todos
- [x] INSERT: cualquiera (system-driven)
- [x] Indices en user_id, email, created_at

### token_events
- [x] SELECT: users ven sus propios events solo
- [x] Indices en user_id, created_at

### user_profiles
- [x] SELECT: users ven su profile, founders ven todos
- [x] UPDATE: users actualizan suyo, founders actualizan cualquiera
- [x] Indices en caua_role, email

## ✅ TypeScript Compilation
- [x] npx tsc --noEmit pasa sin errores
- [x] Tipos AdminCRM correctos (UserProfile, EmailRow, etc)

## ✅ Integration

### AdminCRM Route
- [x] Protegida por AuthContext.isAdmin check
- [x] isAdmin incluye founder role (no solo email específico)
- [x] Accesible en /admin/crm

### Nav Bar
- [x] No muestra CRM link a non-admins
- [x] Muestra CRM link a founders (caua_role = 'founder')

## 📋 Deployment Steps

### 1. Run Migrations in Supabase SQL Editor
```bash
# Copy and paste these in order:
- supabase/migrations/003_blog_tokens_crm.sql
- supabase/migrations/004_user_profiles_rls.sql
```

### 2. Verify RLS (Optional)
```bash
# Copy and paste this to test:
- supabase/rls-test-phase-f.sql
# Run individual test blocks and verify ✓ results
```

### 3. Frontend Deployment
```bash
npm run build
# Deploy to Vercel or production
```

### 4. Test in Production
1. Login as founder user
2. Navigate to /admin/crm
3. Click on a user row → should open edit panel
4. Update name/region/role/lead_score → should save
5. Click Emails tab → should show email_log entries

## 🚨 Common Issues & Solutions

### Issue: "Cannot INSERT into blog_posts"
- **Cause**: User is not farmer/founder
- **Solution**: Create user with caua_role = 'farmer' or 'founder' first

### Issue: "User can see other users' emails"
- **Cause**: RLS policy not applied
- **Solution**: Run `004_user_profiles_rls.sql` migration

### Issue: "EditUserPanel doesn't save"
- **Cause**: RLS preventing UPDATE on user_profiles
- **Solution**: Ensure auth.uid() is founder role via policy

### Issue: "lead_score column doesn't exist"
- **Cause**: Migration not run
- **Solution**: Execute `003_blog_tokens_crm.sql` in Supabase

## 📊 Database Queries for Verification

```sql
-- Check lead_score column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'lead_score';
-- ✓ Should show lead_score

-- Check email_log table exists
SELECT COUNT(*) FROM email_log LIMIT 1;
-- ✓ Should not error

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('blog_posts', 'email_log', 'token_events', 'user_profiles');
-- ✓ All should show rowsecurity = true

-- Check blog posts visible
SELECT COUNT(*) FROM blog_posts WHERE published = true;
-- ✓ Should show public posts
```

## 🎯 Success Criteria
- [x] Admins can view/edit all users
- [x] Lead scores visible and editable (🫘 UI)
- [x] Email log shows all sent emails
- [x] RLS prevents unauthorized access
- [x] No TypeScript errors
- [x] Dev server runs without errors
