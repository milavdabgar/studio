// Newsletter Data for Academic Year 2024-25
// Electronics & Communication Engineering Department
// Government Polytechnic Palanpur

import { NewsletterData } from '../newsletter-data';

export const newsletterData2024_25: NewsletterData = {
  stats: [
    { label: 'Placement Rate', value: 0, color: 'bg-blue-500' },
    { label: 'Conference Papers', value: 0, color: 'bg-green-500' },
    { label: 'Students Placed', value: 0, color: 'bg-purple-500' },
    { label: 'Higher Studies', value: 0, color: 'bg-orange-500' },
    { label: 'Historical References', value: 2, color: 'bg-gray-500' },
  ],
  
  canvas: [
    // Canvas items will be added as we gather more content
  ],

  spotlight: [
    {
      category: 'placement' as const,
      title: 'Historical Placement Excellence - Industry Diversity',
      description: 'Comprehensive placement success across multiple industries showcasing the versatility and industry readiness of EC department graduates',
      person: 'EC Department Alumni (2017-2020)',
      details: 'Outstanding placement record spanning renewable energy, power sector, manufacturing, and technology industries with 100% placement achievement in key academic years',
      date: '2017-2020',
      achievements: [
        '🌱 RENEWABLE ENERGY SECTOR: Mundra Solar Pv Ltd - Trainee Engineer positions (Adilbhai Memon, Sanket Jha, Sanjay Chauhan)',
        '⚡ POWER & ELECTRICAL INDUSTRY: GSECL Powerplant Bhuj - Plant Operator (Rajkuvar Sharma), Tata Power Wav - Trainee (Jamabhai Rabari), L&T Jamnagar - Trainee Engineer (Pravinkumar Rathod)',
        '🏭 MANUFACTURING & AUTOMOTIVE: Maruti Suzuki Becharaji - Data Operator (Chirag Chauhan), D-Mart Palanpur - Trainee (Jigar Darji)',
        '📡 TELECOMMUNICATIONS: Reliance Jio Tharad - Trainee (Hiteshbhai Prajapati)',
        '💼 BUSINESS & MARKETING: Asian Pacific Learning Leverage - Marketing Agent (Avinash Goswami)',
        '🎯 KEY ACHIEVEMENTS: 100% placement rate for 2017-18 batch, Strong industry relationships across diverse sectors, Consistent placement track record over multiple years, Average package range: ₹2.5-4.5 LPA'
      ]
    },
    {
      category: 'higher-education' as const,
      title: 'Premier Engineering College Admissions - Academic Excellence',
      description: 'Exceptional track record of students securing admissions to top engineering institutions across Gujarat, demonstrating strong academic foundation and competitive performance',
      person: 'EC Department Students (2018-2024)',
      details: 'Consistent success in securing admissions to premier engineering colleges through merit-based ACPC counseling, with students continuing their technical education journey in Electronics & Communication and related engineering disciplines',
      date: '2018-2024',
      achievements: [
        '🏛️ LD COLLEGE OF ENGINEERING, AHMEDABAD: Multiple admissions including Bharatbhai Khardola, Nileshkumar Pavar, Krishna Panchal - recognized as one of Gujarat\'s premier engineering institutions',
        '🎓 VISHWAKARMA GOVERNMENT ENGINEERING COLLEGE (VGEC): Successful admissions at both Ahmedabad and Chandkheda campuses - Abhishek Roy, Riddhiben Sathwara, Armankhan Ghasura, and recent admission Srujal Yashvantbhai Chaudhary (2024)',
        '🏫 GOVERNMENT ENGINEERING COLLEGES: Wide representation across GEC Gandhinagar, GEC Bharuch, GEC Modasa showcasing geographical diversity and accessibility',
        '📊 ADMISSION STATISTICS: 85%+ students opting for higher education pursue B.E. in Electronics & Communication Engineering, Merit-based selections through competitive ACPC counseling process',
        '🎯 KEY HIGHLIGHTS: Consistent year-over-year success rate, Strong academic performance enabling premier college admissions, Continuation of technical education in specialized engineering fields, Alumni network across top engineering institutions in Gujarat'
      ]
    },
    {
      category: 'star-performer' as const,
      title: 'Semester Toppers - DIPL SEM 1 - Regular (DEC 2024)',
      description: 'Outstanding academic performance across all semesters',
      date: 'December 2024',
      achievements: [
        'Mali Bhavin Ashokbhai (246260311010) - 8.71 SPI (Sem 1)',
        'Modi Jainilkumar Dipakbhai (246260311011) - 7.62 SPI (Sem 1)',
        'Joshi Neel Subhashchandra (246260332012) - 8.19 SPI (Sem 1)',
        'Thakor Ashvinkumar Balvantji (246260332039) - 7.71 SPI (Sem 1)'
      ]
    },
    {
      category: 'star-performer' as const,
      title: 'Semester Toppers - DIPL SEM 3 - Regular (DEC 2024)',
      description: 'Outstanding academic performance across all semesters',
      date: 'December 2024',
      achievements: [
        'Prajapati Princekumar Dilipbhai (236260311006) - 8.3 SPI (Sem 3)',
        'Prajapati Shaileshbhai Chelabhai (236260311007) - 5.75 SPI (Sem 3)',
        'Maknojiya Arman Imranbhai (236260332029) - 9.2 SPI (Sem 3)',
        'Mevada Aarykumar Mukeshkumar (236260332030) - 8.35 SPI (Sem 3)'
      ]
    },
    {
      category: 'star-performer' as const,
      title: 'Semester Toppers - DIPL SEM 5 - Regular (DEC 2024)',
      description: 'Outstanding academic performance across all semesters',
      date: 'December 2024',
      achievements: [
        'Patel Akshar Dilipkumar (226260311004) - 8.52 SPI (Sem 5)',
        'Suthar Bharat Vishnubhai (226260311009) - 8.17 SPI (Sem 5)',
        'Patel Dev Kiritbhai (226260332015) - 9.62 SPI (Sem 5)',
        'Ansari Mohammad Sadik Ansar Ahmed (226260332002) - 9.14 SPI (Sem 5)'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'AICTE Approval & GTU Affiliation Leadership',
      description: 'AICTE approval processes and GTU affiliation coordination with academic excellence',
      person: 'Mr. S. J. Chauhan',
      designation: 'Head of Department, EC Department',
      details: 'Convener of AICTE Approval/GTU Affiliation, Member of MAY/PMKVY programs',
      date: '2024-25',
      achievements: [
        'Convener of AICTE Approval and GTU Affiliation processes',
        'Member of MAY (Make in India for Youth) programs',
        'PMKVY (Pradhan Mantri Kaushal Vikas Yojana) coordination',
        'Academic excellence and institutional accreditation leadership'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'SSIP Innovation & Central Store Management',
      description: 'Student Startup Innovation Policy coordination and central store operations',
      person: 'Mr. L. K. Patel',
      designation: 'Lecturer, EC Department',
      details: 'Convener of SSIP/CIC3/IPR/Hackathone, Member of Central Store and CLEANLINESS committees',
      date: '2024-25',
      achievements: [
        'Convener of Student Startup Innovation Policy (SSIP)',
        'CIC3 (Common Innovation Campus) coordination',
        'Intellectual Property Rights (IPR) management',
        'Hackathon organization and mentorship',
        'Central Store management and CLEANLINESS committee member'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'NBA Accreditation & Student Development',
      description: 'NBA accreditation processes and comprehensive student development activities',
      person: 'Ms. M. K. Pedhadiya',
      designation: 'Lecturer, EC Department',
      details: 'Member of NBA, Student Section, Women Development Cell, and Internal Complaint Committee',
      date: '2024-25',
      achievements: [
        'National Board of Accreditation (NBA) member',
        'Student Section coordination and management',
        'Women Development Cell participation',
        'Internal Complaint Committee member',
        'Student welfare and development activities'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'Human Resources & Digital Portal Management',
      description: 'Human resource management and digital transformation through various portals',
      person: 'Mr. R. N. Patel',
      designation: 'Lecturer, EC Department',
      details: 'Convener of Establishment Section, SATHI Karmyogi Portal, Member of CAS and Alumni Association',
      date: '2024-25',
      achievements: [
        'Convener of Establishment Section',
        'SATHI Karmyogi Portal management and coordination',
        'Career Advancement Scheme (CAS) member',
        'Alumni Association activities and networking',
        'Digital transformation and HR management'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'Student Affairs & Hostel Administration',
      description: 'Comprehensive student affairs management and hostel administration',
      person: 'Mr. N. M. Patel',
      designation: 'Lecturer, EC Department',
      details: 'Member of Student Section, Hostel Rector, Gymkhana activities, and SC-ST Cell',
      date: '2024-25',
      achievements: [
        'Student Section coordination and support',
        'Hostel Rector duties and residential management',
        'Gymkhana activities and extracurricular coordination',
        'SC-ST Cell member for social welfare',
        'Student welfare and campus life enhancement'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'Infrastructure & Industry Outreach',
      description: 'Infrastructure maintenance coordination and industry partnership development',
      person: 'Mr. M. J. Dabgar',
      designation: 'Lecturer, EC Department',
      details: 'Convener of CWAN/Internet/CCTV, Member of Training & Placement Cell, NEP coordination',
      date: '2024-25',
      achievements: [
        'Convener of Campus Wide Area Network (CWAN)',
        'Internet infrastructure and CCTV systems management',
        'Training & Placement Cell member',
        'National Education Policy (NEP) coordination',
        'Technology infrastructure and industry partnerships'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'Academic Planning & Time Management',
      description: 'Institute academic planning and comprehensive time table management',
      person: 'Mr. R. C. Parmar',
      designation: 'Lecturer, EC Department',
      details: 'Member of Institute Time table committee, Student Section, RUSA, and CAS',
      date: '2024-25',
      achievements: [
        'Institute Time Table committee member',
        'Academic calendar planning and coordination',
        'Student Section activities support',
        'RUSA (Rashtriya Uchchatar Shiksha Abhiyan) member',
        'Career Advancement Scheme (CAS) participation'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'Communication Systems & Data Management',
      description: 'Institutional communication systems and academic data management',
      person: 'Mr. S. P. Joshiara',
      designation: 'Lecturer, EC Department',
      details: 'Convener of E-Mail Handling, Co-convener of GTU, Member of CWAN and CLEANLINESS',
      date: '2024-25',
      achievements: [
        'Convener of E-Mail Handling systems',
        'Co-convener of GTU coordination',
        'CWAN (Campus Wide Area Network) committee member',
        'CLEANLINESS committee participation',
        'Digital communication and data management'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'ISTE Chapter & Student Development',
      description: 'Indian Society for Technical Education chapter coordination and student development activities',
      person: 'Mr. N. J. Chauhan',
      designation: 'Lecturer, EC Department',
      details: 'Member of ISTE Chapter, Gymkhana activities, and A V Gajjar-Elect team',
      date: '2024-25',
      achievements: [
        'Indian Society for Technical Education (ISTE) Chapter member',
        'Gymkhana activities coordination',
        'A V Gajjar-Elect team member',
        'Student development and technical education activities'
      ]
    }
  ],

  essence: {
    vision: "To be a center of excellence in Electronics and Communication Engineering education, fostering innovation, research, and industry collaboration to produce globally competent professionals.",
    mission: "To provide quality technical education through modern teaching methodologies, state-of-the-art laboratories, and industry partnerships, enabling students to excel in their careers and contribute to society's technological advancement."
  },

  chronicles: [
    {
      title: 'ISTE Student Chapter 2024',
      date: 'July 22, 2024',
      category: 'training',
      description: 'Indian Society for Technical Education (ISTE) Student Chapter activities promoting technical education and professional development.',
      tags: ['ISTE', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240722-WA0022-1024x768.jpg',
          alt: 'ISTE Student Chapter 2024 - Image 1',
          caption: 'ISTE Student Chapter 2024 - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240722-WA0021-1024x768.jpg',
          alt: 'ISTE Student Chapter 2024 - Image 2',
          caption: 'ISTE Student Chapter 2024 - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240722-WA0020-1024x768.jpg',
          alt: 'ISTE Student Chapter 2024 - Image 3',
          caption: 'ISTE Student Chapter 2024 - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240722-WA0019-1024x768.jpg',
          alt: 'ISTE Student Chapter 2024 - Image 4',
          caption: 'ISTE Student Chapter 2024 - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240722-WA0018-1024x768.jpg',
          alt: 'ISTE Student Chapter 2024 - Image 5',
          caption: 'ISTE Student Chapter 2024 - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240722-WA0017-1024x768.jpg',
          alt: 'ISTE Student Chapter 2024 - Image 6',
          caption: 'ISTE Student Chapter 2024 - Image 6'
        }
      ]
    },
    {
      title: 'Industrial Training at Duke Pipes',
      date: 'July 27, 2024',
      category: 'workshop',
      description: 'Industrial training program organized to bridge the gap between academic learning and industry practices.',
      tags: ['Industrial Training at Duke Pipes', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20240727_145950-1024x577.jpg',
          alt: 'Industrial Training at Duke Pipes - Image 1',
          caption: 'Industrial Training at Duke Pipes - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20240727_145947-577x1024.jpg',
          alt: 'Industrial Training at Duke Pipes - Image 2',
          caption: 'Industrial Training at Duke Pipes - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20240727_144258-577x1024.jpg',
          alt: 'Industrial Training at Duke Pipes - Image 3',
          caption: 'Industrial Training at Duke Pipes - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20240727_144231-1024x577.jpg',
          alt: 'Industrial Training at Duke Pipes - Image 4',
          caption: 'Industrial Training at Duke Pipes - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20240727_144216-1024x577.jpg',
          alt: 'Industrial Training at Duke Pipes - Image 5',
          caption: 'Industrial Training at Duke Pipes - Image 5'
        }
      ]
    },
    {
      title: 'Visit: Bajrang Paper Products, Palanpur',
      date: 'August 2, 2024',
      category: 'visit',
      description: 'Educational visit organized by the EC Department to enhance practical learning and industry exposure for students. The visit included 33 students from Semester 1, accompanied by faculty members MJD and JVK.',
      tags: ['Visit', 'Bajrang Paper Products', 'Industry Exposure', 'Paper Manufacturing'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2024/08/20240802_121122-1024x577.jpg',
          alt: 'Visit: Bajrang Paper Products, Palanpur - Image 1',
          caption: 'Visit: Bajrang Paper Products, Palanpur - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2024/08/20240802_121211-1024x577.jpg',
          alt: 'Visit: Bajrang Paper Products, Palanpur - Image 2',
          caption: 'Visit: Bajrang Paper Products, Palanpur - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2024/08/20240802_121621-1024x577.jpg',
          alt: 'Visit: Bajrang Paper Products, Palanpur - Image 3',
          caption: 'Visit: Bajrang Paper Products, Palanpur - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2024/08/20240802_121124-1024x577.jpg',
          alt: 'Visit: Bajrang Paper Products, Palanpur - Image 4',
          caption: 'Visit: Bajrang Paper Products, Palanpur - Image 4'
        }
      ]
    },
    {
      title: 'Visit: Railway Station, Palanpur',
      date: 'September 25, 2024',
      category: 'visit',
      description: 'Educational visit organized by the EC Department to enhance practical learning and industry exposure for students. The visit included 49 students from Semesters 3 and 5, accompanied by faculty members MKP and NJC.',
      tags: ['Visit', 'Railway Station', 'Transportation Technology', 'Signal Systems'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240925-WA0041-1024x768.jpg',
          alt: 'Visit: Railway Station, Palanpur - Image 1',
          caption: 'Visit: Railway Station, Palanpur - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240925-WA0038-766x1024.jpg',
          alt: 'Visit: Railway Station, Palanpur - Image 2',
          caption: 'Visit: Railway Station, Palanpur - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240925-WA0036-766x1024.jpg',
          alt: 'Visit: Railway Station, Palanpur - Image 3',
          caption: 'Visit: Railway Station, Palanpur - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240925-WA0034-1024x766.jpg',
          alt: 'Visit: Railway Station, Palanpur - Image 4',
          caption: 'Visit: Railway Station, Palanpur - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240925-WA0032-1024x766.jpg',
          alt: 'Visit: Railway Station, Palanpur - Image 5',
          caption: 'Visit: Railway Station, Palanpur - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240925-WA0030-766x1024.jpg',
          alt: 'Visit: Railway Station, Palanpur - Image 6',
          caption: 'Visit: Railway Station, Palanpur - Image 6'
        }
      ]
    },
    {
      title: 'Workshop: Embedded System',
      date: 'March 13, 2024',
      category: 'workshop',
      description: 'Technical workshop on embedded system design and development. Expert: Mr. Vishal Vadher, Assistant Manager Training, SOFCON India Pvt. Ltd. with 45 participants. This session provided insights into embedded systems, their role in modern electronics, and real-world applications using microcontrollers. The workshop covered embedded system fundamentals, microcontroller programming, circuit design, and practical implementation techniques.',
      tags: ['Workshop', 'Embedded System', 'Microcontroller', 'SOFCON India', 'Programming', 'Electronics'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0028-1024x766.jpg',
          alt: 'Workshop: Embedded System - Session in progress',
          caption: 'Workshop: Embedded System - Session in progress'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0029-766x1024.jpg',
          alt: 'Workshop: Embedded System - Expert presentation',
          caption: 'Workshop: Embedded System - Expert presentation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0021-1024x766.jpg',
          alt: 'Workshop: Embedded System - Students engaged in learning',
          caption: 'Workshop: Embedded System - Students engaged in learning'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0010-1024x459.jpg',
          alt: 'Workshop: Embedded System - Practical demonstration',
          caption: 'Workshop: Embedded System - Practical demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0008-1024x459.jpg',
          alt: 'Workshop: Embedded System - Hands-on training session',
          caption: 'Workshop: Embedded System - Hands-on training session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0005-1024x459.jpg',
          alt: 'Workshop: Embedded System - Interactive learning environment',
          caption: 'Workshop: Embedded System - Interactive learning environment'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0033-1024x766.jpg',
          alt: 'Workshop: Embedded System - Group discussion and Q&A',
          caption: 'Workshop: Embedded System - Group discussion and Q&A'
        }
      ]
    },
    {
      title: 'Workshop: Web Development Technologies',
      date: 'March 13, 2024',
      category: 'workshop',
      description: 'Technical workshop on modern web development technologies and frameworks. Expert: Mr. Vishal Vadher, Assistant Manager Training, SOFCON India Pvt. Ltd. with 53 participants. The session covered front-end and back-end technologies, responsive design, and current industry practices.',
      tags: ['Workshop', 'Web Development', 'Programming', 'SOFCON India', 'Front-end', 'Back-end'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0035-1024x766.jpg',
          alt: 'Workshop: Web Development Technologies - Expert session in progress',
          caption: 'Workshop: Web Development Technologies - Expert session in progress'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0031-1024x766.jpg',
          alt: 'Workshop: Web Development Technologies - Interactive learning session',
          caption: 'Workshop: Web Development Technologies - Interactive learning session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0027-1024x766.jpg',
          alt: 'Workshop: Web Development Technologies - Students learning modern frameworks',
          caption: 'Workshop: Web Development Technologies - Students learning modern frameworks'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0028-1024x766.jpg',
          alt: 'Workshop: Web Development Technologies - Coding demonstration',
          caption: 'Workshop: Web Development Technologies - Coding demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0025-766x1024.jpg',
          alt: 'Workshop: Web Development Technologies - Hands-on practice session',
          caption: 'Workshop: Web Development Technologies - Hands-on practice session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0020-1024x766.jpg',
          alt: 'Workshop: Web Development Technologies - Group learning activity',
          caption: 'Workshop: Web Development Technologies - Group learning activity'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0018-1024x766.jpg',
          alt: 'Workshop: Web Development Technologies - Technical discussion',
          caption: 'Workshop: Web Development Technologies - Technical discussion'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0011-1024x459.jpg',
          alt: 'Workshop: Web Development Technologies - Practical implementation',
          caption: 'Workshop: Web Development Technologies - Practical implementation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0008-1024x459.jpg',
          alt: 'Workshop: Web Development Technologies - Front-end development demo',
          caption: 'Workshop: Web Development Technologies - Front-end development demo'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0004-1024x459.jpg',
          alt: 'Workshop: Web Development Technologies - Back-end technologies overview',
          caption: 'Workshop: Web Development Technologies - Back-end technologies overview'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0005-1024x459.jpg',
          alt: 'Workshop: Web Development Technologies - Responsive design concepts',
          caption: 'Workshop: Web Development Technologies - Responsive design concepts'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0006-1024x459.jpg',
          alt: 'Workshop: Web Development Technologies - Career opportunities discussion',
          caption: 'Workshop: Web Development Technologies - Career opportunities discussion'
        }
      ]
    },
    {
      title: 'AI-ML: A New Era of Future',
      date: 'September 30, 2024',
      category: 'workshop',
      description: 'The session explored the impact of AI and machine learning in various industries, discussing deep learning, neural networks, and career prospects. Expert: Mr. Vishal Vadher, Assistant Manager Training, SOFCON India Pvt. Ltd. with 77 participants.',
      tags: ['AI-ML', 'Machine Learning', 'Deep Learning', 'Career Prospects', 'SOFCON India'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240930-WA0007-1024x766.jpg',
          alt: 'AI-ML: A New Era of Future - Image 1',
          caption: 'AI-ML: A New Era of Future - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240930-WA0006-1024x766.jpg',
          alt: 'AI-ML: A New Era of Future - Image 2',
          caption: 'AI-ML: A New Era of Future - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240930-WA0003-1024x768.jpg',
          alt: 'AI-ML: A New Era of Future - Image 3',
          caption: 'AI-ML: A New Era of Future - Image 3'
        }
      ]
    },
    {
      title: 'EC ICT Rocks',
      date: 'October 1, 2024',
      category: 'training',
      description: 'Department activity organized as part of the academic curriculum and student development program.',
      tags: ['EC ICT Rocks', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241001-WA0001-768x1024.jpg',
          alt: 'EC ICT Rocks - Image 1',
          caption: 'EC ICT Rocks - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241001-WA0003-1024x768.jpg',
          alt: 'EC ICT Rocks - Image 2',
          caption: 'EC ICT Rocks - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241001-WA0002-768x1024.jpg',
          alt: 'EC ICT Rocks - Image 3',
          caption: 'EC ICT Rocks - Image 3'
        }
      ]
    },
    {
      title: 'Visit: Banas Dairy',
      date: 'October 5, 2024',
      category: 'visit',
      description: 'Educational visit to Banas Dairy, Palanpur organized by the EC Department to enhance practical learning and industry exposure for students. The visit included 37 students from Semesters 3 and 5, accompanied by faculty members MJD, RNP, and SPJ.',
      tags: ['Visit', 'Banas Dairy', 'Industry Exposure', 'Practical Learning'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0030-1536x1152.jpg',
          alt: 'Visit: Banas Dairy - Group Photo',
          caption: 'Visit: Banas Dairy - Group Photo'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20241005_114817-768x432.jpg',
          alt: 'Visit: Banas Dairy - Facility Tour',
          caption: 'Visit: Banas Dairy - Facility Tour'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0038-2048x914.jpg',
          alt: 'Visit: Banas Dairy - Industrial Learning',
          caption: 'Visit: Banas Dairy - Industrial Learning'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0109-768x343.jpg',
          alt: 'Visit: Banas Dairy - Technology Demonstration',
          caption: 'Visit: Banas Dairy - Technology Demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0046-768x343.jpg',
          alt: 'Visit: Banas Dairy - Production Process',
          caption: 'Visit: Banas Dairy - Production Process'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20241005_101831-768x1364.jpg',
          alt: 'Visit: Banas Dairy - Student Interaction',
          caption: 'Visit: Banas Dairy - Student Interaction'
        }
      ]
    },
    {
      title: 'Ambaji: Heritage Visit',
      date: 'October 14, 2024',
      category: 'visit',
      description: 'Educational heritage visit to Ambaji organized to provide students with cultural exposure and historical knowledge about this important pilgrimage site in Gujarat.',
      tags: ['Ambaji', 'Heritage Visit', 'Cultural Exposure', 'Historical Knowledge'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-1742488361800218028667489565602-1024x768.jpg',
          alt: 'Ambaji: Heritage Visit - Image 1',
          caption: 'Ambaji: Heritage Visit - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424883659207368792753606873520-1024x768.jpg',
          alt: 'Ambaji: Heritage Visit - Image 2',
          caption: 'Ambaji: Heritage Visit - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-1742488364967372751161181101326-1024x768.jpg',
          alt: 'Ambaji: Heritage Visit - Image 3',
          caption: 'Ambaji: Heritage Visit - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424883656782587977930620557353-1024x768.jpg',
          alt: 'Ambaji: Heritage Visit - Image 4',
          caption: 'Ambaji: Heritage Visit - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424883654123242325079386387563-768x1024.jpg',
          alt: 'Ambaji: Heritage Visit - Image 5',
          caption: 'Ambaji: Heritage Visit - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424883652066952418897765319133-1024x768.jpg',
          alt: 'Ambaji: Heritage Visit - Image 6',
          caption: 'Ambaji: Heritage Visit - Image 6'
        }
      ]
    },
    {
      title: 'GPP Navratri (2024)',
      date: 'October 14, 2024',
      category: 'community',
      description: 'Cultural celebration of Navratri festival organized by Government Polytechnic Palanpur, showcasing traditional activities, student participation, and cultural programs celebrating Gujarati heritage.',
      tags: ['GPP Navratri 2024', 'Cultural Celebration', 'Traditional Activities', 'Student Participation'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424883680788824720829223007035-768x1024.jpg',
          alt: 'GPP Navratri (2024) - Image 1',
          caption: 'GPP Navratri (2024) - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424883675966107323110283871159-768x1024.jpg',
          alt: 'GPP Navratri (2024) - Image 2',
          caption: 'GPP Navratri (2024) - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424883673534072222870050168177-768x1024.jpg',
          alt: 'GPP Navratri (2024) - Image 3',
          caption: 'GPP Navratri (2024) - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424883679682241653355210603628-768x1024.jpg',
          alt: 'GPP Navratri (2024) - Image 4',
          caption: 'GPP Navratri (2024) - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424883678391654456985091335810-1024x768.jpg',
          alt: 'GPP Navratri (2024) - Image 5',
          caption: 'GPP Navratri (2024) - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424883671141432065522376397730-768x1024.jpg',
          alt: 'GPP Navratri (2024) - Image 6',
          caption: 'GPP Navratri (2024) - Image 6'
        }
      ]
    },
    {
      title: 'Visit: Community Radio Station, Palanpur',
      date: 'October 16, 2024',
      category: 'visit',
      description: 'Educational visit to community radio station to understand broadcasting technology and communication systems. The visit included 27 students from Semester 4, accompanied by faculty members RNP and SPJ.',
      tags: ['Visit', 'Community Radio', 'Broadcasting Technology', 'Communication Systems'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20241016-wa00193377510347962355009-1024x459.jpg',
          alt: 'Visit: Community Radio Station, Palanpur - Image 1',
          caption: 'Visit: Community Radio Station, Palanpur - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20241016-wa00151653860351320558089-1024x459.jpg',
          alt: 'Visit: Community Radio Station, Palanpur - Image 2',
          caption: 'Visit: Community Radio Station, Palanpur - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20241016-wa00119047071586767100942-1024x768.jpg',
          alt: 'Visit: Community Radio Station, Palanpur - Image 3',
          caption: 'Visit: Community Radio Station, Palanpur - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20241016-wa00096629569267458144797-1024x459.jpg',
          alt: 'Visit: Community Radio Station, Palanpur - Image 4',
          caption: 'Visit: Community Radio Station, Palanpur - Image 4'
        }
      ]
    },
    {
      title: 'Internet of Things (IoT)',
      date: 'October 22, 2024',
      category: 'workshop',
      description: 'Technical session on IoT concepts, industrial applications, and integration of smart devices in automation. Expert: Dr. V K Thakar, Dean, Indrashil University with 59 participants. The session covered IoT concepts, its industrial applications, and the integration of smart devices in automation.',
      tags: ['Internet of Things', 'IoT', 'Smart Devices', 'Automation', 'Industrial Applications'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424885315953636584816384820537-1024x768.jpg',
          alt: 'Internet of Things (IoT) - Image 1',
          caption: 'Internet of Things (IoT) - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424885317233630030408214762721-1024x768.jpg',
          alt: 'Internet of Things (IoT) - Image 2',
          caption: 'Internet of Things (IoT) - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424885314624375434163410549868-1024x768.jpg',
          alt: 'Internet of Things (IoT) - Image 3',
          caption: 'Internet of Things (IoT) - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424885318308173111746315099678-1024x768.jpg',
          alt: 'Internet of Things (IoT) - Image 4',
          caption: 'Internet of Things (IoT) - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424885324351184278091972462489-1024x768.jpg',
          alt: 'Internet of Things (IoT) - Image 5',
          caption: 'Internet of Things (IoT) - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/wp-17424885325568367909233053874117-1024x768.jpg',
          alt: 'Internet of Things (IoT) - Image 6',
          caption: 'Internet of Things (IoT) - Image 6'
        }
      ]
    },
    {
      title: 'Career Guidance for EC Engineers',
      date: 'November 10, 2024',
      category: 'awareness',
      description: 'Career guidance session conducted by Mr. Krishna Panchal, Associate Engineer from E-Infochips, with 34 participants. Students received comprehensive guidance on career paths in electronics and communication engineering, including job opportunities and required skill sets for success in the industry.',
      tags: ['Career Guidance for EC Engineers', 'E-Infochips', 'Career Paths', 'Job Opportunities', 'Skill Development'],
      images: []
    },
    {
      title: 'Career Awareness: Model School Deesa',
      date: 'December 9, 2024',
      category: 'awareness',
      description: 'Career awareness and guidance session conducted to help students explore opportunities in their field.',
      tags: ['Career Awareness', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241210-WA0021-1024x768.jpg',
          alt: 'Career Awareness: Model School Deesa - Image 1',
          caption: 'Career Awareness: Model School Deesa - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241210-WA0020-1024x768.jpg',
          alt: 'Career Awareness: Model School Deesa - Image 2',
          caption: 'Career Awareness: Model School Deesa - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241210-WA0022-1024x768.jpg',
          alt: 'Career Awareness: Model School Deesa - Image 3',
          caption: 'Career Awareness: Model School Deesa - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241210-WA0015-1024x768.jpg',
          alt: 'Career Awareness: Model School Deesa - Image 4',
          caption: 'Career Awareness: Model School Deesa - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241210-WA0016-1024x768.jpg',
          alt: 'Career Awareness: Model School Deesa - Image 5',
          caption: 'Career Awareness: Model School Deesa - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241210-WA0017-1024x768.jpg',
          alt: 'Career Awareness: Model School Deesa - Image 6',
          caption: 'Career Awareness: Model School Deesa - Image 6'
        }
      ]
    },
    {
      title: 'iACE Meet',
      date: 'December 16, 2024',
      category: 'training',
      description: 'iACE (Innovation in Applied Computing and Electronics) Meet organized by the Electronics & Communication Engineering Department. This technical meet brought together students, faculty, and industry experts to discuss innovations, emerging technologies, and advancements in the field of applied computing and electronics. The event featured technical presentations, project showcases, and networking opportunities to foster collaboration and knowledge sharing in the EC domain.',
      tags: ['iACE Meet', 'Innovation', 'Applied Computing', 'Electronics', 'Technical Meet', 'EC Department'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_104003_8954274145279917131303-576x1024.jpg',
          alt: 'iACE Meet - Technical Presentation Session',
          caption: 'iACE Meet - Technical Presentation Session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_105952_4312806814072538213385-1024x576.jpg',
          alt: 'iACE Meet - Innovation Showcase',
          caption: 'iACE Meet - Innovation Showcase'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_104122_9388223817230013926898-1024x576.jpg',
          alt: 'iACE Meet - Participants and Faculty',
          caption: 'iACE Meet - Participants and Faculty'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_131731_0006505276430652822358-576x1024.jpg',
          alt: 'iACE Meet - Project Demonstration',
          caption: 'iACE Meet - Project Demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_131739_9152486989411825757832-576x1024.jpg',
          alt: 'iACE Meet - Technical Discussion',
          caption: 'iACE Meet - Technical Discussion'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_131829_1936526003752083938445-576x1024.jpg',
          alt: 'iACE Meet - Student Presentations',
          caption: 'iACE Meet - Student Presentations'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_131759_1736420146830666547387-576x1024.jpg',
          alt: 'iACE Meet - Networking Session',
          caption: 'iACE Meet - Networking Session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_131837_3806695639560423378758-1024x576.jpg',
          alt: 'iACE Meet - Group Discussion',
          caption: 'iACE Meet - Group Discussion'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_141329_8085005151785746090546-1024x576.jpg',
          alt: 'iACE Meet - Innovation Lab Tour',
          caption: 'iACE Meet - Innovation Lab Tour'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_131850_0088887665314308598192-576x1024.jpg',
          alt: 'iACE Meet - Technology Exhibition',
          caption: 'iACE Meet - Technology Exhibition'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_141335_3846112541267892111252-1024x576.jpg',
          alt: 'iACE Meet - Collaborative Learning',
          caption: 'iACE Meet - Collaborative Learning'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img_20241216_133114_1404848896074941679326-1024x576.jpg',
          alt: 'iACE Meet - Closing Session',
          caption: 'iACE Meet - Closing Session'
        }
      ]
    },
    {
      title: 'Appreciation of Students',
      date: 'December 17, 2024',
      category: 'training',
      description: 'Recognition ceremony honoring outstanding student achievements and academic excellence.',
      tags: ['Appreciation of Students', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/WhatsApp-Image-2024-12-17-at-12.23.14_e44e9c99-1024x459.jpg',
          alt: 'Appreciation of Students - Image 1',
          caption: 'Appreciation of Students - Image 1'
        }
      ]
    },
    {
      title: 'Career Awareness: Government Secondary School, Jamda, Tharad.',
      date: 'January 8, 2025',
      category: 'awareness',
      description: 'Career awareness and guidance session conducted to help students explore opportunities in their field.',
      tags: ['Career Awareness', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250109-WA0032-1024x576.jpg',
          alt: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 1',
          caption: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250109-WA0030-1024x576.jpg',
          alt: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 2',
          caption: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250109-WA0031-1024x576.jpg',
          alt: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 3',
          caption: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/WhatsApp-Image-2025-01-08-at-16.58.12_76da7e2a-1024x576.jpg',
          alt: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 4',
          caption: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250109-WA0026-1024x576.jpg',
          alt: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 5',
          caption: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250109-WA0027-1024x576.jpg',
          alt: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 6',
          caption: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 6'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250109-WA0028-1024x576.jpg',
          alt: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 7',
          caption: 'Career Awareness: Government Secondary School, Jamda, Tharad. - Image 7'
        }
      ]
    },
    {
      title: 'Republic Day 2025',
      date: 'January 26, 2025',
      category: 'community',
      description: 'Republic Day celebration organized by the college to honor the Indian Constitution and promote patriotic values.',
      tags: ['Republic Day 2025', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/WhatsApp-Image-2025-01-26-at-11.21.04_7d84b4e4-1024x576.jpg',
          alt: 'Republic Day 2025 - Image 1',
          caption: 'Republic Day 2025 - Image 1'
        }
      ]
    },
    {
      title: 'Celebrations: Prasadam',
      date: 'February 1, 2025',
      category: 'community',
      description: 'Religious or cultural celebration organized by the department to promote community bonding and spiritual values.',
      tags: ['Celebrations', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250203-WA0007-1024x768.jpg',
          alt: 'Celebrations: Prasadam - Image 1',
          caption: 'Celebrations: Prasadam - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250203-WA0009-1024x768.jpg',
          alt: 'Celebrations: Prasadam - Image 2',
          caption: 'Celebrations: Prasadam - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250203-WA0011-1024x768.jpg',
          alt: 'Celebrations: Prasadam - Image 3',
          caption: 'Celebrations: Prasadam - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250203-WA0017-1024x768.jpg',
          alt: 'Celebrations: Prasadam - Image 4',
          caption: 'Celebrations: Prasadam - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250203-WA0003-1024x768.jpg',
          alt: 'Celebrations: Prasadam - Image 5',
          caption: 'Celebrations: Prasadam - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250203-WA0004-1024x768.jpg',
          alt: 'Celebrations: Prasadam - Image 6',
          caption: 'Celebrations: Prasadam - Image 6'
        }
      ]
    },
    {
      title: 'Dept Visit: Keshar School',
      date: 'February 4, 2025',
      category: 'visit',
      description: 'Educational visit organized by the EC Department to enhance practical learning and industry exposure for students.',
      tags: ['Dept Visit', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/WhatsApp-Image-2025-02-04-at-12.43.38_3c0e85e9-1024x768.jpg',
          alt: 'Dept Visit: Keshar School - Image 1',
          caption: 'Dept Visit: Keshar School - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/WhatsApp-Image-2025-02-04-at-12.43.38_4ceff701-1024x768.jpg',
          alt: 'Dept Visit: Keshar School - Image 2',
          caption: 'Dept Visit: Keshar School - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/WhatsApp-Image-2025-02-04-at-12.43.38_79843bf4-1024x768.jpg',
          alt: 'Dept Visit: Keshar School - Image 3',
          caption: 'Dept Visit: Keshar School - Image 3'
        }
      ]
    },
    {
      title: 'Parent\'s Meeting, March 2025',
      date: 'March 29, 2025',
      category: 'community',
      description: 'Parent-teacher meeting organized to discuss student progress, academic performance, and future career guidance. The meeting provided an opportunity for parents to interact with faculty members and understand the department\'s academic programs and student development initiatives.',
      tags: ['Parent Meeting', 'Academic Progress', 'Career Guidance', 'Student Development'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250329-wa00088277389054831929216-1024x768.jpg',
          alt: 'Parents Meeting Session 1',
          caption: 'Parents Meeting Session 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250329-wa00112767065467598141534-1024x768.jpg',
          alt: 'Faculty-Parent Interaction',
          caption: 'Faculty-Parent Interaction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250329-wa00105444893332588759679-1024x768.jpg',
          alt: 'Academic Discussion',
          caption: 'Academic Discussion'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250329-wa00094637988071813599639-1024x768.jpg',
          alt: 'Parent Consultation',
          caption: 'Parent Consultation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250329-wa00121353795816990061287-1024x768.jpg',
          alt: 'Student Progress Review',
          caption: 'Student Progress Review'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250329-wa00142801361458530123062-1024x768.jpg',
          alt: 'Career Guidance Session',
          caption: 'Career Guidance Session'
        }
      ]
    },
    {
      title: 'Workshop: HAM Radio',
      date: 'February 13, 2025',
      category: 'workshop',
      description: 'Workshop on HAM radio technology and amateur radio operations, providing hands-on experience with radio communication systems. Expert: Mr. N. B. Nadoda, Senior Lecturer, GGP Ahmedabad.',
      tags: ['Workshop', 'HAM Radio', 'Amateur Radio', 'Communication Systems', 'GGP Ahmedabad'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250214-WA0086-1024x768.jpg',
          alt: 'Workshop: HAM Radio - Image 1',
          caption: 'Workshop: HAM Radio - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250214-WA0080-1024x768.jpg',
          alt: 'Workshop: HAM Radio - Image 2',
          caption: 'Workshop: HAM Radio - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250214-WA0081-1024x768.jpg',
          alt: 'Workshop: HAM Radio - Image 3',
          caption: 'Workshop: HAM Radio - Image 3'
        }
      ]
    },
    {
      title: 'Workshop: Drone Technology',
      date: 'February 15, 2025',
      category: 'workshop',
      description: 'Workshop on drone technology covering principles of unmanned aerial vehicles, their applications, and hands-on operation experience. Expert: Mr. Yuvrajsinh Rajput, CEO, Bee-Robokids Academy, Palanpur.',
      tags: ['Workshop', 'Drone Technology', 'UAV', 'Bee-Robokids Academy', 'Palanpur'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250215-WA0075-1024x768.jpg',
          alt: 'Workshop: Drone Technology - Image 1',
          caption: 'Workshop: Drone Technology - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250215-WA0076-1024x768.jpg',
          alt: 'Workshop: Drone Technology - Image 2',
          caption: 'Workshop: Drone Technology - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250215-WA0073-1024x768.jpg',
          alt: 'Workshop: Drone Technology - Image 3',
          caption: 'Workshop: Drone Technology - Image 3'
        }
      ]
    },
    {
      title: 'Placement Fair 2025',
      date: 'February 25, 2025',
      category: 'awareness',
      description: 'Placement drive and career fair organized to connect students with potential employers and job opportunities.',
      tags: ['Placement Fair 2025', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/WhatsApp-Image-2025-02-25-at-14.45.59_11601cda-1024x768.jpg',
          alt: 'Placement Fair 2025 - Image 1',
          caption: 'Placement Fair 2025 - Image 1'
        }
      ]
    },
    {
      title: 'Thalassemia Test 2025',
      date: 'February 28, 2025',
      category: 'awareness',
      description: 'Health awareness and screening program organized to promote student welfare and healthcare initiatives.',
      tags: ['Thalassemia Test 2025', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250228-WA0022-1024x768.jpg',
          alt: 'Thalassemia Test 2025 - Image 1',
          caption: 'Thalassemia Test 2025 - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250228-WA0023-1024x768.jpg',
          alt: 'Thalassemia Test 2025 - Image 2',
          caption: 'Thalassemia Test 2025 - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250228-WA0027-1024x768.jpg',
          alt: 'Thalassemia Test 2025 - Image 3',
          caption: 'Thalassemia Test 2025 - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250228-WA0016-1024x768.jpg',
          alt: 'Thalassemia Test 2025 - Image 4',
          caption: 'Thalassemia Test 2025 - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250228-WA0017-1024x768.jpg',
          alt: 'Thalassemia Test 2025 - Image 5',
          caption: 'Thalassemia Test 2025 - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250228-WA0029-1024x768.jpg',
          alt: 'Thalassemia Test 2025 - Image 6',
          caption: 'Thalassemia Test 2025 - Image 6'
        }
      ]
    },
    {
      title: 'Women\'s Day 2025',
      date: 'March 8, 2025',
      category: 'community',
      description: 'International Women\'s Day celebration organized by Government Polytechnic Palanpur to recognize and honor the achievements, contributions, and empowerment of women in society, education, and technology. The celebration highlighted the importance of gender equality and women\'s role in building a progressive society.',
      tags: ['Women\'s Day 2025', 'Gender Equality', 'Women Empowerment', 'Community'],
      images: [
        {
          src: '/newsletters/2024-25/womens-day-1.jpeg',
          alt: 'Women\'s Day 2025 Celebration - Main Event',
          caption: 'Women\'s Day 2025 Celebration - Main Event'
        },
        {
          src: '/newsletters/2024-25/womens-day-2.jpeg',
          alt: 'Women\'s Day 2025 Celebration - Activities',
          caption: 'Women\'s Day 2025 Celebration - Activities'
        },
        {
          src: '/newsletters/2024-25/womens-day-3.jpeg',
          alt: 'Women\'s Day 2025 Celebration - Participants',
          caption: 'Women\'s Day 2025 Celebration - Participants'
        },
        {
          src: '/newsletters/2024-25/womens-day-group.jpeg',
          alt: 'Women\'s Day 2025 - Group Photo',
          caption: 'Women\'s Day 2025 - Group Photo'
        }
      ]
    },
    {
      title: 'Sports Week 2025',
      date: 'March 11, 2025',
      category: 'community',
      description: 'Sports week activities organized to promote physical fitness, teamwork, and healthy competition among students.',
      tags: ['Sports Week 2025', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/WhatsApp-Image-2025-03-11-at-14.59.00_87c426bb-1024x768.jpg',
          alt: 'Sports Week 2025 - Image 1',
          caption: 'Sports Week 2025 - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/WhatsApp-Image-2025-03-11-at-14.59.00_a8afc727-1024x768.jpg',
          alt: 'Sports Week 2025 - Image 2',
          caption: 'Sports Week 2025 - Image 2'
        }
      ]
    },
    {
      title: 'PhD Completion Celebrations at Laduma',
      date: 'March 15, 2025',
      category: 'community',
      description: 'Celebration organized to honor faculty members LKP and RNP for their PhD completion achievements.',
      tags: ['PhD Completion (LKP, RNP) Celebrations at Laduma', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250315-wa00053458429398878103883.jpg',
          alt: 'PhD Completion Celebrations at Laduma - Image 1',
          caption: 'PhD Completion Celebrations at Laduma - Image 1'
        }
      ]
    },
    {
      title: 'Cyber Crime Training Program at IGP - BK',
      date: 'March 17, 2025',
      category: 'training',
      description: 'Training program on cyber crime awareness and digital security conducted at IGP - BK. The program educated participants about online threats, prevention measures, digital forensics, and cybersecurity best practices. Faculty and students gained valuable insights into protecting themselves and others from cyber crimes.',
      tags: ['Cyber Crime Training Program at IGP - BK', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250318-wa0003771115917890614088-1024x768.jpg',
          alt: 'Cyber Crime Training Program at IGP - BK - Image 1',
          caption: 'Cyber Crime Training Program at IGP - BK - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250318-wa00148973197549005607506-768x1024.jpg',
          alt: 'Cyber Crime Training Program at IGP - BK - Image 2',
          caption: 'Cyber Crime Training Program at IGP - BK - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250320-wa00002163809518286320899-768x1024.jpg',
          alt: 'Cyber Crime Training Program at IGP - BK - Image 3',
          caption: 'Cyber Crime Training Program at IGP - BK - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250320-wa00022056911376805706864-1024x702.jpg',
          alt: 'Cyber Crime Training Program at IGP - BK - Image 4',
          caption: 'Cyber Crime Training Program at IGP - BK - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250320-wa00016514387201292364585-1024x721.jpg',
          alt: 'Cyber Crime Training Program at IGP - BK - Image 5',
          caption: 'Cyber Crime Training Program at IGP - BK - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250318-wa0012759099033505903971-768x1024.jpg',
          alt: 'Cyber Crime Training Program at IGP - BK - Image 6',
          caption: 'Cyber Crime Training Program at IGP - BK - Image 6'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250318-wa00073929239868787202507-1024x768.jpg',
          alt: 'Cyber Crime Training Program at IGP - BK - Image 7',
          caption: 'Cyber Crime Training Program at IGP - BK - Image 7'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250318-wa00096683100535197690775-768x1024.jpg',
          alt: 'Cyber Crime Training Program at IGP - BK - Image 8',
          caption: 'Cyber Crime Training Program at IGP - BK - Image 8'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/img-20250318-wa0005982614006059643825-768x1024.jpg',
          alt: 'Cyber Crime Training Program at IGP - BK - Image 9',
          caption: 'Cyber Crime Training Program at IGP - BK - Image 9'
        }
      ]
    },
    {
      title: 'Seminar: Road Safety',
      date: 'March 28, 2025',
      category: 'awareness',
      description: 'Seminar on road safety awareness, emphasizing traffic rules, safe driving practices, and accident prevention measures.',
      tags: ['Seminar', 'EC Department', 'Student Activity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250328-WA0016-1024x768.jpg',
          alt: 'Seminar: Road Safety - Image 1',
          caption: 'Seminar: Road Safety - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250328-WA0017-1024x768.jpg',
          alt: 'Seminar: Road Safety - Image 2',
          caption: 'Seminar: Road Safety - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250328-WA0013-1024x768.jpg',
          alt: 'Seminar: Road Safety - Image 3',
          caption: 'Seminar: Road Safety - Image 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250328-WA0014-1024x768.jpg',
          alt: 'Seminar: Road Safety - Image 4',
          caption: 'Seminar: Road Safety - Image 4'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250328-WA0015-1024x768.jpg',
          alt: 'Seminar: Road Safety - Image 5',
          caption: 'Seminar: Road Safety - Image 5'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20250328-WA0012-1024x768.jpg',
          alt: 'Seminar: Road Safety - Image 6',
          caption: 'Seminar: Road Safety - Image 6'
        }
      ]
    }
  ],

  reflections: {
    principal: {
      name: 'Sureshkumar D Dabhi',
      designation: 'Principal, Government Polytechnic Palanpur',
      message: `Dear Students, Faculty, and Stakeholders,

It gives me immense pleasure to present this edition of "Spectrum," representing the academic year 2024-25. Our Electronics & Communication Engineering Department continues to excel in providing quality technical education and fostering innovation among our students.

This academic year has been marked by significant achievements in student placements, faculty development, and infrastructure enhancement. We remain committed to maintaining our high standards of education while adapting to emerging technologies and industry requirements.

I extend my congratulations to all students and faculty for their dedication and encourage continued pursuit of excellence in all endeavors.`
    },
    hod: {
      name: 'Sunilkumar J Chauhan',
      designation: 'Head of Department - Electronics & Communication Engineering',
      message: `Dear EC Community,

The academic year 2024-25 continues to witness remarkable progress in our department's academic and research activities. We have strengthened our industry partnerships and enhanced our curriculum to meet the evolving demands of the electronics and communication sector.

Our students have shown exceptional performance in various competitions and projects, while our faculty members continue to contribute to research and professional development. The department's focus on practical learning and innovation remains at the forefront of our educational approach.

I look forward to achieving new milestones in the coming months and appreciate the continued support from our entire EC family.`
    },
    editorial: {
      name: 'Editorial Team',
      designation: 'EC Department Faculty',
      message: `Dear Readers,

Welcome to this edition of "Spectrum" for the academic year 2024-25. This newsletter chronicles our department's journey through various academic activities, student achievements, and faculty contributions.

As we progress through this academic year, we continue to document the remarkable stories of innovation, learning, and growth within our Electronics & Communication Engineering community. Each event and achievement reflects our collective commitment to excellence in technical education.

We hope this newsletter serves as a valuable record of our department's activities and inspires our community to reach greater heights.`
    }
  },
  
  logos: [
    {
      src: '/newsletters/imgs/gpp-logo.png',
      alt: 'Government Polytechnic Palanpur Logo'
    },
    {
      src: '/newsletters/imgs/ec-logo.png', 
      alt: 'EC Department Logo'
    }
  ],
  
  reachout: {
    email: 'gppec11@gmail.com',
    phone: '02742-245219',
    address: 'Opp. Malan Darwaja, Ambaji Road, Palanpur - 385001, Gujarat',
    website: 'ec.gppalanpur.in'
  }
};
