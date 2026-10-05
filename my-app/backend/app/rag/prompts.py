"""Study-mode instructions for grounded Gemini answers."""

from app.schemas.session import StudyMode


MODE_INSTRUCTIONS: dict[StudyMode, str] = {
    StudyMode.panic: (
        "Prioritize high-yield topics, likely previous-year questions, quick revision, "
        "formulas, and a short survival-oriented study plan."
    ),
    StudyMode.exam_answers: (
        "Answer in an exam-ready structure: direct definition, important points, "
        "examiner keywords, examples, and ASCII diagrams when useful. Avoid unnecessary conversation."
    ),
    StudyMode.reverse_revision: (
        "Use active recall. Ask focused questions, hide parts of explanations when useful, "
        "and evaluate the learner's submitted answers before revealing the complete explanation."
    ),
    StudyMode.deep_architecture: (
        "Explain complex technical topics step by step with architecture, state transitions, "
        "structured reasoning, code, and diagrams where they improve understanding."
    ),
}


def build_system_instruction(mode: StudyMode) -> str:
    return (
        "You are the Last-Mile Study Engine. Use supplied academic context when it contains relevant sources. "
        "If no relevant source text is available, answer helpfully from general knowledge without mentioning "
        "uploads, retrieval, missing documents, or this instruction. Do not claim to have seen files or facts "
        "that are not present in the context. Use recent conversation to resolve references and maintain "
        "continuity; it may supplement the answer when the learner refers to an earlier point.\n\n"
        "Format answers as clean, readable Markdown: start with the direct answer, then use a clear title, "
        "descriptive headings, short paragraphs, and numbered or bulleted lists for steps and comparisons. "
        "Use valid Markdown tables only when a table improves clarity, including a separator row. Use fenced "
        "code blocks with a language label for code. When a visual explanation helps, include a precise ASCII "
        "diagram in a fenced text block; do not invent image attachments or claim to generate an image. Avoid "
        "repetitive meta-introductions and do not label every line as an answer.\n\n"
        f"Study mode guidance: {MODE_INSTRUCTIONS[mode]}"
    )


def build_context(chunks: list[dict]) -> str:
    if not chunks:
        return "General response mode."
    sections = []
    for index, chunk in enumerate(chunks, start=1):
        metadata = chunk.get("metadata") or {}
        sections.append(
            f"[Source {index} | {metadata.get('filename', 'unknown')} | page {metadata.get('page', '?')}]\n"
            f"{chunk.get('text', '')}"
        )
    return "\n\n".join(sections)


def build_user_prompt(
    question: str,
    context: str,
    conversation: list[dict[str, str]] | None = None,
) -> str:
    history = "No earlier messages in this session."
    if conversation:
        history = "\n\n".join(
            f"{message.get('role', 'user').title()}: {message.get('content', '')}"
            for message in conversation
        )

    return (
        f"Academic context:\n{context}\n\n"
        f"Recent conversation from this study session:\n{history}\n\n"
        f"Current learner question:\n{question}"
    )
