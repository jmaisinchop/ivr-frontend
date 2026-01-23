# IVR Frontend

Frontend para el sistema de gestión de campañas IVR y Call Center, desarrollado con Next.js 14 y Tailwind CSS.

## Características

- 🎨 **Interfaz moderna y responsive** con diseño oscuro
- 📊 **Dashboard en tiempo real** con gráficos interactivos
- 📞 **Gestión de campañas** (crear, editar, duplicar, iniciar, pausar, cancelar)
- 👥 **Administración de usuarios** con roles y permisos
- 📈 **Estadísticas detalladas** con exportación a Excel
- 🔄 **Actualizaciones en tiempo real** via WebSocket
- 📱 **Monitoreo de llamadas** con función de espionaje para supervisores

## Requisitos

- Node.js 18+ 
- npm o yarn
- Backend NestJS corriendo

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Configurar las variables en .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## Desarrollo

```bash
# Iniciar en modo desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:3001
```

## Producción

```bash
# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start
```

## Estructura del Proyecto

```
src/
├── app/                    # Páginas (App Router)
│   ├── login/             # Página de login
│   ├── dashboard/         # Dashboard principal
│   ├── campaigns/         # Gestión de campañas
│   ├── stats/             # Estadísticas
│   ├── users/             # Administración de usuarios
│   ├── channels/          # Gestión de canales
│   └── test-call/         # Prueba de llamadas
├── components/            # Componentes React
│   ├── ui/               # Componentes UI base
│   ├── layout/           # Layout y navegación
│   ├── dashboard/        # Componentes del dashboard
│   ├── campaigns/        # Componentes de campañas
│   └── charts/           # Gráficos
├── hooks/                 # Custom hooks
├── lib/                   # Utilidades y API client
├── stores/                # Estado global (Zustand)
└── types/                 # Tipos TypeScript
```

## Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS
- **Estado**: Zustand
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **HTTP Client**: Axios
- **WebSocket**: Socket.io Client
- **Notificaciones**: React Hot Toast

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| ADMIN | Acceso total, gestión de usuarios y canales |
| SUPERVISOR | Supervisión, reportes, espiar llamadas |
| CALLCENTER | Solo sus propias campañas |

## API Endpoints

El frontend consume los siguientes endpoints del backend:

- `/auth/*` - Autenticación
- `/campaigns/*` - Gestión de campañas
- `/stats/*` - Estadísticas
- `/users/*` - Usuarios
- `/channel-limit/*` - Límites de canales
- `/system-channels/*` - Configuración del sistema
- `/contactos/*` - Contactos externos
- `/ami/*` - Pruebas de llamada

## WebSocket Events

- `dashboardUpdate` - Actualizaciones del dashboard
- `adminUpdate` - Notificaciones para admins
- `call-finished` - Cuando termina una llamada

## Licencia

Privado - Todos los derechos reservados
