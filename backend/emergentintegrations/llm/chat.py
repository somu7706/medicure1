import os
from groq import Groq
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

class UserMessage:
    def __init__(self, text, image_url=None):
        self.text = text
        self.image_url = image_url

class LlmChat:
    def __init__(self, api_key, session_id, system_message):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.provider = os.environ.get("AI_PROVIDER", "gemini").lower()
        
        if self.provider == "groq":
            self.model_name = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
            self.client = Groq(api_key=api_key.strip() if api_key else os.environ.get("GROQ_API_KEY"))
        else:
            self.model_name = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
            if api_key:
                genai.configure(api_key=api_key.strip())

    def with_model(self, provider, model):
        self.provider = provider.lower()
        self.model_name = model
        if self.provider == "groq" and not hasattr(self, 'client'):
            self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        return self

    async def send_message(self, message: UserMessage):
        if self.provider == "groq":
            return await self._send_groq_message(message)
        else:
            return await self._send_gemini_message(message)

    async def _send_groq_message(self, message: UserMessage):
        try:
            messages = [
                {"role": "system", "content": self.system_message},
                {"role": "user", "content": message.text}
            ]
            
            # Note: Standard Groq Llama models don't support multi-modal images yet in the same way.
            # If image_url is provided, we might need a specific vision model or just skip for now.
            
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.1,
                max_tokens=4096,
                stream=False
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"Error processing Groq request ({self.model_name}): {str(e)}"

    async def _send_gemini_message(self, message: UserMessage):
        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=self.system_message
            )
            
            content = [message.text]
            
            if message.image_url and message.image_url.startswith("data:image"):
                try:
                    import base64
                    header, encoded = message.image_url.split(",", 1)
                    data = base64.b64decode(encoded)
                    mime_type = header.split(";", 1)[0].split(":", 1)[1]
                    content.append({"mime_type": mime_type, "data": data})
                except Exception as img_err:
                    return f"Error processing image: {img_err}"

            safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            }

            response = await model.generate_content_async(content, safety_settings=safety_settings)
            return response.text
        except Exception as e:
            return f"Error processing Gemini request ({self.model_name}): {str(e)}"
