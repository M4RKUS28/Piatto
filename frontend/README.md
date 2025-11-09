# Piatto Frontend - React SPA

Technical documentation for the Piatto frontend application built with React 19, Vite 7, and Tailwind CSS 4.

---

## Table of Contents

- [Piatto Frontend - React SPA](#piatto-frontend---react-spa)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Architecture](#architecture)
  - [Tech Stack](#tech-stack)
    - [Core](#core)
    - [Styling](#styling)
    - [State \& Data](#state--data)
    - [Internationalization](#internationalization)
    - [UI Components \& Icons](#ui-components--icons)
    - [Development Tools](#development-tools)
  - [Additional Resources](#additional-resources)

---

## Overview

The Piatto frontend is a modern Single Page Application (SPA) that provides:

- **Responsive UI** for desktop and mobile devices
- **Real-time recipe generation** with AI assistance
- **Interactive cooking interface** with step-by-step guidance
- **Multi-language support** (English, German)
- **OAuth authentication** with Google
- **Cloud-synced recipe library** with collections
- **Voice assistant integration** (optional)

---

## Architecture

```text
User Interaction
    *
React Component (src/pages/*)
    *
API Client (src/api/*.js)
    *
Axios HTTP Request
    *
Backend FastAPI (via /api/*)
    *
Response * State Update * UI Re-render
```

## Tech Stack

### Core

- **React 19.1** - UI library with latest features
- **Vite 7.1** - Next-generation build tool
- **React Router 6.29** - Client-side routing

### Styling

- **Tailwind CSS 4.1** - Utility-first CSS framework
- **@tailwindcss/vite** - Vite plugin for Tailwind
- **Framer Motion 12.23** - Animation library
- **Lottie React 2.4** - Animation player

### State & Data

- **React Context API** - Global auth state
- **Axios 1.12** - HTTP client with interceptors
- **Custom Hooks** - Reusable stateful logic

### Internationalization

- **i18next 25.6** - i18n framework
- **react-i18next 16.2** - React bindings
- **i18next-browser-languagedetector** - Auto language detection

### UI Components & Icons

- **Lucide React** - Icon library
- **React Icons** - Additional icons
- **React Markdown 9.0** - Markdown renderer
- **react-timer-hook 4.0** - Timer utilities

### Development Tools

- **ESLint 9** - Code linting
- **@vitejs/plugin-react** - React fast refresh

---

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Main Project README](../README.md)
- [Backend README](../backend/README.md)

---

**For questions or contributions, see the main project repository.**
