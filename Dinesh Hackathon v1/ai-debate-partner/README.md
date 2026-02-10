# Debate Studio

An intelligent conversational system designed for structured argumentation on abstract and philosophical topics. This prototype uses **React.js** for the frontend, **FastAPI** for the backend, and **Groq** (LLama-3.3-70b-versatile) as the reasoning engine.

## Prerequisites
- Node.js & npm
- Python 3.8+
- Groq API Key (Get one at [console.groq.com](https://console.groq.com))

## Getting Started

### 1. Setup Backend
1. Go to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create or open the `.env` file and add your Groq API Key:
   ```env
   GROQ_API_KEY=your_actual_key_here
   ```
3. Path to your python might vary. Install dependencies if you haven't:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python main.py
   ```
   *The backend will run on `http://localhost:8001`*

### 2. Setup Frontend
1. Go to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`*

### 3. Run Full Application (Production Mode)
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Start the backend:
   ```bash
   cd ../backend
   python main.py
   ```
   *Access the full application at `http://localhost:8001`*

## Features
- **Opposing Stance Generation**: AI analyzes your view and takes the opposite side.
- **Modern UI**: Dark mode glassmorphism design with Framer Motion animations.
- **Adaptive Reasoning**: AI adjusts to your argument's complexity.
- **Persistent Context**: Maintains logical coherence throughout the debate.

## Topics to Explore
- Free Will vs Determinism
- Ethics of AI Consciousness
- Simulation Theory
- Privacy vs Security
