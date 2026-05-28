import { z } from 'zod';

export const latestNewsPromptInput = z.object({
  message: z.string().min(3),
  language: z.enum(['en', 'hi']).default('en'),
  mode: z.enum(['summary', 'timeline', 'explain', 'sources']).default('summary')
});

export const productionNewsBotPlan = {
  name: 'YE MERA INDIA AI News Bot',
  purpose: 'Answer user questions using latest news feeds and editorial context.',
  recommendedSources: ['Google News RSS', 'official government feeds', 'editorial CMS feed', 'News API provider'],
  responseShape: ['short summary', 'key facts', 'timeline', 'source links', 'related questions', 'related swipe posts']
};
