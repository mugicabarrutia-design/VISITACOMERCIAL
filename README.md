# Gestión de Visitas Comerciales

Aplicación web integral para la planificación y seguimiento de visitas de comerciales con calendario interactivo (FullCalendar), gestión de clientes y seguimiento de actividad comercial con backend en **Supabase** y frontend en **React + TypeScript + Tailwind CSS**.

---

## 🚀 Guía de Puesta en Marcha

### 1. Crear el proyecto en Supabase
1. Accede a [supabase.com](https://supabase.com) e inicia sesión con tu cuenta.
2. Haz clic en **"New project"**.
3. Elige un nombre para el proyecto (ej. `crm-visitas-comerciales`), una contraseña segura para la base de datos y selecciona la región más cercana (ej. `eu-west-3` en Europa/Fráncfort/Madrid).
4. Espera 1 minuto a que el proyecto se termine de provisionar.

### 2. Ejecutar el script SQL (`supabase/schema.sql`)
1. En el panel lateral de tu proyecto en Supabase, dirígete a **SQL Editor**.
2. Haz clic en **"New query"**.
3. Abre el archivo `supabase/schema.sql` de este repositorio, copia todo su contenido y pégalo en el editor SQL de Supabase.
4. Haz clic en el botón verde **"Run"** (o presiona `Ctrl + Enter`).
5. Esto creará:
   - Las tablas `comerciales`, `clientes` y `visitas` con sus claves foráneas, restricciones de fecha y validaciones.
   - Los índices de rendimiento para búsquedas rápidas.
   - Las políticas RLS permisivas para el rol `anon`.
   - Datos de prueba listos: 3 comerciales con colores, 8 clientes y 10 visitas dinámicas en el mes actual.

### 3. Obtener credenciales y configurar variables de entorno
1. En Supabase, dirígete a **Project Settings** > **API**.
2. Copia:
   - **Project URL** (ej. `https://xyzcompany.supabase.co`)
   - **Project API Keys** -> clave pública `anon` / `public`.
3. Crea un archivo `.env` en la raíz del proyecto (basado en `.env.example`):
   ```env
   VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
   VITE_SUPABASE_ANON_KEY="tu-clave-anon-publica"
   ```
*(Nota: la aplicación también incluye un botón en la interfaz para configurar y verificar las claves de Supabase directamente desde el navegador).*

### 4. Ejecución en desarrollo local
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 🌐 Despliegue en Vercel

1. Sube tu código a un repositorio en **GitHub** o **GitLab**.
2. Entra en [vercel.com](https://vercel.com) y pulsa en **"Add New Project"**.
3. Importa tu repositorio.
4. En la sección **Environment Variables**, añade:
   - `VITE_SUPABASE_URL`: tu URL del proyecto en Supabase.
   - `VITE_SUPABASE_ANON_KEY`: tu clave pública `anon` de Supabase.
5. Haz clic en **"Deploy"**. Vercel compilará automáticamente con Vite y tu aplicación estará disponible globalmente con HTTPS.

---

## 🛠️ Estructura del Proyecto

```text
├── supabase/
│   └── schema.sql            # Script SQL con DDL, RLS e inserts de prueba
├── src/
│   ├── components/           # Componentes modulares (Modales, Navbar, Toasts, etc.)
│   ├── context/              # DataContext para sincronización con Supabase / fallback local
│   ├── hooks/                # Hooks personalizados
│   ├── lib/                  # Cliente Supabase y utilidades
│   ├── pages/                # Páginas: Calendario, Visitas, Clientes, Comerciales
│   ├── types/                # Definiciones de TypeScript
│   ├── App.tsx               # Enrutamiento y layout principal
│   └── main.tsx              # Punto de entrada React
├── .env.example              # Plantilla de variables de entorno
└── README.md                 # Esta guía de documentación
```
