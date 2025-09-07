#!/usr/bin/env python3
"""
JSON to LaTeX Syllabus Generator
Converts GTU syllabus JSON files to professionally formatted LaTeX documents
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
\fancyfoot[C]{\thepage}

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
        
        # Course header
        course_info = json_data.get('courseInfo', {})
        latex_content += self._generate_header(course_info)
        
        # Course information table
        latex_content += self._generate_course_info(course_info)
        
        # Rationale
        if 'rationale' in json_data:
            latex_content += self._generate_rationale(json_data['rationale'])
        
        # Course Outcomes
        if 'courseOutcomes' in json_data:
            latex_content += self._generate_course_outcomes(json_data['courseOutcomes'])
        
        # Teaching and Examination Scheme
        if 'teachingExamScheme' in json_data:
            latex_content += self._generate_teaching_scheme(json_data['teachingExamScheme'])
        
        # Course Content (new format) or Underpinning Theory (old format)
        if 'courseContent' in json_data:
            latex_content += self._generate_course_content(json_data['courseContent'])
        elif 'underpinningTheory' in json_data:
            latex_content += self._generate_underpinning_theory(json_data['underpinningTheory'])
        
        # Practical Exercises/Outcomes
        if 'practicalExercises' in json_data:
            latex_content += self._generate_practical_exercises(json_data['practicalExercises'])
        elif 'practicalOutcomes' in json_data:
            latex_content += self._generate_practical_outcomes(json_data['practicalOutcomes'])
        
        # Specification Table
        if 'specificationTable' in json_data:
            latex_content += self._generate_specification_table(json_data['specificationTable'])
        
        # Learning Resources
        if 'learningResources' in json_data:
            latex_content += self._generate_learning_resources(json_data['learningResources'])
        
        # Projects
        if 'projectList' in json_data:
            latex_content += self._generate_projects(json_data['projectList'])
        elif 'microProjects' in json_data:
            latex_content += self._generate_micro_projects(json_data['microProjects'])
        
        # Student Activities
        if 'studentActivities' in json_data:
            latex_content += self._generate_student_activities(json_data['studentActivities'])
        
        # Laboratory Resources
        if 'laboratoryResources' in json_data:
            latex_content += self._generate_laboratory_resources(json_data['laboratoryResources'])
        
        latex_content += r"\end{document}"
        return latex_content
    
    def _generate_header(self, course_info: Dict) -> str:
        course_title = course_info.get('courseTitle', 'Course Title')
        course_code = course_info.get('courseCode', 'XXX')
        return f"\\courseheader{{{course_title}}}{{{course_code}}}\n\n"
    
    def _generate_course_info(self, course_info: Dict) -> str:
        latex = r"""
\section{Course Information}

\begin{tabular}{|l|l|}
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
    
    def _generate_rationale(self, rationale: str) -> str:
        return f"""
\\section{{Rationale}}

{self._escape_latex(rationale)}

"""
    
    def _generate_course_outcomes(self, outcomes: List[Dict]) -> str:
        latex = r"""
\section{Course Outcomes}

After completion of the course, students will be able to:

\begin{longtable}{|p{1cm}|p{12cm}|p{2cm}|}
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
\begin{tabular}{|c|c|c|c||c|c|c|c|c|}
\hline
\multicolumn{4}{|c|}{\textbf{Teaching Scheme (Hours)}} & \multicolumn{5}{c|}{\textbf{Assessment Pattern (Marks)}} \\
\hline
\textbf{L} & \textbf{T} & \textbf{PR} & \textbf{C} & \textbf{Theory ESE} & \textbf{Theory CA} & \textbf{Practical CA} & \textbf{Practical ESE} & \textbf{Total} \\
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

\begin{longtable}{|p{2cm}|p{10cm}|p{2cm}|p{2cm}|}
\hline
\textbf{Unit No.} & \textbf{Content} & \textbf{Hours} & \textbf{Weightage (\%)} \\
\hline
\endhead
"""
        
        for unit in content:
            unit_num = unit.get('unitNumber', '')
            unit_title = unit.get('unitTitle', '')
            hours = unit.get('hours', 0)
            weightage = unit.get('weightage', 0)
            
            # Combine unit title and content
            content_text = f"\\textbf{{{unit_title}}}\\\\\n"
            for item in unit.get('content', []):
                content_text += f"{self._escape_latex(item)}\\\\\n"
            
            latex += f"{unit_num} & {content_text} & {hours} & {weightage} \\\\\n\\hline\n"
        
        latex += r"\end{longtable}" + "\n\n"
        return latex
    
    def _generate_underpinning_theory(self, theory: List[Dict]) -> str:
        latex = r"""
\section{Underpinning Theory}

"""
        
        for unit in theory:
            unit_title = unit.get('unitTitle', '')
            latex += f"\\subsection{{{unit_title}}}\n\n"
            
            # Unit Outcomes
            if 'unitOutcomes' in unit:
                latex += "\\textbf{Unit Outcomes:}\n\\begin{itemize}\n"
                for outcome in unit['unitOutcomes']:
                    outcome_id = outcome.get('id', '')
                    description = self._escape_latex(outcome.get('description', ''))
                    latex += f"\\item[{outcome_id}] {description}\n"
                latex += "\\end{itemize}\n\n"
            
            # Topics
            if 'topics' in unit:
                latex += "\\textbf{Topics and Sub-topics:}\n\\begin{enumerate}\n"
                for topic in unit['topics']:
                    topic_title = self._escape_latex(topic.get('title', ''))
                    latex += f"\\item {topic_title}\n"
                    
                    # Subtopics
                    if 'subtopics' in topic:
                        latex += "\\begin{itemize}\n"
                        for subtopic in topic['subtopics']:
                            latex += f"\\item {self._escape_latex(subtopic)}\n"
                        latex += "\\end{itemize}\n"
                latex += "\\end{enumerate}\n\n"
        
        return latex
    
    def _generate_practical_exercises(self, exercises: List[Dict]) -> str:
        latex = r"""
\section{Suggested Practical Exercises}

\begin{longtable}{|p{1cm}|p{10cm}|p{2cm}|p{2cm}|}
\hline
\textbf{Sr. No} & \textbf{Practical Outcomes (PrOs)} & \textbf{Unit No.} & \textbf{Hrs.} \\
\hline
\endhead
"""
        
        for exercise in exercises:
            sr_no = exercise.get('srNo', '')
            description = self._escape_latex(exercise.get('description', ''))
            
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

\begin{longtable}{|p{1cm}|p{10cm}|p{2cm}|p{2cm}|}
\hline
\textbf{Sr. No} & \textbf{Practical Outcomes (PrOs)} & \textbf{Unit No.} & \textbf{Hrs.} \\
\hline
\endhead
"""
        
        for outcome in outcomes:
            sr_no = outcome.get('srNo', '')
            description = self._escape_latex(outcome.get('outcome', ''))
            
            # Add details if available
            if 'details' in outcome:
                for detail in outcome['details']:
                    description += f"\\\\ • {self._escape_latex(detail)}"
            
            unit_no = outcome.get('unitNo', '')
            hours = outcome.get('hours', 0)
            
            latex += f"{sr_no} & {description} & {unit_no} & {hours} \\\\\n\\hline\n"
        
        latex += r"\end{longtable}" + "\n\n"
        return latex
    
    def _generate_specification_table(self, spec_table: List[Dict]) -> str:
        latex = r"""
\section{Suggested Specification Table with Marks (Theory)}

\begin{center}
\begin{tabular}{|l|l|c|c|c|c|c|c|c|}
\hline
\textbf{Unit} & \textbf{Unit Title} & \textbf{R} & \textbf{U} & \textbf{A} & \textbf{N} & \textbf{E} & \textbf{C} & \textbf{Total} \\
\hline
"""
        
        for row in spec_table:
            unit_no = row.get('unitNo', '')
            unit_title = self._escape_latex(row.get('unitTitle', ''))
            r_level = row.get('rememberLevel', 0)
            u_level = row.get('understandLevel', 0)
            a_level = row.get('applyLevel', 0)
            n_level = row.get('analyzeLevel', 0)
            e_level = row.get('evaluateLevel', 0)
            c_level = row.get('createLevel', 0)
            total = row.get('totalMarks', 0)
            
            latex += f"{unit_no} & {unit_title} & {r_level} & {u_level} & {a_level} & {n_level} & {e_level} & {c_level} & {total} \\\\\n\\hline\n"
        
        latex += r"\end{tabular}" + "\n"
        latex += r"\end{center}" + "\n\n"
        
        # Add legend
        latex += "\\textbf{Legend:} R: Remember; U: Understanding; A: Application; N: Analyze; E: Evaluate; C: Create\n\n"
        
        return latex
    
    def _generate_learning_resources(self, resources: Dict) -> str:
        latex = r"""
\section{References/Suggested Learning Resources}

"""
        
        # Books
        if 'books' in resources:
            latex += r"""
\subsection{Books}

\begin{longtable}{|p{1cm}|p{6cm}|p{4cm}|p{4cm}|}
\hline
\textbf{Sr. No.} & \textbf{Title of Book} & \textbf{Author} & \textbf{Publication} \\
\hline
\endhead
"""
            
            for book in resources['books']:
                sr_no = book.get('srNo', '')
                title = self._escape_latex(book.get('title', ''))
                author = self._escape_latex(book.get('author', ''))
                publication = self._escape_latex(book.get('publication', ''))
                
                latex += f"{sr_no} & {title} & {author} & {publication} \\\\\n\\hline\n"
            
            latex += r"\end{longtable}" + "\n\n"
        
        # Open Source Software
        if 'openSourceSoftware' in resources:
            latex += "\\subsection{Open-source Software and Websites}\n\n"
            latex += "\\begin{enumerate}\n"
            
            for software in resources['openSourceSoftware']:
                name = self._escape_latex(software.get('name', ''))
                url = software.get('url', '')
                description = self._escape_latex(software.get('description', ''))
                
                latex += f"\\item {name}"
                if url:
                    latex += f" - \\url{{{url}}}"
                if description:
                    latex += f" - {description}"
                latex += "\n"
            
            latex += "\\end{enumerate}\n\n"
        
        return latex
    
    def _generate_projects(self, projects: List[Dict]) -> str:
        latex = r"""
\section{Suggested Project List}

\begin{enumerate}
"""
        
        for project in projects:
            title = self._escape_latex(project.get('title', ''))
            description = self._escape_latex(project.get('description', ''))
            
            latex += f"\\item \\textbf{{{title}}}"
            if description:
                latex += f" - {description}"
            latex += "\n"
        
        latex += r"\end{enumerate}" + "\n\n"
        return latex
    
    def _generate_micro_projects(self, projects: List[str]) -> str:
        latex = r"""
\section{Suggested Micro-Projects}

\begin{enumerate}
"""
        
        for project in projects:
            latex += f"\\item {self._escape_latex(project)}\n"
        
        latex += r"\end{enumerate}" + "\n\n"
        return latex
    
    def _generate_student_activities(self, activities: List[Dict]) -> str:
        latex = r"""
\section{Suggested Activities for Students}

\begin{enumerate}
"""
        
        for activity in activities:
            activity_text = self._escape_latex(activity.get('activity', ''))
            activity_type = activity.get('type', '')
            context = self._escape_latex(activity.get('context', ''))
            
            latex += f"\\item {activity_text}"
            if activity_type:
                latex += f" (\\textit{{{activity_type}}})"
            if context:
                latex += f"\\\\\n{context}"
            latex += "\n"
        
        latex += r"\end{enumerate}" + "\n\n"
        return latex
    
    def _generate_laboratory_resources(self, resources: List[Dict]) -> str:
        latex = r"""
\section{Laboratory/Learning Resources Required}

\begin{longtable}{|p{1cm}|p{10cm}|p{3cm}|}
\hline
\textbf{Sr. No.} & \textbf{Laboratory/Learning Resources} & \textbf{Applicable To} \\
\hline
\endhead
"""
        
        for resource in resources:
            sr_no = resource.get('srNo', '')
            name = self._escape_latex(resource.get('resourceName', ''))
            specs = self._escape_latex(resource.get('specifications', ''))
            applicable = resource.get('applicableTo', '')
            
            description = f"\\textbf{{{name}}}"
            if specs:
                description += f"\\\\\n{specs}"
            
            latex += f"{sr_no} & {description} & {applicable} \\\\\n\\hline\n"
        
        latex += r"\end{longtable}" + "\n\n"
        return latex
    
    def _escape_latex(self, text: str) -> str:
        """Escape special LaTeX characters"""
        if not isinstance(text, str):
            return str(text)
        
        # LaTeX special characters
        replacements = {
            '&': r'\&',
            '%': r'\%',
            '$': r'\$',
            '#': r'\#',
            '^': r'\textasciicircum{}',
            '_': r'\_',
            '{': r'\{',
            '}': r'\}',
            '~': r'\textasciitilde{}',
            '\\': r'\textbackslash{}'
        }
        
        for char, replacement in replacements.items():
            text = text.replace(char, replacement)
        
        return text
    
    def convert_json_to_latex(self, json_file_path: str, output_dir: str = None) -> str:
        """Convert a JSON syllabus file to LaTeX"""
        json_path = Path(json_file_path)
        
        if not json_path.exists():
            raise FileNotFoundError(f"JSON file not found: {json_file_path}")
        
        # Load JSON data
        with open(json_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        # Generate LaTeX content
        latex_content = self.generate_latex(json_data)
        
        # Determine output path
        if output_dir is None:
            output_dir = json_path.parent
        else:
            output_dir = Path(output_dir)
            output_dir.mkdir(exist_ok=True)
        
        latex_file_path = output_dir / f"{json_path.stem}.tex"
        
        # Write LaTeX file
        with open(latex_file_path, 'w', encoding='utf-8') as f:
            f.write(latex_content)
        
        print(f"LaTeX file generated: {latex_file_path}")
        return str(latex_file_path)
    
    def compile_to_pdf(self, latex_file_path: str) -> str:
        """Compile LaTeX file to PDF using pdflatex"""
        latex_path = Path(latex_file_path)
        
        if not latex_path.exists():
            raise FileNotFoundError(f"LaTeX file not found: {latex_file_path}")
        
        # Run pdflatex twice for proper cross-references
        import subprocess
        
        try:
            # First pass
            subprocess.run(['pdflatex', '-interaction=nonstopmode', str(latex_path)], 
                         cwd=latex_path.parent, check=True, capture_output=True)
            
            # Second pass
            result = subprocess.run(['pdflatex', '-interaction=nonstopmode', str(latex_path)], 
                                  cwd=latex_path.parent, check=True, capture_output=True)
            
            pdf_path = latex_path.with_suffix('.pdf')
            print(f"PDF generated: {pdf_path}")
            return str(pdf_path)
            
        except subprocess.CalledProcessError as e:
            print(f"Error compiling LaTeX: {e}")
            print(f"Error output: {e.stderr.decode() if e.stderr else 'No error output'}")
            return None
        except FileNotFoundError:
            print("pdflatex not found. Please install LaTeX (e.g., texlive-latex-extra)")
            return None


def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python json-to-latex.py <json_file> [output_dir]")
        sys.exit(1)
    
    json_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    
    generator = SyllabusLatexGenerator()
    
    try:
        # Generate LaTeX
        latex_file = generator.convert_json_to_latex(json_file, output_dir)
        
        # Optionally compile to PDF
        if input("Compile to PDF? (y/n): ").lower() == 'y':
            generator.compile_to_pdf(latex_file)
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()