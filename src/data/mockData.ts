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
  { q: "How does Namso work?", a: "You describe your business problem, and Namso scopes the project, matches you with a vetted applied AI builder, and manages delivery. Your payment is held in escrow and only released after you approve the work." },
  { q: "Who are the builders on Namso?", a: "Vetted applied AI professionals with hands-on experience building automation systems, workflows, and intelligent tools for businesses. Every builder is reviewed before joining the platform." },
  { q: "How much do projects cost?", a: "Projects start from €550 and vary based on complexity and scope. Every solution listing shows a transparent starting price, and final scope is agreed before work begins." },
  { q: "How do payments work?", a: "Payments are processed securely through our platform. Funds are held in escrow and only released when you review and approve the completed work." },
  { q: "What if I'm not satisfied with the work?", a: "You can request revisions if the deliverables need adjustments. If a project isn't delivered as agreed, our team provides support and a fair resolution process." },
  { q: "How fast is delivery?", a: "Most systems are delivered within 1–3 weeks depending on complexity. Timelines are agreed during the scoping phase before work begins." },
  { q: "Is Namso available in my country?", a: "Yes. Namso is a global platform. Businesses from anywhere can submit projects and work with builders worldwide." },
  { q: "Is my payment information safe?", a: "All payments are processed through secure, encrypted payment processing. We never store your card details directly. Funds are held in escrow until you approve the work." },
  { q: "Can I work with the same builder again?", a: "Absolutely. Many businesses start with a single project and build ongoing relationships with their preferred builders for continuous AI implementation." },
  { q: "What AI tools do builders use?", a: "Our builders are proficient in tools like ChatGPT, Zapier, Make, n8n, Notion AI, Google Workspace, Airtable, and many more. Each builder profile lists their specific skills and toolset." },
];
