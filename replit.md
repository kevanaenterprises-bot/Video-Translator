# Overview

This is a real-time video calling application with live translation capabilities between English and Vietnamese. The application enables two users to video chat while providing automatic speech recognition and translation of their conversations in real-time. It's built as a full-stack web application with a React frontend and Node.js/Express backend.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI with shadcn/ui component library and Tailwind CSS for styling
- **WebRTC**: Custom hooks for managing peer-to-peer video connections
- **Real-time Communication**: WebSocket connections for signaling and translation data

## Backend Architecture
- **Runtime**: Node.js with Express framework
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Real-time Communication**: WebSocket server for signaling and live translation streaming
- **Storage Strategy**: In-memory storage implementation with interface for easy database migration

## Data Layer
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle with schema-first approach
- **Schema Design**: 
  - Users table for participant management
  - Call sessions for tracking video calls
  - Translations table for storing conversation history
- **Migrations**: Drizzle Kit for database schema migrations

## WebRTC Implementation
- **Peer Connection**: Direct browser-to-browser video/audio streaming
- **Signaling**: WebSocket-based signaling server for connection establishment
- **STUN Servers**: Google STUN servers for NAT traversal
- **Media Controls**: Microphone and camera toggle functionality

## Translation Services
- **Speech Recognition**: Google Cloud Speech-to-Text API integration
- **Translation**: Google Cloud Translation API for real-time text translation
- **Language Support**: Bidirectional English-Vietnamese translation
- **Audio Processing**: Browser MediaRecorder API for audio capture and base64 encoding

## Authentication & Session Management
- **Session Storage**: PostgreSQL with session tracking
- **User Management**: Simple username-based user identification
- **Call Sessions**: Tracked with host/guest participant model and session status

## Development Environment
- **Build System**: Vite with TypeScript support
- **Development Server**: Express with Vite middleware in development
- **Hot Reload**: Vite HMR with custom error overlay
- **Path Aliases**: TypeScript path mapping for clean imports

# External Dependencies

## Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Google Cloud Speech-to-Text API**: Real-time speech recognition
- **Google Cloud Translation API**: Text translation between languages

## Core Libraries
- **@neondatabase/serverless**: PostgreSQL driver for Neon
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **ws**: WebSocket library for real-time communication
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router

## UI Framework
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

## Development Tools
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database migration and introspection tools
- **esbuild**: JavaScript bundler for production builds