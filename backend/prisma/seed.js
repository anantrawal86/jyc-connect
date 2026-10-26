import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Hub names, descriptions and council groups from the supplied project data.
// The Secretary listed for each matching council group is shown as that hub's lead.
const hubs = [
  { id: 'cultural', name: 'Cultural Hub', tagline: 'Dance, drama, music & stage', description: 'Celebrate traditions, festivals, dance, music and stagecraft together.', icon: 'drama', councilGroup: 'Cultural Hub' },
  { id: 'visual-art', name: 'Visual Art Hub', tagline: 'Make ideas visible', description: 'Sketching, painting, design and visual storytelling.', icon: 'palette', councilGroup: 'Visual Art Hub' },
  { id: 'ai-coding', name: 'AI & Coding Hub', tagline: 'Build, explore, solve', description: 'Build with code, explore AI and solve real problems together.', icon: 'code', councilGroup: 'AI & Coding Hub' },
  { id: 'literary', name: 'Literary Hub', tagline: 'Read, write, debate', description: 'Debate, extempore, MUN, TEDx and creative writing.', icon: 'book', councilGroup: 'Literary Hub' },
  { id: 'sports', name: 'Sports Hub', tagline: 'Play, compete, grow', description: 'Stay active, play as a team and push your limits.', icon: 'trophy', councilGroup: 'Sports Hub' },
  { id: 'business', name: 'Business Hub', tagline: 'Ideas into ventures', description: 'Turn ideas into ventures and learn how businesses work.', icon: 'briefcase', councilGroup: 'Business Hub' },
  { id: 'tinkering', name: 'Tinkering Hub', tagline: 'Prototype & experiment', description: 'Prototype, experiment and build hands-on projects.', icon: 'wrench', councilGroup: 'Tinkering Hub' },
  { id: 'media', name: 'Media Hub', tagline: 'Stories through lenses', description: 'Photography, video and content creation for campus life.', icon: 'camera', councilGroup: 'Media Hub' },
  { id: 'social-work', name: 'Social Work Hub', tagline: 'Create positive change', description: 'Community service and outreach that makes a difference.', icon: 'heart', councilGroup: 'Social Work Hub' },
  { id: 'alumni', name: 'Alumni Hub', tagline: 'Stay connected', description: 'Connect students and alumni for guidance and networking.', icon: 'globe', councilGroup: 'Alumni Hub' },
];
const groups = {
  'Executive Council': [
    ['General Secretary', 'Khushi Bhardwaj', '8824103104'], ['General Secretary', 'Vikas', '8824103101'], ['Operations Head', 'Rashi Tyagi', '8824201012'], ['Operations Head', 'Aadi Jain', '8824103003'], ['Treasurer', 'Radhika Garg', '8824103022'],
  ],
  'Cultural Hub': [
    ['Secretary', 'Yashi Goyal', '8824103050'], ['Joint Secretary (Dance Folk)', 'Riya Chaudhary', '8825202019'], ['Joint Secretary (Dance Contemporary)', 'Kanak Rajora', '8825202041'], ['Joint Secretary (Drama)', 'Anshika Mishra', '8825103063'], ['Joint Secretary (Eventronics)', 'Bhavya Aggarwal', '8825103002'], ['Joint Secretary (Stage)', 'Shivansh Pandey', '8825103015'], ['Joint Secretary (Music)', 'Anushka Chauhan', '8825209076'],
  ],
  'Visual Art Hub': [['Secretary', 'Kavita', '8824103041'], ['Joint Secretary', 'Nishant', '8824209089'], ['Joint Secretary', 'Priyanshi', '8825208007']],
  'AI & Coding Hub': [['Secretary', 'Preet Choudhary', '8825103013'], ['Joint Secretary', 'Kaif', '8825103100'], ['Joint Secretary', 'Keshav', '8825107005'], ['Joint Secretary', 'Samiksha', '8825209051'], ['Joint Secretary', 'Anirudh Saxena', '8825209040']],
  'Literary Hub': [['Secretary', 'Palak Chaudhary', '8824103047'], ['Joint Secretary (Debate, Extempore)', 'Priyanshu Sharma', '8824103082'], ['Joint Secretary (MUN, TedX)', 'Devansh Joshi', '8824103087']],
  'Sports Hub': [['Secretary', 'Kashish Parmar', '8824202005'], ['Joint Secretary', 'Nikhil Pratap Singh', '8824103040'], ['Joint Secretary', 'Taranjeet Singh', '8825208012'], ['Joint Secretary', 'Jasika', '8825208002']],
  'Business Hub': [['Secretary', 'Jyoti Chaturvedi', '8826502005'], ['Joint Secretary', 'Deepak Sharma', '8826502015'], ['Joint Secretary', 'Anamika Gaur', '8825203015']],
  'Tinkering Hub': [['Secretary', 'Lavish Giri', '8824103054'], ['Joint Secretary', 'Yashi Singhal', '8824103015'], ['Joint Secretary', 'Vishal Atri', '8824103089']],
  'Media Hub': [['Secretary', 'Sarthak Bhardwaj', '8824103043'], ['Joint Secretary (Photography)', 'Piyush Kumar', '8824202035'], ['Joint Secretary (Content Creation)', 'Chirag Goswami', '8825209057']],
  'Social Work Hub': [['Secretary', 'Rahul Sharma', '8824103110'], ['Joint Secretary', 'Priyanka', '8824103055']],
  'Alumni Hub': [['Secretary', 'Prashant Sharma', '8824103103'], ['Joint Secretary', 'Adish Goyal', '8824103092']],
};
try {
  for (const hub of hubs) {
    await prisma.hub.upsert({
      where: { id: hub.id },
      create: hub,
      // Preserve any images and event registration URLs already configured by an admin.
      update: { name: hub.name, tagline: hub.tagline, description: hub.description, icon: hub.icon, councilGroup: hub.councilGroup },
    });
  }
  let sortOrder = 0;
  for (const [group, rows] of Object.entries(groups)) for (const [designation, name, enrollment] of rows) {
    await prisma.councilMember.upsert({ where: { enrollment }, create: { id: enrollment, group, designation, name, enrollment, sortOrder }, update: { group, designation, name, sortOrder } }); sortOrder += 1;
  }
  await prisma.facultyCoordinator.upsert({
    where: { id: 'primary' },
    create: { id: 'primary', name: 'Dr. Rakhi Pandey', designation: 'Faculty Incharge (Student Welfare)' },
    update: {},
  });
  console.log('Council seed complete (official 2026–2027 list).');
} finally { await prisma.$disconnect(); }
