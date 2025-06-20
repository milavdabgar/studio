// Newsletter Data for Academic Year 2022-23
// Electronics & Communication Engineering Department
// Government Polytechnic Palanpur

import { NewsletterData } from '../newsletter-data';

export const newsletterData2022_23: NewsletterData = {
  stats: [
    { label: 'Placement Rate', value: 58, color: 'bg-blue-500' },
    { label: 'Conference Papers', value: 1, color: 'bg-green-500' },
    { label: 'Students Placed', value: 4, color: 'bg-purple-500' },
    { label: 'Highest Package (L)', value: 3.2, color: 'bg-orange-500' },
  ],
  
  canvas: [
    {
      title: "IoT Revolution in Electronics Engineering",
      author: "Prof. Sunilkumar J Chauhan",
      designation: "Head of Department, EC Engineering",
      content: "The Internet of Things is transforming how we design and implement electronic systems. From smart homes to industrial automation, IoT applications are creating new opportunities for EC engineers. Our students are working on innovative IoT projects including agricultural monitoring systems and smart healthcare solutions.",
      date: "February 2023",
      type: "tech-news",
      authorType: "faculty"
    },
    {
      title: "Machine Learning in Signal Processing",
      author: "Ms. Mittal K. Pedhadiya",
      designation: "Lecturer, EC Department",
      content: "The integration of machine learning algorithms with digital signal processing is opening new frontiers in communications, image processing, and audio systems. Recent developments in neural networks for signal denoising and pattern recognition are particularly promising for our field.",
      date: "December 2022",
      type: "innovation",
      authorType: "faculty"
    },
    {
      title: "My Smart Healthcare Project Journey",
      author: "Krish Modi",
      studentId: "GJPO765432",
      semester: "6th Semester",
      content: "Developing a smart healthcare monitoring system has been an incredible learning experience. Using Arduino, sensors, and IoT connectivity, we created a system that monitors vital signs and sends alerts to healthcare providers. Winning the state-level competition boosted my confidence in pursuing innovation.",
      date: "March 2023",
      type: "project",
      authorType: "student"
    },
    {
      title: "Quantum Computing and Electronics",
      author: "Mr. Milav J. Dabgar",
      designation: "Lecturer, EC Department",
      content: "Quantum computing represents the next paradigm shift in computing technology. Understanding quantum principles and their applications in electronics will be crucial for future engineers. The development of quantum processors and quantum communication systems offers exciting research opportunities.",
      date: "January 2023",
      type: "research",
      authorType: "faculty"
    },
    {
      title: "The Circuit's Song",
      author: "Harsh Trivedi",
      studentId: "GJK0876543",
      semester: "4th Semester",
      content: "Electrons flow like rivers of light,\nThrough pathways etched in silicon bright,\nEach component plays its vital part,\nIn the symphony of electronic art.\n\nFrom simple gates to complex design,\nWhere logic meets the divine,\nWe learn to build tomorrow's dreams,\nWith circuits, codes, and engineering schemes.",
      date: "November 2022",
      type: "poem",
      authorType: "student"
    },
    {
      title: "Edge Computing in Electronics",
      author: "Faculty Contributor",
      designation: "EC Department",
      content: "Edge computing is bringing processing power closer to data sources, reducing latency and improving efficiency. This technology is particularly relevant for real-time applications in autonomous vehicles, industrial IoT, and smart cities. EC engineers need to understand both the hardware and software aspects of edge computing.",
      date: "October 2022",
      type: "tech-news",
      authorType: "faculty"
    }
  ],

  spotlight: [
    // Faculty Contributions
    {
      category: "faculty-contribution" as const,
      title: "Department Head Leadership",
      description: "Prof. Sunilkumar J Chauhan's administrative and research contributions",
      person: "Prof. Sunilkumar J Chauhan",
      designation: "Head of Department, EC Engineering",
      details: "Head of Department - Research Leadership & Academic Administration",
      date: "2022-23",
      achievements: [
        "Research paper on VLSI Design Optimization at National Conference on Advanced Electronics",
        "GTU Board of Studies member for EC curriculum development",
        "Department strategic planning and infrastructure development",
        "Industry-academia collaboration coordinator"
      ]
    },
    {
      category: "faculty-contribution" as const,
      title: "Digital Signal Processing Research",
      description: "Ms. Mittal K. Pedhadiya's advanced certification and research work",
      person: "Ms. Mittal K. Pedhadiya",
      designation: "Lecturer, EC Department",
      details: "Advanced DSP Research - IIT Bombay Certification Program",
      date: "2022-23",
      achievements: [
        "Advanced certification in Digital Signal Processing from IIT Bombay",
        "Published research paper on adaptive filtering techniques",
        "Student project mentor for signal processing applications",
        "Faculty coordinator for technical symposiums"
      ]
    },
    {
      category: "faculty-contribution" as const,
      title: "5G Antenna Design Research",
      description: "Mr. Milav J. Dabgar's PhD research and academic contributions",
      person: "Mr. Milav J. Dabgar",
      designation: "Lecturer, EC Department",
      details: "PhD Research Scholar - 5G Antenna Design & Wireless Communication",
      date: "2022-23",
      achievements: [
        "PhD coursework completion in Antenna Design for 5G Applications",
        "Research supervision for final year student projects",
        "SSIP coordinator for student innovation projects", 
        "Expert lecture series organizer on emerging technologies"
      ]
    },
    // Student Achievements
    {
      category: "student-achievement" as const,
      title: "Gujarat Gyan Guru Quiz Winner",
      description: "Student won Gujarat Gyan Guru Quiz (G3Q) 1.0",
      person: "Patel Niravkumar Jitendrabhai",
      studentId: "GJR1345678",
      details: "Gujarat Gyan Guru Quiz (G3Q) 1.0 Week 8 - College Category Winner",
      date: "2022",
      achievements: [
        "Winner in Gujarat Gyan Guru Quiz (G3Q) 1.0 Week 8, College Category",
        "Represented college at state level competition"
      ]
    },
    {
      category: "student-achievement" as const,
      title: "State Level Project Competition",
      description: "First prize in State Level Project Competition on Smart Healthcare Systems",
      person: "Modi Krish Bharatkumar",
      studentId: "GJPO765432",
      details: "State Level Project Competition - Smart Healthcare Systems (First Prize)",
      date: "2023",
      achievements: [
        "First prize in State Level Project Competition on Smart Healthcare Systems",
        "SSIP 2.0 funding received for IoT-based Agricultural Monitoring System",
        "Innovation team leadership and project management"
      ]
    },
    {
      category: "student-achievement" as const,
      title: "Inter-college Electronics Quiz Winner",
      description: "Winner in Inter-college Electronics Quiz Competition",
      person: "Trivedi Harsh Rameshbhai",
      studentId: "GJK0876543",
      details: "SVNIT Inter-college Electronics Quiz Competition - Winner",
      date: "2022",
      achievements: [
        "Winner in Inter-college Electronics Quiz Competition organized by SVNIT",
        "Outstanding performance in electronics fundamentals and applications"
      ]
    },
    // Placements
    {
      category: "placement" as const,
      title: "Tata Electronics Placement",
      description: "Student placed at Tata Electronics with highest package",
      person: "Solanki Rajeshkumar Pravinbhai",
      studentId: "196260311002",
      details: "Tata Electronics, Pune - Associate Engineer - ₹3.2L annual salary",
      date: "2023"
    },
    {
      category: "placement" as const,
      title: "HCL Technologies Placement",
      description: "Student placed at HCL Technologies",
      person: "Patel Divyaben Nareshkumar",
      studentId: "196260311004",
      details: "HCL Technologies, Noida - Software Trainee - ₹2.8L annual salary",
      date: "2023"
    },
    {
      category: "placement" as const,
      title: "Mahindra Tech Placement",
      description: "Student placed at Mahindra Tech",
      person: "Joshi Kiran Jagdishbhai",
      studentId: "196260311008",
      details: "Mahindra Tech, Chennai - Junior Engineer - ₹2.6L annual salary",
      date: "2023"
    },
    // Higher Education
    {
      category: "higher-education" as const,
      title: "NIT Surat Admission",
      description: "Student admitted to NIT Surat for B.E.",
      person: "Sharma Ankitkumar Rajesh",
      studentId: "196260311010",
      details: "NIT Surat - B.E. (Admission Year: 2023)",
      date: "2023"
    }
  ],
  
  events: [
    {
      title: 'Orientation Program 2022',
      date: 'July 12, 2022',
      category: 'orientation',
      description: 'Comprehensive orientation for new students focusing on hybrid learning model, department facilities, and emerging career opportunities in electronics and communication sector.',
      tags: ['Orientation', 'New Students', 'Hybrid Learning', 'Career Guidance'],
      images: []
    },
    {
      title: 'Expert Session on 5G Technology',
      date: 'August 15, 2022',
      category: 'workshop',
      description: 'Technical session by Dr. Rajesh Kumar from Qualcomm India on 5G technology, covering network architecture, applications, and implementation challenges.',
      tags: ['5G Technology', 'Network Architecture', 'Industry Expert', 'Telecommunications'],
      images: []
    },
    {
      title: 'Arduino Workshop for Beginners',
      date: 'September 20, 2022',
      category: 'workshop',
      description: 'Hands-on workshop on Arduino programming and interfacing, covering basic to intermediate projects for embedded system development.',
      tags: ['Arduino', 'Embedded Systems', 'Programming', 'Hands-on Learning'],
      images: []
    },
    {
      title: 'Industrial Visit - Bharti Airtel, Gandhinagar',
      date: 'October 8, 2022',
      category: 'visit',
      description: '35 students visited Bharti Airtel switching center in Gandhinagar, observing modern telecommunication infrastructure and network management systems.',
      tags: ['Industrial Visit', 'Telecommunications', 'Network Management', 'Bharti Airtel'],
      images: []
    },
    {
      title: 'Diwali Celebration & Cultural Event',
      date: 'October 24, 2022',
      category: 'community',
      description: 'Traditional Diwali celebration with cultural programs, rangoli competition, and community bonding activities organized by student council.',
      tags: ['Cultural Event', 'Diwali Celebration', 'Rangoli Competition', 'Community Bonding'],
      images: []
    },
    {
      title: 'National Education Day Celebration',
      date: 'November 11, 2022',
      category: 'community',
      description: 'Special programs organized to commemorate National Education Day, including seminars on modern education techniques and technology integration.',
      tags: ['National Education Day', 'Modern Education', 'Technology Integration', 'Academic Excellence'],
      images: []
    },
    {
      title: 'PCB Design Workshop',
      date: 'December 3, 2022',
      category: 'workshop',
      description: 'Intensive workshop on Printed Circuit Board design using industry-standard CAD tools, covering design rules and manufacturing considerations.',
      tags: ['PCB Design', 'CAD Tools', 'Manufacturing', 'Circuit Design'],
      images: []
    },
    {
      title: 'Inter-college Technical Quiz',
      date: 'December 18, 2022',
      category: 'workshop',
      description: 'Regional technical quiz competition with participation from 12 polytechnic colleges, testing knowledge in electronics and communication fundamentals.',
      tags: ['Technical Quiz', 'Inter-college', 'Electronics Fundamentals', 'Regional Competition'],
      images: []
    },
    {
      title: 'Republic Day Celebration',
      date: 'January 26, 2023',
      category: 'community',
      description: 'Patriotic celebration with flag hoisting, cultural programs, and awareness sessions on constitutional values and national unity.',
      tags: ['Republic Day', 'Patriotic Celebration', 'Constitutional Values', 'National Unity'],
      images: []
    },
    {
      title: 'Final Year Project Showcase',
      date: 'February 15, 2023',
      category: 'workshop',
      description: 'Exhibition of innovative final year projects including IoT applications, embedded systems, and communication technology solutions.',
      tags: ['Project Showcase', 'Innovation', 'IoT Applications', 'Communication Technology'],
      images: []
    },
    {
      title: 'Women\'s Day Celebration',
      date: 'March 8, 2023',
      category: 'community',
      description: 'Special celebration recognizing achievements of women in technology, featuring talks by successful female engineers and entrepreneurs.',
      tags: ['Women\'s Day', 'Women in Technology', 'Female Engineers', 'Gender Equality'],
      images: []
    },
    {
      title: 'Industry-Academia Interface Meet',
      date: 'March 25, 2023',
      category: 'workshop',
      description: 'Collaborative session between industry representatives and academic staff to align curriculum with industry requirements and placement opportunities.',
      tags: ['Industry Academia', 'Curriculum Alignment', 'Industry Requirements', 'Collaboration'],
      images: []
    },
    {
      title: 'Campus Placement Drive',
      date: 'April 10, 2023',
      category: 'orientation',
      description: 'Multi-company campus placement drive with opportunities in electronics manufacturing, software development, and telecommunications sectors.',
      tags: ['Campus Placement', 'Electronics Manufacturing', 'Software Development', 'Career Opportunities'],
      images: []
    },
    {
      title: 'SSIP Innovation Exhibition',
      date: 'April 28, 2023',
      category: 'community',
      description: 'Exhibition of student innovation projects under SSIP 2.0, showcasing solutions for agriculture, healthcare, and smart city applications.',
      tags: ['SSIP Exhibition', 'Student Innovation', 'Agriculture Technology', 'Smart City Solutions'],
      images: []
    },
    {
      title: 'Summer Training Program',
      date: 'May 15, 2023',
      category: 'training',
      description: 'Comprehensive summer training program for students covering emerging technologies like AI, Machine Learning, and IoT applications.',
      tags: ['Summer Training', 'AI Technology', 'Machine Learning', 'Emerging Technologies'],
      images: []
    },
    {
      title: 'Environment Day Tree Plantation',
      date: 'June 5, 2023',
      category: 'community',
      description: 'Environmental conservation initiative with mass tree plantation and awareness session on sustainable development and green technology.',
      tags: ['Environment Day', 'Tree Plantation', 'Sustainable Development', 'Green Technology'],
      images: []
    }
  ],

  messages: {
    principal: {
      name: 'Sureshkumar D Dabhi',
      designation: 'Principal, Government Polytechnic Palanpur',
      message: `Dear Students, Faculty, and Stakeholders,

The academic year 2022-23 has been a year of recovery and growth. As we transitioned back to normal operations post-pandemic, our Electronics & Communication Engineering department has shown remarkable resilience and adaptability.

Our focus on industry-academia collaboration has yielded excellent results with improved placement rates and better industry exposure for our students. The department's commitment to innovation through SSIP initiatives has fostered an entrepreneurial mindset among our students.

I commend our faculty for their dedication to academic excellence and our students for their enthusiasm in embracing new technologies and learning opportunities. Together, we continue to build a strong foundation for technical education.`
    },
    hod: {
      name: 'Sunilkumar J Chauhan',
      designation: 'Head of Department - Electronics & Communication Engineering',
      message: `Dear EC Department Community,

The year 2022-23 has been transformative for our department with significant improvements in academic delivery, research activities, and industry partnerships. Our curriculum has been enhanced to include emerging technologies like 5G, IoT, and embedded AI applications.

Student participation in various competitions and technical events has increased substantially, reflecting their growing confidence and technical competence. The successful implementation of hands-on workshops and industrial visits has strengthened the practical learning experience.

I extend my gratitude to our dedicated faculty members who have consistently worked towards providing quality education and creating an environment conducive to innovation and learning.`
    },
    editorial: {
      name: 'Editorial Team',
      designation: 'Ms. Mittal K. Pedhadiya & Mr. Milav J. Dabgar',
      message: `Dear Readers,

"Spectrum" 2022-23 edition captures the essence of our department's growth trajectory and renewed focus on excellence. This year has witnessed increased industry engagement, enhanced learning experiences, and improved outcomes for our students.

From innovative project showcases to successful placement drives, every achievement reflects our collective commitment to quality education and holistic development. The stories featured in this newsletter demonstrate the potential and dedication of our EC family.

We hope this edition serves as an inspiration for continued excellence and motivates our community to reach greater heights in technical education and innovation.`
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
