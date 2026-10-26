/**
 * OFFICIAL — JYC Student Council 2026–2027, transcribed from the council list supplied by JYC.
 * Do not add or edit names/positions without an updated official list.
 * Council member records are served by the backend; this file keeps the supplied official labels and notes.
 */
export type CouncilMember = {
  name: string;
  designation: string;
  group: string;
  enrollment: string;
  photoUrl?: string | null;
};

type Row = [string, string, string];

const groups: Record<string, Row[]> = {
  "Executive Council": [
    ["General Secretary", "Khushi Bhardwaj", "8824103104"],
    ["General Secretary", "Vikas", "8824103101"],
    ["Operations Head", "Rashi Tyagi", "8824201012"],
    ["Operations Head", "Aadi Jain", "8824103003"],
    ["Treasurer", "Radhika Garg", "8824103022"],
  ],
  "Cultural Hub": [
    ["Secretary", "Yashi Goyal", "8824103050"],
    ["Joint Secretary (Dance Folk)", "Riya Chaudhary", "8825202019"],
    ["Joint Secretary (Dance Contemporary)", "Kanak Rajora", "8825202041"],
    ["Joint Secretary (Drama)", "Anshika Mishra", "8825103063"],
    ["Joint Secretary (Eventronics)", "Bhavya Aggarwal", "8825103002"],
    ["Joint Secretary (Stage)", "Shivansh Pandey", "8825103015"],
    ["Joint Secretary (Music)", "Anushka Chauhan", "8825209076"],
  ],
  "Visual Art Hub": [
    ["Secretary", "Kavita", "8824103041"],
    ["Joint Secretary", "Nishant", "8824209089"],
    ["Joint Secretary", "Priyanshi", "8825208007"],
  ],
  "AI & Coding Hub": [
    ["Secretary", "Preet Choudhary", "8825103013"],
    ["Joint Secretary", "Kaif", "8825103100"],
    ["Joint Secretary", "Keshav", "8825107005"],
    ["Joint Secretary", "Samiksha", "8825209051"],
    ["Joint Secretary", "Anirudh Saxena", "8825209040"],
  ],
  "Literary Hub": [
    ["Secretary", "Palak Chaudhary", "8824103047"],
    ["Joint Secretary (Debate, Extempore)", "Priyanshu Sharma", "8824103082"],
    ["Joint Secretary (MUN, TedX)", "Devansh Joshi", "8824103087"],
  ],
  "Sports Hub": [
    ["Secretary", "Kashish Parmar", "8824202005"],
    ["Joint Secretary", "Nikhil Pratap Singh", "8824103040"],
    ["Joint Secretary", "Taranjeet Singh", "8825208012"],
    ["Joint Secretary", "Jasika", "8825208002"],
  ],
  "Business Hub": [
    ["Secretary", "Jyoti Chaturvedi", "8826502005"],
    ["Joint Secretary", "Deepak Sharma", "8826502015"],
    ["Joint Secretary", "Anamika Gaur", "8825203015"],
  ],
  "Tinkering Hub": [
    ["Secretary", "Lavish Giri", "8824103054"],
    ["Joint Secretary", "Yashi Singhal", "8824103015"],
    ["Joint Secretary", "Vishal Atri", "8824103089"],
  ],
  "Media Hub": [
    ["Secretary", "Sarthak Bhardwaj", "8824103043"],
    ["Joint Secretary (Photography)", "Piyush Kumar", "8824202035"],
    ["Joint Secretary (Content Creation)", "Chirag Goswami", "8825209057"],
  ],
  "Social Work Hub": [
    ["Secretary", "Rahul Sharma", "8824103110"],
    ["Joint Secretary", "Priyanka", "8824103055"],
  ],
  "Alumni Hub": [
    ["Secretary", "Prashant Sharma", "8824103103"],
    ["Joint Secretary", "Adish Goyal", "8824103092"],
  ],
};

export const COUNCIL_YEAR = "2026–2027";
export const COUNCIL_GROUPS = Object.keys(groups);
export const COUNCIL: CouncilMember[] = Object.entries(groups).flatMap(([group, rows]) =>
  rows.map(([designation, name, enrollment]) => ({ group, designation, name, enrollment })),
);

export const COUNCIL_NOTES = [
  "All nominations are provisional; lack of coordination among team members will lead to removal from positions.",
  "General Secretaries hold overall responsibility for PR and coordination among hubs.",
  "The Head of Operations is responsible for logistics, execution and daily administrative functions of council events and initiatives.",
  "The Treasurer oversees all financial transactions, budgets, expenditure tracking, institutional compliance and transparency of council funds.",
];
