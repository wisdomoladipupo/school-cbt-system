"""
Document parser for exam questions.
Supports Word (.docx) and PDF formats.

Expected format:
Question: Question text here?
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Answer: A or B or C or D

---

For next question...
"""

from docx import Document as DocxDocument
from PyPDF2 import PdfReader
import re
from typing import List, Tuple


class ParsedQuestion:
    def __init__(self, text: str, options: List[str], correct_answer: int):
        self.text = text
        self.options = options
        self.correct_answer = correct_answer


def parse_docx(filepath: str) -> List[ParsedQuestion]:
    """Parse questions from Word document"""
    doc = DocxDocument(filepath)
    text_content = "\n".join([para.text for para in doc.paragraphs])
    return parse_questions_from_text(text_content)


def parse_pdf(filepath: str) -> List[ParsedQuestion]:
    """Parse questions from PDF document"""
    reader = PdfReader(filepath)
    text_content = ""
    for page in reader.pages:
        text_content += page.extract_text() + "\n"
    return parse_questions_from_text(text_content)


def parse_questions_from_text(text: str) -> List[ParsedQuestion]:
    """Parse questions from raw text content"""
    questions = []
    
    # Split by question separator or multiple newlines
    question_blocks = re.split(r'\n\s*---\s*\n|\n\n\n+', text.strip())
    
    for block in question_blocks:
        if not block.strip():
            continue
            
        question = parse_single_question(block.strip())
        if question:
            questions.append(question)
    
    return questions


def parse_single_question(text: str) -> ParsedQuestion | None:
    """Parse a single question from text block"""
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    if len(lines) < 6:  # Need at least: Question, 4 options, answer
        return None
    
    # Extract question text
    question_line = lines[0]
    if question_line.lower().startswith('question:'):
        question_text = question_line[9:].strip()
    else:
        question_text = question_line
    
    # Extract options
    options = []
    answer_idx = None
    option_pattern = r'^[A-D]\)\s*(.+)$'
    option_letters = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
    
    for i, line in enumerate(lines[1:], 1):
        match = re.match(option_pattern, line)
        if match:
            options.append(match.group(1))
        elif line.lower().startswith('answer:'):
            answer_str = line[7:].strip().upper()
            answer_idx = option_letters.get(answer_str, None)
    
    # Validate
    if len(options) < 2 or answer_idx is None:
        return None
    
    # Pad options to 4 if needed
    while len(options) < 4:
        options.append("")
    
    return ParsedQuestion(question_text, options[:4], answer_idx)
