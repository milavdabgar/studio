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
        """Base LaTeX template with authentic GTU styling"""
        return r"""
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[margin=0.6in,top=0.7in,bottom=0.8in]{geometry}
\usepackage{fancyhdr}
\usepackage{booktabs}
\usepackage{longtable}
\usepackage{array}
\usepackage{multirow}
\usepackage{xcolor}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{graphicx}
\usepackage{tabularx}
\usepackage{hhline}
\usepackage{afterpage}
\usepackage{tikz}
\usepackage{eso-pic}

% GTU Colors - matching authentic colors
\definecolor{gtured}{RGB}{176,48,50}
\definecolor{gtugold}{RGB}{218,165,32}
\definecolor{gtutext}{RGB}{0,0,0}

% Define fancy page styles with golden borders on all pages
\fancypagestyle{gtupage}{
    \fancyhf{}
    % Header with GTU logo and info
    \fancyhead[L]{
        \includegraphics[height=0.6cm]{gtu-logo.png}
    }
    \fancyhead[C]{
        \textbf{GUJARAT TECHNOLOGICAL UNIVERSITY}\\
        \textbf{\footnotesize (Established under Gujarat Technological University Act 2007)}\\
        \textbf{\footnotesize COURSE CURRICULUM}
    }
    \fancyhead[R]{
        \textbf{\footnotesize COURSE_YEAR_PLACEHOLDER}\\
        \textbf{\footnotesize Page \thepage}
    }
    \renewcommand{\headrulewidth}{1pt}
    \renewcommand{\footrulewidth}{0pt}
}

% First page style - no header to avoid duplication
\fancypagestyle{firstpage}{
    \fancyhf{}
    \renewcommand{\headrulewidth}{0pt}
    \renewcommand{\footrulewidth}{0pt}
}

% Set default page style  
\pagestyle{gtupage}

% Adjust header height for subsequent pages
\setlength{\headheight}{39pt}
\setlength{\headsep}{15pt}

% Add golden border to all pages
\AddToShipoutPicture{
    \AtPageLowerLeft{
        \begin{tikzpicture}[overlay,remember picture]
            \draw[color=gtugold,line width=2pt] 
                ([shift={(12pt,12pt)}]current page.south west) 
                rectangle 
                ([shift={(-12pt,-12pt)}]current page.north east);
        \end{tikzpicture}
    }
}

% Section styling - matching GTU format
\titleformat{\section}{\large\bfseries}{}{0em}{}
\titleformat{\subsection}{\normalsize\bfseries}{}{0em}{}

% Hyperlink styling
\hypersetup{
    colorlinks=true,
    linkcolor=black,
    filecolor=black,
    urlcolor=blue,
    citecolor=black
}

% Table styling to match GTU format
\renewcommand{\arraystretch}{1.2}

% Custom command for first page header with course details
\newcommand{\firstpageheader}[5]{
    \thispagestyle{firstpage}
    \vspace*{0.2cm}
    
    \begin{center}
        % Logo and title section - matching original layout exactly
        \includegraphics[height=1.8cm]{gtu-logo.png}
        \hspace{0.5cm}
        \begin{minipage}[c]{10cm}
            \centering
            \textcolor{gtured}{\textbf{\large GUJARAT TECHNOLOGICAL UNIVERSITY}}\\[0.05cm]
            \textcolor{gtured}{\textbf{\normalsize Program Name: #1}}\\[0.02cm]
            \textcolor{gtured}{\textbf{\normalsize Level: #2}}\\[0.02cm]
            \textcolor{gtured}{\textbf{\normalsize Branch: #3}}\\[0.05cm]
            \textcolor{gtured}{\textbf{\normalsize Course / Subject Code : #4}}\\[0.02cm]
            \textcolor{gtured}{\textbf{\normalsize Course / Subject Name : #5}}
        \end{minipage}
    \end{center}
    \vspace{0.3cm}
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
        latex_content = latex_content.replace('COURSE_YEAR_PLACEHOLDER', course_info.get('academicYear', 'w.e.f. 2024-25'))
        
        # Generate first page header with course details
        program = course_info.get('program', 'Engineering')
        level = course_info.get('level', 'Diploma') 
        branch = self._escape_latex(course_info.get('branch', ''))  # Escape ampersand
        latex_content += f"\\firstpageheader{{{program}}}{{{level}}}{{{branch}}}{{{course_code}}}{{{course_title}}}\n\n"
        
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
\begin{tabular}{|c|c|c|c|c|c|c|c|c|}
\hline
\multirow{3}{*}{\textbf{\begin{tabular}{c}Teaching Scheme\\(in Hours)\end{tabular}}} & \multirow{3}{*}{\textbf{\begin{tabular}{c}Total\\Credits\\L+T+\\(PR/2)\end{tabular}}} & \multicolumn{6}{c|}{\textbf{Assessment Pattern and Marks}} & \multirow{3}{*}{\textbf{\begin{tabular}{c}Total\\Marks\end{tabular}}} \\
\cline{3-8}
 &  & \multicolumn{2}{c|}{\textbf{Theory}} & \multicolumn{2}{c|}{\textbf{Tutorial / Practical}} & & &  \\
\cline{3-8}
 &  & \textbf{\begin{tabular}{c}ESE\\(E)\end{tabular}} & \textbf{\begin{tabular}{c}PA\\(M)\end{tabular}} & \textbf{\begin{tabular}{c}PA\\(I)\end{tabular}} & \textbf{\begin{tabular}{c}ESE\\(V)\end{tabular}} & & &  \\
\hline
\textbf{L} & \textbf{T} & \textbf{PR} & \textbf{C} & \textbf{} & \textbf{} & \textbf{} & \textbf{} & \\
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
    
    def _get_content_indentation(self, item: str) -> int:
        """Determine indentation level based on numbering depth and bullet points"""
        item = item.strip()
        
        # Handle bullet points
        if item.startswith('•'):
            return 1
        if item.startswith('○'):
            return 2
        
        # Handle numbered items by counting dots
        # Examples: "1.1" = 0, "1.1.1" = 1, "1.1.1.1" = 2
        if item and item[0].isdigit():
            # Find the first space to get the numbering part
            space_idx = item.find(' ')
            if space_idx > 0:
                numbering = item[:space_idx]
                dot_count = numbering.count('.')
                
                # Indentation based on numbering depth:
                # 1.1, 2.1 = 0 indentation (base level)
                # 1.1.1, 1.1.2 = 1 level indentation 
                # 1.1.1.1 = 2 levels indentation
                if dot_count == 1:  # 1.1, 2.1
                    return 0
                elif dot_count == 2:  # 1.1.1, 1.1.2
                    return 1  
                elif dot_count == 3:  # 1.1.1.1, 1.1.1.2
                    return 2
                else:  # Deeper nesting
                    return min(dot_count - 1, 3)  # Cap at 3 levels of indentation
        
        return 0
    
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
            
            # Process content items and convert bullet points to numbered format
            current_main_topic = None
            sub_topic_counter = 1
            
            for item in content_items:
                clean_item = item.strip()
                
                if not clean_item:
                    continue
                
                # Check if this is a numbered main topic (like "1.1 Something")
                if clean_item and clean_item[0].isdigit() and '.' in clean_item:
                    # This is a main topic - reset sub-topic counter
                    current_main_topic = clean_item.split()[0]  # Get "1.1" part
                    sub_topic_counter = 1
                    
                    # Main topics get no indentation
                    escaped_item = self._escape_latex(clean_item)
                    content_lines.append(escaped_item)
                    
                elif clean_item.startswith('•'):
                    # Convert bullet point to numbered sub-topic
                    if current_main_topic:
                        # Convert "• Something" to "1.1.1 Something" format
                        bullet_text = clean_item[1:].strip()  # Remove bullet and leading space
                        numbered_item = f"{current_main_topic}.{sub_topic_counter} {bullet_text}"
                        sub_topic_counter += 1
                        
                        # Apply one level of indentation for sub-topics
                        escaped_item = self._escape_latex(numbered_item)
                        indented_item = f"\\phantom{{xxx}}{escaped_item}"
                        content_lines.append(indented_item)
                    else:
                        # Fallback: treat as regular bullet with indentation
                        escaped_item = self._escape_latex(clean_item)
                        indented_item = f"\\phantom{{xxx}}{escaped_item}"
                        content_lines.append(indented_item)
                else:
                    # Other content - determine indentation level
                    indentation = self._get_content_indentation(clean_item)
                    escaped_item = self._escape_latex(clean_item)
                    
                    if indentation > 0:
                        indent_str = f"\\phantom{{{'x' * (3 * indentation)}}}"
                        indented_item = f"{indent_str}{escaped_item}"
                        content_lines.append(indented_item)
                    else:
                        content_lines.append(escaped_item)
            
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
        latex_content = latex_content.replace('COURSE_YEAR_PLACEHOLDER', course_info.get('academicYear', 'w.e.f. 2024-25'))
        
        # Generate first page header with course details and border
        program = course_info.get('program', 'Engineering')
        level = course_info.get('level', 'Diploma') 
        branch = self._escape_latex(course_info.get('branch', ''))  # Escape ampersand
        latex_content += f"\\firstpageheader{{{program}}}{{{level}}}{{{branch}}}{{{course_code}}}{{{course_title}}}\n\n"
        
        # DI Format specific sections - add course details table right after header
        latex_content += self._generate_first_page_course_details_table(course_info)
        
        # Prerequisites section in table format like original
        if course_info.get('prerequisite'):
            latex_content += f"""
\\begin{{center}}
\\begin{{tabular}}{{|l|p{{11cm}}|}}
\\hline
\\textbf{{Prerequisite:}} & {self._escape_latex(course_info['prerequisite'])} \\\\
\\hline
\\end{{tabular}}
\\end{{center}}

\\vspace{{0.3cm}}

"""
        
        # Course Description (if available)
        if json_data.get('courseDescription'):
            latex_content += f"""
\\section{{Course Description}}

{self._escape_latex(json_data['courseDescription'])}

"""
        
        # Rationale in table format like original
        if 'rationale' in json_data:
            latex_content += f"""
\\begin{{center}}
\\begin{{tabular}}{{|l|p{{11cm}}|}}
\\hline
\\textbf{{Rationale:}} & {self._escape_latex(json_data['rationale'])} \\\\
\\hline
\\end{{tabular}}
\\end{{center}}

\\vspace{{0.3cm}}

"""
        
        # Course Outcomes with DI format styling
        if 'courseOutcomes' in json_data:
            latex_content += self._generate_di_course_outcomes(json_data['courseOutcomes'])
        
        # End first page border
        latex_content += "\\newpage\n\n"
        
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
        latex_content = latex_content.replace('COURSE_YEAR_PLACEHOLDER', course_info.get('academicYear', 'w.e.f. 2024-25'))
        
        # Generate first page header with course details
        program = course_info.get('program', 'Engineering')
        level = course_info.get('level', 'Diploma') 
        branch = self._escape_latex(course_info.get('branch', ''))  # Escape ampersand
        latex_content += f"\\firstpageheader{{{program}}}{{{level}}}{{{branch}}}{{{course_code}}}{{{course_title}}}\n\n"
        
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
        """Generate course outcomes for DI format matching original layout"""
        latex = r"""
\textbf{Course Outcome:}\\
After Completion of the Course, Student will able to:

\begin{center}
\begin{tabular}{|c|p{10cm}|c|}
\hline
\textbf{No} & \textbf{Course Outcomes} & \textbf{RBT Level} \\
\hline
"""
        
        for outcome in outcomes:
            co_id = outcome.get('id', '').replace('CO', '')  # Remove CO prefix for cleaner look
            description = self._escape_latex(outcome.get('description', ''))
            # DI format uses combined RBT levels like "R,U,A"
            rbt_level = outcome.get('rbtLevel', outcome.get('bloomLevel', ''))
            latex += f"{co_id} & {description} & {rbt_level} \\\\\n\\hline\n"
        
        latex += r"""\end{tabular}
\end{center}

\vspace{0.3cm}
\textit{*Revised Bloom's Taxonomy (RBT)}

"""
        return latex

    def _generate_di_teaching_scheme(self, scheme: Dict) -> str:
        """Generate teaching scheme for DI format with proper 3-tier header structure"""
        teaching = scheme.get('teachingScheme', {})
        examination = scheme.get('examinationScheme', {})
        
        latex = r"""
\section{Teaching and Examination Scheme}

\begin{center}
\small
\begin{tabular}{|c|c|c|c|c|c|c|c|c|}
\hline
\multicolumn{3}{|c|}{\textbf{\begin{tabular}{c}Teaching Scheme\\(in Hours)\end{tabular}}} & \multirow{3}{*}{\textbf{\begin{tabular}{c}Total\\Credits\\L+T+\\(PR/2)\end{tabular}}} & \multicolumn{4}{c|}{\textbf{Assessment Pattern and Marks}} & \multirow{3}{*}{\textbf{\begin{tabular}{c}Total\\Marks\end{tabular}}} \\
\cline{1-3}\cline{5-8}
 & & & & \multicolumn{2}{c|}{\textbf{Theory}} & \multicolumn{2}{c|}{\textbf{Tutorial / Practical}} & \\
\cline{5-8}
\textbf{L} & \textbf{T} & \textbf{PR} & & \textbf{\begin{tabular}{c}ESE\\(E)\end{tabular}} & \textbf{PA(M)} & \textbf{PA(I)} & \textbf{\begin{tabular}{c}ESE (V)\end{tabular}} & \\
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

    def _generate_first_page_course_details_table(self, course_info: Dict) -> str:
        """Generate the course details table for first page like in original GTU syllabus"""
        latex = r"""
\begin{center}
\begin{tabular}{|l|l|}
\hline
\textbf{w.e.f Academic Year:} & """ + self._escape_latex(course_info.get('academicYear', '2024-25')) + r""" \\
\hline
\textbf{Semester:} & """ + str(course_info.get('semester', '')) + r"""$^{rd}$ \\
\hline
\textbf{Category of the Course:} & """ + self._escape_latex(course_info.get('category', '')) + r""" \\
\hline
\end{tabular}
\end{center}

\vspace{0.5cm}

"""
        return latex

    # Placeholder methods for additional DI format sections
    def _generate_di_specification_table(self, table: List[Dict]) -> str:
        latex = r"""
\section{Suggested Specification Table with Marks (Theory)}

"""
        
        if table and len(table) > 0:
            # Use data from JSON
            spec_data = table[0]  # Usually there's one overall distribution
            
            latex += r"""
\begin{center}
\small
\begin{tabular}{|c|c|c|c|c|c|}
\hline
\multicolumn{6}{|c|}{\textbf{Distribution of Theory Marks (in \%)}} \\
\hline
\textbf{R Level} & \textbf{U Level} & \textbf{A Level} & \textbf{N Level} & \textbf{E Level} & \textbf{C Level} \\
\hline
"""
            
            # Get values from JSON data, with fallbacks
            r_level = spec_data.get('rememberLevel', 0)
            u_level = spec_data.get('understandLevel', 0) 
            a_level = spec_data.get('applyLevel', 0)
            n_level = spec_data.get('analyzeLevel', 0) if spec_data.get('analyzeLevel', 0) > 0 else '--'
            e_level = spec_data.get('evaluateLevel', 0) if spec_data.get('evaluateLevel', 0) > 0 else '--'
            c_level = spec_data.get('createLevel', 0) if spec_data.get('createLevel', 0) > 0 else '--'
            
            latex += f"{r_level} & {u_level} & {a_level} & {n_level} & {e_level} & {c_level} \\\\\n"
            latex += r"""\hline
\end{tabular}
\end{center}

\textit{Where R: Remember; U: Understanding; A: Application, N: Analyze and E: Evaluate C: Create (as per Revised Bloom's Taxonomy)}

"""
        else:
            # Fallback if no data available
            latex += r"""
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

"""
        
        # Books section
        if 'books' in resources and resources['books']:
            latex += r"\subsection{(a) Books:}" + "\n"
            latex += r"\begin{enumerate}" + "\n"
            
            for book in resources['books']:
                title = self._escape_latex(book.get('title', ''))
                author = self._escape_latex(book.get('author', ''))
                publication = self._escape_latex(book.get('publication', ''))
                isbn = book.get('isbn', '')
                
                book_entry = f"{title}"
                if author:
                    book_entry += f" by {author}"
                if publication:
                    book_entry += f", {publication}"
                if isbn:
                    book_entry += f", ISBN: {isbn}"
                
                latex += f"\\item {book_entry}\n"
            
            latex += r"\end{enumerate}" + "\n\n"
        
        # Software and websites section
        latex += r"\subsection{(b) Open source software and website:}" + "\n"
        latex += r"\begin{itemize}" + "\n"
        
        # Software subsection
        if 'openSourceSoftware' in resources and resources['openSourceSoftware']:
            latex += r"\item \textbf{Softwares}" + "\n"
            latex += r"\begin{itemize}" + "\n"
            
            for software in resources['openSourceSoftware']:
                name = self._escape_latex(software.get('name', ''))
                url = software.get('url', '')
                
                if name:
                    if url and url.strip():
                        # Make it a clickable link
                        latex += f"\\item \\href{{{url}}}{{{name}}}\n"
                    else:
                        # Plain text if no URL
                        latex += f"\\item {name}\n"
            
            latex += r"\end{itemize}" + "\n"
        
        # Websites section - categorize by type
        if 'websites' in resources and resources['websites']:
            website_categories = {}
            
            # Group websites by type
            for website in resources['websites']:
                website_type = website.get('type', 'Other')
                if website_type not in website_categories:
                    website_categories[website_type] = []
                website_categories[website_type].append(website)
            
            # Generate sections for each type
            for category_name, websites in website_categories.items():
                if websites:
                    # Map category names to display names
                    display_names = {
                        'Official Documentation': r'\textbf{Official Documentation}',
                        'Online Tutorial': r'\textbf{Online Tutorials}',
                        'Video Course': r'\textbf{Video Courses}',
                        'Comprehensive Course': r'\textbf{Comprehensive Courses}'
                    }
                    
                    display_name = display_names.get(category_name, f"\\textbf{{{self._escape_latex(category_name)}}}")
                    latex += f"\\item {display_name}\n"
                    latex += r"\begin{itemize}" + "\n"
                    
                    for website in websites:
                        title = self._escape_latex(website.get('title', ''))
                        url = website.get('url', '')
                        
                        if title:
                            if url and url.strip():
                                # Make it a clickable link
                                latex += f"\\item \\href{{{url}}}{{{title}}}\n"
                            else:
                                # Plain text if no URL
                                latex += f"\\item {title}\n"
                    
                    latex += r"\end{itemize}" + "\n"
        
        latex += r"\end{itemize}" + "\n\n"
        
        return latex
    
    def _generate_di_laboratory_resources(self, resources: List[Dict]) -> str:
        latex = r"""
\section{List of Laboratory/Learning Resources Required}

"""
        
        if resources:
            latex += r"\begin{longtable}{|p{1cm}|p{8cm}|p{3cm}|p{2cm}|}" + "\n"
            latex += r"\hline" + "\n"
            latex += r"\textbf{Sr. No} & \textbf{Resource Name} & \textbf{Specifications} & \textbf{Applicable To} \\" + "\n"
            latex += r"\hline" + "\n"
            latex += r"\endhead" + "\n"
            
            for resource in resources:
                sr_no = resource.get('srNo', '')
                name = self._escape_latex(resource.get('resourceName', ''))
                specs = self._escape_latex(resource.get('specifications', ''))
                applicable = self._escape_latex(resource.get('applicableTo', ''))
                
                latex += f"{sr_no} & {name} & {specs} & {applicable} \\\\\n\\hline\n"
            
            latex += r"\end{longtable}" + "\n\n"
        else:
            # Fallback to generic format if no specific resources provided
            latex += r"\begin{enumerate}" + "\n"
            latex += r"\item Computer laboratory with networked computers (1:1 ratio)" + "\n"
            latex += r"\item Required development environment and tools" + "\n"  
            latex += r"\item Internet connectivity for accessing online resources" + "\n"
            latex += r"\item Projector/Smart board for demonstrations" + "\n"
            latex += r"\end{enumerate}" + "\n\n"
        
        return latex
    
    def _generate_di_project_list(self, projects: List[Dict]) -> str:
        latex = r"""
\section{Suggested Project List}

"""
        
        if projects:
            latex += r"\begin{enumerate}" + "\n"
            
            for project in projects:
                title = self._escape_latex(project.get('title', ''))
                description = self._escape_latex(project.get('description', ''))
                domain = self._escape_latex(project.get('domain', ''))
                
                if title:
                    latex += f"\\item \\textbf{{{title}}}\n"
                    if description:
                        latex += "\\begin{itemize}\n"
                        latex += f"\\item {description}\n"
                        if domain:
                            latex += f"\\item Domain: {domain}\n"
                        latex += "\\end{itemize}\n\n"
            
            latex += r"\end{enumerate}" + "\n\n"
        else:
            # Fallback message if no projects provided
            latex += "Please refer to course materials for suggested project topics.\n\n"
        
        return latex
    
    def _generate_di_student_activities(self, activities) -> str:
        latex = r"""
\section{Suggested Activities for Students}

"""
        
        if activities:
            latex += r"\begin{enumerate}" + "\n"
            
            for activity_item in activities:
                if isinstance(activity_item, dict):
                    # Handle structured activity object
                    activity_text = activity_item.get('activity', '')
                    activity_type = activity_item.get('type', '')
                    context = activity_item.get('context', '')
                    
                    # Format as: Activity description (Type): Context
                    formatted_activity = f"{self._escape_latex(activity_text)}"
                    if activity_type:
                        formatted_activity += f" (\\textbf{{{activity_type}}})"
                    if context:
                        formatted_activity += f": {self._escape_latex(context)}"
                    
                    latex += f"\\item {formatted_activity}\n\n"
                else:
                    # Handle simple string activity
                    escaped_activity = self._escape_latex(str(activity_item))
                    latex += f"\\item {escaped_activity}\n\n"
            
            latex += r"\end{enumerate}" + "\n\n"
        else:
            # Fallback message if no activities provided
            latex += "Students are encouraged to engage in additional learning activities as recommended by the instructor.\n\n"
        
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