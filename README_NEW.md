# Yeh Mera India - AI News Platform

A modern AI-powered news platform built with React, TypeScript, and Vite.

## Features

- 📰 Real-time news aggregation
- 🤖 AI-powered content analysis
- 🌐 Multi-language support
- 🎨 Modern, responsive UI with Tailwind CSS
- 📱 Mobile-friendly design
- 🔐 Secure authentication

## Prerequisites

- Node.js 18+
- npm or yarn
- Git

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/yeh-mera-india-ai-news.git
cd app

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your configuration
```

## Development

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` folder, ready for deployment.

## Deployment

### To Hostinger:

1. Build the project: `npm run build`
2. Upload `dist/` folder contents to your Hostinger `public_html` directory
3. Ensure your web server is configured to serve `index.html` for all routes

See [GITHUB_SETUP.md](../GITHUB_SETUP.md) for detailed deployment instructions.

## Tech Stack

- **Frontend Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: GSAP, Framer Motion
- **State Management**: React Context API
- **Form Handling**: React Hook Form

## Project Structure

```
src/
├── components/      # React components
├── pages/          # Page components
├── context/        # React Context
├── hooks/          # Custom hooks
├── services/       # API services
├── config/         # Configuration files
├── styles/         # Global styles
└── lib/            # Utility functions
```

## Environment Variables

See `.env.example` for required environment variables.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Create a feature branch
2. Make your changes
3. Commit and push
4. Create a Pull Request

## License

MIT

## Support

For issues and questions, please create an issue on GitHub.
