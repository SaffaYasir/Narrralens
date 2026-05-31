from flask import Blueprint, request, jsonify, current_app, send_file
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white, Color
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, KeepTogether, PageBreak)
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from analysis_engine import run_full_analysis
from ai_narrator import generate_narrative
import re

report_bp = Blueprint('report', __name__)

PRIMARY    = HexColor('#6366f1')
PRIMARY_D  = HexColor('#4f46e5')
ACCENT     = HexColor('#a5b4fc')
ACCENT2    = HexColor('#f0abfc')
DARK       = HexColor('#0f172a')
GRAY       = HexColor('#64748b')
LIGHT_BG   = HexColor('#f1f5f9')
MID_BG     = HexColor('#e2e8f0')
SUCCESS    = HexColor('#10b981')
WARNING    = HexColor('#f59e0b')
DANGER     = HexColor('#ef4444')
WHITE      = white
TEXT_DARK  = HexColor('#1e293b')
TEXT_MID   = HexColor('#475569')

PAGE_W = A4[0] - 4*cm   # usable width


def strip_markdown(text):
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'#{1,6}\s+', '', text)
    text = re.sub(r'`(.*?)`', r'\1', text)
    return text.strip()


def build_pdf(filepath, ext, output_path, filename="Dataset", user_preferences=None):
    analysis = run_full_analysis(filepath, ext)
    narrative_result = generate_narrative(analysis, user_preferences)
    narrative_text = narrative_result.get("narrative", "")
    insight_cards = narrative_result.get("insight_cards", [])

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2.5*cm,
        bottomMargin=2.5*cm,
        title=f"NarraLens Report – {filename}",
        author="NarraLens AI"
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Styles ────────────────────────────────────────────────────────────────
    def S(name, **kw):
        return ParagraphStyle(name, parent=styles['Normal'], **kw)

    title_s   = S('DS_Title',   fontSize=30, textColor=WHITE,     fontName='Helvetica-Bold', alignment=TA_CENTER, spaceAfter=4, leading=36)
    sub_s     = S('DS_Sub',     fontSize=12, textColor=ACCENT,    fontName='Helvetica',      alignment=TA_CENTER, spaceAfter=4, leading=18)
    meta_s    = S('DS_Meta',    fontSize=10, textColor=ACCENT,    fontName='Helvetica',      alignment=TA_CENTER, spaceAfter=0)
    h1_s      = S('DS_H1',      fontSize=18, textColor=PRIMARY,   fontName='Helvetica-Bold', spaceBefore=20, spaceAfter=10, leading=22, borderPad=(0,0,4,0))
    h2_s      = S('DS_H2',      fontSize=14, textColor=TEXT_DARK, fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=6,  leading=18)
    body_s    = S('DS_Body',    fontSize=10, textColor=TEXT_DARK, fontName='Helvetica',      leading=16, spaceAfter=8, alignment=TA_JUSTIFY)
    bullet_s  = S('DS_Bullet',  fontSize=10, textColor=TEXT_DARK, fontName='Helvetica',      leading=16, leftIndent=16, spaceAfter=5, bulletIndent=4)
    num_s     = S('DS_Num',     fontSize=10, textColor=TEXT_DARK, fontName='Helvetica',      leading=16, leftIndent=20, spaceAfter=5)
    card_val  = S('DS_CardVal', fontSize=20, textColor=PRIMARY,   fontName='Helvetica-Bold', leading=24, spaceAfter=2, alignment=TA_CENTER)
    card_ttl  = S('DS_CardTtl', fontSize=9,  textColor=TEXT_MID,  fontName='Helvetica-Bold', leading=12, spaceAfter=4, alignment=TA_CENTER)
    card_desc = S('DS_CardDsc', fontSize=8,  textColor=GRAY,      fontName='Helvetica',      leading=11, alignment=TA_CENTER)
    footer_s  = S('DS_Footer',  fontSize=8,  textColor=GRAY,      fontName='Helvetica',      alignment=TA_CENTER)
    th_s      = S('DS_TH',      fontSize=9,  textColor=WHITE,     fontName='Helvetica-Bold', alignment=TA_CENTER)
    td_s      = S('DS_TD',      fontSize=9,  textColor=TEXT_DARK, fontName='Helvetica',      alignment=TA_RIGHT,  leading=13)
    td_left_s = S('DS_TDL',     fontSize=9,  textColor=TEXT_DARK, fontName='Helvetica-Bold', alignment=TA_LEFT,   leading=13)

    # ── Cover block ───────────────────────────────────────────────────────────
    cover_rows = [
        [Paragraph("NarraLens", title_s)],
        [Paragraph(f"AI-Generated Data Report", sub_s)],
        [Paragraph(f"<b>{filename}</b>", sub_s)],
        [Paragraph(f"{analysis['shape']['rows']:,} rows  ×  {analysis['shape']['columns']} columns", meta_s)],
    ]
    cover = Table(cover_rows, colWidths=[PAGE_W])
    cover.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,-1), PRIMARY),
        ('TOPPADDING',   (0,0), (-1, 0), 28),
        ('BOTTOMPADDING',(0,-1),(-1,-1), 28),
        ('TOPPADDING',   (0,1), (-1,-2), 6),
        ('BOTTOMPADDING',(0,1), (-1,-2), 6),
        ('LEFTPADDING',  (0,0), (-1,-1), 24),
        ('RIGHTPADDING', (0,0), (-1,-1), 24),
    ]))
    story.append(cover)
    story.append(Spacer(1, 20))

    # ── Insight cards (bigger, 3-per-row) ─────────────────────────────────────
    if insight_cards:
        story.append(Paragraph("Key Insights", h1_s))
        story.append(HRFlowable(width=PAGE_W, thickness=1.5, color=PRIMARY, spaceAfter=12))

        card_rows = []
        row = []
        type_colors = {
            "positive": SUCCESS, "negative": DANGER,
            "warning": WARNING,  "neutral":  PRIMARY
        }
        icon_map = {
            "trend-up": "↑", "trend-down": "↓",
            "alert": "⚠", "star": "★",
            "chart": "◈", "info": "ℹ"
        }

        for i, card in enumerate(insight_cards[:6]):
            clr = type_colors.get(card.get("type","neutral"), PRIMARY)
            icon_char = icon_map.get(card.get("icon","chart"), "◈")

            val_para  = Paragraph(f'<font color="#{clr.hexval()[2:]}">{card.get("value","")}</font>', card_val)
            icon_para = Paragraph(f'<font size="14">{icon_char}</font> {card.get("title","")}', card_ttl)
            desc_para = Paragraph(card.get("description",""), card_desc)

            cell = Table([[icon_para],[val_para],[desc_para]], colWidths=[5.5*cm])
            cell.setStyle(TableStyle([
                ('BACKGROUND',    (0,0),(-1,-1), LIGHT_BG),
                ('BOX',           (0,0),(-1,-1), 1.5, clr),
                ('TOPPADDING',    (0,0),(-1,-1), 10),
                ('BOTTOMPADDING', (0,0),(-1,-1), 10),
                ('LEFTPADDING',   (0,0),(-1,-1), 8),
                ('RIGHTPADDING',  (0,0),(-1,-1), 8),
                ('ROUNDEDCORNERS',[6,6,6,6]),
            ]))
            row.append(cell)

            if len(row) == 3 or i == len(insight_cards)-1:
                while len(row) < 3:
                    row.append(Paragraph("", body_s))
                card_rows.append(row)
                row = []

        cards_table = Table(card_rows, colWidths=[5.7*cm, 5.7*cm, 5.7*cm], hAlign='CENTER')
        cards_table.setStyle(TableStyle([
            ('TOPPADDING',    (0,0),(-1,-1), 6),
            ('BOTTOMPADDING', (0,0),(-1,-1), 6),
            ('LEFTPADDING',   (0,0),(-1,-1), 4),
            ('RIGHTPADDING',  (0,0),(-1,-1), 4),
            ('VALIGN',        (0,0),(-1,-1), 'TOP'),
        ]))
        story.append(cards_table)
        story.append(Spacer(1, 20))

    # ── Statistics table ──────────────────────────────────────────────────────
    stats = analysis.get("statistics", {})
    if stats:
        story.append(Paragraph("Statistical Summary", h1_s))
        story.append(HRFlowable(width=PAGE_W, thickness=1.5, color=PRIMARY, spaceAfter=12))

        header = ["Column", "Mean", "Median", "Std Dev", "Min", "Max", "Missing%"]
        hdr_row = [Paragraph(h, th_s) for h in header]
        rows = [hdr_row]

        for col, s in list(stats.items())[:15]:
            def fmt(v):
                if v is None: return "—"
                try:
                    f = float(v)
                    if abs(f) >= 1e6:  return f"{f:,.0f}"
                    if abs(f) >= 1000: return f"{f:,.1f}"
                    return f"{f:.3f}".rstrip('0').rstrip('.')
                except: return str(v)

            rows.append([
                Paragraph(str(col)[:22], td_left_s),
                Paragraph(fmt(s.get("mean")),   td_s),
                Paragraph(fmt(s.get("median")), td_s),
                Paragraph(fmt(s.get("std")),    td_s),
                Paragraph(fmt(s.get("min")),    td_s),
                Paragraph(fmt(s.get("max")),    td_s),
                Paragraph(f"{s.get('missing_pct',0)}%", td_s),
            ])

        col_w = [4.8*cm, 2.1*cm, 2.1*cm, 2.1*cm, 2.1*cm, 2.1*cm, 2.2*cm]
        t = Table(rows, colWidths=col_w, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND',   (0,0), (-1,0),  PRIMARY),
            ('TEXTCOLOR',    (0,0), (-1,0),  WHITE),
            ('FONTNAME',     (0,0), (-1,0),  'Helvetica-Bold'),
            ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_BG]),
            ('GRID',         (0,0), (-1,-1), 0.4, MID_BG),
            ('LINEBELOW',    (0,0), (-1,0),  1.5, PRIMARY_D),
            ('TOPPADDING',   (0,0), (-1,-1), 6),
            ('BOTTOMPADDING',(0,0), (-1,-1), 6),
            ('LEFTPADDING',  (0,0), (-1,-1), 7),
            ('RIGHTPADDING', (0,0), (-1,-1), 7),
            ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

    # ── Correlations table ────────────────────────────────────────────────────
    top_pairs = analysis.get("correlations", {}).get("top_pairs", [])
    if top_pairs:
        story.append(Paragraph("Top Correlations", h1_s))
        story.append(HRFlowable(width=PAGE_W, thickness=1.5, color=PRIMARY, spaceAfter=12))

        corr_header = [Paragraph(h, th_s) for h in ["Column A", "Column B", "Correlation", "Strength"]]
        corr_rows = [corr_header]
        for pair in top_pairs[:8]:
            val = pair.get("correlation", 0)
            strength = "Strong" if abs(val) > 0.7 else "Moderate" if abs(val) > 0.4 else "Weak"
            clr_hex = "#10b981" if abs(val) > 0.7 else "#f59e0b" if abs(val) > 0.4 else "#64748b"
            corr_rows.append([
                Paragraph(str(pair.get("col1",""))[:20], td_left_s),
                Paragraph(str(pair.get("col2",""))[:20], td_left_s),
                Paragraph(f'<font color="{clr_hex}"><b>{val:.4f}</b></font>',
                          S('cv', fontSize=9, fontName='Helvetica', alignment=TA_CENTER)),
                Paragraph(strength, td_s),
            ])
        ct = Table(corr_rows, colWidths=[5*cm, 5*cm, 3.5*cm, 3*cm], repeatRows=1)
        ct.setStyle(TableStyle([
            ('BACKGROUND',    (0,0),(-1,0),  PRIMARY),
            ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT_BG]),
            ('GRID',          (0,0),(-1,-1), 0.4, MID_BG),
            ('LINEBELOW',     (0,0),(-1,0),  1.5, PRIMARY_D),
            ('TOPPADDING',    (0,0),(-1,-1), 6),
            ('BOTTOMPADDING', (0,0),(-1,-1), 6),
            ('LEFTPADDING',   (0,0),(-1,-1), 7),
            ('RIGHTPADDING',  (0,0),(-1,-1), 7),
        ]))
        story.append(ct)
        story.append(Spacer(1, 20))

    # ── Narrative report ──────────────────────────────────────────────────────
    story.append(HRFlowable(width=PAGE_W, thickness=1, color=MID_BG, spaceAfter=16))
    story.append(Paragraph("AI-Generated Narrative Report", h1_s))
    story.append(HRFlowable(width=PAGE_W, thickness=1.5, color=PRIMARY, spaceAfter=16))

    in_list = False
    for line in narrative_text.split('\n'):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 5))
            in_list = False
            continue

        if line.startswith('## ') or line.startswith('# '):
            heading = line.lstrip('#').strip()
            story.append(Paragraph(heading, h1_s))
            story.append(HRFlowable(width=PAGE_W, thickness=0.5, color=ACCENT, spaceAfter=8))
            in_list = False

        elif re.match(r'^\d+\.', line):
            # Numbered list — render bold title + body nicely
            clean = re.sub(r'^\d+\.\s*', '', line)
            # Try to bold the part before the first colon
            if ':' in clean:
                parts = clean.split(':', 1)
                bold_part = re.sub(r'\*\*(.*?)\*\*', r'\1', parts[0].strip())
                rest = strip_markdown(parts[1].strip())
                text = f"<b>{bold_part}:</b> {rest}"
            else:
                text = strip_markdown(clean)
            story.append(Paragraph(f"• {text}", bullet_s))
            in_list = True

        elif line.startswith('- ') or line.startswith('* '):
            clean = strip_markdown(line[2:])
            story.append(Paragraph(f"• {clean}", bullet_s))
            in_list = True

        else:
            # Handle inline bold in body text
            def md_to_rl(t):
                t = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', t)
                t = re.sub(r'\*(.*?)\*', r'<i>\1</i>', t)
                return t
            clean = md_to_rl(line)
            story.append(Paragraph(clean, body_s))
            in_list = False

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 24))
    story.append(HRFlowable(width=PAGE_W, thickness=0.5, color=MID_BG, spaceAfter=8))
    story.append(Paragraph(
        "Generated by <b>NarraLens</b> — AI-Powered Data Narrative Engine &nbsp;·&nbsp; Powered by Claude AI",
        footer_s
    ))

    doc.build(story)


@report_bp.route('/report/<file_id>', methods=['GET', 'POST'])
def generate_report(file_id):
    upload_folder = current_app.config['UPLOAD_FOLDER']
    reports_folder = current_app.config['REPORTS_FOLDER']

    # Accept user preferences from POST body
    user_preferences = None
    if request.method == 'POST':
        user_preferences = request.get_json() or {}

    filepath = None
    ext = None
    orig_name = file_id
    for f in os.listdir(upload_folder):
        if f.startswith(file_id):
            filepath = os.path.join(upload_folder, f)
            ext = f.rsplit('.', 1)[1].lower()
            break

    if not filepath:
        return jsonify({"error": "File not found"}), 404

    # Add pref hash to filename so different preferences create different PDFs
    pref_suffix = ""
    if user_preferences:
        import hashlib, json
        pref_suffix = "_" + hashlib.md5(json.dumps(user_preferences, sort_keys=True).encode()).hexdigest()[:8]

    output_path = os.path.join(reports_folder, f"{file_id}{pref_suffix}_report.pdf")

    try:
        build_pdf(filepath, ext, output_path, filename=orig_name, user_preferences=user_preferences)
        return send_file(
            output_path,
            as_attachment=True,
            download_name="narrralens_report.pdf",
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({"error": f"Report generation failed: {str(e)}"}), 500
