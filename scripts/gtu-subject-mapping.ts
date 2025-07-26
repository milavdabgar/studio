// Comprehensive GTU Diploma Subject Name Mapping
// Based on actual GTU Diploma syllabus for academic year 2024-25

export const GTU_SUBJECT_MAPPINGS: Record<string, any> = {
  // First Semester - Common Subjects
  'DI01000011': { 
    name: 'Applied Mathematics - I', 
    category: 'Basic Science', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 1, 
    practicalHours: 0,
    description: 'Differential and Integral Calculus, Matrices, Determinants'
  },
  'DI01000021': { 
    name: 'Applied Physics - I', 
    category: 'Basic Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Mechanics, Heat, Sound, and Optics'
  },
  'DI01000031': { 
    name: 'Applied Chemistry', 
    category: 'Basic Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'General Chemistry, Organic Chemistry, Physical Chemistry'
  },
  'DI01000041': { 
    name: 'Communication Skills in English', 
    category: 'Humanities', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 1,
    description: 'Grammar, Vocabulary, Writing Skills, Presentation Skills'
  },
  'DI01000051': { 
    name: 'Computer Programming and Utilization', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Programming fundamentals, C Programming, Problem Solving'
  },
  'DI01000061': { 
    name: 'Basic Electronics', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Electronic devices, circuits, digital basics'
  },
  'DI01000071': { 
    name: 'Computer Fundamental and Programming', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 2, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Computer basics, Operating systems, Programming concepts'
  },
  'DI01000081': { 
    name: 'Basic Electrical Engineering', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Circuit analysis, electrical measurements, AC/DC circuits'
  },
  'DI01000091': { 
    name: 'Applied Mathematics - II', 
    category: 'Basic Science', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 1, 
    practicalHours: 0,
    description: 'Differential equations, Laplace transforms, Statistics'
  },
  'DI01000101': { 
    name: 'Communication Skills', 
    category: 'Humanities', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 0,
    description: 'Business communication, Technical writing, Soft skills'
  },
  'DI01000111': { 
    name: 'Engineering Graphics and Design', 
    category: 'Engineering Science', 
    isTheory: false, 
    lectureHours: 1, 
    tutorialHours: 0, 
    practicalHours: 4,
    description: 'Technical drawing, CAD, Geometric constructions'
  },
  'DI01000121': { 
    name: 'Workshop Practice', 
    category: 'Engineering Science', 
    isTheory: false, 
    lectureHours: 0, 
    tutorialHours: 0, 
    practicalHours: 6,
    description: 'Hands-on training in workshop operations and safety'
  },
  'DI01000131': { 
    name: 'Environmental Science and Disaster Management', 
    category: 'Basic Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 0,
    description: 'Environmental issues, Pollution control, Disaster preparedness'
  },
  'DI01000141': { 
    name: 'Elements of Mechanical Engineering', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Basic mechanical systems, Materials, Manufacturing processes'
  },
  'DI01000151': { 
    name: 'Elements of Civil Engineering', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Construction materials, Surveying basics, Structural elements'
  },
  'DI01000161': { 
    name: 'Elements of Electrical Engineering', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Electrical systems, Power generation, Motor basics'
  },
  'DI01000171': { 
    name: 'Engineering Mechanics', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 1, 
    practicalHours: 0,
    description: 'Statics, Dynamics, Force analysis, Equilibrium'
  },
  'DI01000181': { 
    name: 'Engineering Materials and Metallurgy', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 1,
    description: 'Material properties, Heat treatment, Material testing'
  },
  'DI01000191': { 
    name: 'Thermodynamics', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 1, 
    practicalHours: 0,
    description: 'Laws of thermodynamics, Heat engines, Refrigeration cycles'
  },

  // Civil Engineering Specific Subjects
  'DI01006011': { 
    name: 'Surveying', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 3,
    description: 'Land surveying, Leveling, Theodolite operations'
  },
  'DI01006021': { 
    name: 'Building Construction and Materials', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Construction techniques, Building materials, Estimation'
  },
  'DI02006011': { 
    name: 'Concrete Technology', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Concrete mix design, Testing, Quality control'
  },
  'DI03006011': { 
    name: 'Structural Analysis', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 1, 
    practicalHours: 0,
    description: 'Analysis of beams, trusses, and frames'
  },
  'DI03006021': { 
    name: 'Soil Mechanics and Foundation Engineering', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Soil properties, Foundation design, Site investigation'
  },
  'DI03006031': { 
    name: 'Hydraulics and Fluid Mechanics', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 1, 
    practicalHours: 1,
    description: 'Fluid properties, Flow measurement, Pipe flow'
  },
  'DI03006041': { 
    name: 'Transportation Engineering', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Highway design, Traffic engineering, Pavement design'
  },
  'DI03006051': { 
    name: 'Environmental Engineering', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 1,
    description: 'Water treatment, Waste management, Pollution control'
  },
  'DI03006061': { 
    name: 'Quantity Surveying and Valuation', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Cost estimation, Contract management, Valuation methods'
  },

  // Electrical Engineering Specific Subjects
  'DI01009011': { 
    name: 'Electrical Machines - I', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'DC machines, Transformers, AC fundamentals'
  },
  'DI02009011': { 
    name: 'Electrical Machines - II', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Induction motors, Synchronous machines, Special machines'
  },
  'DI03009011': { 
    name: 'Power Systems', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Power generation, Transmission, Distribution systems'
  },
  'DI03009021': { 
    name: 'Electrical Installation and Estimating', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 3,
    description: 'Wiring systems, Cost estimation, Safety regulations'
  },
  'DI03000071': { 
    name: 'Control Systems and Instrumentation', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Control theory, Instrumentation, Process control'
  },
  'DI03000081': { 
    name: 'Power Electronics', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Power devices, Converters, Motor drives'
  },

  // Electronics & Communication Specific Subjects
  'DI02011011': { 
    name: 'Electronic Devices and Circuits', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Diodes, Transistors, Amplifiers, Oscillators'
  },
  'DI03011011': { 
    name: 'Digital Electronics and Logic Design', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Logic gates, Combinational circuits, Sequential circuits'
  },
  'DI03011021': { 
    name: 'Communication Systems', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Analog and Digital communication, Modulation techniques'
  },
  'DI03011031': { 
    name: 'Microprocessors and Microcontrollers', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 3,
    description: '8085/8086 microprocessors, 8051 microcontroller'
  },
  'DI03000111': { 
    name: 'Network Analysis and Synthesis', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 1, 
    practicalHours: 0,
    description: 'Circuit analysis, Network theorems, Filter design'
  },
  'DI03000121': { 
    name: 'Electromagnetics and Antenna Theory', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 1, 
    practicalHours: 1,
    description: 'Electromagnetic waves, Antenna fundamentals, Wave propagation'
  },

  // Information Technology Specific Subjects
  'DI01016011': { 
    name: 'Programming in C', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 3,
    description: 'C programming fundamentals, Data structures, Algorithms'
  },
  'DI01016021': { 
    name: 'Computer Organization and Architecture', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 0,
    description: 'Computer architecture, Memory systems, I/O organization'
  },
  'DI01016031': { 
    name: 'Digital Electronics and Computer Fundamentals', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Digital logic, Number systems, Computer basics'
  },
  'DI02016011': { 
    name: 'Object Oriented Programming using C++', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 3,
    description: 'OOP concepts, C++ programming, Classes and objects'
  },
  'DI02016021': { 
    name: 'Data Structures', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Arrays, Linked lists, Stacks, Queues, Trees'
  },
  'DI03016011': { 
    name: 'Database Management Systems', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Database design, SQL, Normalization, Transactions'
  },
  'DI03016021': { 
    name: 'Computer Networks', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Network protocols, TCP/IP, LAN/WAN technologies'
  },
  'DI03016031': { 
    name: 'Operating Systems', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Process management, Memory management, File systems'
  },
  'DI03016041': { 
    name: 'Software Engineering', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'SDLC, Software design, Testing, Project management'
  },
  'DI03016051': { 
    name: 'Web Technology', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 3,
    description: 'HTML, CSS, JavaScript, Server-side programming'
  },
  'DI03016061': { 
    name: 'Java Programming', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 3,
    description: 'Java fundamentals, OOP in Java, GUI programming'
  },

  // Mechanical Engineering Specific Subjects
  'DI02000111': { 
    name: 'Strength of Materials', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 1, 
    practicalHours: 0,
    description: 'Stress, Strain, Bending, Torsion, Deflection'
  },
  'DI02000121': { 
    name: 'Theory of Machines', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Kinematics, Dynamics, Cam design, Gear trains'
  },
  'DI03000141': { 
    name: 'Machine Design', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Design of machine elements, Shafts, Gears, Bearings'
  },
  'DI03000151': { 
    name: 'Fluid Mechanics and Hydraulic Machines', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Fluid properties, Pumps, Turbines, Hydraulic systems'
  },
  'DI03000161': { 
    name: 'Heat Transfer and Thermal Engineering', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Heat transfer modes, Heat exchangers, Boilers'
  },
  'DI03000171': { 
    name: 'Manufacturing Technology', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 3,
    description: 'Machining processes, Welding, Casting, Forming'
  },
  'DI03000201': { 
    name: 'Industrial Engineering and Management', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Production planning, Quality control, Industrial safety'
  },
  'DI03019011': { 
    name: 'Automobile Engineering', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Engine systems, Transmission, Chassis, Vehicle dynamics'
  },

  // Computer Engineering Specific Subjects
  'DI01032011': { 
    name: 'Computer Programming and Problem Solving', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 3,
    description: 'Programming logic, C programming, Problem solving techniques'
  },
  'DI02032011': { 
    name: 'Data Structures and Algorithms', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Linear and non-linear data structures, Algorithm analysis'
  },
  'DI03032011': { 
    name: 'Object Oriented Programming', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 3,
    description: 'OOP principles, Java/C++ programming, Design patterns'
  },
  'DI03032021': { 
    name: 'Database Management and Organization', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Relational databases, SQL, Database design, Optimization'
  },
  'DI03032031': { 
    name: 'Computer Networks and Security', 
    category: 'Professional Core', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Network protocols, Network security, Cryptography'
  },

  // Second Semester Common Subjects
  'DI02000011': { 
    name: 'Applied Mathematics - III', 
    category: 'Basic Science', 
    isTheory: true, 
    lectureHours: 4, 
    tutorialHours: 1, 
    practicalHours: 0,
    description: 'Vector calculus, Partial differential equations, Complex analysis'
  },
  'DI02000021': { 
    name: 'Applied Physics - II', 
    category: 'Basic Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Electricity, Magnetism, Modern physics, Semiconductor physics'
  },
  'DI02000051': { 
    name: 'Basic Civil Engineering', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Construction materials, Surveying, Building construction'
  },
  'DI02000061': { 
    name: 'Basic Mechanical Engineering', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Manufacturing processes, Machine tools, Engineering materials'
  },
  'DI02000071': { 
    name: 'Engineering Drawing', 
    category: 'Engineering Science', 
    isTheory: false, 
    lectureHours: 1, 
    tutorialHours: 0, 
    practicalHours: 4,
    description: 'Orthographic projections, Sectional views, Assembly drawings'
  },
  'DI02000081': { 
    name: 'Basic Electronics and Communication', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Electronic circuits, Communication principles, Digital systems'
  },
  'DI02000131': { 
    name: 'Gujarati', 
    category: 'Humanities', 
    isTheory: true, 
    lectureHours: 2, 
    tutorialHours: 0, 
    practicalHours: 0,
    description: 'Gujarati language and literature'
  },
  'DI02000141': { 
    name: 'Principles of Economics', 
    category: 'Humanities', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 0,
    description: 'Microeconomics, Macroeconomics, Economic principles'
  },
  'DI02000151': { 
    name: 'Sociology', 
    category: 'Humanities', 
    isTheory: true, 
    lectureHours: 2, 
    tutorialHours: 0, 
    practicalHours: 0,
    description: 'Social structures, Social issues, Community development'
  },
  'DI02000161': { 
    name: 'Electrical Technology', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Electrical measurements, AC/DC circuits, Electrical machines'
  },
  'DI02000171': { 
    name: 'Electronic Technology', 
    category: 'Engineering Science', 
    isTheory: true, 
    lectureHours: 3, 
    tutorialHours: 0, 
    practicalHours: 2,
    description: 'Electronic devices, Digital electronics, Communication systems'
  }
};

// Helper function to get subject details with fallback
export function getGTUSubjectDetails(subcode: string, branchCode?: string, semester?: number): any {
  // Try exact match first
  if (GTU_SUBJECT_MAPPINGS[subcode]) {
    return GTU_SUBJECT_MAPPINGS[subcode];
  }
  
  // Generate fallback based on patterns
  const isCommon = subcode.includes('000');
  const semesterNum = semester || parseInt(subcode.substring(2, 4));
  
  let category = 'Professional Core';
  let name = `Subject ${subcode}`;
  let isTheory = true;
  let lectureHours = 3;
  let tutorialHours = 0;
  let practicalHours = 2;
  
  // Generate meaningful names based on branch and semester
  if (branchCode && semester) {
    const branchNames = {
      '06': 'Civil Engineering',
      '09': 'Electrical Engineering',
      '11': 'Electronics & Communication',
      '16': 'Information Technology', 
      '19': 'Mechanical Engineering',
      '32': 'Computer Engineering'
    };
    
    const branchName = branchNames[branchCode as keyof typeof branchNames];
    
    if (isCommon) {
      if (semester <= 2) {
        category = 'Basic Science';
        name = `Basic Science Subject - Semester ${semester}`;
      } else {
        category = 'Engineering Science';
        name = `Engineering Science Subject - Semester ${semester}`;
      }
    } else {
      name = `${branchName} - Semester ${semester} Subject`;
    }
  }
  
  return {
    name,
    category,
    isTheory,
    lectureHours,
    tutorialHours,
    practicalHours,
    description: `${name} - Course content as per GTU syllabus`
  };
}