"""Generate the Unibud concept specification PDF from the handwritten source notes.

Usage: python3 spec/build_spec.py
Output: spec/unibud-concept-spec.pdf
"""

import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    NextPageTemplate,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "unibud-concept-spec.pdf")

ACCENT = colors.HexColor("#2E9E4F")      # the green the title was written in
INK = colors.HexColor("#1A1A1A")
MUTED = colors.HexColor("#6B6B6B")
RULE = colors.HexColor("#D8D8D8")
PANEL = colors.HexColor("#F4F6F2")

PAGE_W, PAGE_H = A4
MARGIN = 22 * mm


# --------------------------------------------------------------------------- styles
def build_styles():
    ss = getSampleStyleSheet()
    s = {}
    s["title"] = ParagraphStyle(
        "title", parent=ss["Title"], fontName="Helvetica-Bold", fontSize=30,
        leading=35, textColor=INK, spaceAfter=4, alignment=TA_LEFT,
    )
    s["subtitle"] = ParagraphStyle(
        "subtitle", parent=ss["Normal"], fontName="Helvetica", fontSize=13,
        leading=18, textColor=MUTED, spaceAfter=2, alignment=TA_LEFT,
    )
    s["meta"] = ParagraphStyle(
        "meta", parent=ss["Normal"], fontName="Helvetica", fontSize=9,
        leading=14, textColor=MUTED,
    )
    s["h1"] = ParagraphStyle(
        "h1", parent=ss["Heading1"], fontName="Helvetica-Bold", fontSize=16,
        leading=20, textColor=INK, spaceBefore=18, spaceAfter=2, keepWithNext=1,
    )
    s["h2"] = ParagraphStyle(
        "h2", parent=ss["Heading2"], fontName="Helvetica-Bold", fontSize=11.5,
        leading=15, textColor=ACCENT, spaceBefore=13, spaceAfter=4, keepWithNext=1,
    )
    s["body"] = ParagraphStyle(
        "body", parent=ss["Normal"], fontName="Helvetica", fontSize=10,
        leading=15, textColor=INK, spaceAfter=7,
    )
    s["bullet"] = ParagraphStyle(
        "bullet", parent=s["body"], fontSize=10, leading=14.5, spaceAfter=3,
    )
    s["quote"] = ParagraphStyle(
        "quote", parent=ss["Normal"], fontName="Helvetica-Oblique", fontSize=10,
        leading=15, textColor=INK, leftIndent=8, spaceAfter=3,
    )
    s["cell"] = ParagraphStyle(
        "cell", parent=ss["Normal"], fontName="Helvetica", fontSize=9,
        leading=12.5, textColor=INK,
    )
    s["cellb"] = ParagraphStyle(
        "cellb", parent=s["cell"], fontName="Helvetica-Bold",
    )
    s["cellh"] = ParagraphStyle(
        "cellh", parent=s["cell"], fontName="Helvetica-Bold", textColor=colors.white,
    )
    s["caption"] = ParagraphStyle(
        "caption", parent=ss["Normal"], fontName="Helvetica", fontSize=8.5,
        leading=12, textColor=MUTED, alignment=TA_CENTER, spaceBefore=4,
    )
    return s


S = build_styles()


# --------------------------------------------------------------------------- helpers
def bullets(items, style=None):
    style = style or S["bullet"]
    return ListFlowable(
        [ListItem(Paragraph(t, style), leftIndent=14, value="bulletchar")
         for t in items],
        bulletType="bullet", bulletFontSize=9, bulletOffsetY=0.5,
        leftIndent=12, bulletColor=ACCENT, spaceAfter=6,
    )


def table(rows, widths, header=True):
    data = []
    for r_i, row in enumerate(rows):
        style = S["cellh"] if (header and r_i == 0) else S["cell"]
        data.append([Paragraph(c, style) for c in row])
    t = Table(data, colWidths=widths, hAlign="LEFT",
              repeatRows=1 if header else 0)
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE),
        ("BOX", (0, 0), (-1, -1), 0.6, RULE),
    ]
    if header:
        cmds += [
            ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
            ("LINEBELOW", (0, 0), (-1, 0), 0.6, ACCENT),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PANEL]),
        ]
    t.setStyle(TableStyle(cmds))
    return t


def rule(color=RULE, width=0.8, space_before=2, space_after=10):
    return HRFlowable(width="100%", thickness=width, color=color,
                      spaceBefore=space_before, spaceAfter=space_after)


def panel(flowables, pad=9):
    """Wrap flowables in a soft tinted box."""
    t = Table([[flowables]], colWidths=[PAGE_W - 2 * MARGIN], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.6, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), pad + 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad),
        ("TOPPADDING", (0, 0), (-1, -1), pad),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, ACCENT),
    ]))
    return t


# --------------------------------------------------------------------------- wireframes
def subjects_wireframe(width=72 * mm):
    """Folder grid — the 'subjects page' sketch, redrawn."""
    cell = ParagraphStyle("wf", parent=S["cell"], fontSize=8.5, alignment=TA_CENTER,
                          textColor=MUTED)
    names = ["Subject 1", "Subject 2", "Subject 3",
             "Subject 4", "Subject 5", "Subject 6"]
    rows = [[Paragraph("<b>Subjects</b>", ParagraphStyle(
        "wfh", parent=S["cell"], fontSize=9, alignment=TA_LEFT, textColor=INK)),
        Paragraph("Files", ParagraphStyle(
            "wff", parent=S["cell"], fontSize=8.5, alignment=TA_CENTER,
            textColor=MUTED))]]
    for i in range(0, 6, 2):
        rows.append([Paragraph(names[i], cell), Paragraph(names[i + 1], cell)])

    t = Table(rows, colWidths=[width / 2, width / 2],
              rowHeights=[9 * mm] + [13 * mm] * 3, hAlign="CENTER")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 0.9, INK),
        ("LINEBELOW", (0, 0), (-1, 0), 0.9, INK),
        ("INNERGRID", (0, 1), (-1, -1), 0.5, RULE),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("BACKGROUND", (0, 0), (-1, 0), PANEL),
    ]))
    return t


def subject_detail_wireframe(width=72 * mm):
    """Content panel + bottom tab bar — the 'inside the subject' sketch, redrawn."""
    body = Table(
        [[Paragraph("Chapters &amp; content<br/>(uploaded documents)",
                    ParagraphStyle("wfb", parent=S["cell"], fontSize=8.5,
                                   alignment=TA_CENTER, textColor=MUTED))]],
        colWidths=[width], rowHeights=[38 * mm], hAlign="CENTER")
    body.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 0.9, INK),
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
    ]))

    tabsty = ParagraphStyle("wft", parent=S["cell"], fontSize=8.5,
                            alignment=TA_CENTER, textColor=INK)
    tabs = Table([[Paragraph(x, tabsty) for x in ("doc", "todo", "deadline", "home")]],
                 colWidths=[width / 4] * 4, rowHeights=[8.5 * mm], hAlign="CENTER")
    tabs.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 0.9, INK),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, INK),
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
    ]))

    wrap = Table([[body], [tabs]], colWidths=[width], hAlign="CENTER")
    wrap.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 3),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return wrap


# --------------------------------------------------------------------------- chrome
def on_page(canvas, doc):
    canvas.saveState()
    # footer rule + page number
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 14 * mm, PAGE_W - MARGIN, 14 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 10 * mm, "Unibud — Concept Specification")
    canvas.drawRightString(PAGE_W - MARGIN, 10 * mm, "Page %d" % doc.page)
    canvas.restoreState()


def on_first_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(ACCENT)
    canvas.rect(0, PAGE_H - 10 * mm, PAGE_W, 10 * mm, stroke=0, fill=1)
    canvas.restoreState()
    on_page(canvas, doc)


# --------------------------------------------------------------------------- content
def story():
    st = []

    # ---- cover block (green bar only on page 1)
    st.append(NextPageTemplate("rest"))
    st.append(Spacer(1, 6 * mm))
    st.append(Paragraph("Unibud", S["title"]))
    st.append(Paragraph("Concept Specification", S["subtitle"]))
    st.append(rule(ACCENT, 1.6, 8, 10))
    st.append(Paragraph(
        "Transcribed and structured from four pages of handwritten notes "
        "(iOS notebook scan, 21 September 2026). Pages 1 and 4 of the source "
        "are a cover and a blank sheet; all content comes from pages 2 and 3.",
        S["meta"]))
    st.append(Spacer(1, 7 * mm))

    st.append(panel([
        Paragraph("<b>What this document is</b>", S["body"]),
        Paragraph(
            "A faithful write-up of the Unibud notes. Everything in "
            "<b>Part A</b> is a direct transcription of what the notes say. "
            "<b>Part B</b> onward is structure and interpretation derived from "
            "them — clearly separated so nothing gets mistaken for an "
            "original decision. Genuine gaps are collected in "
            "<b>Open Questions</b> rather than guessed at.", S["body"]),
    ]))

    # ---- Part A: transcription
    st.append(Paragraph("Part A &nbsp;·&nbsp; Source Transcription", S["h1"]))
    st.append(rule())

    st.append(Paragraph("Page 2 — feature notes", S["h2"]))
    st.append(Paragraph(
        'Titled "<b>Unibud</b>", hand-lettered in green inside a drawn cloud. '
        "Five feature lines, then a short checklist:", S["body"]))
    st.append(bullets([
        "add your subjects and schedule",
        "asks <b>daily</b> for your deadlines and assignments",
        "quizzes and deadlines tab, and reminders",
        "allows you to upload your documents",
        "allows you to divide the chapters and content",
    ], S["quote"]))
    st.append(Spacer(1, 2 * mm))
    st.append(table([
        ["Checklist item", "State in notes"],
        ["add schedule", "✓ ticked"],
        ["reminders", "unticked"],
        ["todo", "unticked"],
        ["upload data", "unticked"],
    ], [60 * mm, 40 * mm]))

    st.append(Paragraph("Page 3 — screen sketches", S["h2"]))
    st.append(Paragraph(
        'Two screens. The first is labelled "<b>subjects page</b>" with the word '
        '"<b>Files</b>" beside it: a two-column grid of six folder icons. The '
        'second is labelled "<b>inside the subject</b>": one large content panel '
        "with a four-item tab bar drawn beneath it.", S["body"]))
    st.append(Spacer(1, 2 * mm))

    wfs = Table(
        [[subjects_wireframe(), subject_detail_wireframe()],
         [Paragraph("Subjects page — folder grid", S["caption"]),
          Paragraph("Inside the subject — content + tab bar", S["caption"])]],
        colWidths=[(PAGE_W - 2 * MARGIN) / 2] * 2, hAlign="CENTER")
    wfs.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    st.append(KeepTogether(wfs))
    st.append(Spacer(1, 2 * mm))
    st.append(Paragraph(
        "The tab bar reads, left to right: <b>doc</b> | <b>todo</b> | "
        "<b>deadline</b> | <b>home</b>. Redrawn above from the sketch; "
        "proportions are approximate.", S["meta"]))

    # ---- Part B: what the notes describe
    st.append(Paragraph("Part B &nbsp;·&nbsp; The Product", S["h1"]))
    st.append(rule())

    st.append(Paragraph("Summary", S["h2"]))
    st.append(Paragraph(
        "Unibud is a study companion for university students. A student registers "
        "their subjects and their class schedule; the app then organises "
        "everything for those subjects — uploaded documents split into "
        "chapters, to-dos, quizzes and deadlines — and prompts the student "
        "daily to keep deadlines and assignments current.", S["body"]))

    st.append(Paragraph("The organising idea", S["h2"]))
    st.append(Paragraph(
        "<b>The subject is the container for everything.</b> The notes are "
        "consistent on this: the home screen is a grid of subjects drawn as "
        "folders, and documents, to-dos and deadlines all live inside a subject "
        "rather than in flat global lists. This single decision drives the data "
        "model and the navigation.", S["body"]))
    st.append(Paragraph(
        "<b>The daily prompt is the distinctive feature.</b> Most study apps wait "
        "for the student to enter data. These notes specify that Unibud asks, "
        "every day, for new deadlines and assignments — it pulls rather than "
        "waits. This implies a recurring notification and a fast capture flow, "
        "neither of which the notes describe yet.", S["body"]))

    st.append(Paragraph("Information architecture", S["h2"]))
    st.append(table([
        ["Level", "Contains", "From the notes"],
        ["<b>Student</b>",
         "Subjects, class schedule, daily prompt settings",
         '"add your subjects and schedule"'],
        ["<b>Subject</b>",
         "Documents, chapters, to-dos, deadlines, quizzes",
         'Folder grid; "inside the subject"'],
        ["<b>Document</b>",
         "Chapters / content sections",
         '"divide the chapters and content"'],
        ["<b>Cross-subject views</b>",
         "Deadlines &amp; quizzes tab, reminders",
         '"quizzes and deadlines tab and reminders"'],
    ], [32 * mm, 60 * mm, 60 * mm]))

    st.append(Paragraph("Screens and navigation", S["h2"]))
    st.append(Paragraph(
        "Four destinations are named in the sketched tab bar. Note that "
        "<b>home</b> sits in the same bar as the subject-level tabs, so the bar "
        "is most likely app-global rather than scoped to one subject:", S["body"]))
    st.append(table([
        ["Tab", "Purpose", "Source"],
        ["<b>home</b>", "Subjects grid; entry point and daily prompt surface",
         '"subjects page" sketch'],
        ["<b>doc</b>", "Uploaded documents, divided into chapters",
         '"upload your documents", "divide the chapters"'],
        ["<b>todo</b>", "Tasks, per subject and combined",
         'Checklist item "todo"'],
        ["<b>deadline</b>", "Deadlines and quizzes, with reminders",
         '"quizzes and deadlines tab and reminders"'],
    ], [26 * mm, 66 * mm, 60 * mm]))

    st.append(Paragraph("Feature inventory", S["h2"]))
    st.append(Paragraph(
        "Every feature stated in the notes, with the work each one implies. "
        "Effort is a rough relative estimate, not a schedule.", S["body"]))
    st.append(table([
        ["Feature", "What it implies", "Effort"],
        ["Add subjects",
         "Create / rename / delete a subject; the folder grid on home.", "Low"],
        ["Add schedule",
         "Weekly recurring class times per subject; a timetable view.", "Medium"],
        ["Daily prompt for deadlines &amp; assignments",
         "Recurring local notification at a chosen time, plus a quick-capture "
         "screen that writes straight into a subject.", "Medium"],
        ["Deadlines &amp; quizzes tab",
         "Dated items with a type (quiz / assignment / exam), sorted across all "
         "subjects.", "Low"],
        ["Reminders",
         "Scheduled notifications ahead of each deadline; needs a lead-time "
         "rule and permission handling.", "Medium"],
        ["To-dos",
         "Checkable tasks, owned by a subject, optionally linked to a deadline.",
         "Low"],
        ["Upload documents",
         "File picking, storage, and in-app viewing. Formats not specified in "
         "the notes.", "Medium"],
        ["Divide chapters and content",
         "Sectioning a document into chapters. The notes do not say whether "
         "this is manual or automatic — see Open Questions. This is the "
         "largest unknown in the concept.", "High"],
    ], [42 * mm, 100 * mm, 18 * mm]))

    # ---- Part C: build order
    st.append(KeepTogether([
        Paragraph("Part C &nbsp;·&nbsp; Build Order", S["h1"]),
        rule(),
        Paragraph(
            "The checklist on page 2 reads as an intended sequence — "
            "<i>add schedule → reminders → todo → upload data</i> — "
            "with the first item already ticked. Expanded, with subjects placed first "
            "because every later item depends on them:", S["body"]),
    ]))
    st.append(table([
        ["#", "Milestone", "Why here"],
        ["0", "Subjects: create, list, open",
         "Nothing else can be attached until a subject exists. Not in the "
         "checklist, but implied by every item that is."],
        ["1", "Schedule — <i>ticked in the notes</i>",
         "First item on the student's checklist; gives the app a reason to open "
         "daily."],
        ["2", "Deadlines, quizzes and reminders",
         "The reminder system and the daily prompt share one notification "
         "layer — build them together."],
        ["3", "To-dos",
         "Small, and reuses the subject and deadline models already built."],
        ["4", "Document upload",
         "First milestone needing file storage; deliberately after the cheaper "
         "wins."],
        ["5", "Chapter / content division",
         "Depends on upload, and carries the most unresolved design. Last by "
         "necessity."],
    ], [10 * mm, 55 * mm, 95 * mm]))

    st.append(Paragraph("Open questions", S["h2"]))
    st.append(Paragraph(
        "These are genuinely unanswered in the notes. Each one changes the scope "
        "of the work, so they are recorded rather than assumed away.", S["body"]))
    st.append(table([
        ["#", "Question", "Why it matters"],
        ["1", "<b>Which platform?</b> The sketched bottom tab bar points to a "
              "mobile app, but the notes never say.",
         "Decides the entire stack. The daily prompt and reminders depend on "
         "local notifications, which are far simpler on native mobile than on "
         "the web."],
        ["2", "<b>Is chapter division manual or automatic?</b> \"divide the "
              "chapters and content\" could mean the student marks sections by "
              "hand, or the app parses the file.",
         "Manual is a few days of work. Automatic parsing of arbitrary PDFs and "
         "slide decks is the single largest item in the project."],
        ["3", "<b>Which file types can be uploaded?</b> Not stated.",
         "PDF-only is straightforward; adding Word, slides and images multiplies "
         "the viewer and parsing work."],
        ["4", "<b>Local-only or synced account?</b> No mention of login, "
              "accounts or sharing.",
         "Local-only removes the backend entirely for v1. Sync adds auth, "
         "storage and cost."],
        ["5", "<b>When does the daily prompt fire, and what exactly does it "
              "ask?</b>",
         "This is the feature that makes Unibud distinctive; a badly timed or "
         "repetitive prompt is the fastest way to get the app muted."],
        ["6", "<b>Is the tab bar global or per subject?</b> \"home\" appearing "
              "inside the subject view is ambiguous.",
         "Determines whether to-dos and deadlines have cross-subject views, "
         "per-subject views, or both."],
    ], [10 * mm, 75 * mm, 75 * mm]))

    st.append(Paragraph("Suggested next step", S["h2"]))
    st.append(panel([
        Paragraph(
            "Answering questions 1 and 2 unblocks everything else. With a "
            "platform chosen and chapter division scoped to manual sectioning "
            "for v1, milestones 0–3 form a coherent first release: "
            "<b>subjects, schedule, deadlines with reminders, and to-dos</b> "
            "— a usable app without any document handling. Upload and "
            "chapters then land as a second release, which is also the order "
            "the handwritten checklist already puts them in.", S["body"]),
    ]))

    st.append(Spacer(1, 6 * mm))
    st.append(rule())
    st.append(Paragraph(
        "Source: 4-page handwritten notebook scan, <i>Unibud</i>. "
        "Pages 2–3 carry all content; pages 1 and 4 are a cover and a blank "
        "sheet. Transcription verified against page renders — the embedded "
        "OCR text layer in the original was unreliable and was not used.",
        S["meta"]))
    return st


def main():
    doc = BaseDocTemplate(
        OUT, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=20 * mm, bottomMargin=20 * mm,
        title="Unibud — Concept Specification",
        author="Unibud", subject="Product concept specification",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([
        PageTemplate(id="first", frames=[frame], onPage=on_first_page),
        PageTemplate(id="rest", frames=[frame], onPage=on_page),
    ])
    doc.build(story())
    print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
