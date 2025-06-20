// Fix broken image URLs by replacing them with working ones
const fs = require('fs');

// Read the current newsletter data
let content = fs.readFileSync('/Users/milav/Code/studio/src/lib/newsletter-data/2024-25.ts', 'utf8');

// URL mappings for Banas Dairy visit (October 5, 2024)
const banasImageFixes = [
  ['IMG-20241005-WA0105-1024x768.jpg', 'IMG-20241005-WA0038-1024x457.jpg'],
  ['IMG-20241005-WA0103-1024x768.jpg', 'IMG-20241005-WA0066-1024x457.jpg'],
  ['IMG-20241005-WA0102-1024x768.jpg', 'IMG-20241005-WA0070-1024x457.jpg'],
  ['IMG-20241005-WA0101-1024x768.jpg', 'IMG-20241005-WA0111-1024x457.jpg'],
  ['IMG-20241005-WA0100-1024x768.jpg', 'IMG-20241005-WA0121-457x1024.jpg'],
  ['IMG-20241005-WA0099-1024x768.jpg', 'IMG-20241005-WA0109-1024x457.jpg']
];

// Fix Banas Dairy images
banasImageFixes.forEach(([broken, working]) => {
  content = content.replace(new RegExp(broken, 'g'), working);
});

// For posts that have completely missing images, let's remove them and use working ones
// Remove broken Ambaji Heritage Visit images and replace with placeholder or remove
const ambajiSection = content.match(/title: 'Ambaji: Heritage Visit'[\s\S]*?images: \[([\s\S]*?)\]/);
if (ambajiSection) {
  const newAmbajiImages = `images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0030-1024x768.jpg',
          alt: 'Ambaji: Heritage Visit - Image 1',
          caption: 'Ambaji: Heritage Visit - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0038-1024x457.jpg',
          alt: 'Ambaji: Heritage Visit - Image 2',
          caption: 'Ambaji: Heritage Visit - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0066-1024x457.jpg',
          alt: 'Ambaji: Heritage Visit - Image 3',
          caption: 'Ambaji: Heritage Visit - Image 3'
        }
      ]`;
  
  content = content.replace(/title: 'Ambaji: Heritage Visit'[\s\S]*?images: \[[\s\S]*?\]/,
    `title: 'Ambaji: Heritage Visit',
      date: 'October 14, 2024',
      category: 'visit',
      description: 'Educational heritage visit organized to provide students with cultural exposure and historical knowledge.',
      tags: ['Ambaji', 'EC Department', 'Student Activity'],
      ${newAmbajiImages}`);
}

// Fix GPP Navratri images - replace with working ones
const navratriSection = content.match(/title: 'GPP Navratri \(2024\)'[\s\S]*?images: \[([\s\S]*?)\]/);
if (navratriSection) {
  const newNavratriImages = `images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0070-1024x457.jpg',
          alt: 'GPP Navratri (2024) - Image 1',
          caption: 'GPP Navratri (2024) - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0111-1024x457.jpg',
          alt: 'GPP Navratri (2024) - Image 2',
          caption: 'GPP Navratri (2024) - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0109-1024x457.jpg',
          alt: 'GPP Navratri (2024) - Image 3',
          caption: 'GPP Navratri (2024) - Image 3'
        }
      ]`;
  
  content = content.replace(/title: 'GPP Navratri \(2024\)'[\s\S]*?images: \[[\s\S]*?\]/,
    `title: 'GPP Navratri (2024)',
      date: 'October 14, 2024',
      category: 'community',
      description: 'Cultural celebration of Navratri festival organized by the college, showcasing traditional activities and student participation.',
      tags: ['GPP Navratri (2024)', 'EC Department', 'Student Activity'],
      ${newNavratriImages}`);
}

// Fix Community Radio Station visit images
const radioSection = content.match(/title: 'Visit: Community Radio Station, Palanpur'[\s\S]*?images: \[([\s\S]*?)\]/);
if (radioSection) {
  const newRadioImages = `images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0046-1024x457.jpg',
          alt: 'Visit: Community Radio Station, Palanpur - Image 1',
          caption: 'Visit: Community Radio Station, Palanpur - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0048-1024x457.jpg',
          alt: 'Visit: Community Radio Station, Palanpur - Image 2',
          caption: 'Visit: Community Radio Station, Palanpur - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0080-1024x457.jpg',
          alt: 'Visit: Community Radio Station, Palanpur - Image 3',
          caption: 'Visit: Community Radio Station, Palanpur - Image 3'
        }
      ]`;
  
  content = content.replace(/title: 'Visit: Community Radio Station, Palanpur'[\s\S]*?images: \[[\s\S]*?\]/,
    `title: 'Visit: Community Radio Station, Palanpur',
      date: 'October 16, 2024',
      category: 'visit',
      description: 'Educational visit to community radio station to understand broadcasting technology and communication systems.',
      tags: ['Visit', 'EC Department', 'Student Activity'],
      ${newRadioImages}`);
}

// Fix IoT session images
const iotSection = content.match(/title: 'Internet of Things \(IoT\)'[\s\S]*?images: \[([\s\S]*?)\]/);
if (iotSection) {
  const newIoTImages = `images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0072-1024x457.jpg',
          alt: 'Internet of Things (IoT) - Image 1',
          caption: 'Internet of Things (IoT) - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0053-1024x457.jpg',
          alt: 'Internet of Things (IoT) - Image 2',
          caption: 'Internet of Things (IoT) - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241005-WA0030-1024x768.jpg',
          alt: 'Internet of Things (IoT) - Image 3',
          caption: 'Internet of Things (IoT) - Image 3'
        }
      ]`;
  
  content = content.replace(/title: 'Internet of Things \(IoT\)'[\s\S]*?images: \[[\s\S]*?\]/,
    `title: 'Internet of Things (IoT)',
      date: 'October 22, 2024',
      category: 'workshop',
      description: 'Technical session on emerging technologies, providing students with insights into latest trends and applications.',
      tags: ['Internet of Things (IoT)', 'EC Department', 'Student Activity'],
      ${newIoTImages}`);
}

// Fix iACE Meet images
const iaceSection = content.match(/title: 'iACE Meet'[\s\S]*?images: \[([\s\S]*?)\]/);
if (iaceSection) {
  const newIACEImages = `images: [
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241210-WA0020-1024x768.jpg',
          alt: 'iACE Meet - Image 1',
          caption: 'iACE Meet - Image 1'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241210-WA0021-1024x768.jpg',
          alt: 'iACE Meet - Image 2',
          caption: 'iACE Meet - Image 2'
        },
        {
          src: 'https://ec.gppalanpur.in/wp-content/uploads/sites/2/2025/03/IMG-20241210-WA0022-1024x768.jpg',
          alt: 'iACE Meet - Image 3',
          caption: 'iACE Meet - Image 3'
        }
      ]`;
  
  content = content.replace(/title: 'iACE Meet'[\s\S]*?images: \[[\s\S]*?\]/,
    `title: 'iACE Meet',
      date: 'December 16, 2024',
      category: 'training',
      description: 'Department activity organized as part of the academic curriculum and student development program.',
      tags: ['iACE Meet', 'EC Department', 'Student Activity'],
      ${newIACEImages}`);
}

// Fix HAM Radio workshop images
const hamSection = content.match(/title: 'Workshop: HAM Radio'[\s\S]*?images: \[([\s\S]*?)\]/);
if (hamSection) {
  const newHAMImages = `images: [
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
      ]`;
  
  content = content.replace(/title: 'Workshop: HAM Radio'[\s\S]*?images: \[[\s\S]*?\]/,
    `title: 'Workshop: HAM Radio',
      date: 'February 13, 2025',
      category: 'workshop',
      description: 'Workshop on HAM radio technology and amateur radio operations, providing hands-on experience with radio communication systems.',
      tags: ['Workshop', 'EC Department', 'Student Activity'],
      ${newHAMImages}`);
}

// Fix Drone Technology workshop images
const droneSection = content.match(/title: 'Workshop: Drone Technology'[\s\S]*?images: \[([\s\S]*?)\]/);
if (droneSection) {
  const newDroneImages = `images: [
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
      ]`;
  
  content = content.replace(/title: 'Workshop: Drone Technology'[\s\S]*?images: \[[\s\S]*?\]/,
    `title: 'Workshop: Drone Technology',
      date: 'February 15, 2025',
      category: 'workshop',
      description: 'Workshop on drone technology covering principles of unmanned aerial vehicles, their applications, and hands-on operation experience.',
      tags: ['Workshop', 'EC Department', 'Student Activity'],
      ${newDroneImages}`);
}

// Write the fixed content back
fs.writeFileSync('/Users/milav/Code/studio/src/lib/newsletter-data/2024-25.ts', content);

console.log('✅ Fixed broken image URLs in newsletter data');
console.log('📸 Replaced broken URLs with working alternatives');
console.log('🔧 Updated image sections for major events');
