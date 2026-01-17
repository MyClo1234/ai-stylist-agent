"""
옷 이미지 특징 추출 API 서버
Gemini API를 사용하여 이미지에서 옷의 특징을 추출하고 JSON으로 저장합니다.
"""

import os
import json
import re
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
import io
import google.generativeai as genai
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

app = Flask(__name__)
CORS(app)

# Gemini API 설정
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
    print("       .env 파일에 GEMINI_API_KEY를 설정하거나 환경변수로 설정해주세요.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# -----------------------------
# Enums
# -----------------------------
ENUMS = {
    "category_main": ["outer", "top", "bottom", "onepiece", "shoes", "bag", "accessory"],
    "category_sub": [
        "coat", "puffer", "jacket", "blazer", "cardigan", "hoodie", "sweatshirt",
        "shirt", "tshirt", "knit", "sweater", "slacks", "jeans", "shorts",
        "skirt", "dress", "sneakers", "loafers", "heels", "boots",
        "bag", "cap", "hat", "scarf", "belt", "other", "unknown"
    ],
    "color": [
        "black", "white", "gray", "navy", "blue", "skyblue", "beige", "brown", "khaki",
        "green", "red", "pink", "purple", "yellow", "orange", "cream", "other", "unknown"
    ],
    "tone": ["dark", "mid", "light", "pastel", "vivid", "unknown"],
    "pattern": ["solid", "stripe", "check", "dot", "graphic", "floral", "other", "unknown"],
    "material": ["cotton", "denim", "knit", "wool", "leather", "poly", "linen", "other", "unknown"],
    "fit": ["slim", "regular", "oversized", "wide", "unknown"],
    "neckline": ["crew", "vneck", "collar", "turtleneck", "hood", "unknown"],
    "sleeve": ["sleeveless", "short", "long", "unknown"],
    "length": ["cropped", "waist", "hip", "long", "unknown"],
    "closure": ["zipper", "button", "open", "none", "unknown"],
    "style_tags": ["minimal", "classic", "street", "sporty", "feminine", "vintage", "business", "formal", "casual", "other"],
    "season": ["spring", "summer", "fall", "winter"],
}

SYSTEM_PROMPT = (
    "You are a clothing-attribute extractor.\n"
    "You MUST output ONLY a valid JSON object. No extra text.\n"
    "Follow the schema EXACTLY.\n"
    "If uncertain, use 'unknown' or null and lower confidence.\n"
)

USER_PROMPT = f"""Extract attributes for the single clothing item in the image.

Return ONLY ONE JSON object with EXACTLY these top-level keys:
category, color, pattern, material, fit, details, style_tags, scores, meta, confidence

Schema (types):
{{
  "category": {{"main": string, "sub": string, "confidence": number}},
  "color": {{"primary": string, "secondary": [string], "tone": string, "confidence": number}},
  "pattern": {{"type": string, "confidence": number}},
  "material": {{"guess": string, "confidence": number}},
  "fit": {{"type": string, "confidence": number}},
  "details": {{
    "neckline": string,
    "sleeve": string,
    "length": string,
    "closure": [string],
    "print_or_logo": boolean
  }},
  "style_tags": [string],
  "scores": {{
    "formality": number,
    "warmth": number,
    "season": [string],
    "versatility": number
  }},
  "meta": {{"is_layering_piece": boolean, "notes": string|null}},
  "confidence": number
}}

Critical rules:
- JSON only. No markdown. No commentary. No trailing text.
- details.closure MUST be an ARRAY, e.g. ["none"] (never a string).
- scores.season MUST be an ARRAY, e.g. ["winter"] (never a string).
- confidence fields must be 0.0~1.0
- Use lowercase tokens (short). If unsure use "unknown".
- category.main must be one of {ENUMS["category_main"]}.
- color.tone must be one of {ENUMS["tone"]}.
"""

DEFAULT_OBJ: Dict[str, Any] = {
    "category": {"main": "unknown", "sub": "unknown", "confidence": 0.2},
    "color": {"primary": "unknown", "secondary": [], "tone": "unknown", "confidence": 0.2},
    "pattern": {"type": "unknown", "confidence": 0.2},
    "material": {"guess": "unknown", "confidence": 0.2},
    "fit": {"type": "unknown", "confidence": 0.2},
    "details": {"neckline": "unknown", "sleeve": "unknown", "length": "unknown", "closure": ["unknown"], "print_or_logo": False},
    "style_tags": [],
    "scores": {"formality": 0.3, "warmth": 0.3, "season": [], "versatility": 0.5},
    "meta": {"is_layering_piece": False, "notes": None},
    "confidence": 0.2,
}

REQUIRED_TOP_KEYS = {"category", "color", "pattern", "material", "fit", "details", "style_tags", "scores", "meta", "confidence"}

# -----------------------------
# JSON parse helpers
# -----------------------------
def _first_balanced_json_object(s: str) -> Optional[str]:
    """Return the first balanced {{...}} JSON object substring found in s."""
    s = s.strip()
    start = s.find("{")
    if start == -1:
        return None

    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(s)):
        ch = s[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        else:
            if ch == '"':
                in_str = True
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return s[start:i+1]
    return None

def _repair_json_like(s: str) -> str:
    s = s.strip()
    s = re.sub(r"^```(?:json)?\s*", "", s)
    s = re.sub(r"\s*```$", "", s)
    s = re.sub(r"\bNone\b", "null", s)
    s = re.sub(r"\bTrue\b", "true", s)
    s = re.sub(r"\bFalse\b", "false", s)
    s = re.sub(r",\s*([}}\]])", r"\1", s)
    if s.count('"') < 4 and s.count("'") > 4:
        s = s.replace("'", '"')
    return s

def _first_balanced_json_array(s: str) -> Optional[str]:
    """Return the first balanced [...] JSON array substring found in s."""
    s = s.strip()
    start = s.find("[")
    if start == -1:
        return None

    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(s)):
        ch = s[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        else:
            if ch == '"':
                in_str = True
                continue
            if ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    return s[start:i+1]
    return None

def parse_json_from_text(text: str) -> Tuple[Optional[Any], str]:
    """
    Parse JSON from text, supporting both dict and list.
    Returns: (parsed_object or None, repaired_text)
    """
    # Try to find JSON array first (for recommendations)
    array_candidate = _first_balanced_json_array(text)
    if array_candidate:
        repaired = _repair_json_like(array_candidate)
        try:
            obj = json.loads(repaired)
            if isinstance(obj, list):
                return obj, repaired
        except Exception:
            pass
    
    # Try to find JSON object (for attribute extraction)
    candidate = _first_balanced_json_object(text) or text
    repaired = _repair_json_like(candidate)
    try:
        obj = json.loads(repaired)
        if isinstance(obj, (dict, list)):
            return obj, repaired
        return None, repaired
    except Exception:
        return None, repaired

# -----------------------------
# Schema validation
# -----------------------------
def _is_num(x: Any) -> bool:
    return isinstance(x, (int, float)) and not (isinstance(x, float) and x != x)

def _in_01(x: Any) -> bool:
    return _is_num(x) and 0.0 <= float(x) <= 1.0

def validate_schema(obj: Dict[str, Any]) -> Tuple[bool, List[str]]:
    errs: List[str] = []
    if not isinstance(obj, dict):
        return False, ["Top-level is not an object/dict"]

    keys = set(obj.keys())
    if keys != REQUIRED_TOP_KEYS:
        missing = sorted(list(REQUIRED_TOP_KEYS - keys))
        extra = sorted(list(keys - REQUIRED_TOP_KEYS))
        if missing:
            errs.append(f"Missing top-level keys: {missing}")
        if extra:
            errs.append(f"Extra top-level keys not allowed: {extra}")

    def _must_dict(name):
        v = obj.get(name)
        if not isinstance(v, dict):
            errs.append(f"{name} must be an object")
            return None
        return v

    cat = _must_dict("category")
    if cat:
        if not isinstance(cat.get("main"), str): errs.append("category.main must be string")
        if not isinstance(cat.get("sub"), str): errs.append("category.sub must be string")
        if not _in_01(cat.get("confidence")): errs.append("category.confidence must be number in [0,1]")

    col = _must_dict("color")
    if col:
        if not isinstance(col.get("primary"), str): errs.append("color.primary must be string")
        sec = col.get("secondary")
        if not isinstance(sec, list) or any(not isinstance(x, str) for x in sec):
            errs.append("color.secondary must be [string]")
        if not isinstance(col.get("tone"), str): errs.append("color.tone must be string")
        if not _in_01(col.get("confidence")): errs.append("color.confidence must be number in [0,1]")

    pat = _must_dict("pattern")
    if pat:
        if not isinstance(pat.get("type"), str): errs.append("pattern.type must be string")
        if not _in_01(pat.get("confidence")): errs.append("pattern.confidence must be number in [0,1]")

    mat = _must_dict("material")
    if mat:
        if not isinstance(mat.get("guess"), str): errs.append("material.guess must be string")
        if not _in_01(mat.get("confidence")): errs.append("material.confidence must be number in [0,1]")

    fit = _must_dict("fit")
    if fit:
        if not isinstance(fit.get("type"), str): errs.append("fit.type must be string")
        if not _in_01(fit.get("confidence")): errs.append("fit.confidence must be number in [0,1]")

    det = _must_dict("details")
    if det:
        if not isinstance(det.get("neckline"), str): errs.append("details.neckline must be string")
        if not isinstance(det.get("sleeve"), str): errs.append("details.sleeve must be string")
        if not isinstance(det.get("length"), str): errs.append("details.length must be string")
        clo = det.get("closure")
        if not isinstance(clo, list) or any(not isinstance(x, str) for x in clo):
            errs.append("details.closure must be [string]")
        if not isinstance(det.get("print_or_logo"), bool):
            errs.append("details.print_or_logo must be boolean")

    tags = obj.get("style_tags")
    if not isinstance(tags, list) or any(not isinstance(x, str) for x in tags):
        errs.append("style_tags must be [string]")

    sc = _must_dict("scores")
    if sc:
        if not _in_01(sc.get("formality")): errs.append("scores.formality must be number in [0,1]")
        if not _in_01(sc.get("warmth")): errs.append("scores.warmth must be number in [0,1]")
        if not _in_01(sc.get("versatility")): errs.append("scores.versatility must be number in [0,1]")
        seas = sc.get("season")
        if not isinstance(seas, list) or any(not isinstance(x, str) for x in seas):
            errs.append("scores.season must be [string]")

    meta = _must_dict("meta")
    if meta:
        if not isinstance(meta.get("is_layering_piece"), bool):
            errs.append("meta.is_layering_piece must be boolean")
        notes = meta.get("notes")
        if not (notes is None or isinstance(notes, str)):
            errs.append("meta.notes must be string|null")

    if not _in_01(obj.get("confidence")):
        errs.append("confidence must be number in [0,1]")

    return (len(errs) == 0), errs

# -----------------------------
# normalization helpers
# -----------------------------
def _clamp01(x: Any, default: float = 0.2) -> float:
    try:
        v = float(x)
        if v != v:
            return default
        return max(0.0, min(1.0, v))
    except Exception:
        return default

def _as_str(x: Any, default: str = "unknown") -> str:
    if x is None:
        return default
    if isinstance(x, str):
        s = x.strip().lower()
        return s if s else default
    return str(x).strip().lower() or default

def _as_bool(x: Any, default: bool = False) -> bool:
    if isinstance(x, bool):
        return x
    if isinstance(x, str):
        s = x.strip().lower()
        if s in ("true", "1", "yes", "y"):
            return True
        if s in ("false", "0", "no", "n"):
            return False
    if isinstance(x, (int, float)):
        return bool(x)
    return default

def _as_list_str(x: Any) -> List[str]:
    if x is None:
        return []
    if isinstance(x, list):
        return [_as_str(i) for i in x if _as_str(i)]
    if isinstance(x, str):
        if "," in x:
            return [_as_str(i) for i in x.split(",") if _as_str(i)]
        return [_as_str(x)]
    return [_as_str(x)]

def _in_enum(value: str, enum_list: List[str]) -> str:
    v = _as_str(value)
    return v if v in enum_list else "unknown"

ALIASES = {
    "category_main": {"clothing": "top", "sweater": "top", "knitwear": "top"},
    "color": {"dark blue": "navy", "navy blue": "navy", "light blue": "skyblue"},
    "neckline": {"round": "crew", "crew neck": "crew", "crewneck": "crew"},
    "closure": {"no closure": "none", "none": "none"},
    "tone": {"navy": "dark"},
}
def _alias(kind: str, s: Any) -> str:
    v = _as_str(s)
    return ALIASES.get(kind, {}).get(v, v)

def normalize(obj: Dict[str, Any]) -> Dict[str, Any]:
    out = json.loads(json.dumps(DEFAULT_OBJ))

    cat = obj.get("category", {}) if isinstance(obj.get("category"), dict) else {}
    out["category"]["main"] = _in_enum(_alias("category_main", cat.get("main")), ENUMS["category_main"])
    out["category"]["sub"]  = _in_enum(_as_str(cat.get("sub")), ENUMS["category_sub"])
    out["category"]["confidence"] = _clamp01(cat.get("confidence"), out["category"]["confidence"])

    col = obj.get("color", {}) if isinstance(obj.get("color"), dict) else {}
    out["color"]["primary"] = _in_enum(_alias("color", col.get("primary")), ENUMS["color"])
    sec = [_in_enum(_alias("color", s), ENUMS["color"]) for s in _as_list_str(col.get("secondary", []))]
    out["color"]["secondary"] = [s for s in sec if s != "unknown"][:3]
    out["color"]["tone"] = _in_enum(_alias("tone", col.get("tone")), ENUMS["tone"])
    out["color"]["confidence"] = _clamp01(col.get("confidence"), out["color"]["confidence"])

    pat = obj.get("pattern", {}) if isinstance(obj.get("pattern"), dict) else {}
    out["pattern"]["type"] = _in_enum(_as_str(pat.get("type")), ENUMS["pattern"])
    out["pattern"]["confidence"] = _clamp01(pat.get("confidence"), out["pattern"]["confidence"])

    mat = obj.get("material", {}) if isinstance(obj.get("material"), dict) else {}
    out["material"]["guess"] = _in_enum(_as_str(mat.get("guess")), ENUMS["material"])
    out["material"]["confidence"] = _clamp01(mat.get("confidence"), out["material"]["confidence"])

    fit = obj.get("fit", {}) if isinstance(obj.get("fit"), dict) else {}
    out["fit"]["type"] = _in_enum(_as_str(fit.get("type")), ENUMS["fit"])
    out["fit"]["confidence"] = _clamp01(fit.get("confidence"), out["fit"]["confidence"])

    det = obj.get("details", {}) if isinstance(obj.get("details"), dict) else {}
    out["details"]["neckline"] = _in_enum(_alias("neckline", det.get("neckline")), ENUMS["neckline"])
    out["details"]["sleeve"] = _in_enum(_as_str(det.get("sleeve")), ENUMS["sleeve"])
    out["details"]["length"] = _in_enum(_as_str(det.get("length")), ENUMS["length"])
    closure = [_in_enum(_alias("closure", c), ENUMS["closure"]) for c in _as_list_str(det.get("closure", ["unknown"]))]
    out["details"]["closure"] = (closure[:3] if closure else ["unknown"])
    out["details"]["print_or_logo"] = _as_bool(det.get("print_or_logo"), False)

    out["style_tags"] = [_in_enum(_as_str(t), ENUMS["style_tags"]) for t in _as_list_str(obj.get("style_tags", []))]
    out["style_tags"] = [t for t in out["style_tags"] if t != "unknown"][:8]

    sc = obj.get("scores", {}) if isinstance(obj.get("scores"), dict) else {}
    out["scores"]["formality"] = _clamp01(sc.get("formality"), out["scores"]["formality"])
    out["scores"]["warmth"] = _clamp01(sc.get("warmth"), out["scores"]["warmth"])
    out["scores"]["versatility"] = _clamp01(sc.get("versatility"), out["scores"]["versatility"])
    out["scores"]["season"] = [_in_enum(_as_str(s), ENUMS["season"]) for s in _as_list_str(sc.get("season", []))]
    out["scores"]["season"] = [s for s in out["scores"]["season"] if s != "unknown"][:4]

    meta = obj.get("meta", {}) if isinstance(obj.get("meta"), dict) else {}
    out["meta"]["is_layering_piece"] = _as_bool(meta.get("is_layering_piece"), out["meta"]["is_layering_piece"])
    notes = meta.get("notes", None)
    out["meta"]["notes"] = None if notes is None else str(notes)

    out["confidence"] = _clamp01(obj.get("confidence"), out["confidence"])
    return out

# -----------------------------
# Image processing
# -----------------------------
def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    """Load image from bytes and convert to RGB"""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return img

def build_retry_prompt(errors: List[str]) -> str:
    return f"""Fix your output to be VALID JSON and match the schema EXACTLY.

Errors:
- {chr(10).join(errors[:10])}

MUST:
- Return ONLY ONE JSON object. No extra text.
- Top-level keys must be EXACTLY: {sorted(list(REQUIRED_TOP_KEYS))}
- details.closure MUST be an ARRAY of strings (e.g. ["none"]).
- scores.season MUST be an ARRAY of strings (e.g. ["winter"]).
- All confidences must be 0.0~1.0.
- category.main must be one of {ENUMS["category_main"]}.
- color.tone must be one of {ENUMS["tone"]}.
- Use "unknown" if unsure.

Return corrected JSON ONLY.
"""

def generate_with_gemini(image: Image.Image, prompt: str) -> str:
    """Generate response using Gemini API"""
    try:
        response = model.generate_content([prompt, image])
        return response.text
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

def extract_attributes(image_bytes: bytes, retry_on_schema_fail: bool = True) -> Dict[str, Any]:
    """Extract clothing attributes from image"""
    image = load_image_from_bytes(image_bytes)
    
    # First try
    raw1 = generate_with_gemini(image, USER_PROMPT)
    parsed1, repaired1 = parse_json_from_text(raw1)

    if parsed1 is None:
        out = json.loads(json.dumps(DEFAULT_OBJ))
        out["meta"]["notes"] = f"JSON_PARSE_FAILED. repaired_head={repaired1[:160]}"
        out["confidence"] = 0.1
        return out

    ok1, errs1 = validate_schema(parsed1)
    if ok1:
        return normalize(parsed1)

    # Retry
    if retry_on_schema_fail:
        prompt2 = build_retry_prompt(errs1)
        raw2 = generate_with_gemini(image, prompt2)
        parsed2, repaired2 = parse_json_from_text(raw2)

        if parsed2 is None:
            out = json.loads(json.dumps(DEFAULT_OBJ))
            out["meta"]["notes"] = f"RETRY_JSON_PARSE_FAILED. repaired_head={repaired2[:160]}"
            out["confidence"] = 0.1
            return out

        ok2, errs2 = validate_schema(parsed2)
        if ok2:
            return normalize(parsed2)

        out = normalize(parsed2)
        out["meta"]["notes"] = (out["meta"]["notes"] or "")
        out["meta"]["notes"] = (out["meta"]["notes"] + f" | SCHEMA_INVALID_AFTER_RETRY: {errs2[:3]}")[:300]
        return out

    # no retry
    out = normalize(parsed1)
    out["meta"]["notes"] = (out["meta"]["notes"] or "")
    out["meta"]["notes"] = (out["meta"]["notes"] + f" | SCHEMA_INVALID_NO_RETRY: {errs1[:3]}")[:300]
    return out

# -----------------------------
# Wardrobe & Recommendation Functions
# -----------------------------
def load_wardrobe_items() -> List[Dict[str, Any]]:
    """Load all clothing items from extracted_attributes/ folder"""
    items = []
    output_dir = "extracted_attributes"
    
    if not os.path.exists(output_dir):
        return items
    
    try:
        for filename in os.listdir(output_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(output_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        attributes = json.load(f)
                        item_id = filename.replace('.json', '')
                        
                        # Check if corresponding image exists
                        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
                        image_path = None
                        for ext in image_extensions:
                            potential_image = os.path.join(output_dir, f"{item_id}{ext}")
                            if os.path.exists(potential_image):
                                image_path = f"/api/images/{item_id}{ext}"
                                break
                        
                        items.append({
                            "id": item_id,
                            "filename": filename,
                            "attributes": attributes,
                            "image_url": image_path
                        })
                except Exception as e:
                    print(f"Error loading {filename}: {e}")
                    continue
    except Exception as e:
        print(f"Error reading wardrobe directory: {e}")
    
    return items

# -----------------------------
# Color Harmony Functions
# -----------------------------
COLOR_WHEEL = {
    "black": 0, "white": 0, "gray": 0,
    "red": 0, "orange": 30, "yellow": 60,
    "green": 120, "skyblue": 180, "blue": 210,
    "navy": 240, "purple": 270, "pink": 300,
    "beige": 45, "brown": 25, "khaki": 90,
    "cream": 50, "other": None, "unknown": None
}

def get_color_hue(color: str) -> Optional[float]:
    """Get hue value for a color (0-360 degrees)"""
    return COLOR_WHEEL.get(color.lower(), None)

def calculate_color_harmony(color1: str, color2: str) -> float:
    """
    Calculate color harmony score between two colors (0.0-1.0)
    Returns higher scores for complementary, analogous, or monochromatic combinations
    """
    hue1 = get_color_hue(color1)
    hue2 = get_color_hue(color2)
    
    # Neutral colors (black, white, gray) go with everything
    if color1.lower() in ["black", "white", "gray"] or color2.lower() in ["black", "white", "gray"]:
        return 0.8
    
    # Unknown or other colors
    if hue1 is None or hue2 is None:
        return 0.5
    
    # Same color (monochromatic)
    if color1.lower() == color2.lower():
        return 0.9
    
    # Calculate angle difference
    diff = abs(hue1 - hue2)
    if diff > 180:
        diff = 360 - diff
    
    # Complementary (170-190 degrees) - high score
    if 170 <= diff <= 190:
        return 0.95
    
    # Analogous (0-60 degrees) - good score
    if diff <= 60:
        return 0.85
    
    # Triadic (120 degrees) - decent score
    if 110 <= diff <= 130:
        return 0.75
    
    # Other combinations - lower score
    if diff <= 90:
        return 0.6
    else:
        return 0.4

def calculate_style_match(style_tags1: List[str], style_tags2: List[str]) -> float:
    """Calculate style tag matching score (0.0-1.0)"""
    if not style_tags1 or not style_tags2:
        return 0.3
    
    set1 = set(style_tags1)
    set2 = set(style_tags2)
    
    common = len(set1 & set2)
    total = len(set1 | set2)
    
    if total == 0:
        return 0.3
    
    return min(1.0, 0.3 + (common / total) * 0.7)

def calculate_formality_match(formality1: float, formality2: float) -> float:
    """Calculate formality matching score (0.0-1.0) - closer values score higher"""
    diff = abs(formality1 - formality2)
    return max(0.0, 1.0 - diff * 2)  # Penalize large differences

def calculate_season_match(seasons1: List[str], seasons2: List[str]) -> float:
    """Calculate season matching score (0.0-1.0)"""
    if not seasons1 or not seasons2:
        return 0.5  # Neutral if no season info
    
    set1 = set(seasons1)
    set2 = set(seasons2)
    
    if len(set1 & set2) > 0:
        return 1.0
    else:
        return 0.3

def calculate_outfit_score(top: Dict[str, Any], bottom: Dict[str, Any]) -> Tuple[float, List[str]]:
    """
    Calculate overall outfit compatibility score and reasons
    Returns: (score 0.0-1.0, list of reasons)
    """
    top_attrs = top.get("attributes", {})
    bottom_attrs = bottom.get("attributes", {})
    
    # Color harmony (40% weight)
    top_color = top_attrs.get("color", {}).get("primary", "unknown")
    bottom_color = bottom_attrs.get("color", {}).get("primary", "unknown")
    color_score = calculate_color_harmony(top_color, bottom_color)
    
    # Style match (30% weight)
    top_styles = top_attrs.get("style_tags", [])
    bottom_styles = bottom_attrs.get("style_tags", [])
    style_score = calculate_style_match(top_styles, bottom_styles)
    
    # Formality match (20% weight)
    top_formality = top_attrs.get("scores", {}).get("formality", 0.5)
    bottom_formality = bottom_attrs.get("scores", {}).get("formality", 0.5)
    formality_score = calculate_formality_match(top_formality, bottom_formality)
    
    # Season match (10% weight)
    top_seasons = top_attrs.get("scores", {}).get("season", [])
    bottom_seasons = bottom_attrs.get("scores", {}).get("season", [])
    season_score = calculate_season_match(top_seasons, bottom_seasons)
    
    # Weighted total
    total_score = (
        color_score * 0.4 +
        style_score * 0.3 +
        formality_score * 0.2 +
        season_score * 0.1
    )
    
    # Generate reasons
    reasons = []
    if color_score >= 0.8:
        reasons.append("색상 조화")
    if style_score >= 0.6:
        reasons.append("스타일 일치")
    if formality_score >= 0.7:
        reasons.append("정장스러움 조화")
    if season_score >= 0.8:
        reasons.append("계절 적합")
    
    if not reasons:
        reasons.append("균형잡힌 조합")
    
    return total_score, reasons

# -----------------------------
# API Routes
# -----------------------------
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/api/images/<filename>', methods=['GET'])
def serve_image(filename):
    """Serve images from extracted_attributes/ folder"""
    try:
        output_dir = "extracted_attributes"
        return send_from_directory(output_dir, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/extract', methods=['POST'])
def extract():
    """Extract clothing attributes from uploaded image"""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # File size validation (max 10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({"error": f"File size exceeds maximum allowed size (10MB). Your file is {file_size / (1024*1024):.1f}MB"}), 400
        
        # File type validation
        ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        ALLOWED_MIME_TYPES = {'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'}
        
        filename = file.filename.lower()
        file_ext = os.path.splitext(filename)[1]
        mime_type = file.content_type
        
        if file_ext not in ALLOWED_EXTENSIONS:
            return jsonify({"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
        if mime_type and mime_type not in ALLOWED_MIME_TYPES:
            return jsonify({"error": f"Invalid MIME type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"}), 400

        image_bytes = file.read()
        attributes = extract_attributes(image_bytes)
        
        # Save to JSON file and image file
        output_dir = "extracted_attributes"
        os.makedirs(output_dir, exist_ok=True)
        
        # Use milliseconds and random suffix to prevent collisions
        import time
        import random
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        milliseconds = int(time.time() * 1000) % 1000
        random_suffix = random.randint(1000, 9999)
        base_id = f"attributes_{timestamp}_{milliseconds:03d}_{random_suffix}"
        
        # Save JSON
        json_filename = f"{output_dir}/{base_id}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(attributes, f, ensure_ascii=False, indent=2)
        
        # Save image file
        # Get original file extension or default to jpg
        original_filename = file.filename
        if original_filename:
            _, ext = os.path.splitext(original_filename)
            if ext.lower() not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                ext = '.jpg'
        else:
            ext = '.jpg'
        
        image_filename = f"{output_dir}/{base_id}{ext}"
        with open(image_filename, 'wb') as f:
            f.write(image_bytes)
        
        # Add image URL to response
        image_url = f"/api/images/{base_id}{ext}"
        
        return jsonify({
            "success": True,
            "attributes": attributes,
            "saved_to": json_filename,
            "image_url": image_url,
            "item_id": base_id
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/wardrobe/items', methods=['GET'])
def get_wardrobe_items():
    """Get all wardrobe items from extracted_attributes/ folder"""
    try:
        category = request.args.get('category', None)  # Optional filter
        
        items = load_wardrobe_items()
        
        # Filter by category if provided
        if category:
            filtered = []
            for item in items:
                item_category = item.get("attributes", {}).get("category", {}).get("main", "")
                if item_category == category.lower():
                    filtered.append(item)
            items = filtered
        
        return jsonify({
            "success": True,
            "items": items,
            "count": len(items)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Cache for Gemini recommendations (in-memory, simple cache)
_gemini_cache = {}
_cache_max_size = 100

def _get_cache_key(tops: List[Dict[str, Any]], bottoms: List[Dict[str, Any]], count: int) -> str:
    """Generate cache key from tops and bottoms IDs"""
    top_ids = sorted([t.get("id") for t in tops])
    bottom_ids = sorted([b.get("id") for b in bottoms])
    return f"{hash(tuple(top_ids))}_{hash(tuple(bottom_ids))}_{count}"

def recommend_outfit_with_gemini(tops: List[Dict[str, Any]], bottoms: List[Dict[str, Any]], count: int = 1, top_candidates: int = 5) -> List[Dict[str, Any]]:
    """
    Use Gemini to recommend outfit combinations with optimization:
    1. Pre-filter with rule-based scoring (fast)
    2. Send only top candidates to Gemini (reduces prompt size)
    3. Use caching for repeated requests
    """
    try:
        # Check cache first
        cache_key = _get_cache_key(tops, bottoms, count)
        if cache_key in _gemini_cache:
            cached_result = _gemini_cache[cache_key]
            # Return cached items with full data
            result = []
            for cached in cached_result:
                top_item = next((t for t in tops if t.get("id") == cached["top_id"]), None)
                bottom_item = next((b for b in bottoms if b.get("id") == cached["bottom_id"]), None)
                if top_item and bottom_item:
                    result.append({
                        "top": top_item,
                        "bottom": bottom_item,
                        "score": cached["score"],
                        "reasoning": cached["reasoning"],
                        "style_description": cached["style_description"],
                        "reasons": [cached["reasoning"]] if cached.get("reasoning") else []
                    })
            if result:
                return result[:count]
        
        # Step 1: Pre-filter with rule-based scoring (fast)
        candidates = []
        for top in tops:
            for bottom in bottoms:
                score, _ = calculate_outfit_score(top, bottom)
                candidates.append({
                    "top": top,
                    "bottom": bottom,
                    "score": score
                })
        
        # Sort and take top candidates
        candidates.sort(key=lambda x: x["score"], reverse=True)
        top_candidates_list = candidates[:min(top_candidates, len(candidates))]
        
        if not top_candidates_list:
            return []
        
        # Step 2: Prepare only top candidates for Gemini (reduces prompt size significantly)
        tops_summary = []
        bottoms_summary = []
        candidate_tops = {}
        candidate_bottoms = {}
        
        for candidate in top_candidates_list:
            top = candidate["top"]
            bottom = candidate["bottom"]
            top_id = top.get("id")
            bottom_id = bottom.get("id")
            
            if top_id not in candidate_tops:
                attrs = top.get("attributes", {})
                candidate_tops[top_id] = top
                tops_summary.append({
                    "id": top_id,
                    "cat": attrs.get("category", {}).get("sub", "unknown"),
                    "col": attrs.get("color", {}).get("primary", "unknown"),
                    "style": attrs.get("style_tags", [])[:3],  # Limit style tags
                    "form": round(attrs.get("scores", {}).get("formality", 0.5), 2)
                })
            
            if bottom_id not in candidate_bottoms:
                attrs = bottom.get("attributes", {})
                candidate_bottoms[bottom_id] = bottom
                bottoms_summary.append({
                    "id": bottom_id,
                    "cat": attrs.get("category", {}).get("sub", "unknown"),
                    "col": attrs.get("color", {}).get("primary", "unknown"),
                    "style": attrs.get("style_tags", [])[:3],  # Limit style tags
                    "form": round(attrs.get("scores", {}).get("formality", 0.5), 2)
                })
        
        # Step 3: Optimized, shorter prompt
        prompt = f"""Recommend {count} best outfit(s) from these {len(top_candidates_list)} pre-filtered combinations.

Tops: {json.dumps(tops_summary, ensure_ascii=False)}
Bottoms: {json.dumps(bottoms_summary, ensure_ascii=False)}

Consider color harmony, style match, formality balance.

Return JSON array with {count} object(s):
{{
  "top_id": "string",
  "bottom_id": "string",
  "score": 0.0-1.0,
  "reasoning": "한국어 100자 이내",
  "style_description": "한국어 50자 이내"
}}

JSON only, no markdown."""

        # Step 4: Call Gemini with timeout
        import signal
        
        try:
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 500,  # Limit response size
                }
            )
            response_text = response.text.strip()
        except Exception as e:
            print(f"Gemini API error: {e}")
            # Fallback to rule-based
            return [{
                "top": c["top"],
                "bottom": c["bottom"],
                "score": c["score"],
                "reasoning": "규칙 기반 추천",
                "style_description": f"{c['top'].get('attributes', {}).get('category', {}).get('sub', 'Top')} & {c['bottom'].get('attributes', {}).get('category', {}).get('sub', 'Bottom')}",
                "reasons": []
            } for c in top_candidates_list[:count]]
        
        # Step 5: Parse response
        parsed, repaired = parse_json_from_text(response_text)
        if parsed is None:
            # Fallback to rule-based
            return [{
                "top": c["top"],
                "bottom": c["bottom"],
                "score": c["score"],
                "reasoning": "규칙 기반 추천",
                "style_description": f"{c['top'].get('attributes', {}).get('category', {}).get('sub', 'Top')} & {c['bottom'].get('attributes', {}).get('category', {}).get('sub', 'Bottom')}",
                "reasons": []
            } for c in top_candidates_list[:count]]
        
        # Ensure parsed is a list
        if isinstance(parsed, dict):
            parsed = [parsed]
        elif not isinstance(parsed, list):
            # Fallback if parsed is neither dict nor list
            return [{
                "top": c["top"],
                "bottom": c["bottom"],
                "score": c["score"],
                "reasoning": "규칙 기반 추천",
                "style_description": f"{c['top'].get('attributes', {}).get('category', {}).get('sub', 'Top')} & {c['bottom'].get('attributes', {}).get('category', {}).get('sub', 'Bottom')}",
                "reasons": []
            } for c in top_candidates_list[:count]]
        
        # Step 6: Map back to full item objects and cache
        result = []
        cache_data = []
        for rec in parsed:
            top_id = rec.get("top_id")
            bottom_id = rec.get("bottom_id")
            
            top_item = candidate_tops.get(top_id) or next((t for t in tops if t.get("id") == top_id), None)
            bottom_item = candidate_bottoms.get(bottom_id) or next((b for b in bottoms if b.get("id") == bottom_id), None)
            
            if top_item and bottom_item:
                result.append({
                    "top": top_item,
                    "bottom": bottom_item,
                    "score": float(rec.get("score", 0.5)),
                    "reasoning": rec.get("reasoning", ""),
                    "style_description": rec.get("style_description", ""),
                    "reasons": [rec.get("reasoning", "AI 추천")] if rec.get("reasoning") else []
                })
                cache_data.append({
                    "top_id": top_id,
                    "bottom_id": bottom_id,
                    "score": float(rec.get("score", 0.5)),
                    "reasoning": rec.get("reasoning", ""),
                    "style_description": rec.get("style_description", "")
                })
        
        # Cache the result (with size limit)
        if cache_data and len(_gemini_cache) < _cache_max_size:
            _gemini_cache[cache_key] = cache_data
        
        return result[:count]
    
    except Exception as e:
        print(f"Gemini recommendation error: {e}")
        # Fallback to rule-based
        candidates = []
        for top in tops[:10]:  # Limit for fallback
            for bottom in bottoms[:10]:
                score, reasons = calculate_outfit_score(top, bottom)
                candidates.append({
                    "top": top,
                    "bottom": bottom,
                    "score": score,
                    "reasoning": ", ".join(reasons),
                    "style_description": f"{top.get('attributes', {}).get('category', {}).get('sub', 'Top')} & {bottom.get('attributes', {}).get('category', {}).get('sub', 'Bottom')}",
                    "reasons": reasons
                })
        candidates.sort(key=lambda x: x["score"], reverse=True)
        return candidates[:count]

@app.route('/api/outfit/score', methods=['GET'])
def get_outfit_score():
    """Calculate outfit score for a specific top-bottom combination"""
    try:
        top_id = request.args.get('top_id')
        bottom_id = request.args.get('bottom_id')
        
        if not top_id or not bottom_id:
            return jsonify({"error": "top_id and bottom_id are required"}), 400
        
        # Load all items
        all_items = load_wardrobe_items()
        
        # Find the items
        top_item = next((item for item in all_items if item.get("id") == top_id), None)
        bottom_item = next((item for item in all_items if item.get("id") == bottom_id), None)
        
        if not top_item or not bottom_item:
            return jsonify({"error": "Items not found"}), 404
        
        # Calculate score
        score, reasons = calculate_outfit_score(top_item, bottom_item)
        
        return jsonify({
            "success": True,
            "score": round(score, 3),
            "score_percent": round(score * 100),
            "reasons": reasons,
            "top": top_item,
            "bottom": bottom_item
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recommend/outfit', methods=['GET'])
def recommend_outfit():
    """Recommend outfit combinations (top + bottom) using Gemini"""
    try:
        count = int(request.args.get('count', 1))
        season = request.args.get('season', None)
        formality = request.args.get('formality', None)
        use_gemini = request.args.get('use_gemini', 'true').lower() == 'true'
        
        # Load all items
        all_items = load_wardrobe_items()
        
        # Filter by category
        tops = [item for item in all_items 
                if item.get("attributes", {}).get("category", {}).get("main") == "top"]
        bottoms = [item for item in all_items 
                   if item.get("attributes", {}).get("category", {}).get("main") == "bottom"]
        
        if not tops or not bottoms:
            return jsonify({
                "success": True,
                "outfits": [],
                "message": "Not enough items in wardrobe (need at least one top and one bottom)"
            })
        
        # Apply optional filters
        if season:
            tops = [t for t in tops 
                   if season.lower() in t.get("attributes", {}).get("scores", {}).get("season", [])]
            bottoms = [b for b in bottoms 
                       if season.lower() in b.get("attributes", {}).get("scores", {}).get("season", [])]
        
        if formality:
            target_formality = float(formality)
            tops = [t for t in tops 
                   if abs(t.get("attributes", {}).get("scores", {}).get("formality", 0.5) - target_formality) <= 0.3]
            bottoms = [b for b in bottoms 
                       if abs(b.get("attributes", {}).get("scores", {}).get("formality", 0.5) - target_formality) <= 0.3]
        
        if not tops or not bottoms:
            return jsonify({
                "success": True,
                "outfits": [],
                "message": "No items match the filters"
            })
        
        # Use Gemini for recommendation (with optimization)
        if use_gemini:
            # Pre-filter to reduce Gemini workload
            # Only send top 5 candidates to Gemini for faster response
            recommendations = recommend_outfit_with_gemini(tops, bottoms, count, top_candidates=5)
            if recommendations:
                return jsonify({
                    "success": True,
                    "outfits": recommendations,
                    "count": len(recommendations),
                    "method": "gemini-optimized"
                })
        
        # Fallback to rule-based if Gemini fails or disabled
        combinations = []
        for top in tops:
            for bottom in bottoms:
                score, reasons = calculate_outfit_score(top, bottom)
                combinations.append({
                    "top": top,
                    "bottom": bottom,
                    "score": round(score, 3),
                    "reasons": reasons,
                    "reasoning": ", ".join(reasons),
                    "style_description": f"{top.get('attributes', {}).get('category', {}).get('sub', 'Top')} & {bottom.get('attributes', {}).get('category', {}).get('sub', 'Bottom')}"
                })
        
        combinations.sort(key=lambda x: x["score"], reverse=True)
        top_combinations = combinations[:count]
        
        return jsonify({
            "success": True,
            "outfits": top_combinations,
            "count": len(top_combinations),
            "method": "rule-based"
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
