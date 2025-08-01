// Newsletter Data for Academic Year 2021-22
// Electronics & Communication Engineering Department
// Government Polytechnic Palanpur

import { NewsletterData } from './index';

export const newsletterData2021_22: NewsletterData = {
  stats: [
    { label: 'Events', value: 12, color: 'bg-blue-500' },
    { label: 'Industry Visits', value: 3, color: 'bg-green-500' },
    { label: 'Expert Lectures & Workshops', value: 2, color: 'bg-purple-500' },
    { label: 'FDP Participation', value: 1, color: 'bg-orange-500' },
    { label: 'Placements & Higher Education', value: 10, color: 'bg-indigo-500' },
    { label: 'Books, Papers & Patents', value: 3, color: 'bg-red-500' },
    { label: 'Industry Partnerships', value: 6, color: 'bg-teal-500' },
    { label: 'Innovation Projects', value: 15, color: 'bg-amber-500' },
  ],
  
  canvas: [
    {
      title: "Device to Device Communication in 5G",
      author: "Ms. Mittal K. Pedhadiya",
      designation: "Lecturer, EC Department", 
      content: "Introduction of Android as an operating system and open source software's, free wares and ample of bandwidth-hungry applications results in scarcity of spectrum for communication. The growth of mobile devices, voice, and video over IP (VoIP) resulted in an exponential growth of data traffic; mobile data traffic expected to increase 1000 times over ten years. The forecast says that the 100 billion devices would be connected by 2030 by the onset of the internet of things. The massive increment in the connected devices causes overcrowded electromagnetic spectrum. In the 5G device to device, communication provides a prominent solution. Device to device communication (D2D) is defined as the communication among devices in close proximity, open to use cellular licensed as well as unlicensed frequency spectrum without the need to traverse the core network.\n\nD2D communication is a prime technology of 5G, which supports a variety of use cases including vehicular communication, content distribution in conferences, concerts, gaming, cellular offloading, relaying of data, and advertisement broadcasting in the streets. The use case of D2D communication of significance is public safety and disaster. The devices close to, enables higher throughput, lower latency, lower transmission power, higher data rate and higher spectral efficiency and energy efficiency.\n\nD2D communication exists on unlicensed as well as on the licensed frequency spectrum. Majority of the research is on the licensed spectrum (inband D2D) as it provides a higher level of security. Resources of cellular devices reused by the D2D devices in inband D2D communication (underlay inband D2D). Reusing the resources certainly improves the spectral efficiency, but interference between the D2D user and cellular user introduced nevertheless. The eventual reduction in the spectral efficiency by using part of dedicated licensed spectrum for D2D users, however, provides fairness in provisioning of resources to D2D users and cellular users (overlay inband D2D).\n\nFor Further Study: https://doi.org/10.1016/j.jnca.2018.10.012",
      date: "March 2022",
      type: "article",
      authorType: "faculty",
      images: [
        {
          src: '/newsletters/2021-22/device-to-device-communication-in-5g-5g-network-architect-2022-image-01.png',
          alt: '5G Network Architecture',
          caption: '5G network architecture showing device-to-device communication capabilities'
        },
        {
          src: '/newsletters/2021-22/device-to-device-communication-in-5g-illustration-of-d2d--2022-image-02.png',
          alt: 'Device to Device Communication in 5G',
          caption: 'Illustration of D2D communication reducing latency and improving spectrum efficiency'
        }
      ]
    },
    {
      title: "Artificial Intelligence in Electronics",
      author: "Dr. R. N. Patel",
      designation: "Lecturer, EC Department",
      content: "AI integration in electronics is transforming how we design and manufacture electronic systems. From automated PCB design to predictive maintenance in electronic equipment, AI is revolutionizing our field. Students should focus on learning AI fundamentals alongside traditional electronics to stay competitive in the evolving industry.",
      date: "January 2022",
      type: "innovation",
      authorType: "faculty"
    },
    {
      title: "My Journey Through Electronics",
      author: "Tirth Panchal",
      studentId: "196260311008",
      semester: "6th Semester",
      content: "Electronics has always fascinated me since childhood. During my time at GPP, I've learned not just the theoretical concepts but also practical applications through our well-equipped labs. The industrial visits and expert lectures have given me insights into real-world applications. I'm grateful for the placement opportunity at Webilok IT Services and look forward to contributing to the tech industry.",
      date: "April 2022",
      type: "experience",
      authorType: "student"
    },
    {
      title: "Innovation in Antenna Design",
      author: "Dr. Laukik K. Patel",
      designation: "Lecturer, EC Department",
      content: "Recent advancements in antenna technology are opening new possibilities in wireless communication. Fractal antennas, metamaterial-based designs, and MIMO systems are reshaping the communication landscape. Our department's research in wideband bow tie antennas and tree-fractal structures demonstrates our commitment to cutting-edge antenna research.",
      date: "February 2022", 
      type: "research",
      authorType: "faculty"
    },
    {
      title: "Dreams and Circuits",
      author: "Stuti Raval",
      studentId: "216260311005",
      semester: "2nd Semester",
      content: "A beautiful poem expressing passion for electronics and engineering, showcasing the creative side of technical education. The poem captures the essence of how students find inspiration in the world of electronics.",
      date: "December 2021",
      type: "poem",
      authorType: "student",
      images: [
        {
          src: '/newsletters/2021-22/dreams-and-circuits-creative-poem-by-stu-2021-image-01.jpg',
          alt: 'Stuti Raval\'s poem "Dreams and Circuits"',
          caption: 'Creative poem by Stuti Raval expressing passion for electronics'
        }
      ]
    },
    {
      title: "A Tribute to Teachers",
      author: "Arman Ghasura",
      studentId: "166260311008",
      semester: "6th Semester",
      content: "A heartfelt poem dedicated to teachers who shape our minds and guide our paths. This Teacher's Day tribute celebrates the invaluable contribution of teachers in building our future and their role in transforming students into capable professionals.",
      date: "September 2021",
      type: "poem",
      authorType: "student",
      images: [
        {
          src: '/newsletters/2021-22/a-tribute-to-teachers-a-touching-tribute-t-2021-image-01.png',
          alt: 'Arman Ghasura\'s poem on Teachers',
          caption: 'A touching tribute to teachers by Arman Ghasura on Teacher\'s Day'
        }
      ]
    }
  ],

  spotlight: [
    // Faculty Contributions
    {
      category: "faculty-contribution" as const,
      title: "GTU Syllabus Development & Administrative Leadership",
      description: "Led development of GTU syllabus for Electronics Workshop, AICTE accreditation coordination, and Hostel Rector services",
      person: "Shri Sunilkumar J. Chauhan",
      designation: "Head of Department, EC Engineering",
      details: "Institute coordinator for AICTE accreditation and GTU affiliation, Hostel Rector",
      date: "2021-22"
    },
    {
      category: "faculty-contribution" as const,
      title: "Housekeeping Committee Coordination",
      description: "Institutional housekeeping committee coordination and management",
      person: "Mrs. G. N. Acharya",
      designation: "Lecturer, EC Department",
      details: "Coordinator of housekeeping committee",
      date: "2021-22"
    },
    {
      category: "faculty-contribution" as const,
      title: "Electronic Circuits Syllabus & Student Section",
      description: "Contributed to GTU syllabus for Electronic Circuits & Applications, Student Section coordination, Embedded Systems training",
      person: "Ms. Mittal K. Pedhadiya",
      designation: "Lecturer, EC Department",
      details: "Co-coordinator of Student Section, Training completed: Embedded Systems",
      date: "2021-22"
    },
    {
      category: "faculty-contribution" as const,
      title: "GTU Coordination & Research Excellence",
      description: "GTU institutional coordination, syllabus development for Fundamentals of Electronics, and research paper recognition at national conference",
      person: "Dr. Laukik K. Patel",
      designation: "Lecturer, EC Department",
      details: "GTU coordinator of the institute with research paper runner-up award at national conference",
      date: "2021-22",
      achievements: [
        "GTU coordinator of the institute",
        "Syllabus development for Fundamentals of Electronics",
        "Best Paper Runner-up Award (October 2021)",
        "Paper: Analysis of matched key points of image registration using SIFT, SURF with different layers of CNN",
        "3rd National Conference on Recent Trends in Engineering, Management, Pharmacy, Architecture And Science",
        "Administrative coordination and research excellence"
      ]
    },    
    {
      category: "faculty-contribution" as const,
      title: "Electronic Circuits Syllabus & Multi-Committee Role",
      description: "Syllabus development for Electronic Circuits & Applications, Gymkhana and placement cell coordination",
      person: "Mr. Nikunj M. Patel",
      designation: "Lecturer, EC Department",
      details: "Co-coordinator in Gymkhana committee and training & placement cell",
      date: "2021-22"
    },
    {
      category: "faculty-contribution" as const,
      title: "Patent Publications & Administrative Leadership",
      description: "Published two patents in antenna design and served as institute administrative officer with editorial board membership",
      person: "Dr. R. N. Patel",
      designation: "Administrative Officer & Lecturer, EC Department",
      details: "Published patents in antenna design for industrial applications, editorial board member, and administrative leadership",
      date: "2021-22",
      achievements: [
        "Patent: Design of wideband bow tie antenna using tapered balun for ISM band (25/02/2022)",
        "Patent: Rectangular patch antenna with Tree-Fractal structure (21/01/2022)",
        "Editorial board member in Global Research and Development Journal",
        "Institute administrative officer duties and responsibilities",
        "Completed training on Antenna Design",
        "Research focus on antenna design for industrial applications"
      ]
    },    
    {
      category: "faculty-contribution" as const,
      title: "CWAN Committee & SSIP Cell Coordination",
      description: "CWAN committee coordination and SSIP Cell co-coordination with professional development training",
      person: "Mr. Milav J. Dabgar",
      designation: "Lecturer, EC Department",
      details: "Coordinator of CWAN committee & co-coordinator of SSIP Cell, Training: Induction Phase – II",
      date: "2021-22"
    },
    {
      category: "faculty-contribution" as const,
      title: "Industrial Electronics Syllabus & Student Section",
      description: "Syllabus development for Industrial Electronics and Student Section co-coordination",
      person: "Mr. Rahul C. Parmar",
      designation: "Lecturer, EC Department",
      details: "Co-coordinator of Student Section, Training: Induction Phase – II",
      date: "2021-22"
    },
    {
      category: "faculty-contribution" as const,
      title: "Multi-Committee Coordination & Training",
      description: "CWAN, Website & GTU committees co-coordination with professional development",
      person: "Mr. Snehil P. Joshiara",
      designation: "Lecturer, EC Department",
      details: "Co-coordinator of CWAN, Website & GTU Committees, Training: Induction Phase – II",
      date: "2021-22"
    },
    {
      category: "faculty-contribution" as const,
      title: "Digital Electronics Syllabus & AICTE Coordination",
      description: "Syllabus development for Digital Electronics and AICTE accreditation committee coordination",
      person: "Mr. Nirav J. Chauhan",
      designation: "Lecturer, EC Department",
      details: "Co-coordinator of AICTE accreditation Committee, Training: Induction Phase – II",
      date: "2021-22"
    },
    // Star Performers (Academic Excellence)
    {
      category: "star-performer" as const,
      title: "Semester Toppers - DIPL SEM 1 - Regular (DEC 2021)",
      description: "Outstanding academic performance across all semesters",
      date: "December 2021",
      achievements: [
        "Raval Stutiben Amitkumar (216260311005) - 7.41 SPI (Sem 1)",
        "Pawar Bharat Shankarlal (216260311003) - 5.95 SPI (Sem 1)"
      ]
    },
    {
      category: "star-performer" as const,
      title: "Semester Toppers - DIPL SEM 2 - Regular (MAY 2022)",
      description: "Outstanding academic performance across all semesters",
      date: "May 2022",
      achievements: [
        "Raval Stutiben Amitkumar (216260311005) - 8.32 SPI (Sem 2)",
        "Pawar Bharat Shankarlal (216260311003) - 7.79 SPI (Sem 2)"
      ]
    },
    {
      category: "star-performer" as const,
      title: "Semester Toppers - DIPL SEM 3 - Regular (DEC 2021)",
      description: "Outstanding academic performance across all semesters",
      date: "December 2021",
      achievements: [
        "Chaudhary Adarsh Premjibhai (206260311005) - 8.19 SPI (Sem 3)",
        "Chaudhary Piyushbhai Nagjibhai (206260311003) - 7.68 SPI (Sem 3)"
      ]
    },
    {
      category: "star-performer" as const,
      title: "Semester Toppers - DIPL SEM 4 - Regular (MAY 2022)",
      description: "Outstanding academic performance across all semesters",
      date: "May 2022",
      achievements: [
        "Chaudhary Adarsh Premjibhai (206260311005) - 9.13 SPI (Sem 4)",
        "Chaudhary Piyushbhai Nagjibhai (206260311003) - 7.77 SPI (Sem 4)"
      ]
    },
    {
      category: "star-performer" as const,
      title: "Semester Toppers - DIPL SEM 5 - Regular (DEC 2021)",
      description: "Outstanding academic performance across all semesters",
      date: "December 2021",
      achievements: [
        "Panchal Tirth Rakeshkumar (196260311008) - 8.2 SPI (Sem 5)",
        "Umatiya Anas Asharafbhai (196260311016) - 8.07 SPI (Sem 5)"
      ]
    },
    {
      category: "star-performer" as const,
      title: "Semester Toppers - DIPL SEM 6 - Regular (MAY 2022)",
      description: "Outstanding academic performance across all semesters",
      date: "May 2022",
      achievements: [
        "Prajapati Rohit Ashwinbhai (196260311013) - 8.13 SPI (Sem 6)",
        "Panchal Tirth Rakeshkumar (196260311008) - 8.07 SPI (Sem 6)"
      ]
    },
    // Placements
    {
      category: "placement",
      title: "Mehta Expai Technologies Placements",
      description: "Two students successfully placed at Mehta Expai Technologies",
      details: "Mehta Expai Technologies Pvt. Ltd. - Technical Roles",
      date: "2022",
      achievements: [
        "Nirav Solanki (196260311505)",
        "Darshil Modi (196260311006)"
      ]
    },
    {
      category: "placement",
      title: "Webilok IT Services Mass Recruitment",
      description: "Five students placed at Webilok IT Services, Deesa",
      details: "Webilok IT Services, Deesa - Software Developer Positions",
      date: "2022",
      achievements: [
        "Dabhi Ashwin (196260311002)",
        "Damor Bhargav (196260311503)", 
        "Chhayank Mevada (196260311005)",
        "Tirth Panchal (196260311008)",
        "Rohit Prajapati (196260311013)"
      ]
    },
    {
      category: "placement",
      title: "Asahi Glass Placement",
      description: "Industrial placement at Asahi Glass, Patan",
      person: "Mohammed Kaif",
      studentId: "156260311501",
      details: "Asahi Glass, Patan - Technical Assistant",
      date: "2022"
    },
    // Higher Education
    {
      category: "higher-education",
      title: "VGEC Admission for Degree Engineering",
      description: "Student admitted to VGEC, Chandkheda for pursuing B.E.",
      person: "Nirajkumar Prajapati",
      studentId: "186260311002",
      details: "VGEC, Chandkheda - Degree Engineering",
      date: "2022"
    },
    {
      category: "higher-education", 
      title: "GEC Gandhinagar Admission",
      description: "Student admitted to Government Engineering College",
      person: "Jaydip Kadiya",
      studentId: "166260311010",
      details: "GEC, Gandhinagar - Degree Engineering", 
      date: "2022"
    }  ],

  essence: {
    vision: "To prepare competent diploma level electronics and communication engineers, catering the needs of industries and society as an excellent employee, innovator and entrepreneur with moral values.",
    mission: "• M1: Provide quality education in the field of EC engineering.\n• M2: Develop state of art laboratories, classrooms and upgradation of Faculties.\n• M3: Strengthen industrial liaison by offering mutual beneficiaries services.\n• M4: Execute extra curricular and co-curricular activities to inculcate innovation, entrepreneurship and moral values.",
    departmentOverview: "The Electronics & Communication Engineering Department at Government Polytechnic Palanpur offers two diploma programs: Electronics & Communication Engineering (ECE) with 38 students intake and Information & Communication Technology (ICT) with 78 students. Our department is led by a Head of Department and supported by 7 qualified faculty members, including 2 Ph.D. holders, 1 pursuing doctoral studies, 3 with M.E. degrees, and 1 with B.E. degree, along with 1 lab assistant and 1 support staff. We are committed to holistic education that blends cutting-edge technology with practical applications, integrating emerging technologies like AI, IoT, and sustainable electronics. Through industry partnerships, expert lectures, and innovation projects, we prepare students as competent engineers and future leaders who will drive technological advancement.",
    hodMessage: {
      name: 'S. J. Chauhan',
      designation: 'Head of Department - Electronics & Communication Engineering',
      message: `Electronics and communication engineering field has witnessed the evolution of semiconductor from vacuum tubes to MOSFETs, from telephones to 5G smart phones. Continuing the evolutionary tradition of the branch, it gives me immense pleasure to present its first yearly newsletter "Spectrum". Spectrum intends to provide a platform for faculties, students, and all other stakeholders to share and receive news of latest updates of the activities carried out in the department. This newsletter will also be publishing achievements of staff members and students. I expect students to take the 'Spectrum' to new heights. A lot of hard work has gone into publishing this, and every stakeholder's involvement will encourage us further. I extend my full cooperation and best wishes to the entire team behind Spectrum.`,
      image: {
        src: '/newsletters/2021-22/sj-chauhan.png',
        alt: 'S. J. Chauhan - Head of Department, EC Engineering',
        caption: 'HOD\'s message for Spectrum Newsletter 2021-22'
      }
    }
  },

  highlights: [
    {
      icon: '🎯',
      title: 'Premier Newsletter Launch',
      description: 'Inaugural edition of Spectrum newsletter showcasing department excellence and student achievements'
    },
    {
      icon: '👥',
      title: '10+ Student Placements',
      description: 'Successful placement of students in top companies like Webilok IT Services and Mehta Expai Technologies'
    },
    {
      icon: '🏆',
      title: 'Academic Excellence',
      description: 'Consistent semester toppers across all years with outstanding academic performance records'
    },
    {
      icon: '🔬',
      title: 'Research & Innovation',
      description: 'Faculty published 2 patents in antenna design and research papers at national conferences'
    },
    {
      icon: '🤝',
      title: 'Industry Partnerships',
      description: 'Strong collaborations with 6+ industry partners for training, visits, and placement opportunities'
    },
    {
      icon: '🌱',
      title: 'Community Impact',
      description: 'Active participation in social initiatives including tree plantation, awareness campaigns, and school outreach'
    }
  ],

  chronicles: [
    {
      title: 'Expert Lecture on "Importance of Programming"',
      date: 'August 9, 2021',
      category: 'workshop',
      description: 'This expert lecture was delivered by Mr. Pranav Dave, Tech Lead (Associate consultant), Tata Consultancy Services (TCS), Gandhinagar in online mode. The session was conducted on the basics of programming, with details on the uses of programming with real time examples. The need of programming in different areas was also discussed. Speaker talked about "How the programming is used to solve and simplify complex problems". The session was ended with the motivation to the students to start programming and build up career.',
      tags: ['Programming', 'TCS', 'Career Development', 'Online Session'],
      images: [
        {
          src: '/newsletters/2021-22/expert-lecture-on-online-expert-lectur-2021-image-01.jpg',
          alt: 'Expert lecture on Programming by TCS',
          caption: 'Online expert lecture session on "Importance of Programming" by Mr. Pranav Dave from TCS'
        }
      ]
    },
    {
      title: 'Expert Lecture on "Navigation with Indian Constellation (NavIC) and Its Application"',
      date: 'January 29, 2022',
      category: 'workshop',
      description: 'This expert lecture was delivered by Dr. Mehulkumar Desai, Lecturer in EC, Government Polytechnic for Girls, Surat in online mode. In this session the basics of satellite-based navigation system, different terminologies and NavIC architecture was explained to the participants. In it effects of positional accuracy and how the navigation system works were discussed. Various applications of satellite-based navigation system were discussed in depth. The session motivated students to work towards make in India by using the NavIC made in India and for India.',
      tags: ['NavIC', 'Navigation Systems', 'Satellite Technology', 'Make in India'],
      images: [
        {
          src: '/newsletters/2021-22/expert-lecture-on-online-expert-lectur-2022-image-01.jpg',
          alt: 'Expert lecture on NavIC navigation system',
          caption: 'Online expert lecture on Navigation with Indian Constellation (NavIC) by Dr. Mehulkumar Desai'
        }
      ]
    },
    {
      title: 'Industrial Visit - Community Radio Palanpur',
      date: 'March 26, 2022',
      category: 'visit',
      description: 'In this visit students got a chance to experience live radio broadcast. In addition, they have seen recording studio, studio equipments, FM transmission equipments and antennas. Students also got opportunity to meet Radio Jockey and manager of Radio Palanpur. They shared their journey and experiences in setting up community radio station at Palanpur.',
      tags: ['Radio Broadcasting', 'FM Transmission', 'Community Radio', 'Industry Visit'],
      images: [
        {
          src: '/newsletters/2021-22/industrial-visit-community-radio-palanpu-students-visiting-co-2022-image-01.jpg',
          alt: 'Students at Community Radio Palanpur',
          caption: 'Students visiting Community Radio Palanpur - observing broadcasting setup'
        },
        {
          src: '/newsletters/2021-22/industrial-visit-community-radio-palanpu-students-exploring-r-2022-image-02.jpg',
          alt: 'Recording studio and transmission equipment',
          caption: 'Students exploring recording studio and transmission equipment at Community Radio'
        }
      ]
    },
    {
      title: 'Industrial Visit - Samsung Customer Care',
      date: 'March 29, 2022',
      category: 'visit',
      description: 'In this visit students observed how smart phone, laptops and tablets are serviced at Samsung service center. Technician of Samsung care demonstrated how to disassemble various parts of Smartphone, Tablets, and laptops, then he also demonstrated how desolder and solder back the tiny components. At last, The Manager at Samsung care guided students about career scope in this segment of industry.',
      tags: ['Electronics Repair', 'Samsung', 'Mobile Technology', 'Career Guidance'],
      images: [
        {
          src: '/newsletters/2021-22/industrial-visit-samsung-customer-care-students-observing-s-2022-image-01.jpg',
          alt: 'Students at Samsung Customer Care center',
          caption: 'Students observing smartphone and tablet servicing techniques at Samsung Customer Care'
        }
      ]
    },
    {
      title: 'Industrial Visit - Sahajanand Laser Technologies',
      date: 'April 12, 2022',
      category: 'visit',
      description: 'As a technology driven group of companies, Sahajanand Laser Technologies (SLTL) undertakes manufacturing of solutions in the fields of Laser Systems, Medical, Diamond & Jewellery, RF & Microwave, and Renewable Energy Machine Tools. Their innovative solutions are designed to match industrial requirements and beyond. During their visit to SLTL, students observed LASER cutting machines, LASER engraving machines, Robotic equipments, RF and microwave equipments manufacturing chain of STLT.',
      tags: ['Laser Technology', 'Manufacturing', 'RF Technology', 'Automation'],
      images: [
        {
          src: '/newsletters/2021-22/industrial-visit-sahajanand-laser-techno-students-observing-l-2022-image-01.jpg',
          alt: 'Students at Sahajanand Laser Technologies',
          caption: 'Students observing LASER cutting and engraving machines at SLTL'
        }
      ]
    },
    {
      title: 'Industrial Visit - JK Industries, Chandisar',
      date: 'May 2, 2022',
      category: 'visit',
      description: 'JK industries majorly works on manufacturing and servicing of High voltage transformers used in power distribution by GEB. Assigned engineer explained repairing of Transformer to the students. Students also got the opportunity to see live troubleshooting and repairing of damaged transformers.',
      tags: ['Power Systems', 'Transformers', 'High Voltage', 'Power Distribution'],
      images: [
        {
          src: '/newsletters/2021-22/industrial-visit-jk-industries-chandisar-students-observing-h-2022-image-01.jpg',
          alt: 'Students learning transformer repair at JK Industries',
          caption: 'Students observing high voltage transformer repairing and troubleshooting at JK Industries'
        }
      ]
    },
    {
      title: 'Farewell for 2022 Pass-outs',
      date: 'April 4, 2022',
      category: 'community',
      description: 'A farewell was given to the 2022 pass-outs with a keynote by HoD, and kind words by all the staff members.',
      tags: ['Farewell', 'Graduation', 'Community Event', 'Students'],
      images: [
        {
          src: '/newsletters/2021-22/farewell-for-2022-pass-outs-farewell-ceremony-fo-2022-image-01.jpg',
          alt: 'Farewell ceremony for 2022 graduates',
          caption: 'Farewell ceremony for 2022 pass-outs with faculty and students'
        }
      ]
    },
    {
      title: 'Tree Plantation Drive',
      date: 'July 31, 2021',
      category: 'awareness',
      description: 'Institute organized Tree Plantation on 31 July 2021 in college campus and Approximately 150 different types of trees were planted in campus. Mr. Lalitbhai Vasvani and his team (Society for clean and green environment) are also joined with us for this event.',
      tags: ['Environment', 'Tree Plantation', 'Green Campus', 'Sustainability'],
      images: [
        {
          src: '/newsletters/2021-22/tree-plantation-drive-tree-plantation-even-2021-image-01.jpg',
          alt: 'Tree plantation drive at campus',
          caption: 'Tree plantation event with students and faculty planting various tree species'
        }
      ]
    },
    {
      title: 'Use of Technology in Education',
      date: 'August 10, 2021',
      category: 'workshop',
      description: 'An Online Seminar for the students on "Use of Technology in Education" by Mr. S.R.Modi and Mr. R.H.Prajapati (Lecturer in Mechanical Engineering Department, G.P.Palanpur).',
      tags: ['Education Technology', 'Online Seminar', 'Teaching Methods', 'Digital Learning'],
      images: []
    },
    {
      title: '75th Independence Day Celebration',
      date: 'August 15, 2021',
      category: 'community',
      description: 'A flag hoisting ceremony was organized at Government Polytechnic Palanpur on 15th August 2021 to celebrate 75th Independence Day in which all students and staff members participated enthusiastically.',
      tags: ['Independence Day', 'Patriotic', 'Flag Hoisting', 'National Festival'],
      images: [
        {
          src: '/newsletters/2021-22/75th-independence-day-celebration-flag-hoisting-ceremo-2021-image-01.jpg',
          alt: '75th Independence Day celebration',
          caption: 'Flag hoisting ceremony during 75th Independence Day celebration'
        }
      ]
    },
    {
      title: 'NBA Visit for Accreditation',
      date: 'September 24-26, 2021',
      category: 'training',
      description: 'Three departments namely Civil, Mechanical and Electrical department applied for the NBA accreditation. And for the successful completion of the visit all the EC staff members played a key role in it.',
      tags: ['NBA Accreditation', 'Quality Assurance', 'Department Support', 'Academic Excellence'],
      images: [
        {
          src: '/newsletters/2021-22/nba-visit-for-accreditation-nba-accreditation-vi-2021-image-01.jpg',
          alt: 'NBA accreditation team visit',
          caption: 'NBA accreditation visit - faculty and team members during evaluation process'
        }
      ]
    },
    {
      title: 'Thalassemia Awareness Camp',
      date: 'October 7, 2021',
      category: 'awareness',
      description: 'Institute has organized a Thalassemia camp for students on 7-10-2021. Awareness and counseling program is also carried out from the team of Indian Red Cross society, Ahmadabad for Thalassemia.',
      tags: ['Health Awareness', 'Thalassemia', 'Medical Camp', 'Student Welfare'],
      images: [
        {
          src: '/newsletters/2021-22/thalassemia-awareness-camp-2021-image-01.png',
          alt: 'Thalassemia awareness and testing camp',
          caption: 'Thalassemia awareness camp conducted by Indian Red Cross Society'
        }
      ]
    },
    {
      title: 'Garba Mahotsav',
      date: 'October 21, 2021',
      category: 'community',
      description: 'One day Garba Mahotsav is organized in institute for celebration of Navaratri. All the students and staff members participated enthusiastically.',
      tags: ['Cultural Event', 'Garba', 'Navaratri', 'Festival Celebration'],
      images: [
        {
          src: '/newsletters/2021-22/garba-mahotsav-students-and-faculty-2021-image-01.jpg',
          alt: 'Garba Mahotsav celebration',
          caption: 'Students and faculty celebrating Garba Mahotsav during Navaratri'
        }
      ]
    },
    {
      title: 'Drug Awareness Program (Vyasan Mukti Abhiyan)',
      date: 'October 22, 2021',
      category: 'awareness',
      description: 'A Seminar on Tobacco free movement-Drug Awareness is organized by Drug enforcement and reception department Palanpur at institute on 22-10-2021. Shree. N.A.Devani (PI, Drug Excise Department), Smt. G.D.Ahir (PSI, Women PoliceStation) and Smt. Jigishaben Tarar (Women counsellor, Women based support center) has given their valuable speech for Drug awareness.',
      tags: ['Drug Awareness', 'Health Campaign', 'Social Awareness', 'Student Safety'],
      images: [
        {
          src: '/newsletters/2021-22/drug-awareness-program-vyasan-mukti-abhi-drug-awareness-semin-2021-image-01.jpg',
          alt: 'Drug awareness seminar',
          caption: 'Drug awareness seminar by enforcement officials and counselors'
        }
      ]
    },
    {
      title: 'Clean India Movement',
      date: 'October 28, 2021',
      category: 'awareness',
      description: 'Cleanliness drive was carried out for clean campus and surroundings under the clean India movement campaign on 28-10-2021.',
      tags: ['Cleanliness', 'Swachh Bharat', 'Campus Cleaning', 'Social Responsibility'],
      images: [
        {
          src: '/newsletters/2021-22/clean-india-movement-students-and-faculty-2021-image-01.jpg',
          alt: 'Clean India Movement drive',
          caption: 'Students and faculty participating in campus cleanliness drive'
        }
      ]
    },
    {
      title: 'National Unity Day',
      date: 'October 31, 2021',
      category: 'community',
      description: 'The birth anniversary of Iron man Shri Sardar Vallabhbhai Patel is celebrated on 31st October every year as "National Unity Day". As a part of the day Pledge taking ceremony was arranged in seminar hall.',
      tags: ['National Unity', 'Sardar Patel', 'Unity Day', 'Patriotic Event'],
      images: [
        {
          src: '/newsletters/2021-22/national-unity-day-pledge-taking-ceremo-2021-image-01.jpg',
          alt: 'National Unity Day celebration',
          caption: 'Pledge taking ceremony during National Unity Day celebration'
        }
      ]
    },
    {
      title: '73rd Republic Day Celebration',
      date: 'January 26, 2022',
      category: 'community',
      description: 'At Government Polytechnic Palanpur, On 26th January 2022, the occasion of 73rd Republic Day, a flag salute program was organized in the presence of "Hon\'ble former MLA Rekhaben Khanesha". In which all the officials and students of the institute enthusiastically participated.',
      tags: ['Republic Day', 'Flag Salute', 'National Festival', 'Guest Speaker'],
      images: [
        {
          src: '/newsletters/2021-22/73rd-republic-day-celebration-flag-salute-ceremony-2022-image-01.jpg',
          alt: '73rd Republic Day celebration',
          caption: 'Flag salute ceremony during 73rd Republic Day with Hon\'ble former MLA Rekhaben Khanesha'
        },
        {
          src: '/newsletters/2021-22/73rd-republic-day-celebration-students-and-faculty-2022-image-02.jpg',
          alt: 'Students participating in Republic Day parade',
          caption: 'Students and faculty participating in Republic Day celebration'
        }
      ]
    },
    {
      title: 'Martyrs\' Day Commemoration',
      date: 'January 29, 2022',
      category: 'awareness',
      description: 'On Martyrs\' Day on 30th January 2022, the opportunity to pay tribute to the martyred heroes who sacrificed their lives in the freedom struggle of India should be taken seriously and the spirit of faith and respect towards the martyrs should be awakened and the country should realize its importance for which an online talk was organized by History Coordinating Committee, Gujarat on 29th January 2020 at 3:00 pm at the institute. In this program, Shri Girishbhai Thacker, Vice Chairman, History Coordinating Committee, Gujarat gave a speech on the subject of "Indian Freedom Struggle (Bhartiya Swatantra Sangram)". The program was also broadcast online through Google meet.',
      tags: ['Martyrs Day', 'Freedom Struggle', 'Historical Awareness', 'Online Event'],
      images: [
        {
          src: '/newsletters/2021-22/martyrs-online-talk-on-india-2022-image-01.jpg',
          alt: 'Martyrs Day commemoration event',
          caption: 'Online talk on Indian Freedom Struggle during Martyrs\' Day commemoration'
        }
      ]
    },
    {
      title: 'Women\'s Day Celebration',
      date: 'March 5, 2022',
      category: 'awareness',
      description: 'Women Development cell has conducted various activities in co-ordination with RUSA. On account of Woman\'s Day celebration on 05/03/2022 an expert lecture on "Laws related to women safety" by MS. YASHASHVI MEHTA PANDYA also an expert lecture on "Disadvantages of mobile and internet" was delivered by MS. GEETA ACHARYA (Sr. Lecturer in EC). An event named "Food without flame contest" was also organized. In this event students took part enthusiastically and prepared ready to serve dishes without using the flame. Stuti Raval and Bijal Suthar (Sem 1 EC) won first prize and Khushbu Garasiya and Khushi Patel (Sem 6 EC) won second prize in the event. Expert lecture on "Self-employment enhancement" was delivered by Tithi Vakil (Interior Designer). She gave a demo of how to enhance employment by developing a hobby. Speaker demonstrated steps for making a pastry/cake, inspiring students to develop hobby along with their profession.',
      tags: ['Women\'s Day', 'Women Safety', 'Expert Lectures', 'Competition'],
      images: [
        {
          src: '/newsletters/2021-22/women-expert-lectures-and--2022-image-01.jpg',
          alt: 'Women\'s Day celebration activities',
          caption: 'Expert lectures and Food without flame contest during Women\'s Day celebration'
        },
        {
          src: '/newsletters/2021-22/women-winners-of-food-with-2022-image-02.jpg',
          alt: 'Food without flame contest winners',
          caption: 'Winners of Food without flame contest - Stuti Raval, Bijal Suthar, Khushbu Garasiya, and Khushi Patel'
        }
      ]
    },
    {
      title: 'District Level Placement Fair',
      date: 'March 23, 2022',
      category: 'orientation',
      description: 'A district level mega placement fair was organized as per directives of the government. Total 22 industries participated and conducted interviews of candidates from Science Colleges, Commerce Colleges, Arts Colleges Degree and Diploma Engineering Colleges across Banaskantha district. Total 9 students were shortlisted/selected by reputed industries like Webilok IT services and Mehta Expai company from our department. Team EC played a key role in smooth execution of Placement Fair.',
      tags: ['Placement Fair', 'Industry Connect', 'Career Opportunities', 'District Level'],
      images: [
        {
          src: '/newsletters/2021-22/district-level-placement-fair-district-level-mega--2022-image-01.jpg',
          alt: 'District level placement fair',
          caption: 'District level mega placement fair with 22 participating industries'
        },
        {
          src: '/newsletters/2021-22/district-level-placement-fair-students-attending-i-2022-image-02.png',
          alt: 'Students attending placement interviews',
          caption: 'Students attending interviews at the district level placement fair'
        }
      ]
    },
    {
      title: 'Voter Awareness Program',
      date: 'May 5, 2022',
      category: 'awareness',
      description: 'As part of extra-curricular activities at Government Polytechnic Palanpur, NSS unit organized drawing competition and essay competition to create awareness among students about voting. The students enthusiastically participated in this competition and brought out their inner skill. The winning students were encouraged by giving certificates and prizes.',
      tags: ['Voter Awareness', 'NSS Activity', 'Democracy', 'Student Competition'],
      images: [
        {
          src: '/newsletters/2021-22/voter-awareness-program-nss-organized-drawin-2022-image-01.jpg',
          alt: 'Voter awareness program activities',
          caption: 'NSS organized drawing and essay competitions for voter awareness'
        }
      ]
    },
    {
      title: 'International Yoga Day Celebration',
      date: 'June 21, 2022',
      category: 'awareness',
      description: 'At Government Polytechnic Palanpur, On 21st June 2022, the occasion of international yoga day various yoga represented by yoga teacher. In which all the officials, employees and students of the institute enthusiastically participated.',
      tags: ['Yoga Day', 'Health Awareness', 'Wellness', 'International Day'],
      images: [
        {
          src: '/newsletters/2021-22/international-yoga-day-celebration-students-and-faculty-2022-image-01.jpg',
          alt: 'International Yoga Day celebration',
          caption: 'Students and faculty participating in International Yoga Day celebration'
        }
      ]
    },
    {
      title: 'SSIP Activities - School Outreach',
      date: 'Throughout the year',
      category: 'community',
      description: 'Students from our department actively participate in various activities of SSIP Cell, GP Palanpur. Students from our department contributed as experts in practical sessions organized at Vidhya mandir School, Palanpur for 5 to 8 standard students by SSIP Cell. The sessions were aimed to give basic ideas of robotics and drone making to school students. It was a wonderful experience for our students to perform the role of teacher and demonstrate their skills to school children. Total 80 students benefited from this session. Whole event was managed by: YUVRAJ RAJPUT (6th EC) & few other students. A Similar kind of events covering Robotics, Drone & RC Plane making were also conducted at Jasra Primary School Vidhya mandir school and few other schools.',
      tags: ['SSIP', 'School Outreach', 'Robotics', 'Community Service'],
      images: [
        {
          src: '/newsletters/2021-22/ssip-activities-school-outreach-students-teaching-ro--image-01.png',
          alt: 'SSIP school outreach program',
          caption: 'Students teaching robotics and drone making to school children at Vidhya Mandir School'
        },
        {
          src: '/newsletters/2021-22/ssip-activities-school-outreach-robotics-and-drone-m--image-02.jpg',
          alt: 'Robotics bootcamp at Jasra Primary School',
          caption: 'Robotics and drone making bootcamp at Jasra Primary School'
        }
      ]
    }
  ],

  
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
  
  editorialTeam: [
    {
      name: 'Mr. Mittal K. Pedhadiya',
      designation: 'Lecturer',
      role: 'Newsletter Editor'
    },
    {
      name: 'Mr. Milav J. Dabgar',
      designation: 'Lecturer',
      role: 'Newsletter Co-Editor'
    }
  ],
  
  reachout: {
    email: 'ec@gppalanpur.ac.in',
    newsletterEmail: 'spectrum@gppalanpur.ac.in',
    phone: '02742-262115',
    address: 'Opp. Malan Darwaja, Ambaji Road, Palanpur - 385001, Gujarat',
    website: 'ec.gppalanpur.ac.in'
  }
};
