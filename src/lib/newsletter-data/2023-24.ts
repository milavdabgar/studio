// Newsletter Data for Academic Year 2023-24
// Electronics & Communication Engineering Department
// Government Polytechnic Palanpur
// This is the main data file, moved from the parent directory

import { NewsletterData } from '../newsletter-data';

export const newsletterData2023_24: NewsletterData = {
  stats: [
    { label: 'Placement Rate', value: 67, color: 'bg-blue-500' },
    { label: 'Conference Papers', value: 1, color: 'bg-green-500' },
    { label: 'Students Placed', value: 2, color: 'bg-purple-500' },
    { label: 'Higher Studies', value: 1, color: 'bg-orange-500' },
  ],
  
  canvas: [
    {
      title: "6G Technology: Beyond Imagination",
      author: "Prof. Advanced Faculty",
      designation: "Senior Lecturer, EC Department",
      content: "While 5G is still being deployed, research into 6G technology is already underway. Expected by 2030, 6G will offer terabit speeds, holographic communications, and brain-computer interfaces. As EC engineers, we must prepare for this technological revolution that will redefine human-machine interaction.",
      date: "March 2024",
      type: "tech-news",
      authorType: "faculty"
    },
    {
      title: "Neuromorphic Computing: The Brain-Inspired Approach",
      author: "Dr. Research Innovator",
      designation: "Research Faculty, EC Department",
      content: "Neuromorphic computing mimics the neural structure of the human brain, offering ultra-low power consumption and real-time learning capabilities. This emerging field combines neuroscience, computer science, and electronics to create next-generation computing systems.",
      date: "February 2024",
      type: "research",
      authorType: "faculty"
    },
    {
      title: "My Robotics Competition Experience",
      author: "Innovative Student",
      studentId: "236260311xxx",
      semester: "5th Semester",
      content: "Participating in the national robotics competition was a dream come true. Our team developed an autonomous navigation robot using computer vision and machine learning. The experience taught me the importance of interdisciplinary knowledge in modern electronics engineering.",
      date: "January 2024",
      type: "experience",
      authorType: "student"
    },
    {
      title: "Sustainable Electronics Design",
      author: "Green Tech Advocate",
      designation: "Environmental Engineering Lecturer",
      content: "The future of electronics lies in sustainable design practices. From biodegradable circuits to energy harvesting systems, we must innovate responsibly. Our students are exploring eco-friendly materials and circular economy principles in electronic product design.",
      date: "December 2023",
      type: "innovation",
      authorType: "faculty"
    },
    {
      title: "Digital Dreams",
      author: "Creative Writer",
      studentId: "236260311yyy",
      semester: "3rd Semester",
      content: "In the realm of bits and bytes,\nWhere digital dreams take flight,\nWe craft the future with our hands,\nGuided by electronic light.\n\nFrom sensors smart to AI bright,\nEach circuit tells a tale,\nOf innovation, dedication,\nWhere human spirits never fail.",
      date: "November 2023",
      type: "poem",
      authorType: "student"
    },
    {
      title: "Quantum Sensors and Measurement",
      author: "Quantum Research Team",
      designation: "Advanced Research Group",
      content: "Quantum sensors are revolutionizing precision measurement across multiple domains. From gravitational wave detection to medical imaging, these ultra-sensitive devices offer unprecedented accuracy. Understanding quantum principles is becoming essential for next-generation sensor design.",
      date: "October 2023",
      type: "research",
      authorType: "faculty"
    }
  ],

  spotlight: [
    // Faculty Contributions
    {
      category: 'faculty-contribution' as const,
      title: 'GTU Board of Studies Coordinator',
      description: 'Prof. Sunilkumar J Chauhan serves as coordinator for GTU syllabus development',
      person: 'Prof. Sunilkumar J Chauhan',
      designation: 'Head of Department, EC Engineering',
      details: 'GTU Board of Studies member for Electronics & Communication Engineering syllabus development and curriculum enhancement',
      date: '2023-24',
      achievements: [
        'GTU Syllabus Committee coordination for EC Engineering',
        'Curriculum modernization with emerging technologies',
        'Academic policy development and implementation',
        'Inter-departmental coordination and leadership'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'Digital Signal Processing Research & Training',
      description: 'Ms. Mittal K. Pedhadiya completed advanced certification and research work',
      person: 'Ms. Mittal K. Pedhadiya',
      designation: 'Assistant Professor, EC Department',
      details: 'Advanced certification in Digital Signal Processing from IIT Bombay and editorial responsibilities',
      date: '2023-24',
      achievements: [
        'Editorial board member for academic publications',
        'Advanced DSP certification from IIT Bombay',
        'Student project supervision and guidance',
        'Industry collaboration for practical training'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'PhD Research in Antenna Design',
      description: 'Mr. Milav J. Dabgar pursuing PhD research in 5G antenna technologies',
      person: 'Mr. Milav J. Dabgar',
      designation: 'Assistant Professor, EC Department',
      details: 'PhD coursework and research in Antenna Design for 5G Applications with publication activities',
      date: '2023-24',
      achievements: [
        'PhD research in 5G antenna design applications',
        'Research publications in peer-reviewed journals',
        'Conference presentations on antenna technologies',
        'Student research mentorship and lab supervision'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'SSIP Coordination & Innovation Programs',
      description: 'Faculty coordination of Student Startup and Innovation Policy initiatives',
      person: 'EC Faculty Team',
      designation: 'SSIP Coordinators',
      details: 'Student Startup and Innovation Policy coordination fostering entrepreneurship and innovation projects',
      date: '2023-24',
      achievements: [
        'SSIP project coordination and mentorship',
        'Innovation and entrepreneurship program development',
        'Industry partnership for startup initiatives',
        'Student competition guidance and support'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'Professional Development & Training',
      description: 'Faculty participation in skill enhancement and professional development programs',
      person: 'EC Department Faculty',
      designation: 'Various Faculty Members',
      details: 'Comprehensive professional development through workshops, seminars, and certification programs',
      date: '2023-24',
      achievements: [
        'ATAL Faculty Development Program participation',
        'NPTEL online certification courses completion',
        'Industry workshop attendance and training',
        'Technical skill enhancement programs'
      ]
    },
    {
      category: 'faculty-contribution' as const,
      title: 'International Conference Paper Presentation - Antenna Design',
      description: 'Prof. Nirav Jashvantkumar Chauhan presented research paper at international conference on antenna design',
      person: 'Prof. Nirav Jashvantkumar Chauhan',
      designation: 'Assistant Professor, EC Department',
      details: 'Paper presentation at 2nd International Conference on Emerging Trends & Contemporary Practices (ICETCP 2024) organized by Atmiya University',
      date: 'February 2024',
      achievements: [
        'Paper Title: "Analysis of Vedic Shaped Microstrip Patch Antenna (MPA) Design for Wireless Applications"',
        'Conference: 2nd International Conference on Emerging Trends & Contemporary Practices (ICETCP 2024)',
        'Organized by: Atmiya University, India',
        'Sponsored by: AICTE & CSIR',
        'Date: February 9th-10th, 2024',
        'Research focus on wireless communication and antenna design',
        'Contribution to cutting-edge research in microstrip patch antennas'
      ],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2024/02/Screen-Shot-2025-03-20-at-22.44.21-PM.png',
          alt: 'Prof. Nirav Jashvantkumar Chauhan at ICETCP 2024',
          caption: 'Prof. Nirav Jashvantkumar Chauhan presenting his research paper at ICETCP 2024, Atmiya University'
        }
      ]
    },
    // Student Achievements
    {
      category: 'student-achievement' as const,
      title: 'Technical Competition Excellence',
      description: 'Students participated and excelled in various technical competitions',
      date: '2023-24',
      achievements: [
        'National level technical competition participation',
        'Project exhibition and presentation at state level',
        'Innovation challenge participation and recognition',
        'Technical paper presentation at conferences'
      ]
    },
    {
      category: 'student-achievement' as const,
      title: 'Academic Excellence & CGPA Performance',
      description: 'Outstanding academic performance by students across all semesters',
      date: '2023-24',
      achievements: [
        'Semester toppers with CGPA above 8.5',
        'Consistent academic performance improvement',
        'Subject-wise excellence in core engineering topics',
        'Overall department academic ranking improvement'
      ]
    },
    // Star Performers
    {
      category: 'star-performer' as const,
      title: 'Academic Excellence - Semester Toppers',
      description: 'Recognition of top-performing students across different semesters',
      date: '2023-24',
      achievements: [
        'Semester 2 topper with outstanding CGPA performance',
        'Semester 4 academic excellence recognition',
        'Semester 6 consistent high performance',
        'Overall academic achievement and improvement'
      ]
    },
    // Placements
    {
      category: 'placement' as const,
      title: 'Micron Technology Placement',
      description: 'Manufacturing Associate position at Micron Technology, Sanand',
      person: 'Bharat Shankarlal Pawar',
      studentId: '216260311003',
      details: 'Micron Technology, Sanand - Manufacturing Associate, Package: ₹3,72,000',
      date: '2024',
      achievements: [
        'Secured placement at leading semiconductor company',
        'Manufacturing Associate role in advanced technology sector',
        'Competitive package of ₹3,72,000 per annum'
      ]
    },
    {
      category: 'placement' as const,
      title: 'TDSC Placement',
      description: 'Diploma Trainee Engineer position at TDSC, Becharaji',
      person: 'Stutiben Amitkumar Raval',
      studentId: '216260311005',
      details: 'TDSC, Becharaji - Diploma Trainee Engineer, Package: ₹3,00,000',
      date: '2024',
      achievements: [
        'Engineering trainee position in reputed organization',
        'Diploma Trainee Engineer role with growth opportunities',
        'Package of ₹3,00,000 per annum'
      ]
    },
    // Higher Education
    {
      category: 'higher-education' as const,
      title: 'VEGC Engineering College Admission',
      description: 'Student admitted to degree engineering program for higher education',
      person: 'Srujal Yashvantbhai Chaudhary',
      studentId: '216260311506',
      date: '2024',
      details: 'VEGC, Chandkheda - B.E. in Electronics & Communication Engineering',
      achievements: [
        'Admission to VEGC, Chandkheda through ACPC',
        'Pursuing B.E. in Electronics & Communication Engineering',
        'Continuation of technical education journey',
        'Merit-based selection for degree program'
      ]
    }  ],

  essence: {
    vision: "To be a center of excellence in Electronics and Communication Engineering education, fostering innovation, research, and industry collaboration to produce globally competent professionals.",
    mission: "To provide quality technical education through modern teaching methodologies, state-of-the-art laboratories, and industry partnerships, enabling students to excel in their careers and contribute to society's technological advancement."
  },

  chronicles: [
    {
      title: 'Orientation Session 2023',
      date: 'July 18, 2023',
      category: 'orientation',
      description: 'Comprehensive orientation program for incoming students, introducing department facilities, academic programs, and career opportunities in electronics and communication engineering.',
      tags: ['Orientation', 'New Students', 'Academic Programs', 'Career Guidance'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0035-1024x462.jpg',
          alt: 'Orientation Session 2023 - Opening ceremony',
          caption: 'Orientation Session 2023 - Opening ceremony'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0034-1024x462.jpg',
          alt: 'Orientation Session 2023 - Welcome address',
          caption: 'Orientation Session 2023 - Welcome address'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0033-1024x462.jpg',
          alt: 'Orientation Session 2023 - Department presentation',
          caption: 'Orientation Session 2023 - Department presentation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0032-1024x462.jpg',
          alt: 'Orientation Session 2023 - Faculty introduction',
          caption: 'Orientation Session 2023 - Faculty introduction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0025-1024x766.jpg',
          alt: 'Orientation Session 2023 - Student interaction',
          caption: 'Orientation Session 2023 - Student interaction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0024-1024x766.jpg',
          alt: 'Orientation Session 2023 - Academic guidelines',
          caption: 'Orientation Session 2023 - Academic guidelines'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0023-1024x766.jpg',
          alt: 'Orientation Session 2023 - Course curriculum overview',
          caption: 'Orientation Session 2023 - Course curriculum overview'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0022-1024x766.jpg',
          alt: 'Orientation Session 2023 - Laboratory tour',
          caption: 'Orientation Session 2023 - Laboratory tour'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0021-1024x766.jpg',
          alt: 'Orientation Session 2023 - Facility showcase',
          caption: 'Orientation Session 2023 - Facility showcase'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0020-1024x766.jpg',
          alt: 'Orientation Session 2023 - Department overview',
          caption: 'Orientation Session 2023 - Department overview'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0019-1024x766.jpg',
          alt: 'Orientation Session 2023 - Career guidance',
          caption: 'Orientation Session 2023 - Career guidance'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0018-1024x766.jpg',
          alt: 'Orientation Session 2023 - Student Q&A session',
          caption: 'Orientation Session 2023 - Student Q&A session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0017-1024x766.jpg',
          alt: 'Orientation Session 2023 - Academic resources introduction',
          caption: 'Orientation Session 2023 - Academic resources introduction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0016-1024x766.jpg',
          alt: 'Orientation Session 2023 - Extracurricular activities presentation',
          caption: 'Orientation Session 2023 - Extracurricular activities presentation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0015-1024x766.jpg',
          alt: 'Orientation Session 2023 - Faculty interaction',
          caption: 'Orientation Session 2023 - Faculty interaction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0014-1024x766.jpg',
          alt: 'Orientation Session 2023 - Student engagement activities',
          caption: 'Orientation Session 2023 - Student engagement activities'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0013-1024x766.jpg',
          alt: 'Orientation Session 2023 - Information session',
          caption: 'Orientation Session 2023 - Information session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0012-1024x766.jpg',
          alt: 'Orientation Session 2023 - Interactive session',
          caption: 'Orientation Session 2023 - Interactive session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0010-1024x766.jpg',
          alt: 'Orientation Session 2023 - Group activities',
          caption: 'Orientation Session 2023 - Group activities'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0008-1024x766.jpg',
          alt: 'Orientation Session 2023 - Welcome session',
          caption: 'Orientation Session 2023 - Welcome session'
        }
      ]
    },
    {
      title: 'Tree Plantation Drive',
      date: 'July 19, 2023',
      category: 'community',
      description: 'Environmental conservation initiative with mass tree plantation in the college campus, promoting ecological awareness and green campus development.',
      tags: ['Environment', 'Tree Plantation', 'Green Campus', 'Conservation'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230719_142931-1024x577.jpg',
          alt: 'Tree Plantation Drive - Environmental conservation activity',
          caption: 'Tree Plantation Drive - Environmental conservation activity'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230719_142939-1024x577.jpg',
          alt: 'Tree Plantation Drive - Campus greening initiative',
          caption: 'Tree Plantation Drive - Campus greening initiative'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230719_142940-1024x577.jpg',
          alt: 'Tree Plantation Drive - Student participation',
          caption: 'Tree Plantation Drive - Student participation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230719_143128-1024x577.jpg',
          alt: 'Tree Plantation Drive - Ecological awareness',
          caption: 'Tree Plantation Drive - Ecological awareness'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230719_143130-1024x577.jpg',
          alt: 'Tree Plantation Drive - Green campus development',
          caption: 'Tree Plantation Drive - Green campus development'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230719_143133-1024x577.jpg',
          alt: 'Tree Plantation Drive - Environmental initiative',
          caption: 'Tree Plantation Drive - Environmental initiative'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0003-1024x768.jpg',
          alt: 'Tree Plantation Drive - Faculty and students collaboration',
          caption: 'Tree Plantation Drive - Faculty and students collaboration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0004-1024x768.jpg',
          alt: 'Tree Plantation Drive - Hands-on environmental work',
          caption: 'Tree Plantation Drive - Hands-on environmental work'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0005-1024x768.jpg',
          alt: 'Tree Plantation Drive - Green initiative activity',
          caption: 'Tree Plantation Drive - Green initiative activity'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0006-1024x768.jpg',
          alt: 'Tree Plantation Drive - Environmental conservation effort',
          caption: 'Tree Plantation Drive - Environmental conservation effort'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0007-1024x768.jpg',
          alt: 'Tree Plantation Drive - Campus sustainability project',
          caption: 'Tree Plantation Drive - Campus sustainability project'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0008-1024x768.jpg',
          alt: 'Tree Plantation Drive - Student environmental engagement',
          caption: 'Tree Plantation Drive - Student environmental engagement'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0009-1024x768.jpg',
          alt: 'Tree Plantation Drive - Green campus initiative',
          caption: 'Tree Plantation Drive - Green campus initiative'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0010-1024x768.jpg',
          alt: 'Tree Plantation Drive - Environmental awareness activity',
          caption: 'Tree Plantation Drive - Environmental awareness activity'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0011-1024x768.jpg',
          alt: 'Tree Plantation Drive - Community involvement',
          caption: 'Tree Plantation Drive - Community involvement'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0012-1024x768.jpg',
          alt: 'Tree Plantation Drive - Tree planting ceremony',
          caption: 'Tree Plantation Drive - Tree planting ceremony'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0013-1024x768.jpg',
          alt: 'Tree Plantation Drive - Ecological responsibility',
          caption: 'Tree Plantation Drive - Ecological responsibility'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0014-1024x768.jpg',
          alt: 'Tree Plantation Drive - Environmental stewardship',
          caption: 'Tree Plantation Drive - Environmental stewardship'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0015-1024x768.jpg',
          alt: 'Tree Plantation Drive - Green environment promotion',
          caption: 'Tree Plantation Drive - Green environment promotion'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0016-1024x768.jpg',
          alt: 'Tree Plantation Drive - Team environmental effort',
          caption: 'Tree Plantation Drive - Team environmental effort'
        }
      ]
    },
    {
      title: 'IPR Awareness Camp at Vidhyamandir School',
      date: 'July 26, 2023',
      category: 'awareness',
      description: 'Students conducted Intellectual Property Rights awareness sessions at local schools, sharing knowledge about patents, trademarks, and innovation protection.',
      tags: ['IPR Awareness', 'Intellectual Property', 'School Outreach', 'Knowledge Sharing'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_142650-768x1024.jpg',
          alt: 'IPR Awareness Camp - Opening session at Vidhyamandir School',
          caption: 'IPR Awareness Camp - Opening session at Vidhyamandir School'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_142738-768x1024.jpg',
          alt: 'IPR Awareness Camp - Student presentation on intellectual property',
          caption: 'IPR Awareness Camp - Student presentation on intellectual property'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_142746-768x1024.jpg',
          alt: 'IPR Awareness Camp - Interactive session on patents',
          caption: 'IPR Awareness Camp - Interactive session on patents'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_142951-1024x768.jpg',
          alt: 'IPR Awareness Camp - Knowledge sharing with school students',
          caption: 'IPR Awareness Camp - Knowledge sharing with school students'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_143104-768x1024.jpg',
          alt: 'IPR Awareness Camp - Educational outreach program',
          caption: 'IPR Awareness Camp - Educational outreach program'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_143225-768x1024.jpg',
          alt: 'IPR Awareness Camp - Student teaching initiative',
          caption: 'IPR Awareness Camp - Student teaching initiative'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_143414-768x1024.jpg',
          alt: 'IPR Awareness Camp - Intellectual property education',
          caption: 'IPR Awareness Camp - Intellectual property education'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_143459-1024x768.jpg',
          alt: 'IPR Awareness Camp - Community knowledge sharing',
          caption: 'IPR Awareness Camp - Community knowledge sharing'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_143748-768x1024.jpg',
          alt: 'IPR Awareness Camp - School visit documentation',
          caption: 'IPR Awareness Camp - School visit documentation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_143757-1024x768.jpg',
          alt: 'IPR Awareness Camp - Student engagement activity',
          caption: 'IPR Awareness Camp - Student engagement activity'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_144208-768x1024.jpg',
          alt: 'IPR Awareness Camp - Group interaction session',
          caption: 'IPR Awareness Camp - Group interaction session'
        }
      ]
    },
    {
      title: 'Industrial Visit: Bajrang Paper Products',
      date: 'August 1, 2023',
      category: 'visit',
      description: '50 students from EC and ICT departments visited Bajrang Paper Products, Palanpur, observing paper manufacturing processes and industrial automation systems.',
      tags: ['Industrial Visit', 'Manufacturing Process', 'Automation', 'Paper Industry'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2024/08/20230801_115754-2048x1153.jpg',
          alt: 'Bajrang Paper Products Visit - Students at manufacturing facility',
          caption: 'Bajrang Paper Products Visit - Students at manufacturing facility'
        }
      ]
    },
    {
      title: 'SSIP 2.0 Appreciation Meet',
      date: 'August 11, 2023',
      category: 'orientation',
      description: 'Student Startup and Innovation Policy (SSIP) 2.0 appreciation meeting to recognize and celebrate student innovation projects and entrepreneurial initiatives, encouraging research and development activities.',
      tags: ['SSIP', 'Innovation', 'Startup Policy', 'Student Recognition'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230811-WA0002-1024x576.jpg',
          alt: 'SSIP Appreciation Meet',
          caption: 'SSIP Appreciation Ceremony'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230811-WA0000-576x1024.jpg',
          alt: 'Innovation Recognition',
          caption: 'Student Innovation Recognition'
        }
      ]
    },
    {
      title: 'SEMICON 2023 Exhibition',
      date: 'September 27, 2023',
      category: 'visit',
      description: 'Students attended SEMICON 2023, India\'s premier semiconductor and electronics exhibition, gaining exposure to latest technologies and industry trends in semiconductor manufacturing.',
      tags: ['Semiconductor Exhibition', 'Technology Trends', 'Industry Exposure', 'SEMICON'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_071846-1024x577.jpg',
          alt: 'SEMICON 2023 - Exhibition entrance and registration',
          caption: 'SEMICON 2023 - Exhibition entrance and registration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_071853-1024x577.jpg',
          alt: 'SEMICON 2023 - Technology exhibition hall',
          caption: 'SEMICON 2023 - Technology exhibition hall'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_071935-1024x577.jpg',
          alt: 'SEMICON 2023 - Semiconductor technology displays',
          caption: 'SEMICON 2023 - Semiconductor technology displays'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_113120-1024x577.jpg',
          alt: 'SEMICON 2023 - Industry technology showcase',
          caption: 'SEMICON 2023 - Industry technology showcase'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_113127-1024x577.jpg',
          alt: 'SEMICON 2023 - Electronics manufacturing exhibits',
          caption: 'SEMICON 2023 - Electronics manufacturing exhibits'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_113133-1024x577.jpg',
          alt: 'SEMICON 2023 - Advanced semiconductor equipment',
          caption: 'SEMICON 2023 - Advanced semiconductor equipment'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_115432-768x1024.jpg',
          alt: 'SEMICON 2023 - Students exploring technology trends',
          caption: 'SEMICON 2023 - Students exploring technology trends'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_115436-1024x768.jpg',
          alt: 'SEMICON 2023 - Industry interaction and learning',
          caption: 'SEMICON 2023 - Industry interaction and learning'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_115708-768x1024.jpg',
          alt: 'SEMICON 2023 - Technology demonstration session',
          caption: 'SEMICON 2023 - Technology demonstration session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_115958-768x1024.jpg',
          alt: 'SEMICON 2023 - Student learning experience',
          caption: 'SEMICON 2023 - Student learning experience'
        }
      ]
    },
    {
      title: 'Solar Cell Fabrication Session',
      date: 'October 18, 2023',
      category: 'workshop',
      description: 'Hands-on session on solar cell fabrication conducted by Mr. Sandip Joshi, Jr. Engineer from Adani Power Ltd., covering photovoltaic principles and fabrication processes for 7 participants.',
      tags: ['Solar Energy', 'Cell Fabrication', 'Photovoltaic', 'Renewable Energy'],
      images: []
    },
    {
      title: 'Rakhi & Rangoli 2023',
      date: 'October 27, 2023',
      category: 'community',
      description: 'Cultural celebration of Rakhi and Rangoli festival showcasing student creativity and cultural heritage, promoting cultural values and artistic expression among students.',
      tags: ['Cultural Event', 'Festival Celebration', 'Student Creativity', 'Cultural Heritage'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231030-WA0001-1024x766.jpg',
          alt: 'Rakhi & Rangoli 2023 - Main celebration event',
          caption: 'Rakhi & Rangoli 2023 - Main celebration event'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231027-WA0004-1024x576.jpg',
          alt: 'Rakhi & Rangoli 2023 - Rangoli art competition',
          caption: 'Rakhi & Rangoli 2023 - Rangoli art competition'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231027-WA0005-1024x576.jpg',
          alt: 'Rakhi & Rangoli 2023 - Student participation in activities',
          caption: 'Rakhi & Rangoli 2023 - Student participation in activities'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231027-WA0006-1024x576.jpg',
          alt: 'Rakhi & Rangoli 2023 - Creative artwork display',
          caption: 'Rakhi & Rangoli 2023 - Creative artwork display'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231027-WA0003-1024x576.jpg',
          alt: 'Rakhi & Rangoli 2023 - Festival celebration activities',
          caption: 'Rakhi & Rangoli 2023 - Festival celebration activities'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230829-WA0012-766x1024.jpg',
          alt: 'Rakhi & Rangoli 2023 - Traditional festival elements',
          caption: 'Rakhi & Rangoli 2023 - Traditional festival elements'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231027-WA0007-1024x576.jpg',
          alt: 'Rakhi & Rangoli 2023 - Cultural expression and creativity',
          caption: 'Rakhi & Rangoli 2023 - Cultural expression and creativity'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230829-WA0013-766x1024.jpg',
          alt: 'Rakhi & Rangoli 2023 - Student engagement in cultural activities',
          caption: 'Rakhi & Rangoli 2023 - Student engagement in cultural activities'
        }
      ]
    },
    {
      title: 'SEMIX Training at IIT Bombay',
      date: 'November 6-10, 2023',
      category: 'training',
      description: 'Advanced training program on semiconductor technology and research methodologies at IIT Bombay, providing exposure to cutting-edge research facilities and industry practices.',
      tags: ['Semiconductor Training', 'IIT Bombay', 'Research Exposure', 'SEMIX'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20231109_102102-1024x768.jpg',
          alt: 'SEMIX Training - IIT Bombay campus and facilities',
          caption: 'SEMIX Training - IIT Bombay campus and facilities'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20231109_154951-768x1024.jpg',
          alt: 'SEMIX Training - Advanced research laboratory session',
          caption: 'SEMIX Training - Advanced research laboratory session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20231110_120533-768x1024.jpg',
          alt: 'SEMIX Training - Semiconductor technology demonstration',
          caption: 'SEMIX Training - Semiconductor technology demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231108-WA0004.jpg',
          alt: 'SEMIX Training - Technical laboratory visit',
          caption: 'SEMIX Training - Technical laboratory visit'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231108-WA0012.jpg',
          alt: 'SEMIX Training - Research facility exploration',
          caption: 'SEMIX Training - Research facility exploration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231109-WA0010.jpg',
          alt: 'SEMIX Training - Technical discussion and learning',
          caption: 'SEMIX Training - Technical discussion and learning'
        }
      ]
    },
    {
      title: 'Expert Sessions on Embedded Systems & Web Development',
      date: 'March 13, 2024',
      category: 'workshop',
      description: 'Two comprehensive expert sessions were conducted by Mr. Vishal Vadher from SOFCON India Pvt. Ltd. covering embedded systems (45 participants) and web development technologies (53 participants), providing industry insights and practical knowledge.',
      tags: ['Expert Session', 'Embedded Systems', 'Web Development', 'Industry Insights'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0004-1024x459.jpg',
          alt: 'Expert Session - Opening presentation',
          caption: 'Expert Session - Opening presentation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0005-1024x459.jpg',
          alt: 'Expert Session - Industry expert speaking',
          caption: 'Expert Session - Industry expert speaking'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0006-1024x459.jpg',
          alt: 'Expert Session - Technical presentation on embedded systems',
          caption: 'Expert Session - Technical presentation on embedded systems'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0008-1024x459.jpg',
          alt: 'Expert Session - Student engagement and interaction',
          caption: 'Expert Session - Student engagement and interaction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0010-1024x459.jpg',
          alt: 'Expert Session - Hands-on demonstration',
          caption: 'Expert Session - Hands-on demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0011-1024x459.jpg',
          alt: 'Expert Session - Web development technologies overview',
          caption: 'Expert Session - Web development technologies overview'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0018-1024x766.jpg',
          alt: 'Expert Session - Interactive workshop session',
          caption: 'Expert Session - Interactive workshop session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0020-1024x766.jpg',
          alt: 'Expert Session - Technical discussion and Q&A',
          caption: 'Expert Session - Technical discussion and Q&A'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0021-1024x766.jpg',
          alt: 'Expert Session - Practical learning session',
          caption: 'Expert Session - Practical learning session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0025-766x1024.jpg',
          alt: 'Expert Session - Student participation in workshop',
          caption: 'Expert Session - Student participation in workshop'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0027-1024x766.jpg',
          alt: 'Expert Session - Industry insights presentation',
          caption: 'Expert Session - Industry insights presentation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0028-1024x766.jpg',
          alt: 'Expert Session - Collaborative learning environment',
          caption: 'Expert Session - Collaborative learning environment'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0029-766x1024.jpg',
          alt: 'Expert Session - Technical skill development',
          caption: 'Expert Session - Technical skill development'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0031-1024x766.jpg',
          alt: 'Expert Session - Workshop documentation',
          caption: 'Expert Session - Workshop documentation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0033-1024x766.jpg',
          alt: 'Expert Session - Technology demonstration',
          caption: 'Expert Session - Technology demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0035-1024x766.jpg',
          alt: 'Expert Session - Group photo with industry expert',
          caption: 'Expert Session - Group photo with industry expert'
        }
      ]
    },
    {
      title: 'Industrial Visit: PCB Power and MCBS Pvt Ltd',
      date: 'March 16, 2024',
      category: 'visit',
      description: '42 students from semesters 2, 4, and 6 visited PCB Power and MCBS Pvt Ltd, Gandhinagar, gaining practical exposure to PCB manufacturing processes and industrial electronics applications.',
      tags: ['Industrial Visit', 'PCB Manufacturing', 'Practical Learning'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0002-1024x766.jpg',
          alt: 'PCB Power Visit - Students at company entrance',
          caption: 'PCB Power Visit - Students at company entrance'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0008-1024x472.jpg',
          alt: 'PCB Power Visit - Industrial equipment demonstration',
          caption: 'PCB Power Visit - Industrial equipment demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0009-1024x472.jpg',
          alt: 'PCB Power Visit - Students learning manufacturing processes',
          caption: 'PCB Power Visit - Students learning manufacturing processes'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0011-1024x472.jpg',
          alt: 'PCB Power Visit - Technical demonstration session',
          caption: 'PCB Power Visit - Technical demonstration session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0013-1024x472.jpg',
          alt: 'PCB Power Visit - Group discussion with engineers',
          caption: 'PCB Power Visit - Group discussion with engineers'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0014-1024x472.jpg',
          alt: 'PCB Power Visit - PCB manufacturing line observation',
          caption: 'PCB Power Visit - PCB manufacturing line observation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0015-1024x473.jpg',
          alt: 'PCB Power Visit - Industrial automation systems',
          caption: 'PCB Power Visit - Industrial automation systems'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0020-766x1024.jpg',
          alt: 'PCB Power Visit - Students observing production process',
          caption: 'PCB Power Visit - Students observing production process'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0021-766x1024.jpg',
          alt: 'PCB Power Visit - Quality control demonstration',
          caption: 'PCB Power Visit - Quality control demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0022-1024x766.jpg',
          alt: 'PCB Power Visit - Company facility tour',
          caption: 'PCB Power Visit - Company facility tour'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0023-1024x766.jpg',
          alt: 'PCB Power Visit - Group photo at industrial facility',
          caption: 'PCB Power Visit - Group photo at industrial facility'
        }
      ]
    },
    {
      title: 'New Palanpur for New India 2.0',
      date: 'April 18, 2024',
      category: 'community',
      description: 'Students actively participated in the "New Palanpur for New India 2.0" initiative, contributing to community development and showcasing innovative projects for societal betterment.',
      tags: ['Community Service', 'Innovation Projects', 'Social Impact'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240418-WA0035-1024x768.jpg',
          alt: 'Community Project 1',
          caption: 'Community Project 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240418-WA0036-1024x768.jpg',
          alt: 'Community Project 2',
          caption: 'Community Project 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240418-WA0037-1024x768.jpg',
          alt: 'Innovation Display',
          caption: 'Innovation Display'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240418-WA0039-1024x768.jpg',
          alt: 'Student Presentation',
          caption: 'Student Presentation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240418-WA0040-1024x768.jpg',
          alt: 'Project Exhibition',
          caption: 'Project Exhibition'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240418-WA0045-1024x768.jpg',
          alt: 'Team Collaboration',
          caption: 'Team Collaboration'
        }
      ]
    },
    {
      title: 'Thalassemia Awareness Camp',
      date: 'April 19, 2024',
      category: 'awareness',
      description: 'Health awareness camp organized to educate students about Thalassemia, its prevention, and treatment options, conducted by medical professionals and health experts.',
      tags: ['Health Awareness', 'Medical Camp', 'Student Welfare'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240419-WA0009-1024x766.jpg',
          alt: 'Health Screening',
          caption: 'Health Screening'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240419-WA0012-1024x766.jpg',
          alt: 'Medical Consultation',
          caption: 'Medical Consultation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240419-WA0013-1024x766.jpg',
          alt: 'Awareness Session',
          caption: 'Awareness Session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240419-WA0017-1024x766.jpg',
          alt: 'Student Participation',
          caption: 'Student Participation'
        }
      ]
    },
    {
      title: 'Fire Safety Training',
      date: 'May 1, 2024',
      category: 'training',
      description: 'Essential fire safety awareness and training session conducted for all students and faculty members, covering emergency procedures and fire prevention techniques.',
      tags: ['Safety Training', 'Emergency Procedures', 'Fire Prevention'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240501-WA0011-1024x766.jpg',
          alt: 'Fire Safety Demo',
          caption: 'Safety Demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240501-WA0013-1024x766.jpg',
          alt: 'Extinguisher Training',
          caption: 'Extinguisher Training'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240501-WA0015-1024x766.jpg',
          alt: 'Safety Instructions',
          caption: 'Safety Instructions'
        }
      ]
    },
    {
      title: 'Orientation Program 2024',
      date: 'June 3, 2024',
      category: 'orientation',
      description: 'Comprehensive orientation program for newly admitted students, introducing them to department facilities, curriculum, and career opportunities in electronics and communication engineering.',
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0035-1024x766.jpg',
          alt: 'Orientation Program 2024 - Welcome session for new students',
          caption: 'Orientation Program 2024 - Welcome session for new students'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0037-1024x766.jpg',
          alt: 'Orientation Program 2024 - Department overview presentation',
          caption: 'Orientation Program 2024 - Department overview presentation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0038-1024x766.jpg',
          alt: 'Orientation Program 2024 - Student interaction session',
          caption: 'Orientation Program 2024 - Student interaction session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0040-1024x766.jpg',
          alt: 'Orientation Program 2024 - Faculty address to new students',
          caption: 'Orientation Program 2024 - Faculty address to new students'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0042-1024x766.jpg',
          alt: 'Orientation Program 2024 - Introduction to department facilities',
          caption: 'Orientation Program 2024 - Introduction to department facilities'
        }
      ]
    },
    {
      title: 'RTL Design Workshop',
      date: 'June 11, 2024',
      category: 'workshop',
      description: 'Comprehensive 3-day workshop on Register Transfer Level (RTL) design using Verilog HDL, covering digital system design, simulation, and synthesis for FPGA implementation.',
      tags: ['VLSI Design', 'RTL Programming', 'HDL', 'Circuit Synthesis'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0013-1024x459.jpg',
          alt: 'RTL Design Workshop - Introduction to Verilog HDL',
          caption: 'RTL Design Workshop - Introduction to Verilog HDL'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0030-1024x459.jpg',
          alt: 'RTL Design Workshop - Digital system design fundamentals',
          caption: 'RTL Design Workshop - Digital system design fundamentals'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0040-1024x459.jpg',
          alt: 'RTL Design Workshop - Circuit synthesis techniques',
          caption: 'RTL Design Workshop - Circuit synthesis techniques'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0043-1024x459.jpg',
          alt: 'RTL Design Workshop - FPGA implementation session',
          caption: 'RTL Design Workshop - FPGA implementation session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0048-1024x459.jpg',
          alt: 'RTL Design Workshop - Hands-on VLSI design practice',
          caption: 'RTL Design Workshop - Hands-on VLSI design practice'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0052-1024x459.jpg',
          alt: 'RTL Design Workshop - Simulation and verification',
          caption: 'RTL Design Workshop - Simulation and verification'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0055-1024x459.jpg',
          alt: 'RTL Design Workshop - Register Transfer Level programming',
          caption: 'RTL Design Workshop - Register Transfer Level programming'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0066-1024x459.jpg',
          alt: 'RTL Design Workshop - Advanced HDL concepts',
          caption: 'RTL Design Workshop - Advanced HDL concepts'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0067-1024x459.jpg',
          alt: 'RTL Design Workshop - Final presentation and evaluation',
          caption: 'RTL Design Workshop - Final presentation and evaluation'
        }
      ]
    }
  ],

  reflections: {
    principal: {
      name: 'Sureshkumar D Dabhi',
      designation: 'Principal, Government Polytechnic Palanpur',
      message: `Dear Students, Faculty, and Stakeholders,

It gives me immense pleasure to introduce this edition of "Spectrum," the newsletter of our Electronics & Communication Engineering Department. Our institution, established in 1984, has been a beacon of technical education in North Gujarat, consistently producing skilled professionals who contribute significantly to the industry and society.

The academic year 2023-24 has been remarkable for our EC department, with students excelling in competitions, faculty contributing to research, and our SSIP cell fostering innovation. Our focus remains on providing quality education that blends theoretical knowledge with practical skills, preparing our students for the dynamic world of technology.

I congratulate the entire EC department team for their dedication and encourage our students to continue their pursuit of excellence.`
    },
    hod: {
      name: 'Sunilkumar J Chauhan',
      designation: 'Head of Department - Electronics & Communication Engineering',
      message: `Dear EC Family,

The Electronics & Communication Engineering department continues to evolve with emerging technologies and industry demands. This year has been particularly significant as we've strengthened our curriculum with advanced topics in IoT, VLSI, and communication systems.

Our students have shown exceptional performance in various competitions, including the G3Q quiz where our team secured top positions. The department's research initiatives have gained momentum with faculty publications and student innovation projects receiving recognition.

As we look ahead, our commitment remains steadfast - to nurture competent engineers who can contribute meaningfully to the technological advancement of our nation. I extend my heartfelt appreciation to our dedicated faculty and motivated students for making this journey rewarding.`
    },
    editorial: {
      name: 'Editorial Team',
      designation: 'Ms. Mittal K. Pedhadiya & Mr. Milav J. Dabgar',
      message: `Dear Readers,

Welcome to this edition of "Spectrum" - a reflection of our department's vibrant academic and research activities. This newsletter showcases the remarkable achievements of our students and faculty, highlighting the innovation and excellence that define our Electronics & Communication Engineering department.

From successful placements to cutting-edge research projects, from industry collaborations to student competitions, every story in this newsletter represents our commitment to academic excellence and holistic development. We hope this edition inspires our readers and strengthens our community bonds.

Thank you for your continued support and encouragement.`
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
