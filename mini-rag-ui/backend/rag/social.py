import re

SOCIAL_PATTERNS = {
    "greeting": [
        r"\bbonjour\b", r"\bsalut\b", r"\bcoucou\b", r"\bhello\b", r"\bbonsoir\b", r"\bhey\b"
    ],
    "thanks": [
        r"\bmerci\b", r"\bthanks\b", r"\bthx\b", r"\bmercii\b"
    ],
    "bye": [
        r"\bau revoir\b", r"\bbye\b", r"\bà bientôt\b"
    ],
    "help": [
        r"en quoi", r"peux-tu", r"aide", r"que peux-tu faire"
    ]
}

def detect_social_intent(text: str):
    text = text.lower()
    for intent, patterns in SOCIAL_PATTERNS.items():
        for p in patterns:
            if re.search(p, text):
                return intent
    return None

def social_response(intent: str):
    responses = {
        "greeting": "Bonjour 👋 Je suis votre assistant IA. En quoi puis-je vous aider ?",
        "thanks": "Avec plaisir 😊 N'hésitez pas si vous avez d'autres questions.",
        "bye": "À bientôt 👋",
        "help": (
            "Je peux vous aider à retrouver des informations "
            "et les services proposés par l’entreprise."
        )
    }
    return responses.get(intent)
