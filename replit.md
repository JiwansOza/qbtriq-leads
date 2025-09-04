# Overview

Qbtriq CRM is a comprehensive lead management system built as a full-stack web application. It provides businesses with tools to manage leads, track team performance, monitor attendance, and maintain activity logs. The system features role-based access control, real-time data management, and a modern user interface built with React and shadcn/ui components.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built with React 18 using TypeScript and modern tooling:
- **Build System**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui components built on top of Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **File Structure**: Organized with pages, components, hooks, and lib directories following React best practices

## Backend Architecture
The server is built with Express.js in a RESTful API pattern:
- **Runtime**: Node.js with TypeScript using ESM modules
- **API Design**: Express.js with middleware for logging, error handling, and request processing
- **File Upload**: Multer for handling multipart form data and file uploads
- **Session Management**: Express sessions with PostgreSQL storage for persistent authentication
- **Development Tools**: Hot reloading with Vite integration for seamless development experience

## Authentication System
The application uses Replit's OpenID Connect (OIDC) authentication:
- **Provider**: Replit OIDC with automatic user discovery and token management
- **Strategy**: Passport.js with OpenID Connect strategy for secure authentication flows
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple for scalability
- **Authorization**: Role-based access control with admin and employee roles

## Database Architecture
PostgreSQL database with Drizzle ORM for type-safe database operations:
- **ORM**: Drizzle ORM with code-first schema definitions and automatic migration generation
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Design**: Relational design with proper foreign key constraints and indexes
- **Key Tables**: users, employees, leads, attendance, activity_logs, and sessions
- **Data Validation**: Zod schemas for runtime type checking and API validation

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database for scalable data storage
- **Authentication**: Replit OIDC service for secure user authentication
- **File Storage**: Local file system with multer for document and image uploads

### Development and Build Tools
- **Package Management**: npm with lockfile for consistent dependency resolution
- **TypeScript**: Full TypeScript support across client and server with strict type checking
- **Build Pipeline**: Vite for frontend builds, esbuild for server bundling
- **Development**: Hot reload, error overlays, and Replit-specific development tools

### UI and Styling
- **Component Library**: Radix UI primitives for accessible, unstyled UI components
- **Design System**: shadcn/ui for pre-built, customizable component implementations
- **Styling**: Tailwind CSS for utility-first styling with PostCSS processing
- **Icons**: Lucide React for consistent iconography throughout the application

### Third-party Libraries
- **Query Management**: TanStack Query for server state synchronization and caching
- **Form Validation**: Zod for schema validation and React Hook Form for form state
- **Utilities**: date-fns for date manipulation, clsx for conditional class names
- **File Processing**: Multer for multipart form handling and file uploads