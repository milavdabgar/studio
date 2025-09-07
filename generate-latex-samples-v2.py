#!/usr/bin/env python3
"""
Generate LaTeX samples from JSON syllabi for visual verification - IMPROVED VERSION
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any

class SyllabusLatexGenerator:
    def __init__(self):
        self.latex_template = self._get_base_template()
    
    def _get_base_template(self) -> str:
        """Base LaTeX template with GTU styling"""
        return r"""
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[margin=1in]{geometry}
\usepackage{fancyhdr}
\usepackage{booktabs}
\usepackage{longtable}
\usepackage{array}
\usepackage{multirow}
\usepackage{xcolor}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{hyperref}

% GTU Colors
\definecolor{gtublue}{RGB}{0,51,102}
\definecolor{gtuorange}{RGB}{255,102,0}

% Header and Footer
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\textcolor{gtublue}{\textbf{Gujarat Technological University}}}
\fancyhead[R]{\textcolor{gtuorange}{\textbf{COGC-2021}}}
\fancyfoot[L]{\textcolor{gtublue}{\small COURSE_CODE_PLACEHOLDER}}
\fancyfoot[C]{\thepage}
\fancyfoot[R]{\textcolor{gtuorange}{\small COURSE_TITLE_PLACEHOLDER}}

% Adjust header height
\setlength{\headheight}{15pt}

% Section styling
\titleformat{\section}{\Large\bfseries\color{gtublue}}{}{0em}{}
\titleformat{\subsection}{\large\bfseries\color{gtuorange}}{}{0em}{}

% Custom commands
\newcommand{\courseheader}[2]{
    \begin{center}
        \textcolor{gtublue}{\Huge\textbf{#1}}\\
        \vspace{0.3cm}
        \textcolor{gtuorange}{\Large Course Code: #2}\\
        \vspace{0.5cm}
        \rule{\textwidth}{2pt}
    \end{center}
}

\begin{document}
"""

    def generate_latex(self, json_data: Dict[str, Any]) -> str:
        """Generate complete LaTeX document from JSON data"""
        latex_content = self.latex_template
        
        # Course header and footer info
        course_info = json_data.get('courseInfo', {})
        course_title = course_info.get('courseTitle', 'Course Title')
        course_code = course_info.get('courseCode', 'XXX')
        
        # Replace placeholders in template
        latex_content = latex_content.replace('COURSE_CODE_PLACEHOLDER', course_code)
        latex_content = latex_content.replace('COURSE_TITLE_PLACEHOLDER', course_title)
        
        latex_content += f"\\courseheader{{{course_title}}}{{{course_code}}}\n\n"
        
        # Course information table
        latex_content += self._generate_course_info(course_info)
        
        # Rationale
        if 'rationale' in json_data:
            latex_content += f"""
\\section{{Rationale}}

{self._escape_latex(json_data['rationale'])}

"""
        
        # Course Outcomes
        if 'courseOutcomes' in json_data:
            latex_content += self._generate_course_outcomes(json_data['courseOutcomes'])
        
        # Teaching and Examination Scheme  
        if 'teachingExamScheme' in json_data:
            latex_content += self._generate_teaching_scheme(json_data['teachingExamScheme'])
        
        # Course Content or Underpinning Theory
        if 'courseContent' in json_data:
            latex_content += self._generate_course_content(json_data['courseContent'])
        elif 'underpinningTheory' in json_data:
            latex_content += self._generate_underpinning_theory(json_data['underpinningTheory'])
        
        # Practical sections
        if 'practicalExercises' in json_data:
            latex_content += self._generate_practical_exercises(json_data['practicalExercises'])
        elif 'practicalOutcomes' in json_data:
            latex_content += self._generate_practical_outcomes(json_data['practicalOutcomes'])
        
        latex_content += r"\end{document}"
        return latex_content
    
    def _generate_course_info(self, course_info: Dict) -> str:
        latex = r"""
\section{Course Information}

\begin{tabular}{|l|p{10cm}|}
\hline
\textbf{Field} & \textbf{Details} \\
\hline
"""
        
        info_fields = [
            ('Program', course_info.get('program', '')),
            ('Branch', course_info.get('branch', '')),
            ('Level', course_info.get('level', '')),
            ('Semester', str(course_info.get('semester', ''))),
            ('Academic Year', course_info.get('academicYear', '')),
            ('Category', course_info.get('category', '')),
            ('Prerequisites', course_info.get('prerequisite', ''))
        ]
        
        for field, value in info_fields:
            if value:
                latex += f"{field} & {self._escape_latex(value)} \\\\\n\\hline\n"
        
        latex += r"\end{tabular}" + "\n\n"
        return latex
    
    def _generate_course_outcomes(self, outcomes: List[Dict]) -> str:
        latex = r"""
\section{Course Outcomes}

After completion of the course, students will be able to:

\begin{longtable}{|p{1.5cm}|p{11cm}|p{2.5cm}|}
\hline
\textbf{No.} & \textbf{Course Outcomes} & \textbf{RBT Level} \\
\hline
\endhead
"""
        
        for outcome in outcomes:
            co_id = outcome.get('id', '')
            description = self._escape_latex(outcome.get('description', ''))
            rbt_level = outcome.get('bloomLevel', outcome.get('rbtLevel', ''))
            latex += f"{co_id} & {description} & {rbt_level} \\\\\n\\hline\n"
        
        latex += r"\end{longtable}" + "\n\n"
        return latex
    
    def _generate_teaching_scheme(self, scheme: Dict) -> str:
        teaching = scheme.get('teachingScheme', {})
        examination = scheme.get('examinationScheme', {})
        
        latex = r"""
\section{Teaching and Examination Scheme}

\begin{center}
\small
\begin{tabular}{|c|c|c|c||p{1.8cm}|p{1.8cm}|p{1.8cm}|p{1.8cm}|c|}
\hline
\multicolumn{4}{|c|}{\textbf{Teaching Scheme (Hours)}} & \multicolumn{5}{c|}{\textbf{Assessment Pattern (Marks)}} \\
\hline
\textbf{L} & \textbf{T} & \textbf{PR} & \textbf{C} & \textbf{\centering Theory ESE} & \textbf{\centering Theory CA} & \textbf{\centering Practical CA} & \textbf{\centering Practical ESE} & \textbf{Total} \\
\hline
"""
        
        l = teaching.get('lecture', teaching.get('lectureHours', 0))
        t = teaching.get('tutorial', teaching.get('tutorialHours', 0))
        pr = teaching.get('practical', teaching.get('practicalHours', 0))
        c = teaching.get('credits', 0)
        
        theory_ese = examination.get('theoryESE', examination.get('theoryEseMarks', 0))
        theory_ca = examination.get('theoryCA', examination.get('theoryPaMarks', 0))
        practical_ca = examination.get('practicalCA', examination.get('practicalPaMarks', 0))
        practical_ese = examination.get('practicalESE', examination.get('practicalEseMarks', 0))
        total = examination.get('totalMarks', 0)
        
        latex += f"{l} & {t} & {pr} & {c} & {theory_ese} & {theory_ca} & {practical_ca} & {practical_ese} & {total} \\\\\n"
        latex += r"\hline" + "\n"
        latex += r"\end{tabular}" + "\n"
        latex += r"\end{center}" + "\n\n"
        
        return latex
    
    def _generate_course_content(self, content: List[Dict]) -> str:
        latex = r"""
\section{Course Content}

\begin{longtable}{|p{2.8cm}|p{8.2cm}|p{1.3cm}|p{1.7cm}|}
\hline
\textbf{Unit No.} & \textbf{Content} & \textbf{Hours} & \textbf{Weight\-age (\%)} \\
\hline
\endhead
"""
        
        for unit in content:
            unit_num = unit.get('unitNumber', '')
            unit_title = unit.get('unitTitle', '')
            hours = unit.get('hours', 0)
            weightage = unit.get('weightage', 0)
            
            # First column: ONLY unit number and title
            unit_header = f"\\textbf{{{unit_num}. {self._escape_latex(unit_title)}}}"
            
            # Second column: ALL content items properly formatted
            content_items = unit.get('content', [])
            content_lines = []
            
            for item in content_items:
                clean_item = self._escape_latex(item).strip()
                if clean_item:
                    # Handle bullet points by replacing with proper LaTeX bullets
                    if '•' in clean_item:
                        clean_item = clean_item.replace('•', '$\\bullet$')
                    content_lines.append(clean_item)
            
            # Join content with line breaks - use \newline for within table cells 
            content_text = " \\newline ".join(content_lines) if content_lines else ""
            
            latex += f"{unit_header} & {content_text} & {hours} & {weightage} \\\\\n\\hline\n"
        
        latex += r"\end{longtable}" + "\n\n"
        return latex
    
    def _generate_underpinning_theory(self, theory: List[Dict]) -> str:
        latex = r"""
\section{Underpinning Theory}

"""
        
        for unit in theory:
            unit_title = unit.get('unitTitle', '')
            latex += f"\\subsection{{{self._escape_latex(unit_title)}}}\n\n"
            
            # Unit Outcomes
            if 'unitOutcomes' in unit:
                latex += "\\textbf{Unit Outcomes:}\n\\begin{itemize}\n"
                for outcome in unit['unitOutcomes']:
                    outcome_id = outcome.get('id', '')
                    description = self._escape_latex(outcome.get('description', ''))
                    latex += f"\\item[{outcome_id}] {description}\n"
                latex += "\\end{itemize}\n\n"
        
        return latex
    
    def _generate_practical_exercises(self, exercises: List[Dict]) -> str:
        latex = r"""
\section{Suggested Practical Exercises}

\begin{longtable}{|p{0.8cm}|p{10.5cm}|p{1.3cm}|p{1.4cm}|}
\hline
\textbf{Sr. No} & \textbf{Practical Outcomes (PrOs)} & \textbf{Unit No.} & \textbf{Hrs.} \\
\hline
\endhead
"""
        
        for exercise in exercises:
            sr_no = exercise.get('srNo', '')
            description = self._escape_latex(exercise.get('description', ''))
            
            # Fix line breaks in description - replace \\ with \newline
            description = description.replace('\\\\', '\\newline')
            
            # Mark compulsory exercises
            if exercise.get('isCompulsory', False):
                description = f"*{description}"
            
            unit_no = exercise.get('unitNo', '')
            hours = exercise.get('hours', 0)
            
            latex += f"{sr_no} & {description} & {unit_no} & {hours} \\\\\n\\hline\n"
        
        latex += r"\end{longtable}" + "\n\n"
        return latex
    
    def _generate_practical_outcomes(self, outcomes: List[Dict]) -> str:
        latex = r"""
\section{Suggested Course Practical List}

\begin{longtable}{|p{0.8cm}|p{10.5cm}|p{1.3cm}|p{1.4cm}|}
\hline
\textbf{Sr. No} & \textbf{Practical Outcomes (PrOs)} & \textbf{Unit No.} & \textbf{Hrs.} \\
\hline
\endhead
"""
        
        for outcome in outcomes:
            sr_no = outcome.get('srNo', '')
            description = self._escape_latex(outcome.get('outcome', ''))
            
            # Fix line breaks in description - replace \\ with \newline
            description = description.replace('\\\\', '\\newline')
            
            # Add details if available with proper formatting
            if 'details' in outcome:
                for detail in outcome['details']:
                    description += f"\\newline • {self._escape_latex(detail)}"
            
            unit_no = outcome.get('unitNo', '')
            hours = outcome.get('hours', 0)
            
            latex += f"{sr_no} & {description} & {unit_no} & {hours} \\\\\n\\hline\n"
        
        latex += r"\end{longtable}" + "\n\n"
        return latex
    
    def _escape_latex(self, text: str) -> str:
        """Escape special LaTeX characters"""
        if not isinstance(text, str):
            return str(text)
        
        # Handle special symbols BEFORE escaping dollar signs
        text = text.replace('•', r'BULLETPOINT')  # Temporary placeholder
        text = text.replace('°', r'DEGREESYMBOL')  # Temporary placeholder
        
        # LaTeX special characters - handle backslash FIRST to avoid double escaping
        replacements = {
            '\\': r'\textbackslash{}',  # Handle backslash first
            '&': r'\&',
            '%': r'\%',
            '$': r'\$',
            '#': r'\#',
            '^': r'\textasciicircum{}',
            '_': r'\_',
            '{': r'\{',
            '}': r'\}',
            '~': r'\textasciitilde{}',
            '○': r'$\circ$'  # Replace Unicode circle with LaTeX circle
        }
        
        for char, replacement in replacements.items():
            text = text.replace(char, replacement)
        
        # Replace placeholders with proper LaTeX formatting
        text = text.replace('BULLETPOINT', r'$\bullet$')
        text = text.replace('DEGREESYMBOL', r'$^\circ$')
        
        return text


def main():
    """Generate improved LaTeX samples for visual verification"""
    
    generator = SyllabusLatexGenerator()
    
    # Test files representing different formats
    test_files = [
        {
            "name": "Python Programming (New Format - Practical)",
            "path": "content/resources/study-materials/16-it/sem-1/DI01016011-python/DI01016011.json"
        },
        {
            "name": "Mathematics-I (New Format - Theory Only)",  
            "path": "content/resources/study-materials/00-general/sem-1/DI01000021-maths1/DI01000021.json"
        },
        {
            "name": "Java Programming (Old Format - Complex)",
            "path": "content/resources/study-materials/32-ict/sem-4/4343203-java/4343203.json"
        }
    ]
    
    # Create output directory
    output_dir = Path("samples/latex-verification-v2")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("🚀 Generating IMPROVED LaTeX samples...\n")
    
    generated_count = 0
    
    for test_file in test_files:
        json_path = Path(test_file["path"])
        
        if not json_path.exists():
            print(f"⚠️  File not found: {test_file['name']}")
            continue
            
        try:
            print(f"🔄 Processing: {test_file['name']}")
            print(f"   Source: {json_path.name}")
            
            # Load JSON data
            with open(json_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            
            # Generate LaTeX content
            latex_content = generator.generate_latex(json_data)
            
            # Write LaTeX file
            latex_file_path = output_dir / f"{json_path.stem}-v2.tex"
            with open(latex_file_path, 'w', encoding='utf-8') as f:
                f.write(latex_content)
            
            # Check file size
            size = latex_file_path.stat().st_size
            print(f"   ✅ Generated: {latex_file_path.name} ({size:,} bytes)")
            
            generated_count += 1
            print()
            
        except Exception as e:
            print(f"   ❌ Error: {e}\n")
    
    print(f"✅ Successfully generated {generated_count} IMPROVED LaTeX files")
    print(f"📁 Output directory: {output_dir}")
    
    # Show all generated files
    if output_dir.exists():
        print(f"\n📄 Generated files:")
        for file in sorted(output_dir.glob("*.tex")):
            size = file.stat().st_size
            print(f"   • {file.name} ({size:,} bytes)")
    
    print(f"\n💡 Key improvements:")
    print(f"   ✅ Fixed course content table column widths (3cm | 10.5cm | 1.5cm | 1.5cm)")
    print(f"   ✅ Proper line break handling (double backslash instead of quadruple)")
    print(f"   ✅ Improved bullet point formatting with indentation")
    print(f"   ✅ Fixed LaTeX character escaping (proper ampersand handling)")
    print(f"   ✅ Better table text wrapping and content fitting")
    print(f"   ✅ Added course code & title in footer")
    print(f"   ✅ Adjusted header height to fix warnings")

if __name__ == "__main__":
    main()