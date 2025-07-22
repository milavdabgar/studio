---
theme: apple-basic
background: https://source.unsplash.com/1920x1080/?cybersecurity
title: Introduction to Cyber Security
info: |
  ## Cyber Security (4353204)
  Introduction to Cyber Security - Lecture 1
  
  Learn about cyber security fundamentals, importance, and current landscape
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Introduction to Cyber Security
## Unit I: Introduction to Cyber Security & Cryptography

### Lecture 1: Fundamentals and Importance

<div class="absolute bottom-10 left-10 text-xs opacity-50">
Cyber Security (4353204) | Semester V | Diploma ICT | Author: Milav Dabgar
</div>

---
layout: default
---

# Course Information

<div class="grid grid-cols-2 gap-4">
<div>

## 📚 Course Details
- **Course Code:** 4353204
- **Course Title:** Cyber Security
- **Semester:** V (Diploma in ICT)
- **Credits:** 4
- **Institution:** Gujarat Technological University

</div>
<div>

## 🎯 Today's Objectives
- Understand cyber security definition
- Learn about digital asset protection
- Explore current threat landscape
- Recognize importance in modern world

</div>
</div>

---
layout: two-cols
---

# What is Cyber Security?

::left::

## 🔐 Definition

**Cyber Security** is the practice of protecting systems, networks, and programs from digital attacks.

### Key Aspects:
- **Protection** of digital information
- **Prevention** of unauthorized access
- **Detection** of security threats
- **Response** to cyber incidents
- **Recovery** from security breaches

::right::

## 🎯 Primary Goals

<div class="space-y-4">

### Confidentiality
Keeping information private and secure

### Integrity
Ensuring data accuracy and completeness

### Availability
Maintaining system accessibility

</div>

---
layout: default
---

# Why Cyber Security Matters

<div class="grid grid-cols-2 gap-8">

<div>

## 🌐 Digital Transformation
- Everything is connected
- Remote work explosion
- Cloud computing adoption
- IoT device proliferation

## 💰 Economic Impact
- Global cybercrime costs: **$6 trillion** annually
- Average data breach cost: **$4.35 million**
- Business disruption losses
- Reputation damage costs

</div>

<div>

## 📊 Threat Statistics (2024)
- **1 cyberattack every 39 seconds**
- **95% of breaches** due to human error
- **43% of attacks** target small businesses
- **300 billion passwords** used globally

## 🚨 Growing Threat Landscape
- Sophisticated attack methods
- State-sponsored attacks
- Ransomware evolution
- Supply chain attacks

</div>

</div>

---
layout: default
---

# Evolution of Cyber Threats

<div class="timeline">

## 📅 Historical Timeline

<div class="grid grid-cols-2 gap-4 mt-8">

<div class="space-y-4">

### **1960s-1970s: Early Computing**
- Basic password protection
- Physical security focus
- Limited network connectivity

### **1980s-1990s: PC Era**
- First computer viruses
- Antivirus software emergence
- Basic firewalls introduced

### **2000s: Internet Boom**
- Email spam and phishing
- Web-based attacks
- Identity theft rises

</div>

<div class="space-y-4">

### **2010s: Mobile & Cloud**
- Mobile malware explosion
- Cloud security challenges
- Advanced Persistent Threats (APTs)

### **2020s: AI & IoT Era**
- AI-powered attacks
- IoT vulnerability exploitation
- Ransomware-as-a-Service
- Supply chain compromises

### **Future: Quantum & Beyond**
- Quantum computing threats
- AI defense systems
- Zero-trust architecture

</div>

</div>

</div>

---
layout: default
---

# Types of Cyber Threats

<div class="grid grid-cols-3 gap-6">

<div class="threat-category">

## 🦠 Malware
- **Viruses** - Self-replicating code
- **Worms** - Network spreaders
- **Trojans** - Hidden malicious code
- **Ransomware** - Data encryption attacks
- **Spyware** - Information stealers

</div>

<div class="threat-category">

## 🎯 Social Engineering
- **Phishing** - Fake emails/websites
- **Spear Phishing** - Targeted attacks
- **Vishing** - Voice-based scams
- **Smishing** - SMS/text scams
- **Baiting** - Physical trap attacks

</div>

<div class="threat-category">

## 🌐 Network Attacks
- **DDoS** - Service disruption
- **Man-in-the-Middle** - Traffic interception
- **SQL Injection** - Database attacks
- **XSS** - Web script injection
- **Zero-day** - Unknown vulnerabilities

</div>

</div>

<style>
.threat-category {
  @apply border-2 border-gray-300 rounded-lg p-4 bg-gray-50;
}
</style>

---
layout: default
---

# Digital Assets We Protect

<div class="grid grid-cols-2 gap-8">

<div>

## 💾 Data Assets
- **Personal Information** (PII)
- **Financial Records**
- **Medical Records**
- **Intellectual Property**
- **Business Intelligence**
- **Customer Databases**

## 🖥️ Technology Assets
- **Servers and Workstations**
- **Network Infrastructure**
- **Mobile Devices**
- **IoT Devices**
- **Software Applications**
- **Cloud Resources**

</div>

<div>

## 🏢 Business Assets
- **Brand Reputation**
- **Customer Trust**
- **Business Continuity**
- **Competitive Advantage**
- **Regulatory Compliance**
- **Operational Efficiency**

## 👥 Human Assets
- **Employee Knowledge**
- **Security Awareness**
- **Skills and Expertise**
- **Access Credentials**
- **Behavioral Patterns**

</div>

</div>

---
layout: default
---

# Current Cybersecurity Landscape

<div class="grid grid-cols-2 gap-8">

<div>

## 🔥 Top Threats 2024
1. **Ransomware** - Growing sophistication
2. **Supply Chain Attacks** - Third-party risks
3. **Cloud Misconfigurations** - Human errors
4. **Insider Threats** - Internal risks
5. **AI-Powered Attacks** - Automated threats

## 🎭 Threat Actors
- **Cybercriminals** - Financial motivation
- **Nation-States** - Espionage/warfare
- **Hacktivists** - Political agenda
- **Insiders** - Internal threats
- **Script Kiddies** - Amateur hackers

</div>

<div>

## 🛡️ Defense Evolution
- **Zero Trust Architecture**
- **AI-Powered Security**
- **Extended Detection & Response (XDR)**
- **Security Orchestration (SOAR)**
- **Behavioral Analytics**

## 📈 Market Trends
- **Global spending:** $188.3 billion (2023)
- **Cloud security** fastest growing segment
- **Shortage:** 3.5 million cybersecurity jobs
- **Automation** becoming essential
- **Compliance** driving adoption

</div>

</div>

---
layout: default
---

# Cybersecurity Framework Overview

<div class="framework-container">

## 🏗️ NIST Cybersecurity Framework

<div class="grid grid-cols-5 gap-4 mt-8">

<div class="framework-pillar">
<div class="pillar-icon">🔍</div>
<h3>Identify</h3>
<p>Asset management, business environment, governance</p>
</div>

<div class="framework-pillar">
<div class="pillar-icon">🛡️</div>
<h3>Protect</h3>
<p>Access control, awareness training, data security</p>
</div>

<div class="framework-pillar">
<div class="pillar-icon">🚨</div>
<h3>Detect</h3>
<p>Continuous monitoring, detection processes</p>
</div>

<div class="framework-pillar">
<div class="pillar-icon">⚡</div>
<h3>Respond</h3>
<p>Response planning, communications, mitigation</p>
</div>

<div class="framework-pillar">
<div class="pillar-icon">🔄</div>
<h3>Recover</h3>
<p>Recovery planning, improvements, communications</p>
</div>

</div>

</div>

<style>
.framework-pillar {
  @apply text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200;
}
.pillar-icon {
  @apply text-3xl mb-2;
}
</style>

---
layout: default
---

# Cybersecurity Careers & Roles

<div class="grid grid-cols-2 gap-8">

<div>

## 🎯 Career Paths
- **Security Analyst** - Monitor and analyze threats
- **Penetration Tester** - Ethical hacking
- **Security Architect** - Design secure systems
- **Incident Responder** - Handle security breaches
- **Forensics Investigator** - Digital evidence analysis
- **Security Consultant** - Advisory services

## 💼 Industry Demand
- **High demand** across all sectors
- **Competitive salaries** - $80K-$200K+
- **Remote work** opportunities
- **Continuous learning** required
- **Professional certifications** valued

</div>

<div>

## 🏆 Popular Certifications
- **CompTIA Security+** - Entry level
- **CISSP** - Management level
- **CEH** - Ethical hacking
- **CISM** - Management focused
- **SANS/GIAC** - Technical specializations

## 🎓 Skills Required
- **Technical:** Networking, programming, systems
- **Analytical:** Problem-solving, critical thinking
- **Communication:** Writing, presentation
- **Continuous learning:** Staying updated
- **Ethical mindset:** Professional responsibility

</div>

</div>

---
layout: default
---

# Cybersecurity in Different Sectors

<div class="grid grid-cols-2 gap-8">

<div>

## 🏥 Healthcare
- **Patient data protection** (HIPAA compliance)
- **Medical device security**
- **Ransomware threat** to critical systems
- **Telemedicine security**

## 🏦 Financial Services
- **PCI DSS compliance**
- **Real-time fraud detection**
- **Mobile banking security**
- **Cryptocurrency protection**

## 🏭 Manufacturing
- **Industrial Control Systems** (ICS)
- **Supply chain security**
- **Intellectual property protection**
- **Operational technology** (OT) security

</div>

<div>

## 🏛️ Government
- **National security** implications
- **Citizen data protection**
- **Critical infrastructure** defense
- **Intelligence operations** security

## 🎓 Education
- **Student record protection** (FERPA)
- **Research data security**
- **Campus network protection**
- **Remote learning** security

## 🛒 Retail/E-commerce
- **Payment card** security
- **Customer data** protection
- **Supply chain** security
- **Online fraud** prevention

</div>

</div>

---
layout: default
---

# Legal and Regulatory Landscape

<div class="grid grid-cols-2 gap-8">

<div>

## ⚖️ Key Regulations

### 🌍 International
- **GDPR** - EU data protection
- **ISO 27001** - Security management
- **SOX** - Financial reporting
- **NIST** - US cybersecurity standards

### 🇮🇳 India Specific
- **IT Act 2000** - Cyber law framework
- **DPDP Act 2023** - Data protection
- **RBI Guidelines** - Banking security
- **CERT-In** - Incident reporting

</div>

<div>

## 📋 Compliance Requirements

### 🛡️ Security Controls
- **Access management**
- **Encryption standards**
- **Incident response**
- **Risk assessments**
- **Employee training**

### 📊 Reporting Obligations
- **Data breach notification**
- **Security incident reporting**
- **Audit requirements**
- **Documentation standards**
- **Regular assessments**

</div>

</div>

---
layout: default
---

# Emerging Technologies & Security

<div class="grid grid-cols-2 gap-8">

<div>

## 🤖 Artificial Intelligence
### Opportunities:
- **Automated threat detection**
- **Behavioral analytics**
- **Predictive security**
- **Response automation**

### Challenges:
- **AI-powered attacks**
- **Deepfakes and manipulation**
- **Algorithm bias**
- **Privacy concerns**

## ☁️ Cloud Computing
### Security Benefits:
- **Scalable security services**
- **Professional management**
- **Regular updates**

### Challenges:
- **Shared responsibility model**
- **Data location concerns**
- **Configuration errors**

</div>

<div>

## 📱 Internet of Things (IoT)
### Security Challenges:
- **Weak authentication**
- **Unencrypted communications**
- **Difficult patching**
- **Default credentials**

### Mitigation Strategies:
- **Network segmentation**
- **Regular updates**
- **Strong authentication**
- **Monitoring systems**

## 🔐 Quantum Computing
### Future Impact:
- **Current encryption vulnerable**
- **Quantum-resistant algorithms needed**
- **Timeline: 10-15 years**
- **Preparation required now**

</div>

</div>

---
layout: default
---

# Building a Security Mindset

<div class="grid grid-cols-2 gap-8">

<div>

## 🧠 Security Thinking Principles

### 🔒 Defense in Depth
- **Multiple layers** of security
- **No single point of failure**
- **Complementary controls**

### 🚫 Zero Trust Model
- **"Never trust, always verify"**
- **Assume breach mentality**
- **Continuous verification**

### 🎯 Risk-Based Approach
- **Identify critical assets**
- **Assess threat likelihood**
- **Prioritize protection efforts**

</div>

<div>

## ⚡ Security Best Practices

### 👤 Personal Security
- **Strong, unique passwords**
- **Multi-factor authentication**
- **Regular software updates**
- **Suspicious email awareness**

### 🏢 Organizational Security
- **Security policies and procedures**
- **Employee training programs**
- **Incident response plans**
- **Regular security assessments**

### 🔄 Continuous Improvement
- **Stay informed** about threats
- **Learn from incidents**
- **Adapt to new technologies**

</div>

</div>

---
layout: default
---

# Practical Exercise: Threat Assessment

<div class="exercise-container">

## 🎯 Individual Activity (15 minutes)

### Scenario Analysis
You are the IT administrator for a small e-commerce company with:
- 50 employees
- Online store with customer data
- Office network and cloud services
- Mobile workforce

### Task: Identify Top 5 Threats
1. **List potential threats** to this organization
2. **Rank them by impact and likelihood**
3. **Suggest basic protection measures**

### Discussion Points
- Which threats concern you most?
- What would be your first security priority?
- How would you convince management to invest in security?

</div>

<style>
.exercise-container {
  @apply bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6;
}
</style>

---
layout: default
---

# Course Preview: What's Coming

<div class="grid grid-cols-2 gap-8">

<div>

## 📚 Unit Topics Overview

### Unit I: Crypto & Fundamentals
- Security terminology
- OSI security architecture
- Cryptography basics
- Hashing algorithms

### Unit II: Account & Data Security
- Authentication methods
- Authorization systems
- Malware analysis
- Attack prevention

### Unit III: Network & System Security
- Web security threats
- SSL/TLS protocols
- VPNs and secure communications

</div>

<div>

### Unit IV: Ethical Hacking
- Penetration testing
- Kali Linux tools
- Vulnerability assessment
- Security testing

### Unit V: Cybercrime & Forensics
- Digital crime investigation
- Forensic techniques
- Legal considerations
- Evidence handling

## 🛠️ Practical Skills
- **Hands-on labs** with security tools
- **Real-world scenarios**
- **Industry-standard practices**

</div>

</div>

---
layout: default
---

# Next Lecture Preview

<div class="grid grid-cols-2 gap-8">

<div>

## 🔜 Lecture 2: Computer Security Fundamentals

### 🎯 Focus Topics:
- **CIA Triad** in detail
- **Information security principles**
- **Security objectives**
- **Real-world examples**

### 📝 Preparation:
- Read about CIA Triad
- Think of examples where each principle is violated
- Consider security in your daily digital activities

</div>

<div>

## 📚 Recommended Reading
- **Textbook:** Information Security Principles and Practice - Chapter 1
- **Online:** NIST Cybersecurity Framework
- **Practice:** Complete online security assessment

## 🎯 Learning Objectives
By next class, you should understand:
- The three pillars of information security
- How to apply CIA triad in practice
- Basic security design principles

</div>

</div>

---
layout: center
class: text-center
---

# Questions & Discussion

<div class="pt-12">

## 🤔 Think About:
- What cyber security threats worry you most?
- How has your perspective on digital security changed?
- What security measures do you currently use?

### 📧 Contact
**Course Questions:** During office hours  
**Emergency Security Issues:** Report to IT immediately

</div>

---
layout: center
class: text-center
---

# Thank You!

## Next Lecture: Computer Security Fundamentals
### CIA Triad & Security Principles

<div class="pt-12 text-gray-500">
  <p>Cyber Security (4353204) - Lecture 1 Complete</p>
  <p>Stay curious, stay secure! 🔐</p>
</div>