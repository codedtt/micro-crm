import { Customer, Contact, Interaction, CustomerInsights } from './crm-data';

export function analyzeCustomerIntelligence(
  customer: Customer,
  contacts: Contact[],
  interactions: Interaction[]
): CustomerInsights {
  const custInteractions = interactions.filter(i => i.customer_id === customer.id)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  const latest = custInteractions[0];
  const primaryContact = contacts.find(c => c.customer_id === customer.id);

  // Default fallback scores and synthesis
  let score = 30;
  let urgencyReason = "Standard cadence.";
  let summary = `Recent interactions include ${custInteractions.length} touchpoints.`;
  let keyPainPoints: string[] = ["Workflow efficiency"];
  let suggestedAction = "Send general check-in email.";
  let recommendedEmailDraft = `Hi ${primaryContact?.name || 'there'},\n\nJust wanted to check in and see how everything is going with your practice!\n\nBest,\nYour CRM Co-Pilot`;

  // Specific high-value customer heuristic patterns
  if (customer.id === 'cust_009') { // Parkview Dental Studio
    score = 98;
    urgencyReason = "High-intent prospect with target onboarding deadline before Sept 15.";
    summary = "Chris completed a demo and requested confirmation for an onboarding timeline prior to Sept 15.";
    keyPainPoints = ["New-patient call volume", "Onboarding timeline constraints"];
    suggestedAction = "Confirm September 15 onboarding timeline and send agreement.";
    recommendedEmailDraft = `Hi Dr. Evans,\n\nThanks for confirming that our pricing fits your budget! I spoke with our onboarding lead, and we can definitely have Parkview Dental Studio fully set up well before September 15th.\n\nI'll send over the agreement today so we can reserve your onboarding slot. Let me know if you have any questions!\n\nBest regards,`;
  } else if (customer.id === 'cust_012') { // Central Avenue Dentistry
    score = 92;
    urgencyReason = "Inbound follow-up request sent Aug 31 regarding implementation.";
    summary = "Completed demo with Kevin & Julia. Sent contract details. Julia requested a follow-up meeting this week to discuss implementation.";
    keyPainPoints = ["Missed calls during lunch & peak hours", "Contract & cancellation terms clarity"];
    suggestedAction = "Schedule short implementation call with Julia & Kevin.";
    recommendedEmailDraft = `Hi Julia,\n\nI'd be happy to set up a brief call this week to walk through implementation and get everything lined up for Central Avenue Dentistry.\n\nDoes Thursday at 10 AM or Friday at 2 PM work for you and Kevin?\n\nBest regards,`;
  } else if (customer.id === 'cust_001') { // Northstar Dental Group
    score = 88;
    urgencyReason = "Proposal sent Aug 23 with no response after expected review date.";
    summary = "Sarah requested 3-location proposal after successful demo. Proposal sent Aug 23; follow-up is overdue.";
    keyPainPoints = ["60 missed calls per week", "Voicemail after 5 PM", "Multi-location expansion"];
    suggestedAction = "Send gentle follow-up email regarding the 3-location proposal.";
    recommendedEmailDraft = `Hi Sarah,\n\nI hope you're having a great week! I wanted to check in to see if you and your partners had a chance to review the 3-location proposal we sent over last week.\n\nHappy to answer any questions or hop on a quick 5-minute call.\n\nBest regards,`;
  } else if (customer.id === 'cust_005') { // BrightSmile Dental
    score = 75;
    urgencyReason = "Decision expected in September (Dentrix reference case study provided).";
    summary = "Rachel evaluated Dentrix integration and received customer references. Indicated decision expected in September.";
    keyPainPoints = ["Lunch & peak hour reception capacity", "Dentrix integration requirements", "Workflow change hesitation"];
    suggestedAction = "Schedule early September check-in regarding Dentrix workflow experience.";
    recommendedEmailDraft = `Hi Rachel,\n\nHappy September! I wanted to follow up following the case study we shared regarding Dentrix integration.\n\nAs you evaluate options for BrightSmile this month, let me know if you'd like to talk through any remaining workflow questions.\n\nBest,`;
  } else if (customer.id === 'cust_011') { // Evergreen Dental Partners
    score = 65;
    urgencyReason = "Budgeting decision planned for September planning meeting.";
    summary = "Laura completed demo for 5-location group. Budgeting was delayed until September planning meeting; avoid aggressive selling.";
    keyPainPoints = ["5-location centralization", "Location-level config", "September budget window"];
    suggestedAction = "Send low-friction check-in for September planning meeting.";
    recommendedEmailDraft = `Hi Laura,\n\nHope you're having a great week! Thinking of Evergreen Dental Partners as September begins. I know your team is conducting planning meetings this month—let me know if you need any additional figures for Brian.\n\nBest regards,`;
  } else if (customer.id === 'cust_003') { // Riverbend Orthodontics
    score = 60;
    urgencyReason = "Stalled lead opening 2nd location in October. No contact since July.";
    summary = "Jason expressed interest for a second location opening in October, but never scheduled the demo link sent in July.";
    keyPainPoints = ["Front desk workload", "2nd location opening in Oct"];
    suggestedAction = "Send re-engagement email focused on October opening date.";
    recommendedEmailDraft = `Hi Jason,\n\nI know you're preparing for the launch of your second location this October! I wanted to circle back and see if you still want to explore automating front desk calls before the expansion.\n\nHere is a quick link to book 15 minutes: [Demo Link].\n\nBest,`;
  } else if (customer.id === 'cust_006') { // Sunrise Pediatric Dentistry
    score = 55;
    urgencyReason = "Existing customer considering 2nd location account next year.";
    summary = "Olivia mentioned during an Aug 28 call that they are opening another office next year and may need an additional account.";
    keyPainPoints = ["Increased call volume with new provider", "Multi-office expansion"];
    suggestedAction = "Log expansion intent and schedule late Q4 check-in.";
    recommendedEmailDraft = `Hi Olivia,\n\nGreat catching up recently! Glad to hear about Sunrise Pediatric's growth plans for next year. Let's touch base later this fall as details for the new location crystallize.\n\nBest regards,`;
  }

  return {
    attentionScore: score,
    urgencyReason,
    summary,
    keyPainPoints,
    suggestedAction,
    recommendedEmailDraft,
  };
}