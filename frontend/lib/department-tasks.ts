export interface TaskPrompt {
  id: string;
  title: string;
  icon: string;
  prompt: string;
  category: string;
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  tasks: TaskPrompt[];
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'sales-marketing',
    name: 'Sales & Marketing',
    icon: '📊',
    color: 'from-blue-500 to-cyan-500',
    description: 'Lead generation, outreach, and campaign management',
    tasks: [
      { id: 'sm-1', title: 'Draft cold outreach email', icon: '📧', prompt: 'Write a professional cold outreach email for [describe your product/service] targeting [describe ideal customer]. Keep it concise, personalized, and include a clear call-to-action.', category: 'sales-marketing' },
      { id: 'sm-2', title: 'Analyze sales pipeline', icon: '📊', prompt: 'Help me analyze my current sales pipeline. I\'ll share the details and I need insights on: conversion rates, bottlenecks, and recommendations to improve close rates.', category: 'sales-marketing' },
      { id: 'sm-3', title: 'Create social media post', icon: '📱', prompt: 'Create an engaging social media post for [platform] about [topic/product]. Include relevant hashtags and a compelling hook.', category: 'sales-marketing' },
      { id: 'sm-4', title: 'Generate lead qualification questions', icon: '🎯', prompt: 'Generate a list of 10 effective lead qualification questions for [industry/product] that help identify budget, authority, need, and timeline.', category: 'sales-marketing' },
      { id: 'sm-5', title: 'Write product description', icon: '✍️', prompt: 'Write a compelling product description for [product name] highlighting key features, benefits, and unique selling points. Target audience: [describe].', category: 'sales-marketing' },
      { id: 'sm-6', title: 'Create email sequence', icon: '📬', prompt: 'Create a 5-email nurture sequence for leads who [describe trigger action]. Include subject lines and optimal send timing.', category: 'sales-marketing' },
      { id: 'sm-7', title: 'Competitor analysis', icon: '🔍', prompt: 'Help me create a competitor analysis framework. I\'ll provide competitor names and I need: strengths, weaknesses, positioning, and differentiation opportunities.', category: 'sales-marketing' },
      { id: 'sm-8', title: 'Write case study outline', icon: '📋', prompt: 'Create an outline for a customer case study featuring [customer/result]. Include sections for challenge, solution, results, and testimonial prompts.', category: 'sales-marketing' },
      { id: 'sm-9', title: 'Generate ad copy variations', icon: '📢', prompt: 'Generate 5 variations of ad copy for [product/service] targeting [audience]. Include headlines, descriptions, and CTAs for [platform].', category: 'sales-marketing' },
      { id: 'sm-10', title: 'Create pitch deck outline', icon: '🎤', prompt: 'Create an outline for a sales pitch deck for [product/service]. Include key slides, talking points, and objection handlers.', category: 'sales-marketing' },
    ],
  },
  {
    id: 'finance-accounting',
    name: 'Finance & Accounting',
    icon: '💰',
    color: 'from-green-500 to-emerald-500',
    description: 'Financial analysis, reporting, and compliance',
    tasks: [
      { id: 'fa-1', title: 'Explain financial statement', icon: '📑', prompt: 'Help me understand and analyze this financial statement. I\'ll share the numbers and need insights on profitability, liquidity, and areas of concern.', category: 'finance-accounting' },
      { id: 'fa-2', title: 'Create budget template', icon: '📊', prompt: 'Create a monthly budget template for [department/project] including categories for [list main expense types]. Include formulas for tracking variance.', category: 'finance-accounting' },
      { id: 'fa-3', title: 'Calculate ROI', icon: '📈', prompt: 'Help me calculate the ROI for [investment/project]. I\'ll provide the costs and expected returns, and need a clear breakdown with assumptions.', category: 'finance-accounting' },
      { id: 'fa-4', title: 'Draft expense policy', icon: '📝', prompt: 'Draft a company expense reimbursement policy covering: eligible expenses, approval limits, submission process, and timeline for reimbursement.', category: 'finance-accounting' },
      { id: 'fa-5', title: 'Prepare variance analysis', icon: '🔄', prompt: 'Help me prepare a variance analysis comparing [actual vs budget/forecast]. I\'ll provide the numbers and need explanations for significant variances.', category: 'finance-accounting' },
      { id: 'fa-6', title: 'Create invoice template', icon: '🧾', prompt: 'Create a professional invoice template for [business type] including all necessary fields, payment terms, and legal requirements.', category: 'finance-accounting' },
      { id: 'fa-7', title: 'Explain tax implications', icon: '🏛️', prompt: 'Explain the potential tax implications of [business decision/transaction]. Note: This is for general understanding, not tax advice.', category: 'finance-accounting' },
      { id: 'fa-8', title: 'Financial forecast model', icon: '🔮', prompt: 'Help me create a 12-month financial forecast for [business/project]. I\'ll provide historical data and assumptions.', category: 'finance-accounting' },
    ],
  },
  {
    id: 'human-resources',
    name: 'Human Resources',
    icon: '👥',
    color: 'from-purple-500 to-pink-500',
    description: 'Hiring, onboarding, and employee management',
    tasks: [
      { id: 'hr-1', title: 'Write job description', icon: '📋', prompt: 'Write a compelling job description for [job title] at [company type]. Include responsibilities, requirements, benefits, and company culture highlights.', category: 'human-resources' },
      { id: 'hr-2', title: 'Create interview questions', icon: '🎤', prompt: 'Generate 15 interview questions for a [job title] position. Include behavioral, situational, and role-specific questions with what to look for in answers.', category: 'human-resources' },
      { id: 'hr-3', title: 'Draft offer letter', icon: '✉️', prompt: 'Draft a professional offer letter for [position] including: compensation, start date, benefits overview, and next steps. Salary: [amount].', category: 'human-resources' },
      { id: 'hr-4', title: 'Create onboarding checklist', icon: '✅', prompt: 'Create a comprehensive 30-60-90 day onboarding checklist for a new [job title]. Include tasks, milestones, and success metrics.', category: 'human-resources' },
      { id: 'hr-5', title: 'Write performance review', icon: '📊', prompt: 'Help me structure a performance review for [employee role]. I\'ll provide accomplishments and areas for improvement, and need professional language.', category: 'human-resources' },
      { id: 'hr-6', title: 'Create employee handbook section', icon: '📖', prompt: 'Draft a section for our employee handbook covering [topic: PTO policy/remote work/code of conduct/etc]. Make it clear and legally sound.', category: 'human-resources' },
      { id: 'hr-7', title: 'Design training program', icon: '🎓', prompt: 'Design a training program outline for [skill/topic] for [audience]. Include modules, learning objectives, and assessment methods.', category: 'human-resources' },
      { id: 'hr-8', title: 'Write termination script', icon: '🚪', prompt: 'Help me prepare talking points for a termination meeting. Reason: [performance/layoff/other]. Keep it professional, compassionate, and legally appropriate.', category: 'human-resources' },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: '⚙️',
    color: 'from-orange-500 to-amber-500',
    description: 'Process optimization and project management',
    tasks: [
      { id: 'op-1', title: 'Create SOP document', icon: '📋', prompt: 'Create a Standard Operating Procedure (SOP) document for [process name]. Include purpose, scope, responsibilities, and step-by-step instructions.', category: 'operations' },
      { id: 'op-2', title: 'Project timeline', icon: '📅', prompt: 'Help me create a project timeline for [project name] with milestones, dependencies, and realistic deadlines. Duration: [timeframe].', category: 'operations' },
      { id: 'op-3', title: 'Process improvement analysis', icon: '🔄', prompt: 'Analyze this process for improvement opportunities: [describe current process]. Identify bottlenecks, waste, and automation possibilities.', category: 'operations' },
      { id: 'op-4', title: 'Vendor evaluation criteria', icon: '🏪', prompt: 'Create a vendor evaluation scorecard for [product/service type]. Include criteria, weighting, and scoring methodology.', category: 'operations' },
      { id: 'op-5', title: 'Meeting agenda template', icon: '📝', prompt: 'Create an effective meeting agenda template for [meeting type: standup/planning/review]. Include time allocations and desired outcomes.', category: 'operations' },
      { id: 'op-6', title: 'Risk assessment', icon: '⚠️', prompt: 'Help me conduct a risk assessment for [project/initiative]. Identify potential risks, likelihood, impact, and mitigation strategies.', category: 'operations' },
      { id: 'op-7', title: 'Resource allocation plan', icon: '👥', prompt: 'Create a resource allocation plan for [project] with [X] team members over [timeframe]. Balance workload and identify gaps.', category: 'operations' },
    ],
  },
  {
    id: 'customer-experience',
    name: 'Customer Experience',
    icon: '🎧',
    color: 'from-teal-500 to-cyan-500',
    description: 'Support, satisfaction, and retention',
    tasks: [
      { id: 'cx-1', title: 'Write support response', icon: '💬', prompt: 'Help me write a professional support response for this customer issue: [describe issue]. Tone should be empathetic and solution-focused.', category: 'customer-experience' },
      { id: 'cx-2', title: 'Create FAQ document', icon: '❓', prompt: 'Create a comprehensive FAQ document for [product/service] covering the top 15 questions customers typically ask.', category: 'customer-experience' },
      { id: 'cx-3', title: 'Design customer survey', icon: '📊', prompt: 'Design a customer satisfaction survey for [product/service/interaction]. Include NPS question and actionable follow-ups.', category: 'customer-experience' },
      { id: 'cx-4', title: 'Write apology email', icon: '🙏', prompt: 'Write a sincere apology email to a customer regarding [issue]. Include acknowledgment, explanation, resolution, and goodwill gesture.', category: 'customer-experience' },
      { id: 'cx-5', title: 'Create escalation procedure', icon: '📈', prompt: 'Create a customer complaint escalation procedure with tiers, response times, and resolution authority levels.', category: 'customer-experience' },
      { id: 'cx-6', title: 'Write knowledge base article', icon: '📚', prompt: 'Write a knowledge base article explaining how to [task/feature]. Include step-by-step instructions, screenshots placeholders, and troubleshooting tips.', category: 'customer-experience' },
    ],
  },
  {
    id: 'fulfillment',
    name: 'Fulfillment & Logistics',
    icon: '📦',
    color: 'from-indigo-500 to-violet-500',
    description: 'Shipping, inventory, and supply chain',
    tasks: [
      { id: 'fl-1', title: 'Create shipping policy', icon: '🚚', prompt: 'Draft a clear shipping policy for [business type] covering: methods, timeframes, costs, international shipping, and tracking.', category: 'fulfillment' },
      { id: 'fl-2', title: 'Inventory reorder analysis', icon: '📊', prompt: 'Help me analyze inventory levels and create reorder points for [products]. I\'ll provide sales velocity and lead times.', category: 'fulfillment' },
      { id: 'fl-3', title: 'Returns process', icon: '↩️', prompt: 'Design a customer-friendly returns process including: eligibility, timeframes, refund methods, and restocking procedures.', category: 'fulfillment' },
      { id: 'fl-4', title: 'Supplier communication', icon: '📧', prompt: 'Draft a professional email to a supplier regarding [issue: late delivery/quality problem/price negotiation]. Maintain relationship while addressing concern.', category: 'fulfillment' },
      { id: 'fl-5', title: 'Warehouse layout optimization', icon: '🏭', prompt: 'Suggest warehouse layout optimization strategies for [size] space handling [product types]. Focus on pick efficiency and safety.', category: 'fulfillment' },
    ],
  },
];

export const DEFAULT_QUICK_ACTIONS: TaskPrompt[] = [
  { id: 'qa-1', title: 'Weekly Report', icon: '📊', prompt: 'Help me create a weekly status report covering: accomplishments, challenges, next week priorities, and any blockers or needs.', category: 'quick-action' },
  { id: 'qa-2', title: 'Draft Email', icon: '📧', prompt: 'Help me draft a professional email to [recipient] about [topic]. Tone: [formal/friendly/urgent].', category: 'quick-action' },
  { id: 'qa-3', title: 'Summarize Document', icon: '📄', prompt: 'Summarize the key points from this document I\'m about to share. Highlight: main ideas, action items, and decisions needed.', category: 'quick-action' },
  { id: 'qa-4', title: 'Brainstorm Ideas', icon: '💡', prompt: 'Help me brainstorm ideas for [topic/challenge]. Give me 10 creative approaches with pros and cons for each.', category: 'quick-action' },
];
