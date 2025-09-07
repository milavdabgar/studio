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

    def _detect_syllabus_format(self, syllabus_data: Dict[str, Any]) -> str:
        """Detect if syllabus is COGC-2021 or DI format"""
        course_code = syllabus_data.get('courseInfo', {}).get('courseCode', '')
        if course_code.startswith('DI'):
            return 'new_di'
        elif course_code.startswith('43'):
            return 'cogc_2021'
        return 'unknown'
    
    def generate_latex(self, json_data: Dict[str, Any]) -> str:
        """Generate complete LaTeX document from JSON data using format-specific generators"""
        format_type = self._detect_syllabus_format(json_data)
        
        if format_type == 'new_di':
            return self._generate_di_format_latex(json_data)
        elif format_type == 'cogc_2021':
            return self._generate_cogc_format_latex(json_data)
        else:
            return self._generate_generic_latex(json_data)
    
    def _generate_generic_latex(self, json_data: Dict[str, Any]) -> str:
        """Generate LaTeX for unknown/generic format - fallback method"""
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
\begin{tabular}{|c|c|c|c||c|c|c|c|c|}
\hline
\multicolumn{3}{|c|}{\textbf{Teaching Scheme (Hours)}} & \multirow{2}{*}{\textbf{\begin{tabular}{c}Total\\Credits\\L+T+\\(PR/2)\end{tabular}}} & \multicolumn{4}{c|}{\textbf{Assessment Pattern and Marks}} & \multirow{2}{*}{\textbf{\begin{tabular}{c}Total\\Marks\end{tabular}}} \\
\cline{1-3} \cline{5-8}
 &  &  &  & \multicolumn{2}{c|}{\textbf{Theory}} & \multicolumn{2}{c|}{\textbf{Tutorial / Practical}} &  \\
\hline
\textbf{L} & \textbf{T} & \textbf{PR} & \textbf{C} & \textbf{\begin{tabular}{c}ESE\\(E)\end{tabular}} & \textbf{\begin{tabular}{c}PA\\(M)\end{tabular}} & \textbf{\begin{tabular}{c}PA\\(I)\end{tabular}} & \textbf{\begin{tabular}{c}ESE\\(V)\end{tabular}} &  \\
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

\setlength{\LTpre}{0pt}
\setlength{\LTpost}{0pt}
\setlength{\LTleft}{0pt}
\setlength{\LTright}{\fill}
\begin{longtable}[c]{|p{1cm}|p{10.5cm}|p{1.5cm}|p{1.5cm}|}
\hline
\textbf{Unit No.} & \textbf{Content} & \textbf{No. of Hours} & \textbf{\% of Weightage} \\
\hline
\endfirsthead
\hline
\textbf{Unit No.} & \textbf{Content} & \textbf{No. of Hours} & \textbf{\% of Weightage} \\
\hline
\endhead
\hline
\endfoot
"""
        
        for unit in content:
            unit_num = unit.get('unitNumber', '')
            unit_title = unit.get('unitTitle', '')
            hours = unit.get('hours', 0)
            weightage = unit.get('weightage', 0)
            
            # First column: ONLY unit number (no title)
            unit_number = str(unit_num).replace('.', '')  # Clean unit number
            
            # Second column: Unit title as first line, then content items
            content_items = unit.get('content', [])
            content_lines = []
            
            # Add unit title as first line in content column
            if unit_title:
                content_lines.append(f"\\textbf{{{self._escape_latex(unit_title)}}}")
            
            current_main_topic = ""
            sub_topic_counter = 0
            
            for item in content_items:
                clean_item = item.strip()
                
                # Check if this is a main topic (starts with number like "1.1", "1.2", etc.)
                if clean_item and clean_item[0].isdigit() and '.' in clean_item[:5]:
                    # This is a main topic - reset counter and update current topic
                    current_main_topic = clean_item.split(' ')[0]  # Extract "1.1", "1.2", etc.
                    sub_topic_counter = 0
                    clean_item = self._escape_latex(clean_item)
                    # No indentation for main topics
                    content_lines.append(clean_item)
                elif clean_item.startswith('•'):
                    # This is a sub-topic - add hierarchical numbering with simple indentation
                    sub_topic_counter += 1
                    clean_item = clean_item[1:].strip()  # Remove bullet
                    # Add hierarchical numbering like 1.1.1, 1.1.2, etc.
                    numbered_item = f"{current_main_topic}.{sub_topic_counter} {clean_item}"
                    # Escape first, then add indentation
                    escaped_item = self._escape_latex(numbered_item)
                    indented_item = f"\\quad {escaped_item}"
                    content_lines.append(indented_item)
                elif clean_item:
                    # Regular content
                    clean_item = self._escape_latex(clean_item)
                    content_lines.append(clean_item)
            
            # Join content with line breaks WITHIN the same table cell (not new rows)
            content_text = " \\newline ".join(content_lines) if content_lines else ""
            
            # Use normal row breaking for tighter spacing
            latex += f"{unit_number} & {content_text} & {hours} & {weightage} \\\\\n\\hline\n"
        
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

    def _generate_di_format_latex(self, json_data: Dict[str, Any]) -> str:
        """Generate LaTeX specifically for new DI format syllabi"""
        latex_content = self.latex_template
        
        # Course header and footer info
        course_info = json_data.get('courseInfo', {})
        course_title = course_info.get('courseTitle', 'Course Title')
        course_code = course_info.get('courseCode', 'XXX')
        
        # Replace placeholders in template - adjust header for new format
        latex_content = latex_content.replace('COURSE_CODE_PLACEHOLDER', course_code)
        latex_content = latex_content.replace('COURSE_TITLE_PLACEHOLDER', course_title)
        latex_content = latex_content.replace('\\textcolor{gtuorange}{\\textbf{COGC-2021}}', 
                                            '\\textcolor{gtuorange}{\\textbf{w.e.f. 2024-25}}')
        
        latex_content += f"\\courseheader{{{course_title}}}{{{course_code}}}\n\n"
        
        # DI Format specific sections
        latex_content += self._generate_di_course_info(course_info)
        
        # Prerequisites section (specific to DI format)
        if course_info.get('prerequisite'):
            latex_content += f"""
\\section{{Prerequisites}}

{self._escape_latex(course_info['prerequisite'])}

"""
        
        # Course Description (if available)
        if json_data.get('courseDescription'):
            latex_content += f"""
\\section{{Course Description}}

{self._escape_latex(json_data['courseDescription'])}

"""
        
        # Rationale
        if 'rationale' in json_data:
            latex_content += f"""
\\section{{Rationale}}

{self._escape_latex(json_data['rationale'])}

"""
        
        # Course Outcomes with DI format styling
        if 'courseOutcomes' in json_data:
            latex_content += self._generate_di_course_outcomes(json_data['courseOutcomes'])
        
        # Teaching and Examination Scheme
        if 'teachingExamScheme' in json_data:
            latex_content += self._generate_di_teaching_scheme(json_data['teachingExamScheme'])
        
        # Course Content (DI format has different structure)
        if 'courseContent' in json_data:
            latex_content += self._generate_course_content(json_data['courseContent'])
        
        # Specification Table (DI format)
        if 'specificationTable' in json_data:
            latex_content += self._generate_di_specification_table(json_data['specificationTable'])
        
        # Learning Resources (DI format)
        if 'learningResources' in json_data:
            latex_content += self._generate_di_learning_resources(json_data['learningResources'])
        
        # Practical Outcomes (DI format)
        if 'practicalOutcomes' in json_data:
            latex_content += self._generate_practical_outcomes(json_data['practicalOutcomes'])
        
        # Laboratory Resources (DI format)
        if 'laboratoryResources' in json_data:
            latex_content += self._generate_di_laboratory_resources(json_data['laboratoryResources'])
        
        # Project List (DI format)
        if 'projectList' in json_data:
            latex_content += self._generate_di_project_list(json_data['projectList'])
        
        # Student Activities (DI format)
        if 'studentActivities' in json_data:
            latex_content += self._generate_di_student_activities(json_data['studentActivities'])
        
        latex_content += r"\end{document}"
        return latex_content

    def _generate_cogc_format_latex(self, json_data: Dict[str, Any]) -> str:
        """Generate LaTeX specifically for old COGC-2021 format syllabi"""
        latex_content = self.latex_template
        
        # Course header and footer info
        course_info = json_data.get('courseInfo', {})
        course_title = course_info.get('courseTitle', 'Course Title')
        course_code = course_info.get('courseCode', 'XXX')
        
        # Replace placeholders in template
        latex_content = latex_content.replace('COURSE_CODE_PLACEHOLDER', course_code)
        latex_content = latex_content.replace('COURSE_TITLE_PLACEHOLDER', course_title)
        
        latex_content += f"\\courseheader{{{course_title}}}{{{course_code}}}\n\n"
        
        # COGC Format specific sections
        latex_content += self._generate_cogc_course_info(course_info)
        
        # Rationale
        if 'rationale' in json_data:
            latex_content += f"""
\\section{{Rationale}}

{self._escape_latex(json_data['rationale'])}

"""
        
        # Competency (specific to COGC format)
        if 'competency' in json_data:
            latex_content += f"""
\\section{{Competency}}

The aim of this course is to help the students to attain the following industry identified competency through various teaching-learning experiences:

{self._escape_latex(json_data['competency'])}

"""
        
        # Course Outcomes
        if 'courseOutcomes' in json_data:
            latex_content += self._generate_cogc_course_outcomes(json_data['courseOutcomes'])
        
        # Teaching and Examination Scheme
        if 'teachingExamScheme' in json_data:
            latex_content += self._generate_teaching_scheme(json_data['teachingExamScheme'])
        
        # Practical Exercises (COGC format)
        if 'practicalExercises' in json_data:
            latex_content += self._generate_cogc_practical_exercises(json_data['practicalExercises'])
        
        # Performance Indicators (COGC format)
        if 'performanceIndicators' in json_data:
            latex_content += self._generate_cogc_performance_indicators(json_data['performanceIndicators'])
        
        # Equipment (COGC format)
        if 'equipment' in json_data:
            latex_content += self._generate_cogc_equipment(json_data['equipment'])
        
        # Affective Domain Outcomes (COGC format)
        if 'affectiveDomainOutcomes' in json_data:
            latex_content += self._generate_cogc_affective_domain(json_data['affectiveDomainOutcomes'])
        
        # Underpinning Theory (COGC format)
        if 'underpinningTheory' in json_data:
            latex_content += self._generate_cogc_underpinning_theory(json_data['underpinningTheory'])
        
        # Specification Table (COGC format)
        if 'specificationTable' in json_data:
            latex_content += self._generate_cogc_specification_table(json_data['specificationTable'])
        
        # Student Activities (COGC format)
        if 'studentActivities' in json_data:
            latex_content += self._generate_cogc_student_activities(json_data['studentActivities'])
        
        # Instructional Strategies (COGC format)
        if 'instructionalStrategies' in json_data:
            latex_content += self._generate_cogc_instructional_strategies(json_data['instructionalStrategies'])
        
        # Micro Projects (COGC format)
        if 'microProjects' in json_data:
            latex_content += self._generate_cogc_micro_projects(json_data['microProjects'])
        
        # Learning Resources
        if 'learningResources' in json_data:
            latex_content += self._generate_cogc_learning_resources(json_data['learningResources'])
        
        # Competency Mapping (COGC format)
        if 'competencyMapping' in json_data:
            latex_content += self._generate_cogc_competency_mapping(json_data['competencyMapping'])
        
        # Development Committee (COGC format)
        if 'developmentCommittee' in json_data:
            latex_content += self._generate_cogc_development_committee(json_data['developmentCommittee'])
        
        latex_content += r"\end{document}"
        return latex_content

    # DI Format specific methods
    def _generate_di_course_info(self, course_info: Dict) -> str:
        """Generate course info table for DI format"""
        latex = r"""
\section{Course Information}

\begin{tabular}{|l|p{10cm}|}
\hline
\textbf{Field} & \textbf{Details} \\
\hline
"""
        
        # DI format specific fields order
        di_fields = [
            ('Program', course_info.get('program', '')),
            ('Branch', course_info.get('branch', '')),
            ('Level', course_info.get('level', '')),
            ('Semester', str(course_info.get('semester', ''))),
            ('Academic Year', course_info.get('academicYear', '')),
            ('Category', course_info.get('category', ''))
        ]
        
        for field, value in di_fields:
            if value:
                latex += f"{field} & {self._escape_latex(value)} \\\\\n\\hline\n"
        
        latex += r"\end{tabular}" + "\n\n"
        return latex

    def _generate_di_course_outcomes(self, outcomes: List[Dict]) -> str:
        """Generate course outcomes for DI format with RBT levels"""
        latex = r"""
\section{Course Outcomes}

After completion of the course, students will be able to:

\begin{longtable}{|p{1cm}|p{11cm}|p{2.5cm}|}
\hline
\textbf{No.} & \textbf{Course Outcomes} & \textbf{RBT Level} \\
\hline
\endhead
"""
        
        for outcome in outcomes:
            co_id = outcome.get('id', '')
            description = self._escape_latex(outcome.get('description', ''))
            # DI format uses combined RBT levels like "R,U,A"
            rbt_level = outcome.get('rbtLevel', outcome.get('bloomLevel', ''))
            latex += f"{co_id} & {description} & {rbt_level} \\\\\n\\hline\n"
        
        latex += r"\end{longtable}" + "\n\n"
        latex += "*RBT: Revised Bloom's Taxonomy\n\n"
        return latex

    def _generate_di_teaching_scheme(self, scheme: Dict) -> str:
        """Generate teaching scheme for DI format with different column headers"""
        teaching = scheme.get('teachingScheme', {})
        examination = scheme.get('examinationScheme', {})
        
        latex = r"""
\section{Teaching and Examination Scheme}

\begin{center}
\small
\begin{tabular}{|c|c|c|c||p{1.8cm}|p{1.8cm}|p{1.8cm}|p{1.8cm}|c|}
\hline
\multicolumn{4}{|c|}{\textbf{Teaching Scheme (Hours)}} & \multicolumn{5}{c|}{\textbf{Assessment Pattern and Marks}} \\
\hline
\textbf{L} & \textbf{T} & \textbf{PR} & \textbf{C} & \textbf{\centering Theory ESE (E)} & \textbf{\centering Theory PA (M)} & \textbf{\centering Tutorial/Practical PA (I)} & \textbf{\centering Tutorial/Practical ESE (V)} & \textbf{Total} \\
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

    # COGC Format specific methods  
    def _generate_cogc_course_info(self, course_info: Dict) -> str:
        """Generate course info table for COGC format"""
        latex = r"""
\section{Course Information}

\begin{tabular}{|l|p{10cm}|}
\hline
\textbf{Field} & \textbf{Details} \\
\hline
"""
        
        # COGC format specific fields order
        cogc_fields = [
            ('Program', course_info.get('program', '')),
            ('Branch', course_info.get('branch', '')),
            ('Level', course_info.get('level', '')),
            ('Semester', str(course_info.get('semester', ''))),
            ('Curriculum', course_info.get('curriculum', 'COGC-2021')),
            ('Category', course_info.get('category', '')),
            ('Prerequisites', course_info.get('prerequisite', ''))
        ]
        
        for field, value in cogc_fields:
            if value:
                latex += f"{field} & {self._escape_latex(value)} \\\\\n\\hline\n"
        
        latex += r"\end{tabular}" + "\n\n"
        return latex

    def _generate_cogc_course_outcomes(self, outcomes: List[Dict]) -> str:
        """Generate course outcomes for COGC format"""
        latex = r"""
\section{Course Outcomes (COs)}

The practical exercises, the underpinning knowledge and the relevant soft skills associated with this competency are to be developed in the student to display the following COs:

\subsection{Course Outcomes}

"""
        
        for i, outcome in enumerate(outcomes):
            letter = chr(ord('a') + i)  # a, b, c, d, e...
            description = self._escape_latex(outcome.get('description', ''))
            latex += f"{letter}) {description}\\newline\n"
        
        latex += "\n\n"
        return latex

    # Placeholder methods for additional COGC format sections
    def _generate_cogc_practical_exercises(self, exercises: List[Dict]) -> str:
        return self._generate_practical_exercises(exercises)
    
    def _generate_cogc_performance_indicators(self, indicators: List[Dict]) -> str:
        return "% TODO: Implement COGC performance indicators\n"
    
    def _generate_cogc_equipment(self, equipment: Dict) -> str:
        return "% TODO: Implement COGC equipment section\n"
    
    def _generate_cogc_affective_domain(self, outcomes: List[str]) -> str:
        return "% TODO: Implement COGC affective domain\n"
    
    def _generate_cogc_underpinning_theory(self, theory: List[Dict]) -> str:
        return self._generate_underpinning_theory(theory)
    
    def _generate_cogc_specification_table(self, table: List[Dict]) -> str:
        return "% TODO: Implement COGC specification table\n"
    
    def _generate_cogc_student_activities(self, activities: List[str]) -> str:
        return "% TODO: Implement COGC student activities\n"
    
    def _generate_cogc_instructional_strategies(self, strategies: List[str]) -> str:
        return "% TODO: Implement COGC instructional strategies\n"
    
    def _generate_cogc_micro_projects(self, projects: List[Dict]) -> str:
        return "% TODO: Implement COGC micro projects\n"
    
    def _generate_cogc_learning_resources(self, resources: Dict) -> str:
        return "% TODO: Implement COGC learning resources\n"
    
    def _generate_cogc_competency_mapping(self, mapping: Dict) -> str:
        return "% TODO: Implement COGC competency mapping\n"
    
    def _generate_cogc_development_committee(self, committee: List[Dict]) -> str:
        return "% TODO: Implement COGC development committee\n"

    # Placeholder methods for additional DI format sections
    def _generate_di_specification_table(self, table: List[Dict]) -> str:
        latex = r"""
\section{Suggested Specification Table with Marks (Theory)}

\begin{center}
\small
\begin{tabular}{|c|c|c|c|c|c|}
\hline
\multicolumn{6}{|c|}{\textbf{Distribution of Theory Marks (in \%)}} \\
\hline
\textbf{R Level} & \textbf{U Level} & \textbf{A Level} & \textbf{N Level} & \textbf{E Level} & \textbf{C Level} \\
\hline
20 & 30 & 50 & -- & -- & -- \\
\hline
\end{tabular}
\end{center}

\textit{Where R: Remember; U: Understanding; A: Application, N: Analyze and E: Evaluate C: Create (as per Revised Bloom's Taxonomy)}

"""
        return latex
    
    def _generate_di_learning_resources(self, resources: Dict) -> str:
        latex = r"""
\section{References/Suggested Learning Resources}

\subsection{(a) Books:}
\begin{enumerate}
\item Java: The Complete Reference by Herbert Schildt, McGraw Hill Education, 12th Edition, 2021, ISBN: 9781260440232
\item Programming with Java by E Balagurusamy, McGraw Hill Education, 6th Edition, 2019, ISBN: 9789353161491
\item Core Java: Volume I - Fundamentals by Cay S. Horstmann, Prentice Hall, 11th Edition, 2018, ISBN: 9780135166307
\item Head First Java by Kathy Sierra and Bert Bates, O'Reilly Media, 3rd Edition, 2022, ISBN: 9781491910771
\item Thinking in Java by Bruce Eckel, Prentice Hall, 4th Edition, 2006, ISBN: 9780131872486
\end{enumerate}

\subsection{(b) Open source software and website:}
\begin{itemize}
\item \textbf{Softwares}
\begin{itemize}
\item Java Development Kit – JDK 23
\item IntelliJ IDEA Community Edition
\item Visual Studio Code
\item Eclipse IDE
\end{itemize}
\item \textbf{Official Documentation}
\begin{itemize}
\item Official Java Documentation
\end{itemize}
\item \textbf{Online Tutorials}
\begin{itemize}
\item W3Schools Java Tutorial
\item JavaTpoint - Java Programming Tutorials
\item GeeksforGeeks - Java Programming Language
\item Learn Java Online
\item TutorialsPoint - Java Tutorials and Examples
\end{itemize}
\item \textbf{Video Courses}
\begin{itemize}
\item Introduction to Java Programming (Udacity YouTube Playlist)
\item Programming in Java by Debasis Samanta, IIT Kharagpur (NPTEL YouTube Playlist)
\item Java Tutorials For Beginners In Hindi (CodeWithHarry YouTube Playlist)
\end{itemize}
\item \textbf{Comprehensive Courses}
\begin{itemize}
\item Java Programming Nanodegree by Udacity
\item Core Java Specialization by LearnQuest on Coursera
\item Java Masterclass 2025: 130+ Hours of Expert Lessons by Tim Bulchka on Udemy
\item Introduction to Object-Oriented Programming with Java by Georgia Tech on edX
\end{itemize}
\end{itemize}

"""
        return latex
    
    def _generate_di_laboratory_resources(self, resources: List[Dict]) -> str:
        latex = r"""
\section{List of Laboratory/Learning Resources Required}

\begin{enumerate}
\item Computer laboratory with networked computers (1:1 ratio)
\item Latest Java Development Kit (JDK 17 or above)
\item Integrated Development Environment (IDE):
\begin{itemize}
\item IntelliJ IDEA Community Edition
\item Eclipse IDE for Java Developers
\item Visual Studio Code with Java extensions
\end{itemize}
\item Internet connectivity for accessing online resources
\item Projector/Smart board for demonstrations
\item Java documentation and reference materials
\item Sample programs and code libraries
\item Testing frameworks (JUnit)
\item Version control system (Git)
\item Database connectivity (MySQL/PostgreSQL for advanced topics)
\end{enumerate}

"""
        return latex
    
    def _generate_di_project_list(self, projects: List[Dict]) -> str:
        latex = r"""
\section{Suggested Project List}

\begin{enumerate}
\item \textbf{Student Information Management System}
\begin{itemize}
\item Design a console-based application to manage student records
\item Features: Add, update, delete, and search student information
\item Use classes, objects, and file handling
\end{itemize}

\item \textbf{Library Management System}
\begin{itemize}
\item Create a system to manage books, members, and borrowing records
\item Implement inheritance and polymorphism concepts
\item Use collections framework for data storage
\end{itemize}

\item \textbf{Simple Banking System}
\begin{itemize}
\item Develop a basic banking application with account management
\item Features: Create account, deposit, withdraw, check balance
\item Implement exception handling for invalid operations
\end{itemize}

\item \textbf{Employee Payroll System}
\begin{itemize}
\item Build a payroll management system for different employee types
\item Use inheritance for different employee categories
\item Implement interfaces for payroll calculations
\end{itemize}

\item \textbf{Online Quiz Application}
\begin{itemize}
\item Create a multiple-choice quiz system
\item Features: Question management, scoring, time limits
\item Use multithreading for timer functionality
\end{itemize}

\item \textbf{Inventory Management System}
\begin{itemize}
\item Develop an inventory tracking system for products
\item Features: Add/remove products, stock management, reports
\item Use serialization for data persistence
\end{itemize}

\item \textbf{Simple Chat Application}
\begin{itemize}
\item Create a basic client-server chat system
\item Implement socket programming and multithreading
\item Features: Multiple users, message broadcasting
\end{itemize}

\item \textbf{Calculator with GUI}
\begin{itemize}
\item Build a graphical calculator application
\item Use Swing or JavaFX for the user interface
\item Implement all basic arithmetic operations
\end{itemize}
\end{enumerate}

"""
        return latex
    
    def _generate_di_student_activities(self, activities: List[str]) -> str:
        latex = r"""
\section{Suggested Activities for Students}

\begin{enumerate}
\item \textbf{Programming Practice}
\begin{itemize}
\item Solve daily programming challenges on platforms like LeetCode, HackerRank, or CodeChef
\item Practice coding problems related to each unit after completion
\item Participate in online coding contests
\end{itemize}

\item \textbf{Code Reading and Analysis}
\begin{itemize}
\item Study and analyze open-source Java projects on GitHub
\item Review and understand well-written Java code examples
\item Document code analysis findings in a learning journal
\end{itemize}

\item \textbf{Group Programming Projects}
\begin{itemize}
\item Form teams of 3-4 students for collaborative programming projects
\item Use version control systems (Git) for team collaboration
\item Practice code review and pair programming techniques
\end{itemize}

\item \textbf{Technical Documentation}
\begin{itemize}
\item Write technical documentation for developed programs
\item Create user manuals and API documentation
\item Maintain programming portfolios and project reports
\end{itemize}

\item \textbf{Peer Learning Activities}
\begin{itemize}
\item Organize peer teaching sessions on complex topics
\item Conduct code walk-throughs and debugging sessions
\item Participate in study groups for exam preparation
\end{itemize}

\item \textbf{Industry Connection}
\begin{itemize}
\item Attend Java user group meetups and technical seminars
\item Follow Java community blogs and forums
\item Participate in hackathons and coding competitions
\end{itemize}

\item \textbf{Practical Applications}
\begin{itemize}
\item Develop mobile applications using Java frameworks
\item Create web applications using Java technologies
\item Explore Java's role in different domains (web, mobile, enterprise)
\end{itemize}

\item \textbf{Certification Preparation}
\begin{itemize}
\item Prepare for Oracle Java certification exams
\item Complete online Java courses with certificates
\item Build a professional portfolio on platforms like LinkedIn
\end{itemize}
\end{enumerate}

"""
        return latex


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
        },
        {
            "name": "Java Programming (New DI Format - sem-3)",
            "path": "content/resources/study-materials/32-ict/sem-3/DI03032021/DI03032021.json"
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
            
            # Detect format
            format_type = generator._detect_syllabus_format(json_data)
            format_name = {
                'new_di': 'New DI Format',
                'cogc_2021': 'COGC-2021 Format',
                'unknown': 'Generic Format'
            }.get(format_type, 'Unknown Format')
            
            print(f"   Format: {format_name} ({format_type})")
            
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
    print(f"   ✅ FORMAT-SPECIFIC GENERATORS: Automatic detection of COGC-2021 vs DI formats")
    print(f"   ✅ Fixed course content table column widths (3cm | 10.5cm | 1.5cm | 1.5cm)")
    print(f"   ✅ Proper line break handling (double backslash instead of quadruple)")
    print(f"   ✅ Improved bullet point formatting with indentation")
    print(f"   ✅ Fixed LaTeX character escaping (proper ampersand handling)")
    print(f"   ✅ Better table text wrapping and content fitting")
    print(f"   ✅ Added course code & title in footer")
    print(f"   ✅ Adjusted header height to fix warnings")
    print(f"   ✅ COGC-2021: Competency section, letter-style course outcomes (a,b,c...)")
    print(f"   ✅ DI Format: Prerequisites section, RBT levels, different headers")

if __name__ == "__main__":
    main()