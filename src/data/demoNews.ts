export interface NewsItem {
  id: string;
  title: string;
  category: string;
  source: string;
  timestamp: string;
  readTime: string;
  excerpt: string;
  duration: string;
}

export const categories = [
  'Politics',    // राजनीति
  'Technology',  // तकनीक
  'Sports',      // खेल
  'Business',    // व्यापार
  'Entertainment', // मनोरंजन
  'Science',     // विज्ञान
  'Health',      // स्वास्थ्य
  'World',       // दुनिया
] as const;

export type Category = (typeof categories)[number];

export const categoryColors: Record<Category, string> = {
  'Politics': '#FF9933',
  'Technology': '#06B6D4',
  'Sports': '#F97316',
  'Business': '#10B981',
  'Entertainment': '#A855F7',
  'Science': '#3B82F6',
  'Health': '#EF4444',
  'World': '#8B5CF6',
};

export const demoNews: NewsItem[] = [
  /* ── Science ── */
  {
    id: '1',
    title: 'ISRO Successfully Launches Gaganyaan Crew Module Drop Test',
    category: 'Science',
    source: 'ISRO',
    timestamp: '2 hours ago',
    readTime: '3 min read',
    excerpt:
      `ISRO has successfully completed the first crew module drop test for the Gaganyaan mission. The test was conducted from Sriharikota, where the crew module was dropped from an altitude of 17 kilometers to validate safe sea landing capabilities. This milestone marks a giant leap forward for India's human spaceflight ambitions, bringing the nation closer to becoming the fourth country to send humans to space.`,
    duration: '3 min',
  },
  {
    id: '10',
    title: 'Chandrayaan-4: ISRO Deploys New Rover at Lunar South Pole',
    category: 'Science',
    source: 'The Hindu',
    timestamp: '8 hours ago',
    readTime: '3 min read',
    excerpt:
      `ISRO has successfully landed the Vikram-2 rover near the Moon's south pole under the Chandrayaan-4 mission. The rover traveled 2 kilometers within the first 48 hours and discovered new evidence of water ice. This achievement intensifies the space race with China's Chang'e-7 mission and positions India as a key player in lunar exploration.`,
    duration: '3 min',
  },
  {
    id: '21',
    title: `DRDO Successfully Tests Hypersonic Missile 'Kali-2'`,
    category: 'Science',
    source: 'DD News',
    timestamp: '1 day ago',
    readTime: '4 min read',
    excerpt:
      `DRDO successfully tested the hypersonic missile 'Kali-2' from the Odisha coast. The missile can travel at Mach 7 and strike targets at 1,500 kilometers. Defense Minister Rajnath Singh stated that this achievement makes India the third nation, after China and Russia, to possess hypersonic weapons capability.`,
    duration: '3 min',
  },
  {
    id: '24',
    title: `World's Longest Rail-Road Bridge Approved Over Brahmaputra River`,
    category: 'Science',
    source: 'Live Science India',
    timestamp: '2 days ago',
    readTime: '5 min read',
    excerpt:
      `The Indian government has approved the construction of the world's longest rail-cum-road bridge, 'Brahma Setu,' over the Brahmaputra River in Assam. At 31 kilometers, it will be 5 kilometers longer than China's Hong Kong-Zhuhai-Macau Bridge. The project, costing 28,000 crore rupees, is expected to be completed by 2030 and will connect Northeast India to the mainland.`,
    duration: '4 min',
  },
  /* ── Business ── */
  {
    id: '2',
    title: 'India-UK FTA Signed, Trade Expected to Grow by 30 Percent',
    category: 'Business',
    source: 'Economic Times',
    timestamp: '3 hours ago',
    readTime: '4 min read',
    excerpt:
      `India and the United Kingdom have signed a historic free trade agreement. Under this FTA, tariffs on 99 percent of Indian goods entering the UK will be reduced, with bilateral trade expected to surge by 30 percent. Prime Minister Narendra Modi hailed the deal as a victory for India's global economic strategy, calling it a new era of India-UK partnership.`,
    duration: '2 min',
  },
  {
    id: '7',
    title: 'RBI Cuts Repo Rate by 25 bps to 6.25 Percent, Markets Rally',
    category: 'Business',
    source: 'Business Standard',
    timestamp: '30 minutes ago',
    readTime: '3 min read',
    excerpt:
      `The Reserve Bank of India has cut the repo rate by 25 basis points to 6.25 percent following the monetary policy committee meeting. RBI Governor Shaktikanta Das stated the move aims to boost the growth rate. Following the announcement, the Sensex jumped 800 points and Nifty crossed the 24,000 mark for the first time in history.`,
    duration: '2 min',
  },
  {
    id: '18',
    title: 'Delhi-Mumbai Expressway Nears Completion, Travel Time Halved',
    category: 'Business',
    source: 'Construction World',
    timestamp: '20 hours ago',
    readTime: '2 min read',
    excerpt:
      `India's largest infrastructure project, the Delhi-Mumbai Expressway, has entered its final phase. Spanning 1,386 kilometers, the expressway will reduce travel time between Delhi and Mumbai from 24 hours to just 12 hours. Built at a cost of 1.5 lakh crore rupees, the project will connect 12 industrial corridors and create 2 crore new jobs.`,
    duration: '2 min',
  },
  {
    id: '23',
    title: 'India GDP Grows at 8.2 Percent, Fastest Among Major Economies',
    category: 'Business',
    source: 'Financial Express',
    timestamp: '1 day ago',
    readTime: '3 min read',
    excerpt:
      `According to a World Bank report, India's GDP growth reached 8.2 percent, the highest among the world's major economies. The services sector recorded 10.3 percent growth while manufacturing posted 7.8 percent. India is rapidly moving toward becoming a 4 trillion dollar economy in 2025, with the IMF raising India's growth forecast to 7.8 percent.`,
    duration: '2 min',
  },
  /* ── Sports ── */
  {
    id: '3',
    title: 'IPL 2025 Playoffs: CSK Reaches Final, Virat Kohli Scores Century',
    category: 'Sports',
    source: 'ESPNcricinfo',
    timestamp: '4 hours ago',
    readTime: '5 min read',
    excerpt:
      `Chennai Super Kings has secured a spot in the IPL 2025 final with a stunning performance in Qualifier 1, defeating RCB by 5 wickets. Virat Kohli played a blazing innings of 112 runs off 68 balls but could not secure victory for his team. RCB will now face MI in the eliminator for a second chance at the title.`,
    duration: '3 min',
  },
  {
    id: '11',
    title: 'Neeraj Chopra Wins Gold at World Athletics Championships',
    category: 'Sports',
    source: 'PTI Sports',
    timestamp: '12 hours ago',
    readTime: '4 min read',
    excerpt:
      `India's star javelin thrower Neeraj Chopra has won the gold medal at the World Athletics Championships with a throw of 89.94 meters. This marks his consecutive world title. Chopra dedicated the medal to 1.4 billion Indians. Prime Minister Modi personally called to congratulate him on this historic achievement.`,
    duration: '4 min',
  },
  {
    id: '17',
    title: 'Indian Women Cricket Team Wins T20 World Cup',
    category: 'Sports',
    source: 'BCCI',
    timestamp: '18 hours ago',
    readTime: '3 min read',
    excerpt:
      `The Indian women's cricket team has won the ICC Women's T20 World Cup 2025, defeating Australia by 8 wickets in the final. Harmanpreet Kaur scored 45 runs and Smriti Mandhana remained unbeaten at 62. This is India's first Women's T20 World Cup victory, sparking celebrations across the nation.`,
    duration: '3 min',
  },
  {
    id: '25',
    title: 'PV Sindhu Clinches All England Badminton Championships Title',
    category: 'Sports',
    source: 'Badminton Association of India',
    timestamp: '2 days ago',
    readTime: '3 min read',
    excerpt:
      `India's star shuttler PV Sindhu has won the All England Badminton Championships title, defeating Japan's Akane Yamaguchi 21-18, 19-21, 21-17 in a thrilling final. This is Sindhu's first All England title, catapulting her to World No. 2 in the rankings. Prime Minister Modi called her 'the pride of India.'`,
    duration: '3 min',
  },
  {
    id: '32',
    title: 'Srikanth Kidambi Wins All England Badminton Men Singles Title',
    category: 'Sports',
    source: 'Badminton World Federation',
    timestamp: '3 days ago',
    readTime: '2 min read',
    excerpt:
      `India's Srikanth Kidambi created history by winning the All England Badminton Men's Singles title. He defeated Viktor Axelsen of Denmark 21-16, 15-21, 21-18 in a thrilling final. This is India's first men's singles title at All England in 25 years. Srikanth dedicated the win to every Indian who believed in him and jumped to World No. 3 in rankings.`,
    duration: '2 min',
  },
  /* ── Technology ── */
  {
    id: '4',
    title: 'Indian AI Startup Sarvam AI Raises 150 Million Dollars in Funding',
    category: 'Technology',
    source: 'TechCrunch India',
    timestamp: '5 hours ago',
    readTime: '4 min read',
    excerpt:
      `Bengaluru-based AI startup Sarvam AI has raised 150 million dollars in Series B funding led by Lightspeed Venture Partners and Peak XV. The company is building foundational AI models for Indian languages, with their flagship Sarvam-1 model supporting 22 official Indian languages. This marks one of the largest AI funding rounds in Indian history.`,
    duration: '4 min',
  },
  {
    id: '8',
    title: 'Reliance Jio Conducts Successful 6G Trials, Plans 2030 Launch',
    category: 'Technology',
    source: 'Mint Tech',
    timestamp: '1 hour ago',
    readTime: '2 min read',
    excerpt:
      `Reliance Jio showcased successful 6G technology trials at the India Mobile Congress 2025. Jio claims its 6G technology will deliver data speeds of up to 100 Gbps. The company has set a target for commercial 6G launch in India by 2030. Prime Minister Modi called it a new height for Digital India.`,
    duration: '2 min',
  },
  {
    id: '12',
    title: 'India First Semiconductor Plant Operational in Gujarat',
    category: 'Technology',
    source: 'Times of India Tech',
    timestamp: '9 hours ago',
    readTime: '5 min read',
    excerpt:
      `Under India's Semiconductor Mission, the first chip manufacturing plant has begun operations at Dholera SIR in Gujarat. Built as a joint venture between Tata Electronics and Taiwan's PSMC, the facility will produce 28-nanometer chips. The 91,000 crore rupee investment will create over 50,000 direct jobs.`,
    duration: '4 min',
  },
  {
    id: '16',
    title: `Paytm Launches AI-Powered Financial Assistant 'Paytm AI'`,
    category: 'Technology',
    source: 'ET Tech',
    timestamp: '16 hours ago',
    readTime: '4 min read',
    excerpt:
      `Paytm has launched an AI-powered financial assistant called Paytm AI. The assistant works in Hindi, English, and 10 other Indian languages, allowing users to make payments, investments, and insurance purchases through voice commands. Vijay Shekhar Sharma described it as a personal banker for every Indian.`,
    duration: '3 min',
  },
  /* ── Entertainment ── */
  {
    id: '9',
    title: `SS Rajamouli Unveils First Look of New Film 'Mahishmati: The Origin'`,
    category: 'Entertainment',
    source: 'Filmfare',
    timestamp: '7 hours ago',
    readTime: '2 min read',
    excerpt:
      `SS Rajamouli has released the first look of his much-anticipated film 'Mahishmati: The Origin.' Ram Charan and Jr NTR will reunite on screen. The film is being made on a budget of 500 crore rupees and is scheduled for release in 2026. The teaser has already garnered 50 million views within 24 hours of release.`,
    duration: '2 min',
  },
  {
    id: '14',
    title: `Aamir Khan Announces 'Mahabharata' Trilogy`,
    category: 'Entertainment',
    source: 'Bollywood Hungama',
    timestamp: '11 hours ago',
    readTime: '3 min read',
    excerpt:
      `Aamir Khan has announced his most ambitious project yet, the Mahabharata trilogy. With a budget of 1,000 crore rupees, Aamir will portray Lord Krishna. SS Rajamouli will oversee the direction. The first installment is scheduled for release during Diwali 2027 and is expected to redefine Indian cinema.`,
    duration: '2 min',
  },
  {
    id: '20',
    title: `Salman Khan's 'Tiger 4' Smashes Box Office with 85 Crore Opening Day`,
    category: 'Entertainment',
    source: 'Filmibeat',
    timestamp: '1 day ago',
    readTime: '3 min read',
    excerpt:
      `Salman Khan's 'Tiger 4' has made a record-breaking start at the box office, earning 85 crore rupees worldwide on its opening day. Released on Eid, the film also stars Katrina Kaif. Trade analysts estimate the first-week collection could cross 400 crore rupees, making it one of the highest-grossing Bollywood films of all time.`,
    duration: '3 min',
  },
  {
    id: '28',
    title: `Karan Johar Launches Bollywood Streaming Platform 'Dharma+'`,
    category: 'Entertainment',
    source: 'Variety India',
    timestamp: '2 days ago',
    readTime: '2 min read',
    excerpt:
      `Karan Johar has launched Dharma Plus, a dedicated Bollywood streaming platform. The service offers over 500 classic Bollywood films, exclusive web series, and behind-the-scenes content. The subscription is priced at 99 rupees per month, and 2 million users signed up on the launch day alone.`,
    duration: '2 min',
  },
  /* ── Politics ── */
  {
    id: '5',
    title: 'Election Commission Announces Lok Sabha Election 2025 Dates',
    category: 'Politics',
    source: 'NDTV India',
    timestamp: '1 hour ago',
    readTime: '2 min read',
    excerpt:
      `The Election Commission of India has announced the dates for the 2025 Lok Sabha elections. The elections will be held in 7 phases between April 15 and May 20, with results to be declared on May 25. A total of 97 crore voters will exercise their franchise. The Commission has confirmed full preparedness of EVM-VVPAT systems across all constituencies.`,
    duration: '2 min',
  },
  {
    id: '19',
    title: 'INDIA Alliance Grand Coalition Strategy for 2025 Elections',
    category: 'Politics',
    source: 'The Hindu Politics',
    timestamp: '22 hours ago',
    readTime: '4 min read',
    excerpt:
      `The UPA has announced the INDIA Alliance grand coalition for the 2025 Lok Sabha elections. Congress, TMC, DMK, NCP, and 18 other parties have joined the alliance. Rahul Gandhi has been named the face of the coalition. Consensus has been reached on over 200 seats, with the first joint rally scheduled for April 20 in Patna.`,
    duration: '3 min',
  },
  {
    id: '29',
    title: 'NITI Aayog Launches Universal Basic Income Pilot Project',
    category: 'Politics',
    source: 'All India Radio',
    timestamp: '3 days ago',
    readTime: '3 min read',
    excerpt:
      `NITI Aayog has launched a Universal Basic Income pilot project in Madhya Pradesh and Tamil Nadu. Under this scheme, every eligible citizen will receive 2,000 rupees per month. The two-year trial will include 5 lakh families. Economists believe this could reduce poverty by up to 30 percent in the pilot regions.`,
    duration: '3 min',
  },
  {
    id: '31',
    title: 'Tata Motors Launches Electric Truck Tata Pravesh',
    category: 'Business',
    source: 'AutoCar India',
    timestamp: '3 days ago',
    readTime: '4 min read',
    excerpt:
      `Tata Motors has launched India's first long-range electric truck, the Tata Pravesh. The truck offers a range of 500 kilometers and can charge to 80 percent in just 30 minutes with fast charging. Prices start at 45 lakh rupees. The company has set a target of selling 50,000 electric trucks by 2030.`,
    duration: '3 min',
  },
  /* ── Health ── */
  {
    id: '6',
    title: 'AIIMS Delhi Achieves Breakthrough in Cancer Immunotherapy',
    category: 'Health',
    source: 'The Hindu',
    timestamp: '6 hours ago',
    readTime: '3 min read',
    excerpt:
      `AIIMS Delhi's Cancer Research Centre has achieved a major breakthrough in CAR-T cell immunotherapy. The new treatment showed over 70 percent tumor reduction in 85 percent of blood cancer patients. The therapy will now be available within India, reducing treatment costs by 90 percent compared to overseas options.`,
    duration: '3 min',
  },
  {
    id: '15',
    title: `ICMR Approves Malaria Vaccine 'Bharat-Vax' for Emergency Use`,
    category: 'Health',
    source: 'Lancet India',
    timestamp: '14 hours ago',
    readTime: '4 min read',
    excerpt:
      `The Indian Council of Medical Research has approved the indigenous malaria vaccine 'Bharat-Vax' for emergency use. Phase 3 clinical trials found the vaccine to be 78 percent effective. The vaccine is expected to be a lifesaver for children under 5 in India's rural areas, where malaria remains a significant health challenge.`,
    duration: '3 min',
  },
  {
    id: '22',
    title: 'Ayushman Bharat 2.0: Health Cover Doubled to 10 Lakh per Family',
    category: 'Health',
    source: 'PIB India',
    timestamp: '1 day ago',
    readTime: '2 min read',
    excerpt:
      `The central government has launched Ayushman Bharat Scheme 2.0, doubling the health cover for every eligible family from 5 lakh to 10 lakh rupees. The new scheme includes OPD coverage, mental health treatment, and telemedicine services. Approximately 12 crore families are expected to benefit from this expansion.`,
    duration: '2 min',
  },
  {
    id: '30',
    title: 'IIT Bombay Develops AI Model for Early Alzheimer Prediction',
    category: 'Health',
    source: 'Nature India',
    timestamp: '3 days ago',
    readTime: '3 min read',
    excerpt:
      `IIT Bombay researchers have developed an AI model that can predict Alzheimer's disease up to 5 years in advance with 92 percent accuracy using brain MRI scans. This technology is expected to be a game-changer, especially in India where 4 million people are affected by dementia and early diagnosis remains a critical challenge.`,
    duration: '3 min',
  },
  /* ── World ── */
  {
    id: '13',
    title: 'India Proposes Global Digital Framework at G20 Summit 2025',
    category: 'World',
    source: 'Reuters India',
    timestamp: '10 hours ago',
    readTime: '3 min read',
    excerpt:
      `At the G20 Summit in New Delhi, India presented the Global Digital Public Infrastructure Framework, which has been signed by 25 nations. Prime Minister Modi announced that India's UPI, DigiLocker, and Aadhaar models are now available for the entire world. The framework is estimated to accelerate digital transformation in developing countries by 10 years.`,
    duration: '3 min',
  },
  {
    id: '26',
    title: 'India-US Defense Agreement Includes 5th Generation Fighter Tech Transfer',
    category: 'World',
    source: 'Defence News',
    timestamp: '2 days ago',
    readTime: '3 min read',
    excerpt:
      `India and the United States have signed a historic defense agreement that includes the transfer of 5th Generation Fighter Jet F-35 technology. GE Aviation India will also receive jet engine manufacturing technology as part of the deal. The total agreement is valued at 35 billion dollars, making it India's largest defense deal to date.`,
    duration: '3 min',
  },
  {
    id: '27',
    title: 'UN Recognizes India Climate Action as Outstanding',
    category: 'World',
    source: 'The Guardian India',
    timestamp: '2 days ago',
    readTime: '4 min read',
    excerpt:
      `The United Nations has declared India an Outstanding Performer in its Climate Action Report 2025. India achieved its 40 percent renewable energy target 10 years ahead of its 2070 Net Zero commitment. Solar capacity has reached 300 GW, making India the world's third-largest green energy producer.`,
    duration: '4 min',
  },
];

export const getNewsByCategory = (category: string): NewsItem[] => {
  return demoNews.filter((item) => item.category === category);
};

export const getNewsExcerpt = (item: NewsItem): string => {
  return item.excerpt || item.title;
};
