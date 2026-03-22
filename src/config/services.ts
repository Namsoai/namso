export type ServiceTier = "low" | "medium" | "high";

export interface ServiceConfig {
  id: string;
  translationKey: string;
  previousPrice: number;
  agencyPrice: number;
  uplift: number;
  tier: ServiceTier;
}

export const servicesConfig: ServiceConfig[] = [
  {
    id: "ai-meeting-summaries",
    translationKey: "services.meeting_summaries",
    previousPrice: 60,
    agencyPrice: 150,
    uplift: 90,
    tier: "low",
  },
  {
    id: "ai-prompt-engineering",
    translationKey: "services.prompt_engineering",
    previousPrice: 90,
    agencyPrice: 250,
    uplift: 160,
    tier: "low",
  },
  {
    id: "data-organisation",
    translationKey: "services.data_organisation",
    previousPrice: 90,
    agencyPrice: 280,
    uplift: 190,
    tier: "low",
  },
  {
    id: "ai-content-generation",
    translationKey: "services.content_generation",
    previousPrice: 95,
    agencyPrice: 300,
    uplift: 205,
    tier: "low",
  },
  {
    id: "ai-image-creation",
    translationKey: "services.image_creation",
    previousPrice: 100,
    agencyPrice: 320,
    uplift: 220,
    tier: "medium",
  },
  {
    id: "ai-research-analysis",
    translationKey: "services.research_analysis",
    previousPrice: 120,
    agencyPrice: 400,
    uplift: 280,
    tier: "medium",
  },
  {
    id: "ai-website-improvements",
    translationKey: "services.website_improvements",
    previousPrice: 140,
    agencyPrice: 500,
    uplift: 360,
    tier: "medium",
  },
  {
    id: "ai-email-automation",
    translationKey: "services.email_automation",
    previousPrice: 150,
    agencyPrice: 550,
    uplift: 400,
    tier: "medium",
  },
  {
    id: "workflow-automation",
    translationKey: "services.workflow_automation",
    previousPrice: 170,
    agencyPrice: 650,
    uplift: 480,
    tier: "high",
  },
  {
    id: "chatbot-setup",
    translationKey: "services.chatbot_setup",
    previousPrice: 220,
    agencyPrice: 950,
    uplift: 730,
    tier: "high",
  },
];
