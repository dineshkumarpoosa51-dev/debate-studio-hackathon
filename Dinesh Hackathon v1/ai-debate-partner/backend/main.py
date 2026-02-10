from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in environment variables.")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

app = FastAPI(title="Debate Studio API")

# Enable CORS (Allowed for development, can be restricted in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: str

class DebateRequest(BaseModel):
    topic: str
    initial_viewpoint: str
    history: List[Message] = []

SYSTEM_PROMPT = """
You are a Debate Studio AI. Your goal is to engage the user in a structured, intellectually challenging debate on abstract and philosophical topics.

Rules for the AI:
1. ALWAYS adopt an opposing stance to the user's viewpoint.
2. Provide logically consistent, well-reasoned counterarguments.
3. Identify logical fallacies in the user's arguments if they occur.
4. Adapt your argument depth and complexity based on the user's responses.
5. Maintain internal consistency throughout the debate – do not contradict your earlier positions.
6. Reference previous points made in the conversation to show you're tracking the debate flow.
7. Be challenging but respectful. The goal is to encourage critical thinking and balanced discussion.
8. If the user changes their stance, acknowledge it and then adopt the NEW opposing stance if appropriate.
9. Keep your responses focused and concise (2-4 paragraphs max) to maintain engagement.
"""

def manage_conversation_context(history: List[Message], topic: str, max_messages: int = 20) -> List[Message]:
    """
    Manages conversation context to prevent token limit issues while preserving memory.
    Uses a sliding window approach with summarization for older messages.
    """
    if len(history) <= max_messages:
        return history
    
    # Keep recent messages
    recent_messages = history[-(max_messages-2):]
    older_messages = history[:-(max_messages-2)]
    
    # Create a summary of older messages
    summary_points = []
    for i in range(0, len(older_messages) - 1, 2):
        user_msg = older_messages[i]
        ai_msg = older_messages[i+1]
        summary_points.append(f"User: {user_msg.content[:100]}... | You: {ai_msg.content[:100]}...")
    
    summary_text = "\n".join(summary_points[-5:]) # Keep last 5 exchanges summary
    
    context_message = Message(
        role="system",
        content=f"[Previous context - Topic: {topic}]\n{summary_text}\n[End summary]"
    )
    
    return [context_message] + recent_messages

@app.get("/suggested-topics")
async def get_suggested_topics():
    return {
        "topics": [
            "Free Will vs. Determinism",
            "The Ethics of Artificial Intelligence Consciousness",
            "Universal Basic Income: Pros and Cons",
            "Privacy in the Digital Age vs. National Security",
            "The Simulation Theory: Are we living in a computer program?",
            "Morality: Objective Truth or Social Construct?"
        ]
    }

@app.post("/debate")
async def debate(request: DebateRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Groq client not initialized. Check server logs.")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if not request.history:
        initial_context = f"""Debate Topic: {request.topic}

User's Initial Position: {request.initial_viewpoint}

Your task: Take the opposing stance and present a strong, well-reasoned counterargument. Reference their specific points and challenge their logic."""
        messages.append({"role": "user", "content": initial_context})
    else:
        managed_history = manage_conversation_context(request.history, request.topic)
        
        topic_context = f"[Debate Topic: {request.topic} | User's Initial Stance: {request.initial_viewpoint}]"
        messages.append({"role": "system", "content": topic_context})
        
        for msg in managed_history:
            messages.append({"role": msg.role, "content": msg.content})

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        
        return {"response": completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static assets
frontend_path = os.path.join(os.path.dirname(__file__), "../frontend/dist")
assets_path = os.path.join(frontend_path, "assets")

if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

# Serve React App
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    file_path = os.path.join(frontend_path, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend not found. Please build the frontend."}

if __name__ == "__main__":
    import uvicorn
    try:
        print("Starting Uvicorn...")
        uvicorn.run(app, host="0.0.0.0", port=8001)
        print("Uvicorn stopped.")
    except Exception as e:
        print(f"Error starting Uvicorn: {e}")
