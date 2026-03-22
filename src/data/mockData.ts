export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  deliveryDays: string;
  tags: string[];
  image: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export const categories = [
  "Chatbot Setup",
  "Workflow Automation",
  "AI Content Generation",
  "AI Image Creation",
  "Data Organization with AI",
  "AI Email Automation",
  "AI Research & Analysis",
  "AI Website Improvements",
  "AI Meeting Summaries",
  "AI Prompt Engineering",
];

export const services: Service[] = [
  {
    id: "s1",
    title: "Chatbot Setup",
    description: "Deploy a custom AI chatbot for your website that handles customer inquiries, provides instant support, and reduces response times — fully integrated with your existing tools.",
    category: "Chatbot Setup",
    price: 110,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "4–5",
    tags: ["Chatbot", "Support", "Website"],
    image: "",
  },
  {
    id: "s2",
    title: "Workflow Automation",
    description: "Automate repetitive business processes using tools like Zapier, Make, or n8n. Connect apps, trigger actions, and eliminate manual work across your tech stack.",
    category: "Workflow Automation",
    price: 70,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "3",
    tags: ["Zapier", "Automation", "Operations"],
    image: "",
  },
  {
    id: "s3",
    title: "AI Content Generation",
    description: "Generate high-quality marketing content using AI — social media copy, product descriptions, blog outlines, and website text tailored to your brand voice.",
    category: "AI Content Generation",
    price: 45,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "2",
    tags: ["Content", "Marketing", "Writing"],
    image: "",
  },
  {
    id: "s4",
    title: "AI Image Creation",
    description: "Create professional AI-generated visuals for marketing campaigns, social media, advertisements, and branded content.",
    category: "AI Image Creation",
    price: 55,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "2",
    tags: ["Images", "Design", "Marketing"],
    image: "",
  },
  {
    id: "s5",
    title: "Data Organization with AI",
    description: "Clean, structure, and optimize your business data using AI tools. Includes data normalization, deduplication, and preparation for analytics or reporting.",
    category: "Data Organization with AI",
    price: 40,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "2",
    tags: ["Data", "Spreadsheets", "Operations"],
    image: "",
  },
  {
    id: "s6",
    title: "AI Email Automation",
    description: "Set up intelligent email workflows — automated replies, follow-up sequences, and lead nurturing systems to streamline your communication.",
    category: "AI Email Automation",
    price: 80,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "3",
    tags: ["Email", "Automation", "Communication"],
    image: "",
  },
  {
    id: "s7",
    title: "AI Research & Analysis",
    description: "Leverage AI tools for competitive analysis, lead research, market intelligence, and structured industry reports tailored to your business.",
    category: "AI Research & Analysis",
    price: 50,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "2–3",
    tags: ["Research", "Leads", "Strategy"],
    image: "",
  },
  {
    id: "s8",
    title: "AI Website Improvements",
    description: "Enhance your website with AI-optimized copy, SEO-friendly content, improved landing pages, and conversion-focused product descriptions.",
    category: "AI Website Improvements",
    price: 65,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "3",
    tags: ["Website", "SEO", "Copy"],
    image: "",
  },
  {
    id: "s9",
    title: "AI Meeting Summaries",
    description: "Transform meeting recordings and transcripts into structured summaries with key decisions, action items, and follow-ups.",
    category: "AI Meeting Summaries",
    price: 30,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "1",
    tags: ["Meetings", "Summaries", "Notes"],
    image: "",
  },
  {
    id: "s10",
    title: "AI Prompt Engineering",
    description: "Get custom-engineered AI prompts optimized for your specific use cases — marketing, customer support, content creation, internal operations, and more.",
    category: "AI Prompt Engineering",
    price: 35,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "2",
    tags: ["Prompts", "AI", "Workflow"],
    image: "",
  },
];

export const reviews: Review[] = [];

export const faqs = [
  { q: "How does Namso work?", a: "Browse services or post a project. Choose a verified AI specialist, agree on scope and pricing, and they deliver the work. Your payment is held securely and only released after you approve." },
  { q: "Who are the specialists on Namso?", a: "Verified AI integration freelancers with hands-on experience implementing AI tools, automations, and intelligent workflows for businesses." },
  { q: "How much do services cost?", a: "Services typically range from €30 to €200 depending on complexity and scope. Each listing includes transparent pricing upfront." },
  { q: "How do payments work?", a: "Payments are processed securely through our platform. Funds are held in escrow and only released when you review and approve the completed work." },
  { q: "What if I'm not satisfied with the work?", a: "You can request revisions if the deliverables need adjustments. If a project isn't delivered as agreed, our team provides support and a fair resolution process." },
  { q: "How fast is delivery?", a: "Most projects are delivered within 1–5 business days depending on complexity. Each service listing includes an estimated delivery time." },
  { q: "Is Namso available in my country?", a: "Yes. Namso is a global platform. Businesses from anywhere can post projects and hire specialists worldwide." },
  { q: "Is my payment information safe?", a: "All payments are processed through secure, encrypted payment processing. We never store your card details directly. Funds are held in escrow until you approve the work." },
  { q: "Can I hire specialists for ongoing work?", a: "Absolutely. Many businesses start with a single project and establish ongoing relationships with their preferred specialists for continuous AI support." },
  { q: "What AI tools do specialists use?", a: "Our specialists are proficient in tools like ChatGPT, Zapier, Make, n8n, Notion AI, Google Workspace, Airtable, and many more. Each profile lists their specific skills and toolset." },
];
