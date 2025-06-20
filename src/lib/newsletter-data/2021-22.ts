// Newsletter Data for Academic Year 2021-22
// Electronics & Communication Engineering Department
// Government Polytechnic Palanpur

import { NewsletterData } from '../newsletter-data';

export const newsletterData2021_22: NewsletterData = {
  stats: [
    { label: 'Students Placed', value: 8, color: 'bg-blue-500' },
    { label: 'Higher Education', value: 2, color: 'bg-green-500' },
    { label: 'Faculty Publications', value: 3, color: 'bg-purple-500' },
    { label: 'Expert Lectures', value: 2, color: 'bg-orange-500' },
  ],
  
  canvas: [
    {
      title: "5G Technology: The Future of Communication",
      author: "Faculty Member",
      designation: "Lecturer, EC Department", 
      content: "5G technology represents a quantum leap in wireless communication, offering unprecedented speeds, ultra-low latency, and massive device connectivity. This revolutionary technology will enable innovations like autonomous vehicles, smart cities, and IoT applications that were previously impossible. As EC engineers, understanding 5G architecture and implementation is crucial for future career prospects.",
      date: "March 2022",
      type: "tech-news",
      authorType: "faculty"
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
      author: "Mr. L. K. Patel",
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
      content: "In the world of resistors and capacitors,\nWhere electrons dance and current flows,\nI find my passion, my calling true,\nIn circuits where innovation grows.\n\nFrom simple LEDs to complex designs,\nEach component tells a story,\nOf human ingenuity and endless dreams,\nBuilding tomorrow's electronic glory.",
      date: "December 2021",
      type: "poem",
      authorType: "student"
    },
    {
      title: "Sustainable Electronics: Green Technology",
      author: "Ms. M. K. Pedhadiya",
      designation: "Lecturer, EC Department",
      content: "The electronics industry is moving towards sustainable practices with eco-friendly materials, energy-efficient designs, and recycling initiatives. As future engineers, we must consider environmental impact in our designs. Green electronics not only reduce carbon footprint but also create new market opportunities for innovative solutions.",
      date: "November 2021",
      type: "innovation",
      authorType: "faculty"
    }
  ],

  spotlight: [
    // Faculty Contributions
    {
      category: "faculty-contribution",
      title: "Patent Publications by Dr. R. N. Patel",
      description: "Published two patents in antenna design for industrial applications",
      person: "Dr. R. N. Patel",
      designation: "Lecturer, EC Department",
      date: "February 2022",
      achievements: [
        "Patent: Design of wideband bow tie antenna using tapered balun for ISM band (25/02/2022)",
        "Patent: Rectangular patch antenna with Tree-Fractal structure (21/01/2022)",
        "Editorial board member in Global Research and Development Journal",
        "Completed training on Antenna Design"
      ]
    },
    {
      category: "faculty-contribution", 
      title: "Best Paper Runner-up Award",
      description: "Mr. L. K. Patel won best paper runner-up at National Conference",
      person: "Mr. L. K. Patel",
      designation: "Lecturer, EC Department",
      date: "October 2021",
      achievements: [
        "Paper: Analysis of matched key points of image registration using SIFT, SURF with different layers of CNN",
        "3rd National Conference on Recent Trends in Engineering, Management, Pharmacy, Architecture And Science",
        "GTU coordinator and syllabus contributor"
      ]
    },
    // Star Performers (Academic Excellence)
    {
      category: "star-performer",
      title: "Semester Toppers - Winter 2021",
      description: "Outstanding academic performance across all semesters",
      date: "Winter 2021",
      achievements: [
        "Stuti Raval (216260311005) - 7.41 CGPA (Sem 1)",
        "Chaudhary Adarsh (206260311005) - 8.19 CGPA (Sem 3)", 
        "Chaudhary Piyush (206260311003) - 7.68 CGPA (Sem 3)",
        "Panchal Tirth (196260311008) - 8.2 CGPA (Sem 5)",
        "Umatiya Anas (196260311016) - 8.07 CGPA (Sem 5)"
      ]
    },
    {
      category: "star-performer",
      title: "Semester Toppers - Summer 2021 & 2022",
      description: "Consistent academic excellence maintained",
      date: "Summer 2021-22",
      achievements: [
        "Chaudhary Piyush (206260311003) - 9.26 CGPA (Sem 2 - Summer 2021)",
        "Chaudhary Adarsh (206260311005) - 8.87 CGPA (Sem 2 - Summer 2021)",
        "Solanki Niravbhai (196260311505) - 8.21 CGPA (Sem 4 - Summer 2021)",
        "Prajapati Rohit (196260311013) - 8.13 CGPA (Sem 6 - Summer 2022)",
        "Panchal Tirth (196260311008) - 8.07 CGPA (Sem 6 - Summer 2022)"
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
    }
  ],
  
  events: [
    {
      title: 'Expert Lecture on "Importance of Programming"',
      date: 'August 9, 2021',
      category: 'workshop',
      description: 'Expert lecture delivered by Mr. Pranav Dave, Tech Lead (Associate consultant), Tata Consultancy Services (TCS), Gandhinagar in online mode. The session covered basics of programming, real-time examples, and motivation for students to start programming and build careers.',
      tags: ['Programming', 'TCS', 'Career Development', 'Online Session'],
      images: []
    },
    {
      title: 'Expert Lecture on "Navigation with Indian Constellation (NavIC) and Its Application"',
      date: 'January 29, 2022',
      category: 'workshop',
      description: 'Expert lecture delivered by Dr. Mehulkumar Desai, Lecturer in EC, Government Polytechnic for Girls, Surat in online mode. Session covered satellite-based navigation system, NavIC architecture, and various applications.',
      tags: ['NavIC', 'Navigation Systems', 'Satellite Technology', 'Make in India'],
      images: []
    },
    {
      title: 'Industrial Visit - Community Radio Palanpur',
      date: 'March 26, 2022',
      category: 'visit',
      description: 'Students experienced live radio broadcast, visited recording studio, observed FM transmission equipment and antennas. Met Radio Jockey and manager who shared their experiences in setting up community radio station.',
      tags: ['Radio Broadcasting', 'FM Transmission', 'Community Radio', 'Industry Visit'],
      images: []
    },
    {
      title: 'Industrial Visit - Samsung Customer Care',
      date: 'March 29, 2022',
      category: 'visit',
      description: 'Students observed smartphone, laptop and tablet servicing at Samsung service center. Technician demonstrated disassembly and component soldering. Manager guided students about career opportunities.',
      tags: ['Electronics Repair', 'Samsung', 'Mobile Technology', 'Career Guidance'],
      images: []
    },
    {
      title: 'Industrial Visit - Sahajanand Laser Technologies',
      date: 'April 12, 2022',
      category: 'visit',
      description: 'Visit to SLTL, a technology-driven company manufacturing solutions in Laser Systems, Medical, Diamond & Jewellery, RF & Microwave, and Renewable Energy. Students observed LASER cutting/engraving machines, robotic equipment, and RF/microwave manufacturing.',
      tags: ['Laser Technology', 'Manufacturing', 'RF Technology', 'Automation'],
      images: []
    },
    {
      title: 'Industrial Visit - JK Industries, Chandisar',
      date: 'May 2, 2022',
      category: 'visit',
      description: 'JK Industries works on manufacturing and servicing high voltage transformers for power distribution by GEB. Students learned about transformer repairing and witnessed live troubleshooting.',
      tags: ['Power Systems', 'Transformers', 'High Voltage', 'Power Distribution'],
      images: []
    },
    {
      title: 'Farewell for 2022 Pass-outs',
      date: 'April 4, 2022',
      category: 'community',
      description: 'Farewell ceremony organized for 2022 graduating batch with keynote by HoD and kind words by all staff members.',
      tags: ['Farewell', 'Graduation', 'Community Event', 'Students'],
      images: []
    },
    {
      title: 'Tree Plantation Drive',
      date: 'July 31, 2021',
      category: 'awareness',
      description: 'Institute organized tree plantation in college campus with approximately 150 different types of trees planted. Mr. Lalitbhai Vasvani and his team from Society for clean and green environment joined the event.',
      tags: ['Environment', 'Tree Plantation', 'Green Campus', 'Sustainability'],
      images: []
    },
    {
      title: '75th Independence Day Celebration',
      date: 'August 15, 2021',
      category: 'community',
      description: 'Flag hoisting ceremony organized at Government Polytechnic Palanpur with enthusiastic participation from all students and staff members.',
      tags: ['Independence Day', 'Patriotic', 'Flag Hoisting', 'National Festival'],
      images: []
    },
    {
      title: 'NBA Visit for Accreditation',
      date: 'September 24-26, 2021',
      category: 'training',
      description: 'NBA accreditation visit for Civil, Mechanical and Electrical departments. EC staff members played key role in successful completion of the visit.',
      tags: ['NBA Accreditation', 'Quality Assurance', 'Department Support', 'Academic Excellence'],
      images: []
    },
    {
      title: 'Thalassemia Awareness Camp',
      date: 'October 7, 2021',
      category: 'awareness',
      description: 'Thalassemia camp organized for students with awareness and counseling program by Indian Red Cross Society, Ahmedabad team.',
      tags: ['Health Awareness', 'Thalassemia', 'Medical Camp', 'Student Welfare'],
      images: []
    },
    {
      title: 'Garba Mahotsav',
      date: 'October 21, 2021',
      category: 'community',
      description: 'One day Garba Mahotsav organized for Navaratri celebration with enthusiastic participation from students and staff.',
      tags: ['Cultural Event', 'Garba', 'Navaratri', 'Festival Celebration'],
      images: []
    },
    {
      title: 'Drug Awareness Program (Vyasan Mukti Abhiyan)',
      date: 'October 22, 2021',
      category: 'awareness',
      description: 'Seminar on Tobacco free movement and Drug Awareness organized by Drug enforcement department Palanpur. Speakers included PI N.A.Devani, PSI G.D.Ahir, and counselor Jigishaben Tarar.',
      tags: ['Drug Awareness', 'Health Campaign', 'Social Awareness', 'Student Safety'],
      images: []
    },
    {
      title: 'Clean India Movement',
      date: 'October 28, 2021',
      category: 'awareness',
      description: 'Cleanliness drive carried out for clean campus and surroundings under the Clean India Movement campaign.',
      tags: ['Cleanliness', 'Swachh Bharat', 'Campus Cleaning', 'Social Responsibility'],
      images: []
    },
    {
      title: 'National Unity Day',
      date: 'October 31, 2021',
      category: 'community',
      description: 'Birth anniversary of Sardar Vallabhbhai Patel celebrated as National Unity Day with pledge taking ceremony in seminar hall.',
      tags: ['National Unity', 'Sardar Patel', 'Unity Day', 'Patriotic Event'],
      images: []
    },
    {
      title: '73rd Republic Day Celebration',
      date: 'January 26, 2022',
      category: 'community',
      description: 'Flag salute program organized in presence of Hon\'ble former MLA Rekhaben Khanesha with enthusiastic participation from officials and students.',
      tags: ['Republic Day', 'Flag Salute', 'National Festival', 'Guest Speaker'],
      images: []
    },
    {
      title: 'Martyrs\' Day Commemoration',
      date: 'January 29, 2022',
      category: 'awareness',
      description: 'Online talk organized by History Coordinating Committee, Gujarat. Shri Girishbhai Thacker, Vice Chairman spoke on "Indian Freedom Struggle (Bhartiya Swatantra Sangram)".',
      tags: ['Martyrs Day', 'Freedom Struggle', 'Historical Awareness', 'Online Event'],
      images: []
    },
    {
      title: 'Women\'s Day Celebration',
      date: 'March 5, 2022',
      category: 'awareness',
      description: 'Women Development cell conducted various activities. Expert lectures on "Laws related to women safety" by Ms. Yashashvi Mehta Pandya and "Disadvantages of mobile and internet" by Ms. Geeta Acharya. "Food without flame contest" organized.',
      tags: ['Women\'s Day', 'Women Safety', 'Expert Lectures', 'Competition'],
      images: []
    },
    {
      title: 'District Level Placement Fair',
      date: 'March 23, 2022',
      category: 'orientation',
      description: 'District level mega placement fair organized as per government directives. 22 industries participated conducting interviews across Banaskantha district. 9 students from EC department were shortlisted/selected by companies like Webilok IT Services and Mehta Expai.',
      tags: ['Placement Fair', 'Industry Connect', 'Career Opportunities', 'District Level'],
      images: []
    },
    {
      title: 'Voter Awareness Program',
      date: 'May 5, 2022',
      category: 'awareness',
      description: 'NSS unit organized drawing and essay competitions to create voting awareness among students. Winners were encouraged with certificates and prizes.',
      tags: ['Voter Awareness', 'NSS Activity', 'Democracy', 'Student Competition'],
      images: []
    },
    {
      title: 'International Yoga Day Celebration',
      date: 'June 21, 2022',
      category: 'awareness',
      description: 'Various yoga asanas demonstrated by yoga teacher with enthusiastic participation from officials, employees and students.',
      tags: ['Yoga Day', 'Health Awareness', 'Wellness', 'International Day'],
      images: []
    },
    {
      title: 'SSIP Activities - School Outreach',
      date: 'Throughout the year',
      category: 'community',
      description: 'Students contributed as experts in practical sessions at Vidhya Mandir School, Palanpur for 5th to 8th standard students. Sessions on robotics and drone making conducted. Bootcamp at Jasra Primary School also organized.',
      tags: ['SSIP', 'School Outreach', 'Robotics', 'Community Service'],
      images: []
    }
  ],

  messages: {
    principal: {
      name: 'Principal Name (Not specified in PDF)',
      designation: 'Principal, Government Polytechnic Palanpur',
      message: `Technology is the fuel for the society; it provides means to ease human lives, and Government Polytechnic, Palanpur is one of the institutes that provide skilled and ethical engineers to the society. This institute runs basic to advance engineering programs. Electronics and communication engineering department is one which stands ahead in terms of technology and advancements. The department is well equipped with the resources to prepare competent and industry ready EC engineers catering the needs of industries, innovators, and entrepreneurs with moral values. It is my great pleasure to see the first band (Volume 1) of the "Spectrum", e-newsletter of Electronics and Communication Department being published.`
    },
    hod: {
      name: 'S. J. Chauhan',
      designation: 'Head of Department - Electronics & Communication Engineering',
      message: `Electronics and communication engineering field has witnessed the evolution of semiconductor from vacuum tubes to MOSFETs, from telephones to 5G smart phones. Continuing the evolutionary tradition of the branch, it gives me immense pleasure to present its first yearly newsletter "Spectrum". Spectrum intends to provide a platform for faculties, students, and all other stakeholders to share and receive news of latest updates of the activities carried out in the department. This newsletter will also be publishing achievements of staff members and students. I expect students to take the 'Spectrum' to new heights. A lot of hard work has gone into publishing this, and every stakeholder's involvement will encourage us further. I extend my full cooperation and best wishes to the entire team behind Spectrum.`
    },
    editorial: {
      name: 'Editorial Team',
      designation: 'Ms. Mittal K Pedhadiya & Mr. Milav J Dabgar, Lecturers, EC Department',
      message: `It gives us an immense pleasure to release the first band of "Spectrum" a Newsletter of EC Engineering. Continuous motivation and guidance by HoD made the first release of this band a success. We are also thankful to the principal of our institute to provide us a platform. To make upcoming Band's of our Spectrum more informative and innovative feedbacks are welcome from all the stakeholders.`
    }
  },
  
  vision: "To prepare competent diploma level electronics and communication engineers, catering the needs of industries and society as an excellent employee, innovator, and entrepreneur with moral values.",
  
  mission: "• Provide quality education in the field of EC engineering.\n• Develop state of art laboratories, classrooms, and up gradation of Faculties.\n• Strengthen industrial liaison by offering mutual beneficiaries services.\n• Execute extra-curricular and co-curricular activities to inculcate innovation, entrepreneurship, and moral values.",
  
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
