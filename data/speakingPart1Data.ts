/**
 * Default Speaking Part 1 (Interview) question bank.
 * These questions are seeded on first app install and can be edited by users.
 * Organized by common IELTS / Cambridge Speaking Part 1 topics.
 */
import { SpeakingQuestion } from '../types';

export const defaultSpeakingTopics = [
  'Personal Information',
  'Work & Study',
  'Family',
  'Hobbies & Free Time',
  'Daily Routine',
  'Home & Accommodation',
  'Food & Cooking',
  'Travel & Holidays',
  'Weather & Seasons',
  'Technology',
  'Health & Sports',
  'Friends & Social Life',
] as const;

export const defaultSpeakingPart1: SpeakingQuestion[] = [
  // ═══════════════════════════════════════
  // PERSONAL INFORMATION (6 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-001',
    topic: 'Personal Information',
    question: 'Can you tell me your full name?',
    sampleAnswer: 'My full name is Nguyen Minh Anh. People usually call me Anh for short.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-002',
    topic: 'Personal Information',
    question: 'Where are you from?',
    sampleAnswer: 'I come from Ho Chi Minh City, which is the largest city in Vietnam. It\'s a vibrant and bustling place with lots of culture and street food.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-003',
    topic: 'Personal Information',
    question: 'What do you do in your free time?',
    sampleAnswer: 'In my free time, I enjoy reading novels and going for walks in the park. I also like watching documentaries about nature.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-004',
    topic: 'Personal Information',
    question: 'Can you describe yourself in a few words?',
    sampleAnswer: 'I would describe myself as hardworking, curious, and quite friendly. I enjoy learning new things and meeting people from different backgrounds.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-005',
    topic: 'Personal Information',
    question: 'What languages do you speak?',
    sampleAnswer: 'I speak Vietnamese as my mother tongue and I\'m currently learning English. I can also understand a little bit of French from school.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-006',
    topic: 'Personal Information',
    question: 'Do you have any plans for the future?',
    sampleAnswer: 'Yes, I\'m planning to pursue higher education abroad. I want to study computer science and then hopefully work in the tech industry.',
    difficulty: 'B1',
  },

  // ═══════════════════════════════════════
  // WORK & STUDY (6 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-007',
    topic: 'Work & Study',
    question: 'Do you work or are you a student?',
    sampleAnswer: 'I\'m currently a student. I\'m in my second year at university, studying business administration.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-008',
    topic: 'Work & Study',
    question: 'What subject are you studying?',
    sampleAnswer: 'I\'m studying English literature. I chose this subject because I\'ve always been passionate about reading and writing.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-009',
    topic: 'Work & Study',
    question: 'Why did you choose that job or field of study?',
    sampleAnswer: 'I chose this field because I\'m fascinated by how technology can solve real-world problems. It also offers great career opportunities.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-010',
    topic: 'Work & Study',
    question: 'What do you like most about your studies or job?',
    sampleAnswer: 'What I enjoy most is the hands-on projects. We get to apply theoretical knowledge to practical situations, which makes learning much more interesting.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-011',
    topic: 'Work & Study',
    question: 'Is there anything you would like to change about your school or workplace?',
    sampleAnswer: 'If I could change one thing, I would add more practical workshops. Sometimes the lessons can be too theoretical and I think we need more real-world experience.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-012',
    topic: 'Work & Study',
    question: 'What are the most important qualities for success in your field?',
    sampleAnswer: 'I believe critical thinking and communication skills are essential. You also need to be adaptable because the industry changes rapidly.',
    difficulty: 'B2',
  },

  // ═══════════════════════════════════════
  // FAMILY (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-013',
    topic: 'Family',
    question: 'How many people are there in your family?',
    sampleAnswer: 'There are four people in my family: my parents, my younger sister, and me. We all live together in the same house.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-014',
    topic: 'Family',
    question: 'Do you spend a lot of time with your family?',
    sampleAnswer: 'Yes, I try to spend as much time as possible with my family. We usually have dinner together every evening and go out on weekends.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-015',
    topic: 'Family',
    question: 'Who are you closest to in your family?',
    sampleAnswer: 'I\'m closest to my mother. She\'s very supportive and understanding. We often talk about everything from daily life to future plans.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-016',
    topic: 'Family',
    question: 'What do you usually do together as a family?',
    sampleAnswer: 'We enjoy cooking meals together on weekends and sometimes we go on short trips to the countryside. It helps us bond and relax.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-017',
    topic: 'Family',
    question: 'How important is family in your culture?',
    sampleAnswer: 'Family is extremely important in Vietnamese culture. We have strong family ties and it\'s common for extended families to live close together and support each other.',
    difficulty: 'B1',
  },

  // ═══════════════════════════════════════
  // HOBBIES & FREE TIME (6 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-018',
    topic: 'Hobbies & Free Time',
    question: 'What hobbies do you have?',
    sampleAnswer: 'My main hobbies are playing guitar and photography. I find them both relaxing and creative.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-019',
    topic: 'Hobbies & Free Time',
    question: 'How much time do you spend on your hobbies?',
    sampleAnswer: 'I usually spend about an hour a day on my hobbies, more during weekends. It helps me unwind after a busy day of studying.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-020',
    topic: 'Hobbies & Free Time',
    question: 'Do you prefer indoor or outdoor activities?',
    sampleAnswer: 'I prefer outdoor activities, especially during good weather. I enjoy cycling, hiking, and exploring new places in the city.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-021',
    topic: 'Hobbies & Free Time',
    question: 'Have you taken up any new hobbies recently?',
    sampleAnswer: 'Yes, I recently started learning to paint watercolors. A friend introduced me to it and I\'ve found it to be incredibly therapeutic.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-022',
    topic: 'Hobbies & Free Time',
    question: 'Do you think hobbies are important? Why?',
    sampleAnswer: 'Absolutely. Hobbies help reduce stress and give us a sense of accomplishment outside of work. They also help us develop new skills and meet like-minded people.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-023',
    topic: 'Hobbies & Free Time',
    question: 'Is there a hobby you would like to try in the future?',
    sampleAnswer: 'I\'d love to try scuba diving. I\'m fascinated by marine life and I think exploring underwater worlds would be an incredible experience.',
    difficulty: 'B1',
  },

  // ═══════════════════════════════════════
  // DAILY ROUTINE (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-024',
    topic: 'Daily Routine',
    question: 'What time do you usually wake up?',
    sampleAnswer: 'I usually wake up at around 6:30 in the morning. I like to have some quiet time before the day gets busy.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-025',
    topic: 'Daily Routine',
    question: 'What do you usually do in the morning?',
    sampleAnswer: 'After waking up, I usually do some light exercise, take a shower, and have breakfast. Then I review my schedule for the day.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-026',
    topic: 'Daily Routine',
    question: 'Do you prefer mornings or evenings? Why?',
    sampleAnswer: 'I\'m definitely a morning person. I feel more productive and focused in the morning, and I enjoy the fresh air and quietness.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-027',
    topic: 'Daily Routine',
    question: 'Has your daily routine changed much over the years?',
    sampleAnswer: 'Yes, it has changed significantly since I started university. I now have a more flexible schedule but I also need to manage my time more carefully.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-028',
    topic: 'Daily Routine',
    question: 'What is your favorite part of the day?',
    sampleAnswer: 'My favorite part is the evening when I finish all my tasks. I can relax, watch a movie, or spend time chatting with friends online.',
    difficulty: 'A2',
  },

  // ═══════════════════════════════════════
  // HOME & ACCOMMODATION (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-029',
    topic: 'Home & Accommodation',
    question: 'Do you live in a house or an apartment?',
    sampleAnswer: 'I live in an apartment in the city center. It\'s not very big, but it\'s cozy and conveniently located near public transport.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-030',
    topic: 'Home & Accommodation',
    question: 'What is your favorite room in your home?',
    sampleAnswer: 'My favorite room is my bedroom because it\'s my personal space. I\'ve decorated it with posters and I have a comfortable reading corner by the window.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-031',
    topic: 'Home & Accommodation',
    question: 'What do you like about your neighborhood?',
    sampleAnswer: 'I really like that it\'s quiet and safe. There\'s also a nice park nearby where I can go jogging in the morning.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-032',
    topic: 'Home & Accommodation',
    question: 'Would you like to move to a different place?',
    sampleAnswer: 'I\'m quite happy where I am now, but in the future, I\'d like to move to a house with a garden. It would be nice to have more outdoor space.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-033',
    topic: 'Home & Accommodation',
    question: 'How long have you been living in your current home?',
    sampleAnswer: 'I\'ve been living here for about five years. My family moved here when I started secondary school.',
    difficulty: 'A2',
  },

  // ═══════════════════════════════════════
  // FOOD & COOKING (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-034',
    topic: 'Food & Cooking',
    question: 'What is your favorite food?',
    sampleAnswer: 'My favorite food is pho, a traditional Vietnamese noodle soup. I love it because of the rich broth and fresh herbs.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-035',
    topic: 'Food & Cooking',
    question: 'Do you enjoy cooking?',
    sampleAnswer: 'Yes, I do. I find cooking relaxing and it gives me a sense of creativity. I often try new recipes I find on YouTube.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-036',
    topic: 'Food & Cooking',
    question: 'Do you prefer eating at home or eating out?',
    sampleAnswer: 'I generally prefer eating at home because it\'s healthier and more economical. But I do enjoy going out with friends to try different restaurants occasionally.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-037',
    topic: 'Food & Cooking',
    question: 'Have you ever tried any foreign food?',
    sampleAnswer: 'Yes, I\'ve tried Japanese sushi and Korean barbecue. I really enjoyed sushi because it\'s fresh and light. I\'m always open to trying cuisine from other cultures.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-038',
    topic: 'Food & Cooking',
    question: 'What food is popular in your country?',
    sampleAnswer: 'In Vietnam, street food is incredibly popular. Dishes like banh mi, bun cha, and spring rolls are loved by both locals and tourists.',
    difficulty: 'A2',
  },

  // ═══════════════════════════════════════
  // TRAVEL & HOLIDAYS (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-039',
    topic: 'Travel & Holidays',
    question: 'Do you like traveling?',
    sampleAnswer: 'Yes, I love traveling! It broadens my horizons and helps me learn about different cultures and lifestyles.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-040',
    topic: 'Travel & Holidays',
    question: 'Where was the last place you visited?',
    sampleAnswer: 'The last place I visited was Da Lat, a highland city in Vietnam. The weather was cool and the scenery was breathtaking.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-041',
    topic: 'Travel & Holidays',
    question: 'Do you prefer traveling alone or with others?',
    sampleAnswer: 'I prefer traveling with a small group of friends. It\'s more fun to share experiences and we can split the costs.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-042',
    topic: 'Travel & Holidays',
    question: 'What country would you most like to visit?',
    sampleAnswer: 'I\'d love to visit Japan. I\'m fascinated by their unique blend of traditional culture and cutting-edge technology.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-043',
    topic: 'Travel & Holidays',
    question: 'How do you usually spend your holidays?',
    sampleAnswer: 'During holidays, I usually travel to my grandparents\' house in the countryside. It\'s a great change of pace from city life.',
    difficulty: 'A2',
  },

  // ═══════════════════════════════════════
  // WEATHER & SEASONS (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-044',
    topic: 'Weather & Seasons',
    question: 'What is the weather like in your country?',
    sampleAnswer: 'Vietnam has a tropical climate, so it\'s generally warm and humid. In the south, we have two main seasons: dry and rainy.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-045',
    topic: 'Weather & Seasons',
    question: 'What is your favorite season?',
    sampleAnswer: 'My favorite season is autumn because the weather is cool and pleasant. I love the golden leaves and the refreshing breeze.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-046',
    topic: 'Weather & Seasons',
    question: 'Does the weather affect your mood?',
    sampleAnswer: 'Yes, definitely. I feel more energetic on sunny days and tend to be a bit lazier on rainy days. I prefer clear, cool weather the most.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-047',
    topic: 'Weather & Seasons',
    question: 'What do you usually do on rainy days?',
    sampleAnswer: 'On rainy days, I stay indoors and read books or watch movies. Sometimes I bake cookies — the smell is perfect for a cozy rainy day.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-048',
    topic: 'Weather & Seasons',
    question: 'Has the climate in your area changed over the years?',
    sampleAnswer: 'Yes, I\'ve noticed it\'s getting hotter in summer and rainfall patterns are less predictable. I think it\'s related to climate change and urbanization.',
    difficulty: 'B2',
  },

  // ═══════════════════════════════════════
  // TECHNOLOGY (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-049',
    topic: 'Technology',
    question: 'How often do you use your phone?',
    sampleAnswer: 'I use my phone quite a lot, probably several hours a day for communication, studying, and entertainment.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-050',
    topic: 'Technology',
    question: 'What is your favorite app?',
    sampleAnswer: 'My favorite app is probably YouTube because I use it for both learning and entertainment. I watch tutorials, music videos, and educational content.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-051',
    topic: 'Technology',
    question: 'Do you think technology has improved our lives?',
    sampleAnswer: 'Yes, technology has made life much more convenient. We can communicate instantly, access information easily, and work more efficiently.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-052',
    topic: 'Technology',
    question: 'Are there any disadvantages of using technology too much?',
    sampleAnswer: 'Absolutely. Excessive screen time can cause eye strain and reduce face-to-face interaction. Social media can also be addictive and affect mental health.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-053',
    topic: 'Technology',
    question: 'What new technology are you most excited about?',
    sampleAnswer: 'I\'m most excited about AI and its applications in education. I think AI-powered learning tools will make quality education more accessible to everyone.',
    difficulty: 'B2',
  },

  // ═══════════════════════════════════════
  // HEALTH & SPORTS (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-054',
    topic: 'Health & Sports',
    question: 'Do you play any sports?',
    sampleAnswer: 'Yes, I play badminton regularly with my friends. We usually play two or three times a week at a nearby sports center.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-055',
    topic: 'Health & Sports',
    question: 'What do you do to stay healthy?',
    sampleAnswer: 'I try to exercise regularly, eat a balanced diet, and get enough sleep. I also drink plenty of water throughout the day.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-056',
    topic: 'Health & Sports',
    question: 'What is the most popular sport in your country?',
    sampleAnswer: 'Football is by far the most popular sport in Vietnam. People are very passionate about it and huge crowds gather to watch major matches.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-057',
    topic: 'Health & Sports',
    question: 'Do you prefer watching sports or playing sports?',
    sampleAnswer: 'I prefer playing sports because I find it more exciting and it keeps me fit. But I also enjoy watching international football matches.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-058',
    topic: 'Health & Sports',
    question: 'Do you think people today are less active than in the past?',
    sampleAnswer: 'Yes, I think modern lifestyles have made people more sedentary. Many people spend long hours sitting at desks and rely on cars instead of walking.',
    difficulty: 'B2',
  },

  // ═══════════════════════════════════════
  // FRIENDS & SOCIAL LIFE (5 questions)
  // ═══════════════════════════════════════
  {
    id: 'def-p1-059',
    topic: 'Friends & Social Life',
    question: 'Do you have a lot of friends?',
    sampleAnswer: 'I have a few close friends and a wider circle of acquaintances. I prefer having deeper connections rather than many superficial friendships.',
    difficulty: 'A1',
  },
  {
    id: 'def-p1-060',
    topic: 'Friends & Social Life',
    question: 'How did you meet your best friend?',
    sampleAnswer: 'I met my best friend in primary school. We sat next to each other in class and discovered we had a lot in common.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-061',
    topic: 'Friends & Social Life',
    question: 'What do you usually do when you go out with friends?',
    sampleAnswer: 'We usually go to a café to chat, or sometimes we play sports together. On special occasions, we might go to the cinema or try a new restaurant.',
    difficulty: 'A2',
  },
  {
    id: 'def-p1-062',
    topic: 'Friends & Social Life',
    question: 'Do you prefer spending time alone or with friends?',
    sampleAnswer: 'It depends on my mood. Sometimes I need alone time to recharge, but I also really enjoy socializing and sharing experiences with friends.',
    difficulty: 'B1',
  },
  {
    id: 'def-p1-063',
    topic: 'Friends & Social Life',
    question: 'Is it easy to make new friends in your city?',
    sampleAnswer: 'Yes, I think people in my city are generally friendly and open. There are also many social events and clubs where you can meet new people.',
    difficulty: 'B1',
  },
];
