import anthropic
import json
import os


def generate_narrative(analysis: dict, user_preferences: dict = None) -> dict:
    """Generate a full written narrative report using Claude."""
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    summary = {
        "shape": analysis["shape"],
        "columns": analysis["columns"],
        "numeric_cols": analysis["numeric_cols"],
        "categorical_cols": analysis["categorical_cols"],
        "datetime_cols": analysis["datetime_cols"],
        "statistics": analysis["statistics"],
        "top_correlations": analysis["correlations"]["top_pairs"][:5],
        "outliers": {k: v for k, v in list(analysis["outliers"].items())[:5]},
        "trends": analysis["trends"][:3],
        "peak_insights": analysis["peak_insights"][:5],
        "categorical_analysis": {k: v for k, v in list(analysis["categorical_analysis"].items())[:3]},
        "total_missing": analysis["total_missing"],
        "anomaly_count": len(analysis["anomaly_rows"])
    }

    pref_instructions = ""
    if user_preferences:
        tone = user_preferences.get("tone", "professional")
        focus = user_preferences.get("focus", [])
        detail = user_preferences.get("detail", "standard")
        custom_note = user_preferences.get("custom_note", "")
        pref_instructions = f"""
\nUSER PREFERENCES:
- Tone: {tone}
- Detail: {detail} ({"concise" if detail == "brief" else "thorough"})
- Focus: {", ".join(focus) if focus else "all areas equally"}
- Custom: {custom_note if custom_note else "none"}
"""

    # Build a concrete stats context string so Claude can use real numbers
    stats_context = []
    for col, s in list(summary["statistics"].items())[:6]:
        stats_context.append(f"  {col}: mean={s.get('mean')}, median={s.get('median')}, std={s.get('std')}, min={s.get('min')}, max={s.get('max')}")
    stats_str = "\n".join(stats_context) or "  (no numeric columns)"

    cat_context = []
    for col, info in list(summary["categorical_analysis"].items())[:3]:
        cat_context.append(f"  {col}: {info.get('unique_count')} unique, top='{info.get('top_value')}' ({info.get('top_pct')}%)")
    cat_str = "\n".join(cat_context) or "  (no categorical columns)"

    prompt = f"""You are a senior data analyst. Write a professional data story report AND generate insight cards.

DATASET FACTS:
- Shape: {summary['shape']['rows']:,} rows × {summary['shape']['columns']} columns
- Numeric columns: {', '.join(summary['numeric_cols'][:8]) or 'none'}
- Categorical columns: {', '.join(summary['categorical_cols'][:5]) or 'none'}
- DateTime columns: {', '.join(summary['datetime_cols']) or 'none'}
- Total missing values: {summary['total_missing']}
- Anomalies detected: {summary['anomaly_count']}

KEY STATISTICS:
{stats_str}

TOP CORRELATIONS:
{json.dumps(summary['top_correlations'][:4], indent=2)}

CATEGORICAL BREAKDOWN:
{cat_str}

PEAKS & TRENDS:
{json.dumps(summary['peak_insights'][:4], indent=2)}
{pref_instructions}

Write a complete data story with these EXACT section headings (use ##):

## Executive Summary
2–3 sentences. Include the most striking specific numbers.

## Dataset Overview
Structure, what data likely represents, quality notes.

## Key Findings
Exactly 5 numbered findings, each starting with a bold title:
1. **[Title]**: Specific stat + interpretation.
(use real numbers from the statistics above)

## Statistical Deep Dive
Distributions, spread, skewness for the key numeric columns.

## Correlations & Relationships
What the correlations mean. Reference specific column pairs.

## Anomalies & Outliers
How many, which columns, what they might indicate.

## Trends & Patterns
Temporal or structural patterns found.

## Recommendations
Exactly 4 numbered, actionable recommendations.

## Conclusion
2 sentences wrapping up.

---JSON---
Then output insight cards as a JSON array. Generate between 3 and 8 cards — only include cards where you have a REAL, SPECIFIC value from the dataset (not a placeholder). Do NOT pad with generic cards.

Each card must use actual column names and actual numbers from the statistics provided above.

Format (output only the JSON array, no extra text):
[
  {{"icon": "trend-up", "title": "Total Records", "value": "{summary['shape']['rows']:,}", "description": "Rows analyzed in this dataset", "type": "neutral"}},
  {{"icon": "chart", "title": "<key numeric metric>", "value": "<mean or total with units>", "description": "<column name and context>", "type": "positive"}},
  {{"icon": "alert", "title": "Anomalies", "value": "{summary['anomaly_count']}", "description": "Records flagged by IsolationForest", "type": "{"warning" if summary['anomaly_count'] > 0 else "positive"}"}},
  {{"icon": "info", "title": "Missing Values", "value": "{summary['total_missing']}", "description": "Total empty cells across all columns", "type": "{"warning" if summary['total_missing'] > 0 else "positive"}"}},
  {{"icon": "star", "title": "<another key insight>", "value": "<specific number>", "description": "<brief explanation>", "type": "positive"}},
  {{"icon": "trend-up", "title": "<correlation or pattern>", "value": "<specific value>", "description": "<what it means>", "type": "neutral"}}
]

Rules for cards:
- Replace ALL placeholder text with REAL values from the statistics above
- "value" field should be a SHORT number/metric (e.g., "42,301", "87.4%", "1,204.5", "$3.2M")
- Use real column names and real numbers — never generic placeholders
- Types: positive (green), negative (red), warning (yellow), neutral (purple)
- Icons: trend-up, trend-down, alert, star, chart, info"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3500,
        messages=[{"role": "user", "content": prompt}]
    )

    full_text = response.content[0].text

    if "---JSON---" in full_text:
        parts = full_text.split("---JSON---")
        narrative_text = parts[0].strip()
        json_part = parts[1].strip()
        # Clean up any markdown fences
        json_part = json_part.replace("```json", "").replace("```", "").strip()
        try:
            insight_cards = json.loads(json_part)
            # Ensure we always have exactly 6 cards
            if len(insight_cards) < 6:
                insight_cards += _fallback_cards(analysis)[len(insight_cards):]
        except Exception:
            insight_cards = _fallback_cards(analysis)
    else:
        narrative_text = full_text
        insight_cards = _fallback_cards(analysis)

    return {
        "narrative": narrative_text,
        "insight_cards": insight_cards
    }


def generate_followup_answer(question: str, analysis: dict, history: list) -> str:
    """Answer follow-up questions about the data with well-formatted responses."""
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    summary = {
        "shape": analysis.get("shape"),
        "columns": analysis.get("columns"),
        "statistics": analysis.get("statistics"),
        "top_correlations": analysis.get("correlations", {}).get("top_pairs", [])[:5],
        "peak_insights": analysis.get("peak_insights", [])[:5],
        "categorical_analysis": analysis.get("categorical_analysis", {}),
        "outliers": {k: v for k, v in list(analysis.get("outliers", {}).items())[:5]},
        "total_missing": analysis.get("total_missing", 0),
        "anomaly_count": len(analysis.get("anomaly_rows", []))
    }

    system_prompt = f"""You are a data analyst assistant. Answer questions about this specific dataset concisely and accurately.

Dataset:
{json.dumps(summary, indent=2)}

RULES:
- Keep answers to 2–6 sentences for simple questions; up to 10 for complex
- Use **bold** for key numbers and column names
- Bullet points only when listing 3+ items
- Answer the question directly first, then add brief context
- Use real numbers from the dataset — never say "I don't have access"
- If the answer isn't in the data, say what you can infer"""

    messages = []
    for msg in history[-8:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        system=system_prompt,
        messages=messages
    )

    return response.content[0].text


def _fallback_cards(analysis):
    """Generate 6 consistent insight cards from raw analysis data."""
    cards = []
    stats = analysis.get("statistics", {})
    shape = analysis.get("shape", {})
    anomaly_count = len(analysis.get("anomaly_rows", []))
    total_missing = analysis.get("total_missing", 0)

    # Card 1: Dataset size
    cards.append({
        "icon": "chart",
        "title": "Total Records",
        "value": f"{shape.get('rows', 0):,}",
        "description": f"{shape.get('columns', 0)} columns analyzed",
        "type": "neutral"
    })

    # Cards 2-4: From numeric stats
    for col, s in list(stats.items())[:3]:
        mean_val = s.get("mean", 0)
        if mean_val is not None:
            try:
                fv = float(mean_val)
                formatted = f"{fv:,.0f}" if abs(fv) >= 100 else f"{fv:.2f}"
            except:
                formatted = str(mean_val)
        else:
            formatted = "N/A"
        cards.append({
            "icon": "trend-up",
            "title": f"Avg {col[:18]}",
            "value": formatted,
            "description": f"Median: {s.get('median', 'N/A')} · Std: {s.get('std', 'N/A')}",
            "type": "neutral"
        })

    # Card 5: Anomalies
    cards.append({
        "icon": "alert",
        "title": "Anomalies",
        "value": str(anomaly_count),
        "description": "Unusual records flagged by ML",
        "type": "warning" if anomaly_count > 0 else "positive"
    })

    # Card 6: Data quality
    cards.append({
        "icon": "info",
        "title": "Missing Values",
        "value": str(total_missing),
        "description": "Empty cells across all columns",
        "type": "warning" if total_missing > 0 else "positive"
    })

    return cards