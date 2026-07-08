import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Yeh Mera India fresh starter' });
});

app.get('/api/roadmap', (_req, res) => {
  res.json({
    phases: [
      'Public magazine website',
      'CMS for stories, books, gallery and events',
      'AI visitor guide and story recommendation',
      'Analytics, newsletter and India Atlas'
    ]
  });
});

app.post('/api/ai-guide', (req, res) => {
  const question = String(req.body?.question || '').trim();
  res.json({
    answer: question
      ? `YMI Guide will answer from published Yeh Mera India content for: ${question}`
      : 'Ask about Indian culture, geography, stories, books, theatre or journalism.',
    nextSteps: ['Recommend related stories', 'Explain in Hindi', 'Suggest category pages']
  });
});

app.listen(port, () => {
  console.log(`Yeh Mera India API running on port ${port}`);
});
