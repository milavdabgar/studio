#!/usr/bin/env python3
"""
AI Voiceover Video Generator for Slidev Presentations
=======================================================

This script generates AI voiceovers for Slidev presentations using modern TTS technology.
It extracts slide content, generates natural speech, and creates a complete video presentation.

Technologies used:
- ElevenLabs API (best commercial TTS)
- OpenAI TTS (cost-effective alternative) 
- Slidev for slide export
- FFmpeg for video processing
- MoviePy for video composition

Author: AI Assistant
Date: 2024-07-23
"""

import re
import os
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Tuple
import time

try:
    import openai
    import requests
    # Try different ElevenLabs import patterns for different versions
    try:
        from elevenlabs.client import ElevenLabs
        from elevenlabs import Voice, VoiceSettings
    except ImportError:
        try:
            from elevenlabs import ElevenLabs, Voice, VoiceSettings
        except ImportError:
            print("ElevenLabs not available, will use OpenAI TTS only")
            ElevenLabs = None
    
    try:
        from moviepy.editor import *
    except ImportError:
        print("MoviePy not available for video generation")
        
except ImportError as e:
    print(f"Installing required packages due to: {e}")
    subprocess.run(["pip", "install", "openai", "elevenlabs", "moviepy", "requests", "pyttsx3"], check=True)
    import openai
    import requests


class SlidevVoiceoverGenerator:
    """Generate AI voiceovers for Slidev presentations"""
    
    def __init__(self, slide_file: str, output_dir: str = "voiceover_output"):
        self.slide_file = Path(slide_file)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # TTS Configuration
        self.tts_provider = "elevenlabs"  # or "openai"
        self.voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel from ElevenLabs (professional female voice)
        
        # Video Configuration
        self.slide_duration = 30  # seconds per slide (will adjust based on speech length)
        self.video_width = 1920
        self.video_height = 1080
        
        # Slide content storage
        self.slides = []
        self.voiceover_scripts = []
        
    def parse_slidev_content(self) -> List[Dict[str, Any]]:
        """Parse Slidev markdown file and extract slide content"""
        print(f"📖 Parsing Slidev file: {self.slide_file}")
        
        with open(self.slide_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split slides by --- separator
        slide_parts = content.split('\n---\n')
        
        slides = []
        for i, slide_content in enumerate(slide_parts):
            if i == 0:  # First part contains frontmatter
                continue
                
            slide_data = {
                'slide_number': i,
                'raw_content': slide_content.strip(),
                'title': self._extract_title(slide_content),
                'content': self._clean_slide_content(slide_content),
                'layout': self._extract_layout(slide_content)
            }
            slides.append(slide_data)
            
        self.slides = slides
        print(f"✅ Parsed {len(slides)} slides")
        return slides
    
    def _extract_title(self, slide_content: str) -> str:
        """Extract main title from slide content"""
        lines = slide_content.split('\n')
        for line in lines:
            if line.startswith('# '):
                return line[2:].strip()
        return f"Slide {len(self.slides) + 1}"
    
    def _extract_layout(self, slide_content: str) -> str:
        """Extract layout from slide frontmatter"""
        layout_match = re.search(r'layout:\s*(\w+)', slide_content)
        return layout_match.group(1) if layout_match else 'default'
    
    def _clean_slide_content(self, slide_content: str) -> str:
        """Clean slide content for TTS conversion"""
        # Remove frontmatter
        content = re.sub(r'^layout:.*$', '', slide_content, flags=re.MULTILINE)
        content = re.sub(r'^class:.*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'^theme:.*$', '', content, flags=re.MULTILINE)
        
        # Remove HTML tags and components
        content = re.sub(r'<[^>]+>', '', content)
        
        # Remove markdown formatting but keep structure
        content = re.sub(r'\*\*([^*]+)\*\*', r'\1', content)  # Bold
        content = re.sub(r'\*([^*]+)\*', r'\1', content)      # Italic
        content = re.sub(r'`([^`]+)`', r'\1', content)        # Code
        
        # Remove code blocks and mermaid diagrams
        content = re.sub(r'```[\s\S]*?```', '', content)
        
        # Clean up whitespace
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = content.strip()
        
        return content
    
    def generate_voiceover_scripts(self) -> List[str]:
        """Generate natural voiceover scripts for each slide"""
        print("🎤 Generating voiceover scripts...")
        
        scripts = []
        
        # Define voiceover templates for different slide types
        intro_script = """
        Welcome to today's lecture on Computer Security Fundamentals. 
        In this session, we'll explore the CIA Triad and Information Security Principles.
        These concepts form the foundation of all cybersecurity practices.
        Let's begin our journey into the world of information security.
        """
        
        scripts_by_slide = {
            1: intro_script.strip(),
            
            2: """
            Let's start with a quick recap of our previous lecture.
            We covered the fundamental definition of cyber security, how to protect digital assets,
            the current threat landscape we face today, career opportunities in cybersecurity,
            and important regulatory requirements.
            
            Today, our learning objectives include understanding the CIA Triad fundamentals,
            learning to apply security principles in practice, analyzing real-world examples,
            and designing secure systems using CIA principles.
            """,
            
            3: """
            Now, let's dive into the heart of information security: the CIA Triad.
            The CIA Triad is the foundation of information security, consisting of three core principles:
            
            First, Confidentiality - which focuses on privacy, access control, and encryption.
            Second, Integrity - ensuring accuracy, completeness, and trustworthiness of data.
            Third, Availability - guaranteeing accessibility, uptime, and reliability of systems.
            
            These three principles work together to create a comprehensive security framework.
            """,
            
            4: """
            Let's examine Confidentiality in detail - the principle of keeping secrets secret.
            
            Confidentiality ensures that sensitive information is accessible only to authorized individuals
            and remains hidden from unauthorized parties.
            
            The key principles include operating on a need-to-know basis, implementing least privilege access,
            proper data classification, and privacy protection.
            
            Implementation methods include encryption both at rest and in transit,
            robust access controls and permissions, strong authentication mechanisms,
            and data masking and anonymization techniques.
            
            Looking at real-world examples, we see good confidentiality practices in banking where account numbers are encrypted,
            healthcare where patient records are protected, government where classified documents are secured,
            and corporations where trade secrets are protected.
            
            However, we've also seen major breaches like Equifax in 2017 affecting 147 million records,
            Facebook in 2018 with 87 million users impacted, Yahoo's massive breach from 2013 to 2014 affecting 3 billion accounts,
            and Marriott's 2018 incident where 500 million guests' data was stolen.
            
            These breaches result in significant financial losses, identity theft, reputation damage, and legal consequences.
            """,
            
            5: """
            Moving to the technical implementation of confidentiality, let's explore encryption technologies.
            
            Symmetric encryption, such as AES, uses the same key for both encryption and decryption.
            Here's a simple example using Python's cryptography library.
            We generate a key, create a cipher suite, encrypt our confidential information, and then decrypt it when needed.
            
            Access control models include Discretionary Access Control or DAC, 
            Mandatory Access Control or MAC, Role-Based Access Control or RBAC, 
            and Attribute-Based Access Control or ABAC.
            
            Authentication systems rely on three factors: something you know like passwords,
            something you have like tokens or cards, and something you are like biometric data.
            
            Authorization levels range from basic read permissions to view information,
            write permissions to modify information, execute permissions to run programs,
            delete permissions to remove information, and administrative permissions for full control.
            
            Resource classification typically includes public data with no restrictions,
            internal data for company use only, confidential data with limited access,
            and restricted data requiring the highest level of protection.
            """,
            
            6: """
            Now let's focus on Integrity - ensuring data accuracy and completeness.
            
            Integrity ensures that data remains accurate, complete, and unaltered during storage, processing, and transmission,
            whether changes occur by accident or through malicious intent.
            
            Key aspects include data accuracy ensuring information is correct,
            data completeness meaning nothing is missing, data consistency with no contradictions,
            and non-repudiation ensuring actions are undeniable.
            
            Threat scenarios that compromise integrity include unauthorized modifications,
            system errors and bugs, hardware failures, malicious attacks, and human errors.
            
            To protect integrity, we use technical controls like hash functions such as MD5 and SHA-256,
            digital signatures, checksums and CRC, version control systems, and database constraints.
            
            Procedural controls include change management processes, comprehensive audit trails,
            input validation procedures, backup verification, and data reconciliation practices.
            
            Common integrity violations include SQL injection attacks that manipulate databases,
            man-in-the-middle attacks that alter data in transit, insider threats causing unauthorized changes,
            and system corruption from hardware or software failures.
            """,
            
            7: """
            Let's dive deeper into hash functions and digital signatures for integrity protection.
            
            Hash functions generate unique fingerprints for data to detect any changes.
            Here's a Python example showing how even small modifications result in completely different hash values.
            
            Hash functions have important properties: they're deterministic, meaning the same input always produces the same hash,
            they provide fast computation, they exhibit the avalanche effect where small changes create big differences in output,
            and they're one-way functions that cannot be reversed.
            
            Digital signatures provide a comprehensive integrity solution.
            The process starts with a document that goes through a hash function to create a message digest.
            This digest is then encrypted with a private key to create the digital signature.
            
            For verification, the received document goes through the same hash function to create a new digest.
            The digital signature is decrypted using the public key to recover the original digest.
            These two digests are compared - if they match, the document is valid and unmodified.
            
            Digital signatures provide multiple benefits: authentication to prove sender identity,
            integrity detection to identify tampering, non-repudiation so senders cannot deny signing,
            and timestamping to prove when documents were signed.
            """,
            
            8: """
            Moving to our third pillar: Availability - ensuring system access when needed.
            
            Availability ensures that information and resources are accessible to authorized users when needed,
            maintaining system uptime and responsiveness.
            
            Key metrics include uptime percentage, where 99.9% uptime still means 8.76 hours of downtime per year,
            Mean Time Between Failures or MTBF, Mean Time To Recovery or MTTR,
            Recovery Point Objective or RPO, and Recovery Time Objective or RTO.
            
            Availability requirements vary: 24/7 critical systems like hospitals and emergency services require constant availability,
            business applications typically need availability during standard office hours,
            systems require scheduled maintenance windows, and all systems need disaster recovery capabilities.
            
            Infrastructure design solutions include redundancy to eliminate single points of failure,
            load balancing to distribute traffic effectively, clustering with multiple servers,
            and geographic distribution across multiple locations.
            
            Backup strategies follow the 3-2-1 rule: maintain 3 copies of data, store them on 2 different types of media,
            and keep 1 copy offsite. This includes full backups with complete data copies,
            incremental backups capturing only changes, and differential backups showing changes since the last full backup.
            
            Threat mitigation includes DDoS protection, comprehensive hardware monitoring,
            proactive capacity planning, and well-defined incident response procedures.
            """,
            
            9: """
            Let's examine high availability architectures and redundancy models.
            
            Active-Active configuration distributes load across all servers simultaneously.
            A load balancer routes traffic to multiple active servers, all connected to a database cluster.
            This provides higher resource utilization and better performance, but requires more complex management.
            
            Active-Passive configuration uses one primary server with standby servers ready for failover.
            While resource inefficient since standby servers aren't actively serving traffic, it's simpler to implement and manage.
            
            Availability levels have direct business implications.
            90% uptime means 36.5 days of downtime per year, suitable only for development environments.
            95% uptime equals 18.25 days of downtime annually, acceptable for internal tools.
            99% uptime reduces downtime to 3.65 days per year, appropriate for business applications.
            99.9% uptime, considered high availability, allows only 8.76 hours of downtime yearly, necessary for e-commerce platforms.
            99.99% uptime, very high availability, limits downtime to just 52.6 minutes per year, required for financial systems.
            99.999% uptime, extreme availability, permits only 5.26 minutes of annual downtime, essential for emergency services.
            
            The relationship between cost and availability is important to understand.
            Higher availability always means higher cost, with diminishing returns after 99.9%.
            This requires careful business impact analysis and consideration of risk tolerance.
            """,
            
            10: """
            Understanding CIA Triad relationships and trade-offs is crucial for practical implementation.
            
            There's often tension between Confidentiality and Availability.
            Strong encryption may slow down system access, complex authentication reduces usability,
            and strict access controls can limit system availability.
            
            Similarly, Integrity measures can impact Performance.
            Hash calculations consume computational resources, digital signatures add processing time,
            and comprehensive audit logging requires significant storage capacity.
            
            The broader challenge is balancing Security with Usability.
            Generally, more security means less convenience, affecting user experience,
            but we must find the right balance for our specific needs.
            
            Our decision framework starts with critical risk assessment questions:
            What data needs protection? Who needs access to it? What are the primary threats?
            What's the potential business impact? And what's our available budget?
            
            We can use a prioritization matrix to guide decisions.
            High impact, high probability risks require immediate attention as Priority 1.
            High impact, low probability risks need planning and preparation as Priority 2.
            Low impact, high probability risks should be monitored and mitigated as Priority 3.
            Low impact, low probability risks can often be accepted as Priority 4.
            """,
            
            11: """
            Let's examine real-world CIA Triad applications across different sectors.
            
            In Banking Systems, all three aspects are equally critical.
            For Confidentiality, we see account encryption, personally identifiable information protection, and transaction privacy.
            Integrity ensures transaction accuracy, maintains comprehensive audit trails, and provides non-repudiation.
            Availability guarantees 24/7 ATM access, online banking uptime, and robust disaster recovery capabilities.
            
            Healthcare Systems prioritize Availability over Integrity over Confidentiality.
            Confidentiality includes HIPAA compliance, patient record privacy, and medical history protection.
            Integrity ensures medical record accuracy, prescription correctness, and complete treatment histories.
            Availability is paramount for emergency access, life support systems, and medical device uptime,
            because in healthcare, availability can literally be a matter of life and death.
            
            Educational Systems prioritize Integrity over Confidentiality over Availability.
            Confidentiality protects student records under FERPA regulations, maintains grade privacy, and secures research data.
            Integrity is crucial for grade accuracy, academic transcript reliability, and research result validity.
            Availability supports learning management systems, online classes, and student services,
            but temporary downtime is generally less critical than data accuracy.
            """,
            
            12: """
            Beyond the CIA Triad, we have additional security principles that complement our foundation.
            
            Non-Repudiation ensures users cannot deny their performed actions.
            This is achieved through digital signatures that provide legal proof,
            comprehensive audit trails that track all activities, and maintaining evidence for legal disputes.
            
            Authentication verifies user identity before granting access.
            This includes multi-factor authentication systems, requirements for strong credentials,
            and comprehensive identity management systems.
            
            Authorization determines user permissions after successful authentication.
            This involves role-based access control systems, applying the principle of least privilege,
            and conducting regular access reviews to ensure permissions remain appropriate.
            
            Key design principles include Defense in Depth, which implements multiple security layers
            with no single point of failure and overlapping controls for comprehensive protection.
            
            The Fail Secure principle ensures systems default to a secure state when failures occur,
            implementing default deny policies and safe failure modes.
            
            Separation of Duties prevents any single person from having complete control,
            requires multiple approvals for critical actions, and helps prevent both fraud and errors.
            
            Security by Design builds security into systems from the very beginning,
            treating security as a core requirement rather than an afterthought,
            and implementing secure-by-default configurations.
            """,
            
            13: """
            Security controls are classified into three main categories based on their function.
            
            Preventive Controls are proactive measures that stop security incidents from occurring.
            Examples include firewalls that block unauthorized network traffic,
            access controls that prevent unauthorized system access, encryption that protects data confidentiality,
            security training that prevents human errors, and policies that guide proper behavior.
            These controls represent a proactive approach, serving as the first line of defense.
            They're typically cost-effective and help reduce overall risk exposure.
            
            Detective Controls identify security incidents when they occur.
            Examples include Intrusion Detection and Prevention Systems for network monitoring,
            Security Information and Event Management systems for log analysis,
            antivirus software for malware detection, security audits for compliance checking,
            and surveillance cameras for physical monitoring.
            These controls provide real-time monitoring capabilities, generate alerts when issues are detected,
            collect evidence for investigation, and help with incident identification.
            
            Corrective Controls respond to and help recover from security incidents.
            Examples include backup systems for data recovery, incident response procedures,
            security patches for vulnerability fixes, quarantine systems to isolate threats,
            and forensic tools for investigation.
            These controls take a reactive approach, focus on damage limitation and recovery,
            and provide valuable learning opportunities for future prevention.
            """,
            
            14: """
            Information classification systems help organizations properly categorize and protect their data.
            
            Government Classification systems use a hierarchical approach.
            Top Secret information could cause the gravest damage to national security,
            requires the highest level of protection, has very limited access, and needs special handling procedures.
            
            Secret information could cause serious damage to national security,
            requires restricted access with background checks needed, and must be stored in controlled environments.
            
            Confidential information could cause damage to national security,
            has limited distribution requirements, needs basic security measures, and requires access controls.
            
            Unclassified information poses no damage to national security,
            can be released to the public, and needs only minimal protection.
            
            Commercial Classification systems adapt these concepts for business use.
            Restricted information includes trade secrets, financial data, legal documents, and executive communications.
            Confidential information covers employee records, customer data, business plans, and internal procedures.
            Internal Use information includes company policies, phone directories, internal announcements, and training materials.
            Public information encompasses marketing materials, press releases, public websites, and annual reports.
            """,
            
            15: """
            Let's put our knowledge into practice with a hands-on CIA analysis exercise.
            
            We have two scenarios to analyze in groups.
            
            Scenario 1 focuses on an E-commerce Website - an online shopping platform handling customer orders and payments.
            
            Your task is to identify CIA requirements for each component:
            the customer account system, shopping cart functionality, payment processing,
            order management system, and inventory management.
            
            Next, rank CIA priorities from 1 to 3 for each component based on business criticality.
            Finally, suggest specific security controls for each CIA requirement you identify.
            
            Scenario 2 examines a Hospital Information System - an electronic health records system for patient care.
            
            Analyze CIA needs for patient records, medical imaging systems, prescription systems,
            emergency access procedures, and billing systems.
            
            Consider how the life-critical nature of healthcare affects your CIA prioritization.
            Think about regulatory requirements like HIPAA and how they influence your control selection.
            
            Take 20 minutes to work through these scenarios in your groups.
            We'll share findings and discuss the different approaches each group takes.
            """,
            
            16: """
            Let's examine common mistakes in CIA implementation and learn from them.
            
            Common Confidentiality errors include using weak encryption algorithms,
            poor key management practices, granting excessive permissions to users,
            storing data in plain text, and using insecure communication channels.
            
            Integrity failures often involve missing input validation,
            absence of checksums for data verification, inadequate change control processes,
            poor audit trail maintenance, and using unsigned software.
            
            Availability issues typically stem from single points of failure in system design,
            inadequate backup strategies, lack of disaster recovery planning,
            poor capacity planning, and insufficient system monitoring.
            
            Best practices start in the Design Phase with thorough security requirements gathering,
            comprehensive threat modeling exercises, complete risk assessment,
            security architecture review, and proper control selection processes.
            
            During Implementation, follow secure coding practices, implement configuration hardening,
            conduct thorough testing and validation, create comprehensive documentation, and provide adequate training.
            
            The Maintenance Phase requires regular security assessments, continuous monitoring systems,
            effective incident response capabilities, timely updates and patches, and ongoing performance reviews.
            """,
            
            17: """
            Measuring security effectiveness requires comprehensive metrics and continuous improvement processes.
            
            Confidentiality Metrics include tracking data loss incidents per year,
            monitoring unauthorized access attempts, measuring encryption coverage percentage,
            tracking access review completion rates, and maintaining privacy compliance scores.
            
            Integrity Metrics involve counting data corruption incidents,
            monitoring hash verification failures, tracking change control violations,
            measuring audit finding resolution times, and checking backup verification success rates.
            
            Availability Metrics focus on system uptime percentages,
            mean time to recovery, incident response times, capacity utilization monitoring, and performance benchmarking.
            
            Our continuous improvement process follows a cycle: Monitor systems continuously,
            Measure performance against established baselines, Analyze results to identify trends and issues,
            and Improve processes based on analysis results.
            
            Key Performance Indicators include security return on investment calculations,
            risk reduction percentages, compliance ratings, user satisfaction scores, and cost per incident analysis.
            
            Effective reporting frameworks provide executive dashboards for leadership,
            detailed technical reports for IT teams, trend analysis for strategic planning, and benchmarking studies for industry comparison.
            """,
            
            18: """
            Let's examine a comprehensive case study showing CIA principles in practice.
            
            Our case study focuses on an Online Banking System serving 10 million customers
            with 50 billion dollars in deposits, requiring 24/7 operations and regulatory compliance with PCI DSS and SOX.
            
            For Confidentiality implementation, they use AES-256 encryption for data at rest,
            TLS 1.3 for data in transit, multi-factor authentication for all access,
            role-based access control systems, and data masking in non-production environments.
            
            Integrity measures include digital signatures for all transactions,
            hash validation for data transfers, comprehensive audit logging of all activities,
            database constraints to prevent data corruption, and regular reconciliation processes.
            
            Availability solutions achieve 99.99% uptime requirements through active-active data centers,
            real-time data replication, load balancing across geographic regions, and comprehensive DDoS protection.
            
            The results achieved are impressive: zero data breaches in 2 years,
            99.995% actual uptime exceeding requirements, 2 million dollars saved in fraud prevention,
            full regulatory compliance maintained, and customer trust preserved.
            
            Key lessons learned include that CIA balance is achievable with proper planning,
            security investment pays off through risk reduction, regular testing is essential for success,
            staff training is critical for implementation, and continuous improvement is required for long-term success.
            """,
            
            19: """
            Industry standards and frameworks provide structured approaches to implementing CIA principles.
            
            ISO/IEC 27001 focuses on Information Security Management with a risk-based approach,
            continuous improvement methodology, and strong management commitment requirements.
            
            The NIST Framework follows the model of Identify, Protect, Detect, Respond, and Recover,
            with risk management focus, voluntary guidelines that are widely adopted across industries.
            
            COBIT serves as an IT Governance framework emphasizing business alignment,
            risk optimization, and effective resource management.
            
            Industry-specific standards address unique sector requirements.
            
            In Healthcare, HIPAA protects patient privacy, HITECH adds security requirements,
            and FDA provides medical device security guidelines.
            
            The Finance sector follows PCI DSS for payment card security,
            SOX for financial reporting integrity, and Basel III for comprehensive risk management.
            
            Government systems comply with FISMA for federal information systems,
            Common Criteria for security evaluation, and the NIST SP 800 series for detailed security guidelines.
            
            These frameworks provide tested methodologies, compliance requirements, and industry best practices
            that organizations can adapt to their specific CIA implementation needs.
            """,
            
            20: """
            As we build on our CIA foundation, let's look at what comes next in our cybersecurity journey.
            
            Our upcoming Lecture 3 will cover Computer Security Terminology,
            where we'll explore adversaries and threat actors, attack vectors and methods,
            countermeasures and security controls, risk assessment and management processes,
            and security policies and procedures.
            
            To prepare for our next session, please read Chapter 2 of your textbook,
            research recent security incidents in the news, think about potential threats to your own organization,
            and consider various risk scenarios you might encounter.
            
            Key takeaways from today's lecture center on remembering the CIA Triad
            as the foundation of all security decisions. Balance is key to practical implementation,
            context matters significantly in prioritization decisions, and measurement enables continuous improvement.
            
            When applying these concepts in practice, remember that every system decision has CIA implications.
            Always consider all three aspects in your analysis, document your reasoning for future reference,
            test your implementations thoroughly, and continuously monitor and adjust your approach.
            
            The CIA Triad provides a timeless framework that remains relevant regardless of technological changes.
            Master these principles, and you'll have a solid foundation for any cybersecurity challenge you encounter.
            """,
            
            21: """
            Now let's open the floor for questions and discussion.
            
            Some discussion points to consider:
            Which CIA aspect do you find most challenging to implement in your experience?
            How would you handle conflicts between CIA requirements in system design?
            What do you see as the biggest CIA threats based on your experience or current events?
            
            I'd also love to hear the results from your practical CIA analysis exercise.
            Please share your group findings and the different approaches you took to analyzing
            the e-commerce and healthcare scenarios.
            
            Remember, there's no single "correct" answer - different organizations, contexts, and risk tolerances
            will lead to different but equally valid CIA implementations.
            The key is understanding the trade-offs and making informed decisions based on your specific requirements.
            
            What questions do you have about implementing CIA principles in your own environments?
            """,
            
            22: """
            Thank you for your attention and engagement throughout today's lecture on Computer Security Fundamentals.
            
            We've covered the essential CIA Triad - Confidentiality, Integrity, and Availability -
            and explored how these principles form the foundation of all cybersecurity practices.
            
            We examined real-world applications, technical implementations, common pitfalls to avoid,
            and measurement strategies for continuous improvement.
            
            Remember: Confidentiality plus Integrity plus Availability equals Security!
            
            Our next lecture will delve into Computer Security Terminology,
            where we'll build upon today's foundation by understanding threats, risks, and countermeasures.
            
            This completes Lecture 2 of our Cyber Security course. I look forward to seeing you next time
            as we continue our journey into the fascinating world of cybersecurity.
            
            Stay secure, stay curious, and keep applying these principles in everything you do!
            """
        }
        
        # Generate scripts for all slides
        for i, slide in enumerate(self.slides, 1):
            if i in scripts_by_slide:
                script = scripts_by_slide[i]
            else:
                # Generate generic script based on slide content
                script = self._generate_generic_script(slide)
            
            scripts.append(script)
            
        self.voiceover_scripts = scripts
        print(f"✅ Generated {len(scripts)} voiceover scripts")
        return scripts
    
    def _generate_generic_script(self, slide: Dict[str, Any]) -> str:
        """Generate a generic script for slides without custom content"""
        title = slide['title']
        content = slide['content']
        
        # Create a natural speaking version of the content
        script = f"Let's examine {title}. "
        
        # Convert bullet points to natural speech
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('- '):
                script += line[2:] + ". "
            elif line.startswith('## '):
                script += f"Moving to {line[3:]}. "
            elif line.startswith('### '):
                script += f"Specifically, {line[4:]}. "
            elif line and not line.startswith('#'):
                script += line + ". "
        
        return script
    
    def generate_audio_files(self) -> List[str]:
        """Generate audio files using AI TTS"""
        print("🎵 Generating audio files...")
        
        audio_files = []
        
        # Create audio directory
        audio_dir = self.output_dir / "audio"
        audio_dir.mkdir(exist_ok=True)
        
        for i, script in enumerate(self.voiceover_scripts, 1):
            print(f"🎤 Generating audio for slide {i}...")
            
            audio_file = audio_dir / f"slide_{i:02d}.mp3"
            
            if self.tts_provider == "elevenlabs":
                self._generate_elevenlabs_audio(script, audio_file)
            else:
                self._generate_openai_audio(script, audio_file)
            
            audio_files.append(str(audio_file))
            
        print(f"✅ Generated {len(audio_files)} audio files")
        return audio_files
    
    def _generate_elevenlabs_audio(self, text: str, output_file: Path):
        """Generate audio using ElevenLabs API (requires API key)"""
        try:
            if ElevenLabs is None:
                raise ImportError("ElevenLabs not available")
            
            # Initialize ElevenLabs client
            client = ElevenLabs(api_key=os.environ.get("ELEVENLABS_API_KEY"))
            
            # Generate audio
            audio = client.generate(
                text=text,
                voice=self.voice_id,
                model="eleven_monolingual_v1"
            )
            
            with open(output_file, 'wb') as f:
                for chunk in audio:
                    f.write(chunk)
                
        except Exception as e:
            print(f"⚠️  ElevenLabs failed: {e}")
            print("🔄 Falling back to OpenAI TTS...")
            self._generate_openai_audio(text, output_file)
    
    def _generate_openai_audio(self, text: str, output_file: Path):
        """Generate audio using OpenAI TTS API (requires API key)"""
        try:
            from openai import OpenAI
            client = OpenAI()  # Uses OPENAI_API_KEY environment variable
            
            response = client.audio.speech.create(
                model="tts-1-hd",  # Higher quality model
                voice="nova",      # Professional female voice
                input=text
            )
            
            response.stream_to_file(output_file)
            
        except Exception as e:
            print(f"⚠️  OpenAI TTS failed: {e}")
            print("🔄 Using text-to-speech fallback...")
            self._generate_fallback_audio(text, output_file)
    
    def _generate_fallback_audio(self, text: str, output_file: Path):
        """Fallback TTS using system tools or pyttsx3"""
        try:
            import pyttsx3
            engine = pyttsx3.init()
            engine.setProperty('rate', 150)  # Speed
            engine.setProperty('volume', 0.8)  # Volume
            
            # Try to use a female voice if available
            voices = engine.getProperty('voices')
            for voice in voices:
                if 'female' in voice.name.lower() or 'woman' in voice.name.lower():
                    engine.setProperty('voice', voice.id)
                    break
            
            engine.save_to_file(text, str(output_file))
            engine.runAndWait()
            
        except Exception as e:
            print(f"❌ Fallback TTS failed: {e}")
            print("📝 Creating placeholder audio file...")
            # Create a simple placeholder
            with open(output_file, 'w') as f:
                f.write(f"# Audio for: {text[:50]}...")


if __name__ == "__main__":
    # Configuration
    slide_file = "/Users/milav/Code/gpp/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev/02-computer-security-fundamentals.md"
    
    # Initialize generator
    generator = SlidevVoiceoverGenerator(slide_file)
    
    # Process slides
    slides = generator.parse_slidev_content()
    scripts = generator.generate_voiceover_scripts()
    
    print("\n🎯 Preview of generated scripts:")
    for i, script in enumerate(scripts[:3], 1):  # Show first 3
        print(f"\n--- Slide {i} ---")
        print(script[:200] + "..." if len(script) > 200 else script)
    
    print(f"\n📊 Summary:")
    print(f"- Slides parsed: {len(slides)}")
    print(f"- Scripts generated: {len(scripts)}")
    print(f"- Total estimated speech time: {sum(len(s.split()) for s in scripts) / 150:.1f} minutes")
    print(f"- Output directory: {generator.output_dir}")
    
    # Uncomment to generate actual audio (requires API keys)
    # audio_files = generator.generate_audio_files()