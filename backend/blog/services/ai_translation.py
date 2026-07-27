import json
import os
import urllib.request
from typing import Dict


def _get_api_config():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")

    api_url = os.environ.get("OPENAI_API_URL", "https://api.openai.com/v1/chat/completions")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    return api_key, api_url, model


def _build_payload(source: Dict[str, str], target_language: str, model: str) -> Dict:
    system_prompt = (
        "You are a professional translator for a European business directory blog. "
        "Translate the provided fields into the target language with natural, native phrasing. "
        "Preserve meaning, tone, and SEO intent. Return ONLY valid JSON with keys: "
        "title, excerpt, body, seo_title, seo_description."
    )

    user_prompt = (
        f"Target language: {target_language}\n\n"
        f"title: {source.get('title', '')}\n"
        f"excerpt: {source.get('excerpt', '')}\n"
        f"body: {source.get('body', '')}\n"
        f"seo_title: {source.get('seo_title', '')}\n"
        f"seo_description: {source.get('seo_description', '')}\n"
    )

    return {
        "model": model,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }


def translate_blog_fields(source: Dict[str, str], target_language: str) -> Dict[str, str]:
    api_key, api_url, model = _get_api_config()
    payload = _build_payload(source, target_language, model)

    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        api_url,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read().decode("utf-8")
    parsed = json.loads(raw)
    content = (
        parsed.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )

    try:
        translated = json.loads(content)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Translation response was not valid JSON: {content}") from exc

    return {
        "title": translated.get("title", "").strip(),
        "excerpt": translated.get("excerpt", "").strip(),
        "body": translated.get("body", "").strip(),
        "seo_title": translated.get("seo_title", "").strip(),
        "seo_description": translated.get("seo_description", "").strip(),
    }
