from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Facilitates local development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "ok", "message": "Neural Core Online"}

@app.post("/chat")
async def chat(data: dict):
    if "message" not in data:
        raise HTTPException(status_code=400, detail="Missing 'message' in request body")
    
    user_message = data["message"]

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": user_message,
                "stream": False
            },
            timeout=15 # Avoid hanging indefinitely
        )
        response.raise_for_status()
        return {"reply": response.json()["response"]}
    except requests.exceptions.RequestException as e:
        print(f"Ollama error: {e}")
        raise HTTPException(
            status_code=503, 
            detail="AI model service unavailable. Please ensure Ollama is running locally."
        )