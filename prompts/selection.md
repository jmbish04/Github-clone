# Template Selection Guidelines

This template provides a minimal but powerful setup for backend heavy projects

- Use this template when you need:
    * Backend heavy projects that are suitable for Vite
    * Projects that require server side state persistence (provided via durable objects or Workers KV cache)
    * Projects that require a lot of backend or server-side stuff or database
    * Projects like file manager dashboards etc

- Do not use it for
    * Static or simple single-page applications
    * Landing pages focused on SEO or server-rendered content
    * Projects that require SSR (Server-Side Rendering)

- Built with
    * React Router 6 for declarative client-side routing
    * ShadCN UI (v2.3.0) for customizable and accessible UI components built on Radix UI primitives
    * Tailwind CSS for utility-first styling
    * Lucide Icons (React) for modern and lightweight iconography
    * ESLint with sensible defaults and TypeScript support
    * Vite for ultra-fast local development and builds
    * Cloudflare Workers for server-side processing
    * Durable Objects for server-side state persistence
    * Workers KV for server-side state persistence


