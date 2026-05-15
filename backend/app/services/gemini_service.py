from google import genai
from google.genai import types
from ..config import settings
from ..db.supabase import supabase_admin
from typing import Dict, Any, Optional
import json
import httpx


def _guess_mime(path_or_url: str) -> str:
    lowered = path_or_url.lower().split("?", 1)[0]
    if lowered.endswith(".png"):
        return "image/png"
    if lowered.endswith(".webp"):
        return "image/webp"
    return "image/jpeg"


async def _load_image_bytes(
    image_url: str, image_path: Optional[str]
) -> Optional[tuple[bytes, str]]:
    """Fetch image bytes from Supabase Storage (preferred) or the public URL."""
    if image_path and supabase_admin is not None:
        try:
            data = supabase_admin.storage.from_(
                settings.REPORT_PHOTOS_BUCKET
            ).download(image_path)
            return data, _guess_mime(image_path)
        except Exception as e:
            print(f"Storage download failed for {image_path}: {e}")

    if image_url.startswith(("http://", "https://")):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(image_url)
                resp.raise_for_status()
                mime = resp.headers.get("content-type", _guess_mime(image_url)).split(";")[0]
                return resp.content, mime
        except Exception as e:
            print(f"HTTP fetch failed for {image_url}: {e}")

    return None


class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.5-flash-lite"

    async def analyze_report(
        self,
        image_url: str,
        category: str,
        user_description: str = "",
        image_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        prompt = f"""
        Analyze this image of a civic issue (Category: {category}).
        User provided description: "{user_description}"

        Tasks:
        1. Provide a professional, detailed description of the issue.
        2. Suggest an urgency score from 1 (low) to 5 (critical) based on public safety impact.
        3. Identify any specific details (e.g., depth of pothole, type of garbage, safety hazards).
        4. VERIFY: Does this image actually show the reported category ({category})? 
           Set ai_verification_status to "Verified" if it clearly shows {category}.
           Set it to "Inauthentic" if it definitely does NOT show {category} or is a fake/unrelated image.
           Set it to "Ambiguous" if you are unsure.

        Return the result in JSON format:
        {
            "enhanced_description": "...",
            "urgency_score": 1-5,
            "hazards": ["...", "..."],
            "ai_verification_status": "Verified" | "Ambiguous" | "Inauthentic"
        }
        """

        try:
            image = await _load_image_bytes(image_url, image_path)
            if image is not None:
                image_bytes, mime = image
                contents = [
                    types.Part.from_bytes(data=image_bytes, mime_type=mime),
                    types.Part.from_text(text=prompt),
                ]
            else:
                contents = [types.Part.from_text(text=prompt)]

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )

            if response.text:
                return json.loads(response.text)

            return {
                "enhanced_description": user_description,
                "urgency_score": 1,
                "hazards": [],
                "ai_verification_status": "Ambiguous",
            }
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            return {
                "enhanced_description": f"AI-detected {category}: Potential hazard. {user_description}",
                "urgency_score": 3,
                "hazards": ["Unverified hazard"],
                "ai_verification_status": "Ambiguous",
            }

    async def verify_resolution(
        self,
        original_image_url: str,
        resolution_image_url: str,
        original_image_path: Optional[str] = None,
        resolution_image_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        prompt = """
        Compare these two images:
        1. 'Before': Evidence of a civic issue.
        2. 'After': Proof of resolution/repair.

        Task:
        Determine if the issue shown in the 'Before' image has been successfully resolved in the 'After' image.
        Consider:
        - Is the location the same?
        - Is the specific defect (e.g., that exact pothole) repaired?
        - Is there any remaining hazard?

        Return the result in JSON format:
        {
            "is_resolved": true | false,
            "confidence_score": 0.0-1.0,
            "reasoning": "...",
            "remaining_hazards": []
        }
        """
        try:
            before = await _load_image_bytes(original_image_url, original_image_path)
            after = await _load_image_bytes(resolution_image_url, resolution_image_path)

            parts = []
            if before is not None:
                parts.append(types.Part.from_bytes(data=before[0], mime_type=before[1]))
            if after is not None:
                parts.append(types.Part.from_bytes(data=after[0], mime_type=after[1]))
            parts.append(types.Part.from_text(text=prompt))

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=parts,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )

            if response.text:
                return json.loads(response.text)

            return {
                "is_resolved": False,
                "confidence_score": 0.0,
                "reasoning": "No response from model.",
                "remaining_hazards": [],
            }
        except Exception as e:
            print(f"Error in semantic change detection: {e}")
            return {
                "is_resolved": False,
                "confidence_score": 0.0,
                "reasoning": f"Error: {str(e)}",
                "remaining_hazards": [],
            }


gemini_service = GeminiService()
