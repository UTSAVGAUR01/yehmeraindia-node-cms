import React from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, Bot, Camera, Globe2, MapPin, Mic2, Newspaper, PenLine, Sparkles, Theater } from 'lucide-react';
import './styles.css';

const categories = [
  { title: 'Culture', text: 'Festivals, language, rituals, food and everyday Indian life.' },
  { title: 'Geography', text: 'Places, rivers, landscapes, regions and people shaped by land.' },
  { title: 'Journalism', text: 'Field notes, interviews, reports and public-interest explainers.' },
  { title: 'Books', text: 'Author updates, book chapters, reviews and reading notes.' },
  { title: 'Theatre', text: 'Plays, performances, scripts, events and creative journeys.' },
  { title: 'Gallery', text: 'India in pictures: people, streets, events and memories.' }
];

const stories = [
  { tag: 'Rajasthan / Culture', title: 'Jodhpur Summer Festivals', text: 'A visual story of colour, music, heat, devotion and public celebration.' },
  { tag: 'Geography / Society', title: 'How Places Shape People', text: 'Short essays connecting land, climate, cities, villages and human behaviour.' },
  { tag: 'Journalism / People', title: 'Stories From the Ground', text: 'Human reports, local voices and overlooked India beyond headlines.' }
];

const aiPrompts = ['Suggest stories about Rajasthan', 'Explain this article in simple Hindi', 'Show me geography stories', 'What should I read today?'];

function App() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top">Yeh Mera <span>India</span></a>
        <div className="navLinks">
          <a href="#stories">Stories</a>
          <a href="#atlas">India Atlas</a>
          <a href="#author">Author</a>
          <a href="#ai">AI Guide</a>
          <a className="navButton" href="#contact">Contact</a>
        </div>
      </nav>

      <section id="top" className="hero sectionPad">
        <div className="heroCopy">
          <p className="eyebrow">Digital magazine · Author platform · India archive</p>
          <h1>Stories of India, by people of India.</h1>
          <p className="heroText">A premium storytelling platform for culture, geography, journalism, books, theatre and human stories from every corner of India.</p>
          <div className="heroActions">
            <a className="button primary" href="#stories"><BookOpen size={18} /> Read Stories</a>
            <a className="button" href="#ai"><Bot size={18} /> Ask AI Guide</a>
          </div>
          <div className="trustRow">
            <span>Culture</span><span>Geography</span><span>Journalism</span><span>Books</span><span>Theatre</span>
          </div>
        </div>
        <div className="heroVisual">
          <div className="mapCard big"><Globe2 /><strong>India Atlas</strong><p>State-wise stories, places and culture.</p></div>
          <div className="mapCard"><Newspaper /><strong>Field Journalism</strong><p>Reports, interviews and public stories.</p></div>
          <div className="mapCard"><Theater /><strong>Theatre & Books</strong><p>Creative profile of the founder-author.</p></div>
        </div>
      </section>

      <section id="stories" className="sectionPad surface">
        <div className="sectionHead">
          <p className="eyebrow">Magazine structure</p>
          <h2>Explore Yeh Mera India</h2>
          <p>Clean categories so visitors immediately understand what to read and where to go next.</p>
        </div>
        <div className="categoryGrid">
          {categories.map((item) => <article className="card" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
      </section>

      <section className="sectionPad">
        <div className="sectionHead left">
          <p className="eyebrow">Featured editorial</p>
          <h2>Today’s India</h2>
        </div>
        <div className="storyGrid">
          {stories.map((story) => <article className="storyCard" key={story.title}><span>{story.tag}</span><h3>{story.title}</h3><p>{story.text}</p><a href="#contact">Read direction →</a></article>)}
        </div>
      </section>

      <section id="atlas" className="sectionPad atlas">
        <div>
          <p className="eyebrow">Unique feature</p>
          <h2>India Atlas</h2>
          <p>Because the client has a geography background, the website should include a state-wise story system. Visitors can explore places, people, festivals, rivers, forts, villages and regional culture.</p>
        </div>
        <div className="stateGrid">
          {['Rajasthan','Gujarat','Maharashtra','Delhi','Uttar Pradesh','Bengal','North East','Kerala'].map((state) => <button key={state}><MapPin size={16} /> {state}</button>)}
        </div>
      </section>

      <section id="author" className="sectionPad authorBlock">
        <div className="authorPhoto"><PenLine size={56} /></div>
        <div>
          <p className="eyebrow">Founder / editor voice</p>
          <h2>Author, media journalist, geography scholar and theatre participant.</h2>
          <p>The client should be presented as the founder-editor behind the platform. This gives the website more authority and keeps future growth open for books, articles, events, media coverage and creative performances.</p>
          <div className="miniGrid">
            <span><BookOpen size={16} /> Books</span><span><Mic2 size={16} /> Journalism</span><span><Camera size={16} /> Gallery</span><span><Theater size={16} /> Plays</span>
          </div>
        </div>
      </section>

      <section id="ai" className="sectionPad aiBlock">
        <div>
          <p className="eyebrow">Visitor engagement</p>
          <h2>AI Guide for more activity</h2>
          <p>The AI agent should recommend stories, explain articles in Hindi or English, guide visitors by state or topic, collect interests and push readers toward more pages.</p>
        </div>
        <div className="aiPanel">
          <div className="aiHeader"><Sparkles /> Ask YMI Guide</div>
          <p className="botBubble">Namaste! What part of India do you want to explore today?</p>
          <div className="promptGrid">{aiPrompts.map((prompt) => <button key={prompt}>{prompt}</button>)}</div>
          <div className="fakeInput">Type your question...</div>
        </div>
      </section>

      <section id="contact" className="sectionPad contactBlock">
        <p className="eyebrow">Build scope</p>
        <h2>Fresh CMS Roadmap</h2>
        <div className="roadmap">
          <article><strong>Phase 1</strong><p>Homepage, stories, categories, author profile, gallery, contact and SEO base.</p></article>
          <article><strong>Phase 2</strong><p>Admin CMS for posts, books, events, media coverage and gallery uploads.</p></article>
          <article><strong>Phase 3</strong><p>AI guide, story recommender, article summary, AI search and visitor activity tracking.</p></article>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
