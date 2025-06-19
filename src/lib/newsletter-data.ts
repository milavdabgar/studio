// Centralized Newsletter Data Source
// This ensures consistency between the interactive UI and export functionality

export interface EventImage {
  src: string;
  alt: string;
  caption: string;
}

export interface Event {
  title: string;
  date: string;
  description: string;
  images: EventImage[];
  tags?: string[];
  category?: 'workshop' | 'training' | 'visit' | 'awareness' | 'community' | 'orientation';
}

export interface Achievement {
  category: string;
  items: string[];
}

export interface Placement {
  company: string;
  package: string;
  students: number;
  position: string;
}

export interface Stat {
  label: string;
  value: number;
  color: string;
}

export interface Message {
  name: string;
  designation: string;
  message: string;
}

export interface NewsletterData {
  stats: Stat[];
  achievements: Achievement[];
  placements: Placement[];
  events: Event[];
  messages: {
    principal: Message;
    hod: Message;
    editorial: Message;
  };
  vision: string;
  mission: string;
  logos?: Array<{
    src: string;
    alt: string;
  }>;
  contact: {
    email: string;
    phone: string;
    address: string;
    website: string;
  };
}

// Centralized Newsletter Data - Single Source of Truth
export const newsletterData: NewsletterData = {
  stats: [
    { label: 'Placement Rate', value: 100, color: 'bg-blue-500' },
    { label: 'Research Papers', value: 20, color: 'bg-green-500' },
    { label: 'Students Placed', value: 4, color: 'bg-purple-500' },
    { label: 'Highest Package (L)', value: 4.5, color: 'bg-orange-500' },
  ],
  
  achievements: [
    {
      category: 'Faculty Excellence',
      items: [
        'Prof. Nirav J. Chauhan - Leading NCET-2024 conference organization and research excellence',
        'Ms. Mittal K. Pedhadiya - Editorial excellence and academic coordination',
        'Mr. Milav J. Dabgar - Technical innovation and newsletter coordination',
        'Faculty Research Team - Multiple publications in reputed journals'
      ]
    },
    {
      category: 'Student Success',
      items: [
        'Sahil S. Vaghela - Placed at Micron Technology as Process Technician (₹4.5L)',
        'Bharat S. Pawar - Placed at Micron Technology as Manufacturing Associate (₹3.7L)',
        'Maitri R. Patel - Placed at TDSC Becharaji as Trainee Engineer (₹3.0L)',
        'Stutiben A. Raval - Placed at TDSC Becharaji as Trainee Engineer (₹3.0L)',
        'Srujal Y. Chaudhary - Pursuing B.E. at VEGC, Chandkheda for higher studies'
      ]
    },
    {
      category: 'Research & Innovation',
      items: [
        'SSIP initiatives with ₹50,000 prize-winning rover project',
        'Multiple patents filed in electronics and communication domain',
        'Industry collaborations for practical learning',
        'Student innovation projects receiving state-level recognition'
      ]
    }
  ],
  
  placements: [
    { company: 'Micron Technology', package: '₹4.5L', students: 2, position: 'Process Technician / Manufacturing Associate' },
    { company: 'TDSC Becharaji', package: '₹3.0L', students: 2, position: 'Trainee Engineer' }
  ],
  
  events: [
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
          alt: 'PCB Manufacturing Line',
          caption: 'PCB Manufacturing Line'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0008-1024x472.jpg',
          alt: 'Industrial Equipment',
          caption: 'Industrial Equipment'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20240316-WA0011-1024x472.jpg',
          alt: 'Technical Demonstration',
          caption: 'Technical Demonstration'
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
        }
      ]
    }
  ],
  
  messages: {
    principal: {
      name: 'Dr. Rajesh Kumar Sharma',
      designation: 'Principal, Government Polytechnic Palanpur',
      message: `Dear Students, Faculty, and Stakeholders,

It gives me immense pleasure to introduce this edition of "Spectrum," the newsletter of our Electronics & Communication Engineering Department. Our institution, established in 1984, has been a beacon of technical education in North Gujarat, consistently producing skilled professionals who contribute significantly to the industry and society.

The academic year 2023-24 has been remarkable for our EC department, with students excelling in competitions, faculty contributing to research, and our SSIP cell fostering innovation. Our focus remains on providing quality education that blends theoretical knowledge with practical skills, preparing our students for the dynamic world of technology.

I congratulate the entire EC department team for their dedication and encourage our students to continue their pursuit of excellence.`
    },
    hod: {
      name: 'Prof. Nirav J. Chauhan',
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
  
  // Additional properties for export functionality
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
