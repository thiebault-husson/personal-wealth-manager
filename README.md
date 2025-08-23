# Personal Wealth Manager

A comprehensive personal financial advisor MVP built with React, Node.js, TypeScript, ChromaDB, and OpenAI. This application allows users to input their personal profile, accounts, positions, and three main goals, then interact with an AI agent that provides personalized recommendations on tax optimization, asset allocation, and wealth management.

## 🏗️ Architecture

This project follows a modular RAG (Retrieval-Augmented Generation) architecture:

```
personal-wealth-manager/ (repository root)
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic & external services
│   │   ├── models/          # Database models & schemas
│   │   ├── controllers/     # Request handlers
│   │   └── middleware/      # Express middleware
│   ├── db/                  # ChromaDB persistence
│   └── docs/               # API documentation
├── frontend/               # React + Vite + TypeScript
├── shared/
│   └── types/              # Shared TypeScript interfaces
└── data/
    └── rag-sources/        # RAG document sources
```

## 🚀 Features

- **Personal Profile Management**: Store user demographics, filing status, risk tolerance, and financial goals
- **Account & Position Tracking**: Manage multiple accounts (401k, IRA, brokerage, etc.) and their holdings
- **AI-Powered Recommendations**: Get personalized advice on tax optimization and asset allocation
- **RAG-Based Knowledge**: Grounded in IRS publications, state tax guides, and wealth management best practices
- **Local-First**: All data stored locally, single-user focused for privacy

## 🛠️ Tech Stack

### Backend
- **Node.js** + **TypeScript** + **Express**
- **ChromaDB** for vector storage and retrieval
- **OpenAI** for embeddings and completions
- **UUID** for unique identifiers

### Frontend
- **React** + **TypeScript** + **Vite**
- Modern UI components and forms
- Real-time AI interaction

## 📋 Prerequisites

- **Node.js** (v20.17.0+)
- **npm** or **pnpm**
- **OpenAI API Key**
- **Docker** (optional, for ChromaDB)

## 🏃‍♂️ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/thiebault-husson/personal-wealth-manager.git
cd personal-wealth-manager
npm install
cd frontend && npm install && cd ..
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
CHROMADB_URL=http://localhost:8000
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Start ChromaDB

**Option A: Using Docker (Recommended)**
```bash
npm run chromadb
```

**Option B: Local Installation**
```bash
npm run chromadb-local
```

### 4. Start the Backend

```bash
npm run backend
```

### 5. Start the Frontend

```bash
npm run frontend
```

The React app will start on port 5173.

---

**Happy Wealth Managing! 💰📈**
