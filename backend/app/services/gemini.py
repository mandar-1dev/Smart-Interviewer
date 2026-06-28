import json
import re
import google.generativeai as genai
from app.core.config import settings

EVALUATION_PROMPT = """
You are an expert software engineering interviewer. Evaluate the candidate's answer to the following interview question.

**Question:** {question}

**Candidate's Answer:** {answer}

**Category:** {category}
**Difficulty:** {difficulty}

Respond ONLY with a valid JSON object (no markdown, no extra text) using this exact structure:
{{
  "score": <number 0-10>,
  "technical_accuracy": "<detailed assessment of technical correctness>",
  "communication_quality": "<assessment of clarity, structure, and communication>",
  "missing_concepts": ["<concept1>", "<concept2>"],
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "suggested_improvements": "<specific actionable suggestions>",
  "ideal_answer": "<a comprehensive ideal answer to this question>",
  "topics_to_study": ["<topic1>", "<topic2>"]
}}
"""


async def evaluate_answer(
    question: str,
    answer: str,
    category: str,
    difficulty: str,
) -> dict:
    prompt = EVALUATION_PROMPT.format(
        question=question,
        answer=answer,
        category=category,
        difficulty=difficulty,
    )

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)

        return {
            "score": float(max(0, min(10, data.get("score", 5)))),
            "technical_accuracy": str(data.get("technical_accuracy", "")),
            "communication_quality": str(data.get("communication_quality", "")),
            "missing_concepts": data.get("missing_concepts", []),
            "strengths": data.get("strengths", []),
            "weaknesses": data.get("weaknesses", []),
            "suggested_improvements": str(data.get("suggested_improvements", "")),
            "ideal_answer": str(data.get("ideal_answer", "")),
            "topics_to_study": data.get("topics_to_study", []),
        }

    except Exception:
        return {
            "score": 5.0,
            "technical_accuracy": "Unable to evaluate. Check your GEMINI_API_KEY.",
            "communication_quality": "Unable to evaluate at this time.",
            "missing_concepts": [],
            "strengths": ["Answer was submitted successfully"],
            "weaknesses": ["Evaluation service temporarily unavailable"],
            "suggested_improvements": "Please retry or check GEMINI_API_KEY in .env",
            "ideal_answer": "Evaluation service unavailable.",
            "topics_to_study": [],
        }