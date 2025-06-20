// Newsletter Data for Academic Year 2022-23
// Electronics & Communication Engineering Department
// Government Polytechnic Palanpur

import { NewsletterData } from '../newsletter-data';

export const newsletterData2022_23: NewsletterData = {
  stats: [
    { label: 'Students Placed', value: 12, color: 'bg-blue-500' },
    { label: 'Higher Education', value: 5, color: 'bg-green-500' },
    { label: 'Faculty Publications', value: 4, color: 'bg-purple-500' },
    { label: 'Expert Lectures', value: 8, color: 'bg-orange-500' },
  ],
  essence: {
    vision: "To be a center of excellence in Electronics and Communication Engineering education, fostering innovation, research, and industry collaboration to produce globally competent professionals.",
    mission: "To provide quality technical education through modern teaching methodologies, state-of-the-art laboratories, and industry partnerships, enabling students to excel in their careers and contribute to society's technological advancement."
  },
  spotlight: [
    {
      category: 'faculty-contribution',
      title: 'Research Excellence Award',
      description: 'Faculty member recognized for outstanding contribution in antenna design research',
      person: 'Dr. K. M. Patel',
      designation: 'Senior Lecturer',
      details: 'IEEE Gujarat Section Best Faculty Award 2022',
      date: 'March 2023'
    },
    {
      category: 'student-achievement',
      title: 'National Level Project Competition Winner',
      description: 'First place in Smart India Hackathon 2022',
      person: 'Raj Patel',
      studentId: '206260311015',
      details: 'IoT-based Smart Agriculture System',
      date: 'September 2022'
    },
    {
      category: 'placement',
      title: 'Record Placement Achievement',
      description: 'Highest package secured by department student',
      person: 'Amit Shah',
      studentId: '206260311003',
      details: 'TCS - Rs. 4.2 LPA',
      date: 'February 2023'
    },
    {
      category: 'higher-education',
      title: 'Admission to Premier Institute',
      description: 'Student secured admission in top engineering college',
      person: 'Priya Sharma',
      studentId: '206260311028',
      details: 'NIT Surat - M.Tech in VLSI Design',
      date: 'June 2023'
    }
  ],
  chronicles: [
    {
      title: 'Orientation Program 2022',
      date: 'July 12, 2022',
      category: 'orientation',
      description: 'Comprehensive orientation for new students focusing on hybrid learning model, department facilities, and emerging career opportunities in electronics and communication sector.',
      tags: ['Orientation', 'New Students', 'Hybrid Learning', 'Career Guidance'],
      images: [
        {
          src: '/newsletters/2022-23/orientation-welcome.jpg',
          alt: 'Welcome ceremony for new students',
          caption: 'New students being welcomed to EC Department'
        },
        {
          src: '/newsletters/2022-23/orientation-session.jpg',
          alt: 'Orientation session in progress',
          caption: 'Interactive session about course curriculum and opportunities'
        }
      ]
    },
    {
      title: 'Industrial Visit to BSNL Exchange',
      date: 'August 28, 2022',
      category: 'visit',
      description: 'Educational visit to understand telecommunication infrastructure, switching systems, and network management in real-world telecom operations.',
      tags: ['Industrial Visit', 'Telecommunications', 'Network Systems', 'Practical Learning'],
      images: [
        {
          src: '/newsletters/2022-23/bsnl-visit-group.jpg',
          alt: 'Students at BSNL exchange facility',
          caption: 'Students exploring telecommunication equipment at BSNL exchange'
        },
        {
          src: '/newsletters/2022-23/bsnl-switching-room.jpg',
          alt: 'Digital switching equipment demonstration',
          caption: 'Technical explanation of digital switching systems'
        }
      ]
    },
    {
      title: 'Expert Lecture on 5G Technology',
      date: 'September 15, 2022',
      category: 'workshop',
      description: 'Comprehensive session on 5G technology fundamentals, implementation challenges, and future prospects in Indian telecom sector.',
      tags: ['5G Technology', 'Expert Lecture', 'Future Technology', 'Wireless Communication'],
      images: [
        {
          src: '/newsletters/2022-23/5g-lecture-hall.jpg',
          alt: '5G technology expert lecture',
          caption: 'Industry expert explaining 5G network architecture'
        },
        {
          src: '/newsletters/2022-23/5g-demo.jpg',
          alt: '5G technology demonstration',
          caption: 'Live demonstration of 5G capabilities and applications'
        }
      ]
    },
    {
      title: 'Technical Paper Presentation Competition',
      date: 'October 20, 2022',
      category: 'workshop',
      description: 'Inter-departmental competition encouraging students to present research papers on emerging technologies in electronics and communication.',
      tags: ['Technical Papers', 'Competition', 'Research', 'Presentation Skills'],
      images: [
        {
          src: '/newsletters/2022-23/paper-presentation.jpg',
          alt: 'Student presenting technical paper',
          caption: 'Student presenting research on IoT applications'
        },
        {
          src: '/newsletters/2022-23/judges-panel.jpg',
          alt: 'Expert judges evaluating presentations',
          caption: 'Panel of industry experts evaluating student presentations'
        }
      ]
    },
    {
      title: 'Diwali Celebration',
      date: 'November 2, 2022',
      category: 'community',
      description: 'Festive celebration bringing together faculty and students, featuring cultural performances, traditional decorations, and community bonding activities.',
      tags: ['Festival', 'Cultural Celebration', 'Community Bonding', 'Traditional Events'],
      images: [
        {
          src: '/newsletters/2022-23/diwali-decoration.jpg',
          alt: 'Beautiful Diwali decorations',
          caption: 'Traditional rangoli and lighting decorations'
        },
        {
          src: '/newsletters/2022-23/diwali-celebration.jpg',
          alt: 'Faculty and students celebrating together',
          caption: 'Faculty and students sharing festive moments'
        }
      ]
    },
    {
      title: 'Digital Communication Workshop',
      date: 'December 8, 2022',
      category: 'training',
      description: 'Hands-on workshop covering advanced digital communication techniques, error correction codes, and modern modulation schemes.',
      tags: ['Digital Communication', 'Workshop', 'Hands-on Training', 'Technical Skills'],
      images: [
        {
          src: '/newsletters/2022-23/digital-comm-lab.jpg',
          alt: 'Students working on digital communication experiments',
          caption: 'Practical session on digital modulation techniques'
        },
        {
          src: '/newsletters/2022-23/digital-comm-demo.jpg',
          alt: 'Faculty demonstrating communication concepts',
          caption: 'Faculty explaining error correction coding principles'
        }
      ]
    },
    {
      title: 'Industry-Academia Interface Program',
      date: 'January 25, 2023',
      category: 'workshop',
      description: 'Collaborative session with industry partners discussing current market trends, skill requirements, and career opportunities in electronics sector.',
      tags: ['Industry Interaction', 'Career Guidance', 'Skill Development', 'Market Trends'],
      images: [
        {
          src: '/newsletters/2022-23/industry-session.jpg',
          alt: 'Industry professionals interacting with students',
          caption: 'Industry experts sharing insights on career opportunities'
        },
        {
          src: '/newsletters/2022-23/networking-session.jpg',
          alt: 'Students networking with industry professionals',
          caption: 'Students engaging in networking opportunities'
        }
      ]
    },
    {
      title: 'Women in Engineering Awareness Program',
      date: 'March 8, 2023',
      category: 'awareness',
      description: 'Special program highlighting achievements of women engineers and encouraging female students to pursue advanced careers in technology.',
      tags: ['Women Engineers', 'Gender Equality', 'Inspiration', 'Career Motivation'],
      images: [
        {
          src: '/newsletters/2022-23/women-engineers-panel.jpg',
          alt: 'Panel of successful women engineers',
          caption: 'Inspiring panel of women engineers sharing their experiences'
        },
        {
          src: '/newsletters/2022-23/female-students-interaction.jpg',
          alt: 'Female students interacting with role models',
          caption: 'Female students engaging with successful women engineers'
        }
      ]
    }
  ],
  canvas: [
    {
      title: "Internet of Things: Revolutionizing Connectivity",
      author: "Dr. S. R. Patel",
      designation: "Head of Department, EC",
      content: "The Internet of Things (IoT) is transforming how we interact with the world around us. From smart homes to industrial automation, IoT is creating an interconnected ecosystem where devices communicate seamlessly. As EC engineers, understanding IoT protocols, sensor networks, and data analytics is crucial for future innovations. Our department is pioneering IoT research through student projects and industry collaborations.",
      date: "November 2022",
      type: "tech-news",
      authorType: "faculty"
    },
    {
      title: "Machine Learning in Signal Processing",
      author: "Mr. A. K. Sharma",
      designation: "Lecturer, EC Department",
      content: "The convergence of machine learning and signal processing is opening new frontiers in communication systems. From adaptive filtering to intelligent antenna systems, ML algorithms are enhancing traditional signal processing techniques. Students should explore Python libraries like TensorFlow and PyTorch alongside MATLAB to stay ahead in this evolving field.",
      date: "October 2022",
      type: "innovation",
      authorType: "faculty"
    },
    {
      title: "My Research Journey in VLSI Design",
      author: "Kavya Patel",
      studentId: "206260311018",
      semester: "6th Semester",
      content: "VLSI design has always fascinated me due to its intricate nature and wide applications. During my project work, I designed a low-power operational amplifier using Cadence tools. The experience taught me the importance of precision in circuit design and the challenges of optimizing for multiple parameters. I'm grateful for the guidance from faculty and the excellent lab facilities that made this possible.",
      date: "January 2023",
      type: "project",
      authorType: "student"
    },
    {
      title: "Sustainable Electronics: Green Technology",
      author: "Dr. M. J. Patel",
      designation: "Senior Lecturer, EC Department",
      content: "As environmental concerns grow, the electronics industry is embracing sustainable practices. From biodegradable PCBs to energy-efficient designs, green electronics is becoming a necessity. Our department is incorporating sustainability concepts in curriculum design, encouraging students to consider environmental impact in their projects and future careers.",
      date: "December 2022",
      type: "article",
      authorType: "faculty"
    },
    {
      title: "Placement Success Story",
      author: "Rohit Shah",
      studentId: "206260311025",
      semester: "6th Semester",
      content: "Getting placed at Infosys was a dream come true. The journey wasn't easy, but the continuous support from our faculty, especially in aptitude and technical preparation, made all the difference. The mock interviews and industry interactions organized by our department built my confidence. I encourage my juniors to actively participate in all department activities and maintain consistency in their studies.",
      date: "March 2023",
      type: "experience",
      authorType: "student"
    },
    {
      title: "Quantum Computing: The Next Frontier",
      author: "Mr. R. K. Patel",
      designation: "Assistant Professor, EC Department",
      content: "Quantum computing represents a paradigm shift in computational capabilities. While still in early stages, quantum algorithms show promise for solving complex problems in cryptography, optimization, and simulation. EC engineers should familiarize themselves with quantum principles as they will likely impact future communication and computing systems.",
      date: "February 2023",
      type: "research",
      authorType: "faculty"
    }
  ],
  reflections: {
    principal: {
      name: "Dr. P. R. Patel",
      designation: "Principal, Government Polytechnic Palanpur",
      message: "The academic year 2022-23 has been remarkable for our Electronics and Communication Engineering department. Despite challenges, our students and faculty have shown exceptional resilience and adaptability. The increasing industry collaborations, successful placements, and research achievements reflect our commitment to excellence. I congratulate the entire EC department for their outstanding contributions and encourage continued innovation in teaching and learning."
    },
    hod: {
      name: "Dr. S. R. Patel",
      designation: "Head of Department, Electronics & Communication Engineering",
      message: "This year has been transformative for our department with significant achievements in student placements, faculty development, and research initiatives. Our focus on practical learning through industry visits, expert lectures, and hands-on workshops has prepared our students for real-world challenges. I'm proud of our faculty's dedication and students' enthusiasm in embracing new technologies and maintaining academic excellence."
    },
    editorial: {
      name: "Newsletter Editorial Team",
      designation: "EC Department",
      message: "We are delighted to present the annual newsletter showcasing the vibrant activities and achievements of our department during 2022-23. This publication reflects the collective efforts of our students, faculty, and staff in creating a dynamic learning environment. We thank everyone who contributed to making this year successful and look forward to continued growth and innovation in the coming years."
    }
  },
  logos: [
    {
      src: '/logos/gpp-logo.png',
      alt: 'Government Polytechnic Palanpur Logo'
    },
    {
      src: '/logos/gte-logo.png',
      alt: 'Gujarat Technological University Logo'
    }
  ],
  reachout: {
    email: 'ecgpp@gmail.com',
    phone: '+91-2742-252000',
    address: 'Government Polytechnic Palanpur, Highway, Palanpur - 385001, Gujarat, India',
    website: 'https://gpp.edu.in'
  }
};