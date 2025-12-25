from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import json
import os
import uvicorn
from typing import Optional

app = FastAPI(
    title="AI 3D Mind Map API",
    description="Professional AI-powered 3D Mind Map visualization system",
    version="1.0.0"
)

# CORS sozlamalari
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API kalitini olish
# Render-da OPENAI_API_KEY deb nomlangan o'zgaruvchi yarating
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    # Mahalliy ishlaganda xatolik bermasligi uchun ogohlantirish
    print("⚠️ OGOHLANTIRISH: API kalit topilmadi!")

client = OpenAI(api_key=api_key)

sessions = {}

# System Prompt
SYSTEM_PROMPT = {
    "role": "system",
    "content": """Siz bilimlarni 3D vizuallashtirish bo'yicha professional ekspertsiz. 
Foydalanuvchi so'rovini tahlil qilib, FAQAT quyidagi JSON formatida javob bering.
Hech qanday qo'shimcha matn, tushuntirish yoki markdown qo'shmang.

Javob strukturasi:
{
  "text_answer": "Mavzu bo'yicha qisqa va aniq tushuntirish (2-3 jumla)",
  "graph_data": {
    "nodes": [
      {
        "id": "unikal_qisqa_id",
        "label": "Tushuncha nomi",
        "color": "#hex_rang",
        "summary": "30-80 so'zlik qisqacha mazmun (tooltip uchun)",
        "icon": "📌"
      }
    ],
    "links": [
      {"source": "id1", "target": "id2"}
    ]
  }
}

MUHIM QOIDALAR:
1. Har bir tugun uchun MAJBURIY "summary" maydoni bo'lishi kerak (30-80 so'z).
2. "icon" maydoni ixtiyoriy, lekin mavzuga mos emoji qo'shish tavsiya etiladi (🧠, 💡, ⚙️, 🌟, 📊, va h.k.).
3. Ranglar:
   - Markaziy mavzu: #00ffcc yoki #0066ff
   - Yordamchi tushunchalar: #ff6b6b, #4ecdc4, #ffd93d, #6bcf7f
4. ID'lar qisqa (3-10 belgi) va unikal bo'lsin.
5. Agar foydalanuvchi avvalgi javobdagi tushuncha haqida so'rasa, YANGI tugun yaratmasdan, o'sha mavjud ID dan foydalanib bog'lanish hosil qiling.
6. Bog'lanishlar mantiqiy va ierarxik bo'lishi shart.
7. Faqat JSON qaytaring, boshqa hech narsa emas."""
}

@app.post("/ask")
async def ask_ai(data: dict):
    """
    AI dan javob olish va 3D grafik ma'lumotlarini qaytarish
    """
    chat_id = data.get("chat_id", "default")
    user_input = data.get("prompt")

    if not user_input or user_input.strip() == "":
        raise HTTPException(status_code=400, detail="Prompt bo'sh bo'lishi mumkin emas")

    # Seans tarixini boshqarish
    if chat_id not in sessions:
        sessions[chat_id] = []

    # OpenAI xabarlar zanjiri
    messages = [SYSTEM_PROMPT]
    messages.extend(sessions[chat_id][-6:])
    messages.append({"role": "user", "content": user_input})

    try:
        # GPT-4o-mini dan JSON formatida javob olish
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=1500
        )

        ai_raw_content = response.choices[0].message.content

        # JSON parse qilish
        try:
            ai_json = json.loads(ai_raw_content)
        except json.JSONDecodeError as je:
            print(f"❌ JSON Parse xatolik: {str(je)}")
            print(f"📄 AI javobi: {ai_raw_content}")
            raise HTTPException(status_code=500, detail="AI dan noto'g'ri format keldi")

        # Tarixni yangilash
        sessions[chat_id].append({"role": "user", "content": user_input})
        sessions[chat_id].append({"role": "assistant", "content": ai_raw_content})

        # Xotirani cheklash
        if len(sessions[chat_id]) > 15:
            sessions[chat_id] = sessions[chat_id][-15:]

        return ai_json

    except Exception as e:
        print(f"❌ Xatolik yuz berdi: {str(e)}")
        return {
            "text_answer": "Kechirasiz, AI bilan bog'lanishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
            "graph_data": {"nodes": [], "links": []}
        }

@app.get("/")
async def status():
    """
    Server holati va statistikasi
    """
    return {
        "status": "online",
        "sessions_active": len(sessions),
        "total_messages": sum(len(s) for s in sessions.values()),
        "version": "1.0.0",
        "api_configured": bool(api_key and api_key != "sizning-api-kalitingiz-bu-yerga")
    }

@app.delete("/clear/{chat_id}")
async def clear_session(chat_id: str):
    """
    Seans tarixini tozalash
    """
    if chat_id in sessions:
        del sessions[chat_id]
        return {"message": "Tarix muvaffaqiyatli tozalandi", "chat_id": chat_id}
    return {"error": "Chat topilmadi", "chat_id": chat_id}

@app.get("/stats")
async def get_stats():
    """
    Tizim statistikasi
    """
    return {
        "total_sessions": len(sessions),
        "session_ids": list(sessions.keys()),
        "messages_per_session": {
            chat_id: len(messages)
            for chat_id, messages in sessions.items()
        }
    }

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 AI 3D Mind Map Server ishga tushmoqda...")
    print("📍 URL: http://localhost:8000")
    print("📚 Dokumentatsiya: http://localhost:8000/docs")
    print("📊 Statistika: http://localhost:8000/stats")
    print("=" * 60)
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )