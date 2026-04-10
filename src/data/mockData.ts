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
  "Workflow Automation",
  "AI Chatbot & Lead Capture",
  "Email & Communication Automation",
  "Website Conversion & AI Optimization",
  "Data Structuring & Intelligence",
  "AI Research & Analysis",
];

export const services: Service[] = [
  {
    id: "s1",
    title: "Workflow Automation System",
    description: "Automate repetitive workflows by connecting tools and eliminating manual processes across your business.",
    category: "Workflow Automation",
    price: 750,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "5–10",
    tags: ["Automation", "Operations", "Efficiency"],
    image: "",
  },
  {
    id: "s2",
    title: "AI Chatbot & Lead Capture System",
    description: "Deploy AI chatbots to capture leads, handle support inquiries, and engage website visitors 24/7.",
    category: "AI Chatbot & Lead Capture",
    price: 950,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "7–14",
    tags: ["Chatbot", "Leads", "Support"],
    image: "",
  },
  {
    id: "s3",
    title: "Email & Communication Automation System",
    description: "Automate inbox management, email flows, and internal communication processes.",
    category: "Email & Communication Automation",
    price: 650,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "5–7",
    tags: ["Email", "Communication", "Automation"],
    image: "",
  },
  {
    id: "s4",
    title: "Website Conversion & AI Optimization System",
    description: "Improve website performance with AI-driven automation and optimized lead flows.",
    category: "Website Conversion & AI Optimization",
    price: 650,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "5–7",
    tags: ["Website", "Conversion", "Optimization"],
    image: "",
  },
  {
    id: "s5",
    title: "Data Structuring & Intelligence System",
    description: "Organize and automate data pipelines to improve operational efficiency and decision-making.",
    category: "Data Structuring & Intelligence",
    price: 550,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "3–7",
    tags: ["Data", "Intelligence", "Operations"],
    image: "",
  },
  {
    id: "s6",
    title: "AI Research & Analysis System",
    description: "Build systems that collect, analyze, and deliver actionable business insights automatically.",
    category: "AI Research & Analysis",
    price: 550,
    rating: 0,
    reviewCount: 0,
    deliveryDays: "3–7",
    tags: ["Research", "Analysis", "Strategy"],
    image: "",
  },
];

export const reviews: Review[] = [];

export const faqs = [
  { q: "How does Namso work?", a: "Browse our AI automation solutions or book a consultation call. Get matched with a verified specialist, agree on scope and pricing, and they deliver the system. Your payment is held securely and only released after you approve." },
  { q: "Who are the specialists on Namso?", a: "Verified AI automation professionals with hands-on experience building intelligent systems, automations, and workflows for businesses." },
  { q: "How much do solutions cost?", a: "Solutions start from €550 and vary based on complexity and scope. Each listing includes transparent starting prices upfront." },
  { q: "How do payments work?", a: "Payments are processed securely through our platform. Funds are held in escrow and only released when you review and approve the completed work." },
  { q: "What if I'm not satisfied with the work?", a: "You can request revisions if the deliverables need adjustments. If a project isn't delivered as agreed, our team provides support and a fair resolution process." },
  { q: "How fast is delivery?", a: "Most systems are delivered within 5–14 business days depending on complexity. Each solution listing includes an estimated delivery time." },
  { q: "Is Namso available in my country?", a: "Yes. Namso is a global platform. Businesses from anywhere can post projects and hire specialists worldwide." },
  { q: "Is my payment information safe?", a: "All payments are processed through secure, encrypted payment processing. We never store your card details directly. Funds are held in escrow until you approve the work." },
  { q: "Can I hire specialists for ongoing work?", a: "Absolutely. Many businesses start with a single project and establish ongoing relationships with their preferred specialists for continuous AI support." },
  { q: "What AI tools do specialists use?", a: "Our specialists are proficient in tools like ChatGPT, Zapier, Make, n8n, Notion AI, Google Workspace, Airtable, and many more. Each profile lists their specific skills and toolset." },
];
