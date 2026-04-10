export type ServiceTier = "core" | "premium";

export interface ServiceConfig {
  id: string;
  translationKey: string;
  descriptionKey: string;
  outcomeKey: string;
  startingPrice: number;
  tier: ServiceTier;
  icon: string;
}

export const servicesConfig: ServiceConfig[] = [
  {
    id: "workflow-automation-system",
    translationKey: "services.workflow_automation",
    descriptionKey: "services.workflow_automation_desc",
    outcomeKey: "services.workflow_automation_outcome",
    startingPrice: 750,
    tier: "premium",
    icon: "Workflow",
  },
  {
    id: "chatbot-lead-capture-system",
    translationKey: "services.chatbot_lead_capture",
    descriptionKey: "services.chatbot_lead_capture_desc",
    outcomeKey: "services.chatbot_lead_capture_outcome",
    startingPrice: 950,
    tier: "premium",
    icon: "MessageSquare",
  },
  {
    id: "email-communication-system",
    translationKey: "services.email_communication",
    descriptionKey: "services.email_communication_desc",
    outcomeKey: "services.email_communication_outcome",
    startingPrice: 650,
    tier: "core",
    icon: "Mail",
  },
  {
    id: "website-conversion-system",
    translationKey: "services.website_conversion",
    descriptionKey: "services.website_conversion_desc",
    outcomeKey: "services.website_conversion_outcome",
    startingPrice: 650,
    tier: "core",
    icon: "Globe",
  },
  {
    id: "data-intelligence-system",
    translationKey: "services.data_intelligence",
    descriptionKey: "services.data_intelligence_desc",
    outcomeKey: "services.data_intelligence_outcome",
    startingPrice: 550,
    tier: "core",
    icon: "Database",
  },
  {
    id: "research-analysis-system",
    translationKey: "services.research_analysis",
    descriptionKey: "services.research_analysis_desc",
    outcomeKey: "services.research_analysis_outcome",
    startingPrice: 550,
    tier: "core",
    icon: "Search",
  },
];
