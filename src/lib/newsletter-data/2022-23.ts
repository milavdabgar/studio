// Newsletter Data for Academic Year 2022-23
// Electronics & Communication Engineering Department
// Government Polytechnic Palanpur

import { NewsletterData } from '../newsletter-data';

export const newsletterData2022_23: NewsletterData = {
  stats: [
    { label: 'Students Placed', value: 0, color: 'bg-blue-500' },
    { label: 'Higher Education', value: 2, color: 'bg-green-500' },
    { label: 'Faculty Publications', value: 4, color: 'bg-purple-500' },
    { label: 'Expert Lectures', value: 5, color: 'bg-orange-500' },
  ],
  
  essence: {
    vision: "To be a center of excellence in Electronics and Communication Engineering education, fostering innovation, research, and industry collaboration to produce globally competent professionals.",
    mission: "To provide quality technical education through modern teaching methodologies, state-of-the-art laboratories, and industry partnerships, enabling students to excel in their careers and contribute to society's technological advancement."
  },
  
  spotlight: [
    {
      category: 'faculty-contribution' as const,
      title: 'Research Excellence Award',
      description: 'Faculty member recognized for outstanding contribution in antenna design research',
      person: 'Dr. K. M. Patel',
      designation: 'Senior Lecturer',
      details: 'IEEE Gujarat Section Best Faculty Award 2022',
      date: 'March 2023',
      achievements: [
        'IEEE Gujarat Section Best Faculty Award recipient',
        'Outstanding contribution in antenna design research',
        'Academic excellence and research leadership',
        'Mentorship and guidance to students'
      ]
    },
    {
      category: 'student-achievement' as const,
      title: 'National Level Project Competition Winner',
      description: 'First place in Smart India Hackathon 2022',
      person: 'Raj Patel',
      studentId: '206260311015',
      details: 'IoT-based Smart Agriculture System',
      date: 'September 2022',
      achievements: [
        'First place in Smart India Hackathon 2022',
        'IoT-based Smart Agriculture System development',
        'Innovation in agricultural technology',
        'National level recognition for technical excellence'
      ]
    },
    {
      category: 'higher-education' as const,
      title: 'Government Engineering College Gandhinagar Admission',
      description: 'Student secured admission to premier government engineering college',
      person: 'Piyushbhai Chaudhary',
      studentId: '206260311502',
      details: 'Government Engineering College, Gandhinagar - B.E. in Electronics & Communication Engineering',
      date: '2023',
      achievements: [
        'Admission to Government Engineering College, Gandhinagar',
        'Pursuing B.E. in Electronics & Communication Engineering',
        'Merit-based selection for degree program',
        'Continuation of technical education journey'
      ]
    },
    {
      category: 'higher-education' as const,
      title: 'LD College of Engineering Admission',
      description: 'Student admitted to prestigious LD College of Engineering, Ahmedabad',
      person: 'Adarsh Chaudhary',
      studentId: '206260311501',
      details: 'LD College of Engineering, Ahmedabad - B.E. in Electronics & Communication Engineering',
      date: '2023',
      achievements: [
        'Admission to LD College of Engineering, Ahmedabad',
        'Pursuing B.E. in Electronics & Communication Engineering',
        'Merit-based selection through ACPC',
        'Academic excellence and career advancement'
      ]
    },
    {
      category: 'star-performer' as const,
      title: 'Academic Excellence Recognition',
      description: 'Outstanding academic performance by students across all semesters',
      date: '2022-23',
      achievements: [
        'Semester toppers with excellent CGPA performance',
        'Consistent academic improvement across batches',
        'Subject-wise excellence in core engineering disciplines',
        'Overall departmental academic achievement'
      ]
    }
  ],
  
  chronicles: [
    {
      title: 'Expert Talk: Importance of Communication in Industries',
      date: 'August 9, 2022',
      category: 'workshop',
      description: 'Expert session conducted by Mr. Jaimin Rami, Station Controller at JMR Ahmedabad, focusing on effective communication skills essential for engineering professionals, including workplace interactions, presentations, and teamwork strategies.',
      tags: ['Expert Session', 'Communication Skills', 'Professional Development', 'Industry Insights'],
      images: []
    },
    {
      title: 'Industrial Visit: Bajrang Paper Products',
      date: 'September 21, 2022',
      category: 'visit',
      description: '23 students from 1st semester EC department visited Bajrang Paper Products, Palanpur, to observe paper manufacturing processes and industrial automation systems.',
      tags: ['Industrial Visit', 'Manufacturing Process', 'Paper Industry', 'Practical Learning'],
      images: []
    },
    {
      title: 'Expert Session on Cyber Security',
      date: 'March 31, 2023',
      category: 'workshop',
      description: 'Comprehensive session conducted by Mr. Sagar Hajare, Security Expert at Bank of America, with 35 participants. Students learned about cyber threats, ethical hacking, and preventive measures against cyber-attacks through real-world case studies.',
      tags: ['Cyber Security', 'Expert Session', 'Ethical Hacking', 'Information Security'],
      images: []
    },
    {
      title: 'Industrial Visit: Samsung Service Centre',
      date: 'May 4, 2023',
      category: 'visit',
      description: '39 students from 2nd semester EC department visited Samsung Service Centre, Palanpur, gaining practical exposure to consumer electronics servicing, troubleshooting techniques, and customer service operations.',
      tags: ['Industrial Visit', 'Consumer Electronics', 'Service Operations', 'Troubleshooting'],
      images: []
    },
    {
      title: 'Industrial Visit: Community Radio Station',
      date: 'May 10, 2023',
      category: 'visit',
      description: '11 students from 4th semester EC department visited Community Radio Station, Palanpur, to understand radio broadcasting operations, transmission systems, and community engagement through radio programming.',
      tags: ['Industrial Visit', 'Radio Broadcasting', 'Transmission Systems', 'Community Radio'],
      images: []
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