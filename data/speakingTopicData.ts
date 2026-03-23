/**
 * Default Speaking Topic Challenge question bank.
 * These questions are seeded into the Topic Bank on first install.
 * Organized by IELTS/Cambridge Part 2 & 3 style topics.
 */
import { SpeakingQuestion } from '../types';

export const defaultTopicBankTopics = [
  'Environment',
  'Education',
  'Technology & Innovation',
  'Culture & Traditions',
  'Entertainment & Media',
  'Society & Lifestyle',
  'Work & Career',
  'Science & Discovery',
] as const;

export const defaultTopicBank: SpeakingQuestion[] = [
  // ═══════════════════════════════════════
  // ENVIRONMENT (6 questions)
  // ═══════════════════════════════════════
  {
    id: 'topic-env-001',
    topic: 'Environment',
    question: 'What are the biggest environmental problems in your country?',
    sampleAnswer: 'Air pollution and plastic waste are major issues. Many cities suffer from poor air quality due to traffic and factories, and single-use plastics pollute our rivers and oceans.',
    difficulty: 'B1',
  },
  {
    id: 'topic-env-002',
    topic: 'Environment',
    question: 'Do you think individuals can make a difference in protecting the environment?',
    sampleAnswer: 'Absolutely. Small actions like reducing plastic use, recycling, and using public transport can collectively have a significant impact. Change starts at the individual level.',
    difficulty: 'B1',
  },
  {
    id: 'topic-env-003',
    topic: 'Environment',
    question: 'Describe something you do to help the environment.',
    sampleAnswer: 'I always carry a reusable water bottle and shopping bag. I also try to take public transport instead of driving whenever possible. These small habits reduce waste significantly.',
    difficulty: 'A2',
  },
  {
    id: 'topic-env-004',
    topic: 'Environment',
    question: 'Should governments invest more in renewable energy? Why?',
    sampleAnswer: 'Yes, investing in solar and wind energy is crucial for long-term sustainability. Fossil fuels are finite and contribute to climate change, so transitioning to renewables is both practical and necessary.',
    difficulty: 'B2',
  },
  {
    id: 'topic-env-005',
    topic: 'Environment',
    question: 'How has climate change affected your local area?',
    sampleAnswer: 'We have experienced more extreme weather events, such as heavy flooding during the rainy season. Temperatures have also risen noticeably over the past decade.',
    difficulty: 'B1',
  },
  {
    id: 'topic-env-006',
    topic: 'Environment',
    question: 'What can schools do to teach children about environmental protection?',
    sampleAnswer: 'Schools can organize tree-planting activities, set up recycling programs, and include environmental studies in the curriculum. Hands-on projects make the biggest impression on children.',
    difficulty: 'B1',
  },

  // ═══════════════════════════════════════
  // EDUCATION (6 questions)
  // ═══════════════════════════════════════
  {
    id: 'topic-edu-001',
    topic: 'Education',
    question: 'What do you think makes a good teacher?',
    sampleAnswer: 'A good teacher is patient, passionate, and able to explain complex ideas simply. They should also be empathetic and adapt their teaching style to different students\' needs.',
    difficulty: 'B1',
  },
  {
    id: 'topic-edu-002',
    topic: 'Education',
    question: 'Is online learning as effective as traditional classroom learning?',
    sampleAnswer: 'Online learning offers flexibility and access, but it lacks the social interaction and hands-on experience of a classroom. I think a blended approach combining both is the most effective.',
    difficulty: 'B2',
  },
  {
    id: 'topic-edu-003',
    topic: 'Education',
    question: 'What subject do you wish you had studied more at school?',
    sampleAnswer: 'I wish I had studied more computer science. Technology skills are increasingly important, and having a stronger foundation would have been very beneficial for my career.',
    difficulty: 'B1',
  },
  {
    id: 'topic-edu-004',
    topic: 'Education',
    question: 'Should university education be free for everyone?',
    sampleAnswer: 'I believe basic university education should be affordable, if not free. Education is a right, and financial barriers prevent talented students from reaching their potential.',
    difficulty: 'B2',
  },
  {
    id: 'topic-edu-005',
    topic: 'Education',
    question: 'How has technology changed the way we learn?',
    sampleAnswer: 'Technology has revolutionized learning by providing access to information anytime, anywhere. Online courses, educational apps, and AI tutors have made personalized learning possible.',
    difficulty: 'B1',
  },
  {
    id: 'topic-edu-006',
    topic: 'Education',
    question: 'Do you think exams are the best way to assess students?',
    sampleAnswer: 'Exams test memory more than understanding. I think a combination of projects, presentations, and continuous assessment gives a more accurate picture of a student\'s abilities.',
    difficulty: 'B2',
  },

  // ═══════════════════════════════════════
  // TECHNOLOGY & INNOVATION (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'topic-tech-001',
    topic: 'Technology & Innovation',
    question: 'How do you think artificial intelligence will change our lives in the next 10 years?',
    sampleAnswer: 'AI will automate many routine tasks, improve healthcare diagnosis, and personalize education. However, it may also displace some jobs, so society needs to prepare for this transition.',
    difficulty: 'B2',
  },
  {
    id: 'topic-tech-002',
    topic: 'Technology & Innovation',
    question: 'Do you think social media has more positive or negative effects?',
    sampleAnswer: 'It has both. Social media connects people globally and raises awareness about important issues. But it can also spread misinformation and negatively impact mental health, especially among young people.',
    difficulty: 'B1',
  },
  {
    id: 'topic-tech-003',
    topic: 'Technology & Innovation',
    question: 'Describe a piece of technology that has changed your daily life.',
    sampleAnswer: 'My smartphone has completely changed how I manage my day. From communication and navigation to banking and entertainment, it\'s become an essential tool that I can\'t imagine living without.',
    difficulty: 'B1',
  },
  {
    id: 'topic-tech-004',
    topic: 'Technology & Innovation',
    question: 'Should children be allowed to use smartphones from a young age?',
    sampleAnswer: 'I think limited, supervised access is acceptable. Smartphones can be educational tools, but excessive screen time can affect children\'s development and social skills.',
    difficulty: 'B1',
  },
  {
    id: 'topic-tech-005',
    topic: 'Technology & Innovation',
    question: 'What invention do you think has had the biggest impact on humanity?',
    sampleAnswer: 'I would say the internet. It has transformed communication, commerce, education, and entertainment. It connects billions of people and makes information accessible to everyone.',
    difficulty: 'B2',
  },

  // ═══════════════════════════════════════
  // CULTURE & TRADITIONS (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'topic-cult-001',
    topic: 'Culture & Traditions',
    question: 'What is the most important festival in your country?',
    sampleAnswer: 'Tet, the Lunar New Year, is the most important festival in Vietnam. Families gather together, prepare special foods, and celebrate the coming year with traditional customs.',
    difficulty: 'A2',
  },
  {
    id: 'topic-cult-002',
    topic: 'Culture & Traditions',
    question: 'Do you think it\'s important to preserve traditional customs?',
    sampleAnswer: 'Yes, traditions are part of our cultural identity and connect us to our history. However, some outdated practices should evolve while keeping the core values intact.',
    difficulty: 'B1',
  },
  {
    id: 'topic-cult-003',
    topic: 'Culture & Traditions',
    question: 'How has globalization affected your country\'s culture?',
    sampleAnswer: 'Globalization has introduced Western fashion, food, and entertainment to Vietnam. While this brings diversity, some people worry about losing our unique cultural traditions.',
    difficulty: 'B2',
  },
  {
    id: 'topic-cult-004',
    topic: 'Culture & Traditions',
    question: 'What traditional food from your country would you recommend to a foreigner?',
    sampleAnswer: 'I would recommend pho, our iconic noodle soup. The aromatic broth simmered for hours with herbs and spices creates an unforgettable flavor that represents Vietnamese cuisine perfectly.',
    difficulty: 'A2',
  },
  {
    id: 'topic-cult-005',
    topic: 'Culture & Traditions',
    question: 'Are young people in your country interested in traditional arts?',
    sampleAnswer: 'Interest has declined somewhat, but there\'s recently been a revival. Many young artists are blending traditional techniques with modern styles, creating exciting new art forms.',
    difficulty: 'B1',
  },

  // ═══════════════════════════════════════
  // ENTERTAINMENT & MEDIA (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'topic-ent-001',
    topic: 'Entertainment & Media',
    question: 'What type of movies do you enjoy watching?',
    sampleAnswer: 'I enjoy watching science fiction and documentaries. Sci-fi movies spark my imagination, while documentaries help me learn about the world in an engaging way.',
    difficulty: 'A2',
  },
  {
    id: 'topic-ent-002',
    topic: 'Entertainment & Media',
    question: 'Do you think streaming services have killed traditional cinema?',
    sampleAnswer: 'Not entirely. While streaming is more convenient, the cinema experience with a big screen and surround sound is still special. Both can coexist by offering different experiences.',
    difficulty: 'B2',
  },
  {
    id: 'topic-ent-003',
    topic: 'Entertainment & Media',
    question: 'How do you think news media has changed in recent years?',
    sampleAnswer: 'News has become much more instant through social media and online platforms. However, this speed has sometimes come at the cost of accuracy, leading to the spread of fake news.',
    difficulty: 'B2',
  },
  {
    id: 'topic-ent-004',
    topic: 'Entertainment & Media',
    question: 'Do you prefer reading books or watching films?',
    sampleAnswer: 'I prefer reading books because they allow you to imagine the scenes and develop a deeper connection with the characters. Films are great too, but they\'re more of a passive experience.',
    difficulty: 'B1',
  },
  {
    id: 'topic-ent-005',
    topic: 'Entertainment & Media',
    question: 'What role does music play in your life?',
    sampleAnswer: 'Music is a huge part of my daily life. I listen to it while commuting, studying, and exercising. It helps me focus, relax, and express emotions that words sometimes can\'t.',
    difficulty: 'A2',
  },

  // ═══════════════════════════════════════
  // SOCIETY & LIFESTYLE (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'topic-soc-001',
    topic: 'Society & Lifestyle',
    question: 'Do you think life in cities is better than in the countryside?',
    sampleAnswer: 'Both have advantages. Cities offer more job opportunities and entertainment, while the countryside is quieter with cleaner air. It depends on what you value most in life.',
    difficulty: 'B1',
  },
  {
    id: 'topic-soc-002',
    topic: 'Society & Lifestyle',
    question: 'How important is work-life balance?',
    sampleAnswer: 'Work-life balance is essential for mental and physical health. Working too much leads to burnout, while having time for hobbies and family makes us more productive and happier.',
    difficulty: 'B1',
  },
  {
    id: 'topic-soc-003',
    topic: 'Society & Lifestyle',
    question: 'What changes would you like to see in your community?',
    sampleAnswer: 'I would love to see more green spaces and cycling paths in my neighborhood. Better public transport would also help reduce traffic congestion and air pollution.',
    difficulty: 'B1',
  },
  {
    id: 'topic-soc-004',
    topic: 'Society & Lifestyle',
    question: 'Do you think the gap between rich and poor is growing?',
    sampleAnswer: 'Unfortunately, yes. Despite economic growth, wealth is becoming more concentrated. Better access to education and healthcare could help bridge this gap and create more equal opportunities.',
    difficulty: 'B2',
  },
  {
    id: 'topic-soc-005',
    topic: 'Society & Lifestyle',
    question: 'How has the cost of living changed in your country?',
    sampleAnswer: 'The cost of living has risen significantly, especially housing and food prices. Young people find it increasingly difficult to afford their own apartments in major cities.',
    difficulty: 'B1',
  },

  // ═══════════════════════════════════════
  // WORK & CAREER (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'topic-work-001',
    topic: 'Work & Career',
    question: 'What qualities are important for career success?',
    sampleAnswer: 'Adaptability, continuous learning, and good communication skills are crucial. In today\'s fast-changing world, the ability to learn and evolve is more valuable than any specific technical skill.',
    difficulty: 'B1',
  },
  {
    id: 'topic-work-002',
    topic: 'Work & Career',
    question: 'Do you prefer working from home or in an office?',
    sampleAnswer: 'I prefer a hybrid model. Working from home gives me flexibility and saves commuting time, but going to the office provides social interaction and better collaboration with colleagues.',
    difficulty: 'B1',
  },
  {
    id: 'topic-work-003',
    topic: 'Work & Career',
    question: 'Is it better to be self-employed or work for a company?',
    sampleAnswer: 'Being self-employed offers freedom and unlimited potential, but comes with more risk and responsibility. Working for a company provides stability and benefits. It depends on your personality.',
    difficulty: 'B2',
  },
  {
    id: 'topic-work-004',
    topic: 'Work & Career',
    question: 'How do you handle stress at work or school?',
    sampleAnswer: 'I try to manage stress by staying organized and prioritizing tasks. When I feel overwhelmed, I take short breaks, go for a walk, or practice deep breathing exercises.',
    difficulty: 'B1',
  },
  {
    id: 'topic-work-005',
    topic: 'Work & Career',
    question: 'What job would you like to have in the future and why?',
    sampleAnswer: 'I would love to work in education technology, combining my passion for teaching and technology. Creating tools that make learning more accessible and engaging would be deeply fulfilling.',
    difficulty: 'B1',
  },

  // ═══════════════════════════════════════
  // SCIENCE & DISCOVERY (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'topic-sci-001',
    topic: 'Science & Discovery',
    question: 'What scientific discovery do you think has been the most important?',
    sampleAnswer: 'I think the discovery of antibiotics was transformative. Before penicillin, a simple infection could be fatal. Antibiotics have saved countless millions of lives worldwide.',
    difficulty: 'B2',
  },
  {
    id: 'topic-sci-002',
    topic: 'Science & Discovery',
    question: 'Should governments spend money on space exploration?',
    sampleAnswer: 'Yes, space exploration drives innovation and has led to many practical technologies we use daily. It also expands our understanding of the universe and inspires future generations of scientists.',
    difficulty: 'B2',
  },
  {
    id: 'topic-sci-003',
    topic: 'Science & Discovery',
    question: 'Do you think robots will replace human workers in the future?',
    sampleAnswer: 'Robots will likely take over repetitive and dangerous tasks, but human creativity, empathy, and complex problem-solving will always be needed. New types of jobs will emerge as technology evolves.',
    difficulty: 'B2',
  },
  {
    id: 'topic-sci-004',
    topic: 'Science & Discovery',
    question: 'How can science help solve the world\'s food problems?',
    sampleAnswer: 'Science can develop more efficient farming techniques, drought-resistant crops, and sustainable food production methods. Vertical farming and lab-grown meat are promising innovations.',
    difficulty: 'B2',
  },
  {
    id: 'topic-sci-005',
    topic: 'Science & Discovery',
    question: 'What area of science interests you the most?',
    sampleAnswer: 'I\'m fascinated by neuroscience and how the brain works. Understanding consciousness, memory, and learning could lead to breakthroughs in treating mental health and neurological disorders.',
    difficulty: 'B1',
  },
];
