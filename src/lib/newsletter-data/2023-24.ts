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
    { label: 'Highest Package (L)', value: 3.72, color: 'bg-orange-500' },
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
      person: 'Student Name',
      details: 'Micron Technology, Sanand - Manufacturing Associate, Package: ₹3.72L',
      date: '2024'
    },
    {
      category: 'placement' as const,
      title: 'TDSC Placement',
      description: 'Diploma Trainee Engineer position at TDSC, Becharaji',
      person: 'Student Name',
      details: 'TDSC, Becharaji - Diploma Trainee Engineer, Package: ₹3.00L',
      date: '2024'
    },
    // Higher Education (if any students pursued further studies)
    {
      category: 'higher-education' as const,
      title: 'Engineering College Admissions',
      description: 'Students admitted to degree engineering programs for higher education',
      date: '2024',
      details: 'Various Government and Private Engineering Colleges - B.E. in Electronics & Communication',
      achievements: [
        'Admission to Government Engineering Colleges',
        'Merit-based selection for degree programs',
        'Continuation of technical education journey'
      ]
    }
  ],
  
  events: [
    {
      title: 'Industrial Training at Duke Pipes',
      date: 'July 27, 2024',
      category: 'training',
      description: 'Industrial training program for students at Duke Pipes, providing practical exposure to manufacturing processes and industrial operations in the field of electronics and communication.',
      tags: ['Industrial Training', 'Manufacturing', 'Practical Exposure', 'Industry Visit'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20240727_145950-1024x577.jpg',
          alt: 'Industrial Training at Duke Pipes',
          caption: 'Industrial Training Session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20240727_145947-577x1024.jpg',
          alt: 'Students at Duke Pipes',
          caption: 'Students During Training'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20240727_144258-577x1024.jpg',
          alt: 'Manufacturing Process',
          caption: 'Manufacturing Process'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20240727_144231-1024x577.jpg',
          alt: 'Industrial Equipment',
          caption: 'Industrial Equipment'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20240727_144216-1024x577.jpg',
          alt: 'Factory Operations',
          caption: 'Factory Operations'
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
      title: 'Rakhi & Rangoli 2023',
      date: 'October 27, 2023',
      category: 'community',
      description: 'Cultural celebration of Rakhi and Rangoli festival showcasing student creativity and cultural heritage, promoting cultural values and artistic expression among students.',
      tags: ['Cultural Event', 'Festival Celebration', 'Student Creativity', 'Cultural Heritage'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231030-WA0001-1024x766.jpg',
          alt: 'Rakhi & Rangoli Celebration',
          caption: 'Cultural Celebration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231027-WA0004-1024x576.jpg',
          alt: 'Rangoli Competition',
          caption: 'Rangoli Art Competition'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231027-WA0005-1024x576.jpg',
          alt: 'Student Participation',
          caption: 'Student Participation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230829-WA0012-766x1024.jpg',
          alt: 'Festival Activities',
          caption: 'Festival Activities'
        }
      ]
    },
    {
      title: 'Orientation Session (2023)',
      date: 'July 18, 2023',
      category: 'orientation',
      description: 'Comprehensive orientation program for newly admitted students in 2023, introducing them to department facilities, curriculum, faculty, and career opportunities in electronics and communication engineering.',
      tags: ['Orientation', 'New Students', 'Department Introduction', 'Academic Program'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0035-1024x462.jpg',
          alt: 'Orientation Session 2023',
          caption: 'Orientation Program 2023'
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
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0048-1024x459.jpg',
          alt: 'RTL Workshop Session 3',
          caption: 'Workshop Session 3'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240611-WA0055-1024x459.jpg',
          alt: 'RTL Workshop Session 4',
          caption: 'Workshop Session 4'
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
          alt: 'Orientation Welcome',
          caption: 'Welcome Session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0037-1024x766.jpg',
          alt: 'Orientation Session',
          caption: 'Department Overview'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0038-1024x766.jpg',
          alt: 'Student Interaction',
          caption: 'Student Interaction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240603-WA0040-1024x766.jpg',
          alt: 'Faculty Address',
          caption: 'Faculty Address'
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
      title: 'GPP Sportsweek Inauguration',
      date: 'February 2024',
      category: 'community',
      description: 'Annual sports week celebration featuring various competitive events, promoting physical fitness and team spirit among students across all departments. The week-long event included multiple sports competitions and encouraged healthy competition.',
      tags: ['Sports Week', 'Physical Fitness', 'Team Spirit', 'Competition'],
      images: []
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
          alt: 'PCB Manufacturing Line',
          caption: 'PCB Manufacturing Line'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0008-1024x472.jpg',
          alt: 'Industrial Equipment',
          caption: 'Industrial Equipment'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0009-1024x472.jpg',
          alt: 'Students Learning',
          caption: 'Students Learning'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0011-1024x472.jpg',
          alt: 'Technical Demonstration',
          caption: 'Technical Demonstration'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0013-1024x472.jpg',
          alt: 'Group Discussion',
          caption: 'Group Discussion'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0022-1024x766.jpg',
          alt: 'Company Visit',
          caption: 'Company Visit'
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
          alt: 'Expert Session Opening',
          caption: 'Session Opening'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0005-1024x459.jpg',
          alt: 'Industry Expert Speaking',
          caption: 'Industry Expert'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0008-1024x459.jpg',
          alt: 'Technical Presentation',
          caption: 'Technical Presentation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0010-1024x459.jpg',
          alt: 'Student Engagement',
          caption: 'Student Engagement'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0021-1024x766.jpg',
          alt: 'Hands-on Session',
          caption: 'Hands-on Session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240314-WA0035-1024x766.jpg',
          alt: 'Group Photo',
          caption: 'Group Photo'
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
          alt: 'IIT Bombay Campus',
          caption: 'IIT Bombay Campus'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20231109_154913-1024x768.jpg',
          alt: 'SEMIX Training Session',
          caption: 'SEMIX Training Session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231108-WA0004.jpg',
          alt: 'Lab Visit',
          caption: 'Lab Visit'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231109-WA0010.jpg',
          alt: 'Technical Discussion',
          caption: 'Technical Discussion'
        }
      ]
    },
    {
      title: 'Cultural Activities - Rakhi & Rangoli Competition',
      date: 'October 27, 2023',
      category: 'community',
      description: 'Student participation in traditional cultural activities including Rakhi making and Rangoli competitions, fostering creativity and cultural awareness among students.',
      tags: ['Cultural Activities', 'Rakhi Making', 'Rangoli Competition', 'Creativity'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230829-WA0012-766x1024.jpg',
          alt: 'Rakhi Making',
          caption: 'Rakhi Making'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231027-WA0003-1024x576.jpg',
          alt: 'Rangoli Competition',
          caption: 'Rangoli Competition'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231027-WA0005-1024x576.jpg',
          alt: 'Cultural Event',
          caption: 'Cultural Event'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20231030-WA0001-1024x766.jpg',
          alt: 'Award Ceremony',
          caption: 'Award Ceremony'
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
      title: 'SEMICON 2023 Exhibition',
      date: 'September 27, 2023',
      category: 'visit',
      description: 'Students attended SEMICON 2023, India\'s premier semiconductor and electronics exhibition, gaining exposure to latest technologies and industry trends in semiconductor manufacturing.',
      tags: ['Semiconductor Exhibition', 'Technology Trends', 'Industry Exposure', 'SEMICON'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_071846-1024x577.jpg',
          alt: 'SEMICON Exhibition',
          caption: 'SEMICON Exhibition'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_113120-1024x577.jpg',
          alt: 'Technology Display',
          caption: 'Technology Display'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_115436-1024x768.jpg',
          alt: 'Industry Interaction',
          caption: 'Industry Interaction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230727_115958-768x1024.jpg',
          alt: 'Student Learning',
          caption: 'Student Learning'
        }
      ]
    },
    {
      title: 'SSIP 2.0 Appreciation Meet',
      date: 'August 14, 2023',
      category: 'community',
      description: 'Recognition ceremony for students and faculty involved in Student Startup and Innovation Policy (SSIP) initiatives, celebrating entrepreneurial achievements and innovative projects.',
      tags: ['SSIP', 'Innovation', 'Startup', 'Recognition'],
      images: []
    },
    {
      title: 'Industrial Visit: Bajrang Paper Products',
      date: 'August 1, 2023',
      category: 'visit',
      description: '50 students from EC and ICT departments visited Bajrang Paper Products, Palanpur, observing paper manufacturing processes and industrial automation systems.',
      tags: ['Industrial Visit', 'Manufacturing Process', 'Automation', 'Paper Industry'],
      images: []
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
          alt: 'IPR Session 1',
          caption: 'IPR Session 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_142951-1024x768.jpg',
          alt: 'School Visit',
          caption: 'School Visit'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_143414-768x1024.jpg',
          alt: 'Student Teaching',
          caption: 'Student Teaching'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230726_143757-1024x768.jpg',
          alt: 'Knowledge Sharing',
          caption: 'Knowledge Sharing'
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
          alt: 'Tree Planting Activity',
          caption: 'Tree Planting Activity'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/20230719_142939-1024x577.jpg',
          alt: 'Environmental Drive',
          caption: 'Environmental Drive'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0005-1024x768.jpg',
          alt: 'Green Initiative',
          caption: 'Green Initiative'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0009-1024x768.jpg',
          alt: 'Student Participation',
          caption: 'Student Participation'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0012-1024x768.jpg',
          alt: 'Campus Greening',
          caption: 'Campus Greening'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230719-WA0016-1024x768.jpg',
          alt: 'Tree Plantation Team',
          caption: 'Tree Plantation Team'
        }
      ]
    },
    {
      title: 'Orientation Session 2023',
      date: 'July 18, 2023',
      category: 'orientation',
      description: 'Comprehensive orientation program for incoming students, introducing department facilities, academic programs, and career opportunities in electronics and communication engineering.',
      tags: ['Orientation', 'New Students', 'Academic Programs', 'Career Guidance'],
      images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0008-1024x766.jpg',
          alt: 'Welcome Session',
          caption: 'Welcome Session'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0015-1024x766.jpg',
          alt: 'Faculty Introduction',
          caption: 'Faculty Introduction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0020-1024x766.jpg',
          alt: 'Department Overview',
          caption: 'Department Overview'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0025-1024x766.jpg',
          alt: 'Student Interaction',
          caption: 'Student Interaction'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0032-1024x462.jpg',
          alt: 'Campus Tour',
          caption: 'Campus Tour'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20230718-WA0035-1024x462.jpg',
          alt: 'Group Photo',
          caption: 'Group Photo'
        }
      ]
    }
  ],

  messages: {
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
  
  vision: "To be a premier department of Electronics & Communication Engineering, recognized for excellence in technical education, innovation, and research, contributing to the technological advancement of society.",
  
  mission: "To provide quality technical education in Electronics & Communication Engineering, foster innovation and research, develop industry-ready professionals, and contribute to the socio-economic development of the region through knowledge creation and dissemination.",
  
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
  
  contact: {
    email: 'gppec11@gmail.com',
    phone: '02742-245219',
    address: 'Opp. Malan Darwaja, Ambaji Road, Palanpur - 385001, Gujarat',
    website: 'ec.gppalanpur.in'
  }
};
