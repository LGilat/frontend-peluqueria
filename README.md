# 💇 Frontend Peluquería - Sistema de Gestión Empresarial

Aplicación web desarrollada con **React + Vite** para la gestión integral de una peluquería o pequeño negocio del sector servicios.

Este proyecto consume una API REST desarrollada con **Django REST Framework** y proporciona una interfaz moderna para gestionar clientes, reservas, productos, empleados, finanzas y mucho más.

> **Estado del proyecto:** En desarrollo activo 🚧

---

# ✨ Características principales

## 🔐 Autenticación

* Inicio de sesión mediante JWT.
* Renovación automática del token (Refresh Token).
* Protección de rutas privadas.
* Gestión automática de sesiones.

---

## 📊 Dashboard

Panel principal con información resumida del negocio.

Incluye:

* Indicadores principales.
* Accesos rápidos.
* Estado general del sistema.

---

## 👥 Gestión de Clientes

* Alta de clientes.
* Edición.
* Eliminación.
* Historial del cliente.
* Búsquedas.

---

## 📅 Gestión de Reservas

* Crear reservas.
* Modificar reservas.
* Cancelar reservas.
* Agenda diaria.
* Agenda semanal.
* Control de solapamientos.
* Recordatorios.

---

## 👨‍💼 Gestión del Personal

* Alta de empleados.
* Organización del personal.
* Horarios.
* Carga semanal.
* Nóminas.

---

## 💇 Servicios

Gestión completa de servicios:

* Corte
* Color
* Tratamientos
* Lavado
* Peinado
* Servicios personalizados

---

## 📦 Productos

Gestión del inventario.

Incluye:

* Productos.
* Stock.
* Costes.
* Existencias.

---

## 💰 Finanzas

Módulo financiero del negocio.

Incluye:

* Ingresos.
* Gastos.
* IVA.
* Categorías contables.
* Comparativas por años.
* Informes mensuales.
* Desglose económico.

---

## 📈 Informes

Paneles con información empresarial:

* Evolución mensual.
* Evolución anual.
* Balance.
* Comparativas.
* Estadísticas.

---

## 📢 Avisos

Sistema interno de notificaciones.

---

## 📆 Calendario

Visualización de reservas y carga de trabajo.

---

# 🖥️ Tecnologías

* React
* Vite
* React Router
* Axios
* Context API
* Bootstrap
* CSS

---

# 🔐 Autenticación

La aplicación utiliza:

* JWT Access Token
* Refresh Token
* Interceptores Axios
* Renovación automática de sesión

---

# ⚙️ Instalación

Clonar el repositorio:

```bash
git clone https://github.com/LGilat/frontend-peluqueria.git
```

Entrar en el proyecto:

```bash
cd frontend-peluqueria
```

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
npm run dev
```

---

# 🌍 Variables de entorno

Crear un archivo `.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

En producción:

```env
VITE_API_URL=https://TU_BACKEND.onrender.com/api
```

---

# 🏗️ Arquitectura

```text
Frontend (React + Vite)
        │
        │ Axios + JWT
        ▼
Backend (Django REST Framework)
        │
        ▼
Base de datos
```

---

# 🚀 Despliegue

Frontend:

* Netlify (recomendado)
* Vercel

Backend:

* Django
* Gunicorn
* Render

---

# 📂 Proyecto relacionado

El backend se encuentra en un repositorio independiente:

**Backend:** https://github.com/LGilat/peluqueria

---

# 🎯 Objetivos del proyecto

Este proyecto nace con el objetivo de desarrollar una aplicación empresarial completa utilizando tecnologías modernas del ecosistema JavaScript y Python.

Se busca aplicar buenas prácticas de arquitectura, autenticación, consumo de APIs REST, organización del código y despliegue en producción.

---

# 📌 Próximas mejoras

* Panel de administración avanzado.
* Gestión de permisos por roles.
* Exportación de informes.
* Notificaciones en tiempo real.
* Integración con correo electrónico.
* Indicadores de negocio.
* Dashboard analítico.
* Responsive mejorado.
* Tests automatizados.
* Docker.
* Integración continua (CI/CD).

---

# 👨‍💻 Autor

**Luis Gil**

Desarrollador Full Stack.

Tecnologías principales:

* Python
* Django
* Django REST Framework
* JavaScript
* React
* Express.js
* Node.js
* SQL

---

## ⭐ Si este proyecto te resulta interesante, puedes darle una estrella al repositorio.
