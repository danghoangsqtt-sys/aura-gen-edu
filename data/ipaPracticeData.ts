/**
 * Practice data for IPA sounds — words and sentences
 * Key: IPA symbol → { words, sentences }
 */
import { PracticeWord, PracticeSentence } from './ipaData';

export interface IPAPractice {
  words: PracticeWord[];
  sentences: PracticeSentence[];
}

export const ipaPracticeMap: Record<string, IPAPractice> = {
  // ═══ MONOPHTHONGS ═══
  'iː': {
    words: [
      { word: 'sheep', ipa: '/ʃiːp/' }, { word: 'beach', ipa: '/biːtʃ/' }, { word: 'tree', ipa: '/triː/' },
      { word: 'green', ipa: '/ɡriːn/' }, { word: 'read', ipa: '/riːd/' }, { word: 'please', ipa: '/pliːz/' },
      { word: 'clean', ipa: '/kliːn/' }, { word: 'teeth', ipa: '/tiːθ/' }, { word: 'leaf', ipa: '/liːf/' },
      { word: 'feel', ipa: '/fiːl/' }, { word: 'deep', ipa: '/diːp/' }, { word: 'agree', ipa: '/əˈɡriː/' },
    ],
    sentences: [
      { sentence: 'She sees three green trees.', ipa: '/ʃiː siːz θriː ɡriːn triːz/' },
      { sentence: 'Please keep the streets clean.', ipa: '/pliːz kiːp ðə striːts kliːn/' },
      { sentence: 'He needs to read each piece.', ipa: '/hiː niːdz tuː riːd iːtʃ piːs/' },
      { sentence: 'We agreed to meet by the beach.', ipa: '/wiː əˈɡriːd tuː miːt baɪ ðə biːtʃ/' },
      { sentence: 'The teacher leaves before evening.', ipa: '/ðə ˈtiːtʃər liːvz bɪˈfɔːr ˈiːvnɪŋ/' },
    ],
  },
  'ɪ': {
    words: [
      { word: 'ship', ipa: '/ʃɪp/' }, { word: 'fish', ipa: '/fɪʃ/' }, { word: 'sit', ipa: '/sɪt/' },
      { word: 'big', ipa: '/bɪɡ/' }, { word: 'river', ipa: '/ˈrɪvər/' }, { word: 'listen', ipa: '/ˈlɪsn/' },
      { word: 'children', ipa: '/ˈtʃɪldrən/' }, { word: 'build', ipa: '/bɪld/' }, { word: 'milk', ipa: '/mɪlk/' },
      { word: 'swim', ipa: '/swɪm/' }, { word: 'rich', ipa: '/rɪtʃ/' }, { word: 'gift', ipa: '/ɡɪft/' },
    ],
    sentences: [
      { sentence: 'The children swim in the river.', ipa: '/ðə ˈtʃɪldrən swɪm ɪn ðə ˈrɪvər/' },
      { sentence: 'This fish is a big gift.', ipa: '/ðɪs fɪʃ ɪz ə bɪɡ ɡɪft/' },
      { sentence: 'Sit still and listen to him.', ipa: '/sɪt stɪl ænd ˈlɪsn tuː hɪm/' },
      { sentence: 'Did the ship hit the bridge?', ipa: '/dɪd ðə ʃɪp hɪt ðə brɪdʒ/' },
      { sentence: 'Bill lives in a big building.', ipa: '/bɪl lɪvz ɪn ə bɪɡ ˈbɪldɪŋ/' },
    ],
  },
  'ʊ': {
    words: [
      { word: 'good', ipa: '/ɡʊd/' }, { word: 'put', ipa: '/pʊt/' }, { word: 'book', ipa: '/bʊk/' },
      { word: 'look', ipa: '/lʊk/' }, { word: 'full', ipa: '/fʊl/' }, { word: 'push', ipa: '/pʊʃ/' },
      { word: 'wood', ipa: '/wʊd/' }, { word: 'foot', ipa: '/fʊt/' }, { word: 'could', ipa: '/kʊd/' },
      { word: 'sugar', ipa: '/ˈʃʊɡər/' }, { word: 'pull', ipa: '/pʊl/' }, { word: 'wool', ipa: '/wʊl/' },
    ],
    sentences: [
      { sentence: 'Could you put the book back?', ipa: '/kʊd juː pʊt ðə bʊk bæk/' },
      { sentence: 'She took a good look at the wood.', ipa: '/ʃiː tʊk ə ɡʊd lʊk æt ðə wʊd/' },
      { sentence: 'The woman stood on one foot.', ipa: '/ðə ˈwʊmən stʊd ɒn wʌn fʊt/' },
      { sentence: 'Push the wool into the full bag.', ipa: '/pʊʃ ðə wʊl ˈɪntə ðə fʊl bæɡ/' },
    ],
  },
  'uː': {
    words: [
      { word: 'food', ipa: '/fuːd/' }, { word: 'blue', ipa: '/bluː/' }, { word: 'moon', ipa: '/muːn/' },
      { word: 'school', ipa: '/skuːl/' }, { word: 'shoe', ipa: '/ʃuː/' }, { word: 'cool', ipa: '/kuːl/' },
      { word: 'juice', ipa: '/dʒuːs/' }, { word: 'fruit', ipa: '/fruːt/' }, { word: 'true', ipa: '/truː/' },
      { word: 'group', ipa: '/ɡruːp/' }, { word: 'tool', ipa: '/tuːl/' }, { word: 'tooth', ipa: '/tuːθ/' },
    ],
    sentences: [
      { sentence: 'The blue moon looks so cool.', ipa: '/ðə bluː muːn lʊks səʊ kuːl/' },
      { sentence: 'Choose some fruit juice from school.', ipa: '/tʃuːz sʌm fruːt dʒuːs frɒm skuːl/' },
      { sentence: 'The group used new tools.', ipa: '/ðə ɡruːp juːzd njuː tuːlz/' },
    ],
  },
  'e': {
    words: [
      { word: 'bed', ipa: '/bed/' }, { word: 'head', ipa: '/hed/' }, { word: 'red', ipa: '/red/' },
      { word: 'get', ipa: '/ɡet/' }, { word: 'any', ipa: '/ˈeni/' }, { word: 'friend', ipa: '/frend/' },
      { word: 'next', ipa: '/nekst/' }, { word: 'bread', ipa: '/bred/' }, { word: 'help', ipa: '/help/' },
      { word: 'ten', ipa: '/ten/' }, { word: 'best', ipa: '/best/' }, { word: 'second', ipa: '/ˈsekənd/' },
    ],
    sentences: [
      { sentence: 'Ted went to bed instead.', ipa: '/ted went tuː bed ɪnˈsted/' },
      { sentence: 'My best friend gets ten presents.', ipa: '/maɪ best frend ɡets ten ˈprezənts/' },
      { sentence: 'Let me get some fresh bread.', ipa: '/let miː ɡet sʌm freʃ bred/' },
    ],
  },
  'ə': {
    words: [
      { word: 'about', ipa: '/əˈbaʊt/' }, { word: 'teacher', ipa: '/ˈtiːtʃər/' }, { word: 'today', ipa: '/təˈdeɪ/' },
      { word: 'banana', ipa: '/bəˈnɑːnə/' }, { word: 'letter', ipa: '/ˈletər/' }, { word: 'again', ipa: '/əˈɡen/' },
      { word: 'police', ipa: '/pəˈliːs/' }, { word: 'support', ipa: '/səˈpɔːrt/' }, { word: 'problem', ipa: '/ˈprɒbləm/' },
      { word: 'family', ipa: '/ˈfæməli/' },
    ],
    sentences: [
      { sentence: 'The teacher told us about a problem.', ipa: '/ðə ˈtiːtʃər təʊld ʌs əˈbaʊt ə ˈprɒbləm/' },
      { sentence: 'I forgot to support my family today.', ipa: '/aɪ fərˈɡɒt tuː səˈpɔːrt maɪ ˈfæməli təˈdeɪ/' },
    ],
  },
  'ɜː': {
    words: [
      { word: 'bird', ipa: '/bɜːd/' }, { word: 'work', ipa: '/wɜːk/' }, { word: 'learn', ipa: '/lɜːn/' },
      { word: 'first', ipa: '/fɜːst/' }, { word: 'nurse', ipa: '/nɜːs/' }, { word: 'earth', ipa: '/ɜːθ/' },
      { word: 'hurt', ipa: '/hɜːt/' }, { word: 'turn', ipa: '/tɜːn/' }, { word: 'world', ipa: '/wɜːld/' },
      { word: 'word', ipa: '/wɜːd/' }, { word: 'serve', ipa: '/sɜːv/' }, { word: 'early', ipa: '/ˈɜːli/' },
    ],
    sentences: [
      { sentence: 'The early bird learns first.', ipa: '/ðə ˈɜːli bɜːd lɜːnz fɜːst/' },
      { sentence: 'The nurse works around the world.', ipa: '/ðə nɜːs wɜːks əˈraʊnd ðə wɜːld/' },
      { sentence: 'Her words hurt the girl.', ipa: '/hɜːr wɜːdz hɜːt ðə ɡɜːl/' },
    ],
  },
  'ɔː': {
    words: [
      { word: 'door', ipa: '/dɔːr/' }, { word: 'more', ipa: '/mɔːr/' }, { word: 'thought', ipa: '/θɔːt/' },
      { word: 'walk', ipa: '/wɔːk/' }, { word: 'call', ipa: '/kɔːl/' }, { word: 'talk', ipa: '/tɔːk/' },
      { word: 'four', ipa: '/fɔːr/' }, { word: 'fall', ipa: '/fɔːl/' }, { word: 'court', ipa: '/kɔːrt/' },
      { word: 'horse', ipa: '/hɔːrs/' }, { word: 'sport', ipa: '/spɔːrt/' }, { word: 'warm', ipa: '/wɔːrm/' },
    ],
    sentences: [
      { sentence: 'I thought you called for more water.', ipa: '/aɪ θɔːt juː kɔːld fɔːr mɔːr ˈwɔːtər/' },
      { sentence: 'We walked to the door of the court.', ipa: '/wiː wɔːkt tuː ðə dɔːr ɒv ðə kɔːrt/' },
    ],
  },
  'æ': {
    words: [
      { word: 'cat', ipa: '/kæt/' }, { word: 'hat', ipa: '/hæt/' }, { word: 'map', ipa: '/mæp/' },
      { word: 'black', ipa: '/blæk/' }, { word: 'happy', ipa: '/ˈhæpi/' }, { word: 'family', ipa: '/ˈfæməli/' },
      { word: 'bad', ipa: '/bæd/' }, { word: 'man', ipa: '/mæn/' }, { word: 'hand', ipa: '/hænd/' },
      { word: 'plan', ipa: '/plæn/' }, { word: 'travel', ipa: '/ˈtrævəl/' }, { word: 'match', ipa: '/mætʃ/' },
    ],
    sentences: [
      { sentence: 'The happy cat sat on the black mat.', ipa: '/ðə ˈhæpi kæt sæt ɒn ðə blæk mæt/' },
      { sentence: 'That man has a bad plan.', ipa: '/ðæt mæn hæz ə bæd plæn/' },
    ],
  },
  'ʌ': {
    words: [
      { word: 'cup', ipa: '/kʌp/' }, { word: 'up', ipa: '/ʌp/' }, { word: 'love', ipa: '/lʌv/' },
      { word: 'money', ipa: '/ˈmʌni/' }, { word: 'sun', ipa: '/sʌn/' }, { word: 'run', ipa: '/rʌn/' },
      { word: 'come', ipa: '/kʌm/' }, { word: 'young', ipa: '/jʌŋ/' }, { word: 'much', ipa: '/mʌtʃ/' },
      { word: 'lunch', ipa: '/lʌntʃ/' }, { word: 'study', ipa: '/ˈstʌdi/' }, { word: 'brother', ipa: '/ˈbrʌðər/' },
    ],
    sentences: [
      { sentence: 'My young brother loves to run under the sun.', ipa: '/maɪ jʌŋ ˈbrʌðər lʌvz tuː rʌn ˈʌndər ðə sʌn/' },
      { sentence: 'Come up for some lunch, son.', ipa: '/kʌm ʌp fɔːr sʌm lʌntʃ sʌn/' },
    ],
  },
  'ɑː': {
    words: [
      { word: 'car', ipa: '/kɑːr/' }, { word: 'father', ipa: '/ˈfɑːðər/' }, { word: 'start', ipa: '/stɑːrt/' },
      { word: 'heart', ipa: '/hɑːrt/' }, { word: 'park', ipa: '/pɑːrk/' }, { word: 'dark', ipa: '/dɑːrk/' },
      { word: 'class', ipa: '/klɑːs/' }, { word: 'half', ipa: '/hɑːf/' }, { word: 'garden', ipa: '/ˈɡɑːrdən/' },
      { word: 'farm', ipa: '/fɑːrm/' }, { word: 'arm', ipa: '/ɑːrm/' }, { word: 'star', ipa: '/stɑːr/' },
    ],
    sentences: [
      { sentence: 'My father parked the car in the dark.', ipa: '/maɪ ˈfɑːðər pɑːrkt ðə kɑːr ɪn ðə dɑːrk/' },
      { sentence: 'The farm garden has a large palm tree.', ipa: '/ðə fɑːrm ˈɡɑːrdən hæz ə lɑːrdʒ pɑːm triː/' },
    ],
  },
  'ɒ': {
    words: [
      { word: 'hot', ipa: '/hɒt/' }, { word: 'stop', ipa: '/stɒp/' }, { word: 'box', ipa: '/bɒks/' },
      { word: 'dog', ipa: '/dɒɡ/' }, { word: 'job', ipa: '/dʒɒb/' }, { word: 'shop', ipa: '/ʃɒp/' },
      { word: 'clock', ipa: '/klɒk/' }, { word: 'rock', ipa: '/rɒk/' }, { word: 'pot', ipa: '/pɒt/' },
      { word: 'knock', ipa: '/nɒk/' }, { word: 'cost', ipa: '/kɒst/' }, { word: 'lot', ipa: '/lɒt/' },
    ],
    sentences: [
      { sentence: 'The dog stopped at the hot rock.', ipa: '/ðə dɒɡ stɒpt æt ðə hɒt rɒk/' },
      { sentence: 'John got a box from the shop.', ipa: '/dʒɒn ɡɒt ə bɒks frɒm ðə ʃɒp/' },
    ],
  },
  // ═══ DIPHTHONGS ═══
  'ɪə': {
    words: [
      { word: 'here', ipa: '/hɪər/' }, { word: 'near', ipa: '/nɪər/' }, { word: 'ear', ipa: '/ɪər/' },
      { word: 'clear', ipa: '/klɪər/' }, { word: 'fear', ipa: '/fɪər/' }, { word: 'beer', ipa: '/bɪər/' },
      { word: 'appear', ipa: '/əˈpɪər/' }, { word: 'idea', ipa: '/aɪˈdɪə/' }, { word: 'career', ipa: '/kəˈrɪər/' },
    ],
    sentences: [
      { sentence: 'Come here and hear this idea clearly.', ipa: '/kʌm hɪər ænd hɪər ðɪs aɪˈdɪə ˈklɪəli/' },
      { sentence: 'The deer appeared near the pier.', ipa: '/ðə dɪər əˈpɪərd nɪər ðə pɪər/' },
    ],
  },
  'eɪ': {
    words: [
      { word: 'wait', ipa: '/weɪt/' }, { word: 'day', ipa: '/deɪ/' }, { word: 'name', ipa: '/neɪm/' },
      { word: 'make', ipa: '/meɪk/' }, { word: 'great', ipa: '/ɡreɪt/' }, { word: 'play', ipa: '/pleɪ/' },
      { word: 'rain', ipa: '/reɪn/' }, { word: 'train', ipa: '/treɪn/' }, { word: 'late', ipa: '/leɪt/' },
      { word: 'change', ipa: '/tʃeɪndʒ/' }, { word: 'place', ipa: '/pleɪs/' }, { word: 'baby', ipa: '/ˈbeɪbi/' },
    ],
    sentences: [
      { sentence: 'Kate was late for the train today.', ipa: '/keɪt wɒz leɪt fɔːr ðə treɪn təˈdeɪ/' },
      { sentence: 'Wait for the rain to change.', ipa: '/weɪt fɔːr ðə reɪn tuː tʃeɪndʒ/' },
    ],
  },
  'ɔɪ': {
    words: [
      { word: 'boy', ipa: '/bɔɪ/' }, { word: 'coin', ipa: '/kɔɪn/' }, { word: 'voice', ipa: '/vɔɪs/' },
      { word: 'joy', ipa: '/dʒɔɪ/' }, { word: 'toy', ipa: '/tɔɪ/' }, { word: 'noise', ipa: '/nɔɪz/' },
      { word: 'choice', ipa: '/tʃɔɪs/' }, { word: 'point', ipa: '/pɔɪnt/' }, { word: 'join', ipa: '/dʒɔɪn/' },
      { word: 'enjoy', ipa: '/ɪnˈdʒɔɪ/' }, { word: 'oil', ipa: '/ɔɪl/' }, { word: 'royal', ipa: '/ˈrɔɪəl/' },
    ],
    sentences: [
      { sentence: 'The boy enjoys playing with his toys.', ipa: '/ðə bɔɪ ɪnˈdʒɔɪz ˈpleɪɪŋ wɪð hɪz tɔɪz/' },
      { sentence: 'Join me and point at the coin.', ipa: '/dʒɔɪn miː ænd pɔɪnt æt ðə kɔɪn/' },
    ],
  },
  'aɪ': {
    words: [
      { word: 'my', ipa: '/maɪ/' }, { word: 'time', ipa: '/taɪm/' }, { word: 'fly', ipa: '/flaɪ/' },
      { word: 'night', ipa: '/naɪt/' }, { word: 'right', ipa: '/raɪt/' }, { word: 'write', ipa: '/raɪt/' },
      { word: 'drive', ipa: '/draɪv/' }, { word: 'life', ipa: '/laɪf/' }, { word: 'light', ipa: '/laɪt/' },
      { word: 'kind', ipa: '/kaɪnd/' }, { word: 'idea', ipa: '/aɪˈdɪə/' }, { word: 'quiet', ipa: '/ˈkwaɪət/' },
    ],
    sentences: [
      { sentence: 'I like to fly my kite at night.', ipa: '/aɪ laɪk tuː flaɪ maɪ kaɪt æt naɪt/' },
      { sentence: 'Life is quite nice when the time is right.', ipa: '/laɪf ɪz kwaɪt naɪs wen ðə taɪm ɪz raɪt/' },
    ],
  },
  'eə': {
    words: [
      { word: 'hair', ipa: '/heər/' }, { word: 'there', ipa: '/ðeər/' }, { word: 'care', ipa: '/keər/' },
      { word: 'share', ipa: '/ʃeər/' }, { word: 'pair', ipa: '/peər/' }, { word: 'where', ipa: '/weər/' },
      { word: 'fair', ipa: '/feər/' }, { word: 'chair', ipa: '/tʃeər/' }, { word: 'wear', ipa: '/weər/' },
      { word: 'square', ipa: '/skweər/' },
    ],
    sentences: [
      { sentence: 'Where is the pair of chairs over there?', ipa: '/weər ɪz ðə peər ɒv tʃeəz ˈəʊvər ðeər/' },
      { sentence: 'Take care and share fairly.', ipa: '/teɪk keər ænd ʃeər ˈfeəli/' },
    ],
  },
  'əʊ': {
    words: [
      { word: 'show', ipa: '/ʃəʊ/' }, { word: 'no', ipa: '/nəʊ/' }, { word: 'go', ipa: '/ɡəʊ/' },
      { word: 'home', ipa: '/həʊm/' }, { word: 'phone', ipa: '/fəʊn/' }, { word: 'old', ipa: '/əʊld/' },
      { word: 'know', ipa: '/nəʊ/' }, { word: 'road', ipa: '/rəʊd/' }, { word: 'cold', ipa: '/kəʊld/' },
      { word: 'boat', ipa: '/bəʊt/' }, { word: 'snow', ipa: '/snəʊ/' }, { word: 'slow', ipa: '/sləʊ/' },
    ],
    sentences: [
      { sentence: 'Go home on the old road below.', ipa: '/ɡəʊ həʊm ɒn ðə əʊld rəʊd bɪˈləʊ/' },
      { sentence: 'I know the boat moves slowly.', ipa: '/aɪ nəʊ ðə bəʊt muːvz ˈsləʊli/' },
    ],
  },
  'aʊ': {
    words: [
      { word: 'cow', ipa: '/kaʊ/' }, { word: 'house', ipa: '/haʊs/' }, { word: 'brown', ipa: '/braʊn/' },
      { word: 'town', ipa: '/taʊn/' }, { word: 'down', ipa: '/daʊn/' }, { word: 'mouth', ipa: '/maʊθ/' },
      { word: 'loud', ipa: '/laʊd/' }, { word: 'sound', ipa: '/saʊnd/' }, { word: 'ground', ipa: '/ɡraʊnd/' },
      { word: 'out', ipa: '/aʊt/' }, { word: 'round', ipa: '/raʊnd/' }, { word: 'count', ipa: '/kaʊnt/' },
    ],
    sentences: [
      { sentence: 'The brown cow ran around the town.', ipa: '/ðə braʊn kaʊ ræn əˈraʊnd ðə taʊn/' },
      { sentence: 'A loud sound came from the ground.', ipa: '/ə laʊd saʊnd keɪm frɒm ðə ɡraʊnd/' },
    ],
  },
  'ʊə': {
    words: [
      { word: 'tour', ipa: '/tʊər/' }, { word: 'poor', ipa: '/pʊər/' }, { word: 'sure', ipa: '/ʃʊər/' },
      { word: 'pure', ipa: '/pjʊər/' }, { word: 'cure', ipa: '/kjʊər/' }, { word: 'jury', ipa: '/ˈdʒʊəri/' },
      { word: 'during', ipa: '/ˈdjʊərɪŋ/' }, { word: 'mature', ipa: '/məˈtjʊər/' },
    ],
    sentences: [
      { sentence: 'Are you sure the tour is for the poor?', ipa: '/ɑːr juː ʃʊər ðə tʊər ɪz fɔːr ðə pʊər/' },
      { sentence: 'The pure cure will mature during the year.', ipa: '/ðə pjʊər kjʊər wɪl məˈtjʊər ˈdjʊərɪŋ ðə jɪər/' },
    ],
  },
  // ═══ CONSONANTS ═══
  'p': {
    words: [
      { word: 'pen', ipa: '/pen/' }, { word: 'paper', ipa: '/ˈpeɪpər/' }, { word: 'happy', ipa: '/ˈhæpi/' },
      { word: 'stop', ipa: '/stɒp/' }, { word: 'park', ipa: '/pɑːrk/' }, { word: 'people', ipa: '/ˈpiːpl/' },
    ],
    sentences: [
      { sentence: 'Peter picked up a paper from the park.', ipa: '/ˈpiːtər pɪkt ʌp ə ˈpeɪpər frɒm ðə pɑːrk/' },
    ],
  },
  'b': {
    words: [
      { word: 'back', ipa: '/bæk/' }, { word: 'baby', ipa: '/ˈbeɪbi/' }, { word: 'job', ipa: '/dʒɒb/' },
      { word: 'blue', ipa: '/bluː/' }, { word: 'before', ipa: '/bɪˈfɔːr/' }, { word: 'brother', ipa: '/ˈbrʌðər/' },
    ],
    sentences: [
      { sentence: 'Bob brought the baby back before breakfast.', ipa: '/bɒb brɔːt ðə ˈbeɪbi bæk bɪˈfɔːr ˈbrekfəst/' },
    ],
  },
  't': {
    words: [
      { word: 'tea', ipa: '/tiː/' }, { word: 'time', ipa: '/taɪm/' }, { word: 'start', ipa: '/stɑːrt/' },
      { word: 'take', ipa: '/teɪk/' }, { word: 'today', ipa: '/təˈdeɪ/' }, { word: 'water', ipa: '/ˈwɔːtər/' },
    ],
    sentences: [
      { sentence: 'Tom told Tim to take the test today.', ipa: '/tɒm təʊld tɪm tuː teɪk ðə test təˈdeɪ/' },
    ],
  },
  'd': {
    words: [
      { word: 'day', ipa: '/deɪ/' }, { word: 'did', ipa: '/dɪd/' }, { word: 'door', ipa: '/dɔːr/' },
      { word: 'dinner', ipa: '/ˈdɪnər/' }, { word: 'leader', ipa: '/ˈliːdər/' }, { word: 'hard', ipa: '/hɑːrd/' },
    ],
    sentences: [
      { sentence: 'David decided to drive down the dark road.', ipa: '/ˈdeɪvɪd dɪˈsaɪdɪd tuː draɪv daʊn ðə dɑːrk rəʊd/' },
    ],
  },
  'k': {
    words: [
      { word: 'key', ipa: '/kiː/' }, { word: 'clock', ipa: '/klɒk/' }, { word: 'back', ipa: '/bæk/' },
      { word: 'quick', ipa: '/kwɪk/' }, { word: 'school', ipa: '/skuːl/' }, { word: 'cook', ipa: '/kʊk/' },
    ],
    sentences: [
      { sentence: 'The cook keeps the kitchen clock clean.', ipa: '/ðə kʊk kiːps ðə ˈkɪtʃɪn klɒk kliːn/' },
    ],
  },
  'g': {
    words: [
      { word: 'get', ipa: '/ɡet/' }, { word: 'give', ipa: '/ɡɪv/' }, { word: 'good', ipa: '/ɡʊd/' },
      { word: 'green', ipa: '/ɡriːn/' }, { word: 'great', ipa: '/ɡreɪt/' }, { word: 'begin', ipa: '/bɪˈɡɪn/' },
    ],
    sentences: [
      { sentence: 'Good girls and guys get great grades.', ipa: '/ɡʊd ɡɜːlz ænd ɡaɪz ɡet ɡreɪt ɡreɪdz/' },
    ],
  },
  'f': {
    words: [
      { word: 'face', ipa: '/feɪs/' }, { word: 'food', ipa: '/fuːd/' }, { word: 'family', ipa: '/ˈfæməli/' },
      { word: 'life', ipa: '/laɪf/' }, { word: 'coffee', ipa: '/ˈkɒfi/' }, { word: 'laugh', ipa: '/lɑːf/' },
    ],
    sentences: [
      { sentence: 'My family finished the food quite fast.', ipa: '/maɪ ˈfæməli ˈfɪnɪʃt ðə fuːd kwaɪt fɑːst/' },
    ],
  },
  'v': {
    words: [
      { word: 'very', ipa: '/ˈveri/' }, { word: 'voice', ipa: '/vɔɪs/' }, { word: 'village', ipa: '/ˈvɪlɪdʒ/' },
      { word: 'visit', ipa: '/ˈvɪzɪt/' }, { word: 'seven', ipa: '/ˈsevən/' }, { word: 'love', ipa: '/lʌv/' },
    ],
    sentences: [
      { sentence: 'Victor visited the village with a very vivid view.', ipa: '/ˈvɪktər ˈvɪzɪtɪd ðə ˈvɪlɪdʒ wɪð ə ˈveri ˈvɪvɪd vjuː/' },
    ],
  },
  'θ': {
    words: [
      { word: 'think', ipa: '/θɪŋk/' }, { word: 'three', ipa: '/θriː/' }, { word: 'both', ipa: '/bəʊθ/' },
      { word: 'month', ipa: '/mʌnθ/' }, { word: 'nothing', ipa: '/ˈnʌθɪŋ/' }, { word: 'health', ipa: '/helθ/' },
    ],
    sentences: [
      { sentence: 'I think both theories are worth something.', ipa: '/aɪ θɪŋk bəʊθ ˈθɪəriz ɑːr wɜːθ ˈsʌmθɪŋ/' },
    ],
  },
  'ð': {
    words: [
      { word: 'this', ipa: '/ðɪs/' }, { word: 'that', ipa: '/ðæt/' }, { word: 'the', ipa: '/ðə/' },
      { word: 'mother', ipa: '/ˈmʌðər/' }, { word: 'weather', ipa: '/ˈweðər/' }, { word: 'together', ipa: '/təˈɡeðər/' },
    ],
    sentences: [
      { sentence: 'The mother and father gathered together.', ipa: '/ðə ˈmʌðər ænd ˈfɑːðər ˈɡæðərd təˈɡeðər/' },
    ],
  },
  's': {
    words: [
      { word: 'see', ipa: '/siː/' }, { word: 'sun', ipa: '/sʌn/' }, { word: 'sister', ipa: '/ˈsɪstər/' },
      { word: 'house', ipa: '/haʊs/' }, { word: 'class', ipa: '/klɑːs/' }, { word: 'nice', ipa: '/naɪs/' },
    ],
    sentences: [
      { sentence: 'The six sisters sat in the sun silently.', ipa: '/ðə sɪks ˈsɪstərz sæt ɪn ðə sʌn ˈsaɪləntli/' },
    ],
  },
  'z': {
    words: [
      { word: 'zero', ipa: '/ˈzɪərəʊ/' }, { word: 'music', ipa: '/ˈmjuːzɪk/' }, { word: 'busy', ipa: '/ˈbɪzi/' },
      { word: 'buzz', ipa: '/bʌz/' }, { word: 'visit', ipa: '/ˈvɪzɪt/' }, { word: 'roses', ipa: '/ˈrəʊzɪz/' },
    ],
    sentences: [
      { sentence: 'Zoe was busy buzzing around the zoo.', ipa: '/ˈzəʊi wɒz ˈbɪzi ˈbʌzɪŋ əˈraʊnd ðə zuː/' },
    ],
  },
  'ʃ': {
    words: [
      { word: 'she', ipa: '/ʃiː/' }, { word: 'shop', ipa: '/ʃɒp/' }, { word: 'wish', ipa: '/wɪʃ/' },
      { word: 'nation', ipa: '/ˈneɪʃən/' }, { word: 'special', ipa: '/ˈspeʃəl/' }, { word: 'ship', ipa: '/ʃɪp/' },
    ],
    sentences: [
      { sentence: 'She showed a special shell from the shore.', ipa: '/ʃiː ʃəʊd ə ˈspeʃəl ʃel frɒm ðə ʃɔːr/' },
    ],
  },
  'ʒ': {
    words: [
      { word: 'pleasure', ipa: '/ˈpleʒər/' }, { word: 'vision', ipa: '/ˈvɪʒən/' }, { word: 'decision', ipa: '/dɪˈsɪʒən/' },
      { word: 'measure', ipa: '/ˈmeʒər/' }, { word: 'beige', ipa: '/beɪʒ/' }, { word: 'garage', ipa: '/ˈɡærɑːʒ/' },
    ],
    sentences: [
      { sentence: 'It was a pleasure to see the beige treasure.', ipa: '/ɪt wɒz ə ˈpleʒər tuː siː ðə beɪʒ ˈtreʒər/' },
    ],
  },
  'h': {
    words: [
      { word: 'hot', ipa: '/hɒt/' }, { word: 'hello', ipa: '/həˈləʊ/' }, { word: 'happy', ipa: '/ˈhæpi/' },
      { word: 'home', ipa: '/həʊm/' }, { word: 'hand', ipa: '/hænd/' }, { word: 'help', ipa: '/help/' },
    ],
    sentences: [
      { sentence: 'He held her hand and hurried home.', ipa: '/hiː held hɜːr hænd ænd ˈhʌrid həʊm/' },
    ],
  },
  'tʃ': {
    words: [
      { word: 'church', ipa: '/tʃɜːtʃ/' }, { word: 'child', ipa: '/tʃaɪld/' }, { word: 'change', ipa: '/tʃeɪndʒ/' },
      { word: 'chair', ipa: '/tʃeər/' }, { word: 'teacher', ipa: '/ˈtiːtʃər/' }, { word: 'kitchen', ipa: '/ˈkɪtʃɪn/' },
    ],
    sentences: [
      { sentence: 'The children chose chips and cheese for lunch.', ipa: '/ðə ˈtʃɪldrən tʃəʊz tʃɪps ænd tʃiːz fɔːr lʌntʃ/' },
    ],
  },
  'dʒ': {
    words: [
      { word: 'job', ipa: '/dʒɒb/' }, { word: 'just', ipa: '/dʒʌst/' }, { word: 'age', ipa: '/eɪdʒ/' },
      { word: 'change', ipa: '/tʃeɪndʒ/' }, { word: 'joke', ipa: '/dʒəʊk/' }, { word: 'large', ipa: '/lɑːrdʒ/' },
    ],
    sentences: [
      { sentence: 'John enjoys juggling and joking at the gym.', ipa: '/dʒɒn ɪnˈdʒɔɪz ˈdʒʌɡlɪŋ ænd ˈdʒəʊkɪŋ æt ðə dʒɪm/' },
    ],
  },
  'm': {
    words: [
      { word: 'make', ipa: '/meɪk/' }, { word: 'money', ipa: '/ˈmʌni/' }, { word: 'mother', ipa: '/ˈmʌðər/' },
      { word: 'home', ipa: '/həʊm/' }, { word: 'name', ipa: '/neɪm/' }, { word: 'summer', ipa: '/ˈsʌmər/' },
    ],
    sentences: [
      { sentence: 'My mother makes the most amazing meals.', ipa: '/maɪ ˈmʌðər meɪks ðə məʊst əˈmeɪzɪŋ miːlz/' },
    ],
  },
  'n': {
    words: [
      { word: 'name', ipa: '/neɪm/' }, { word: 'nice', ipa: '/naɪs/' }, { word: 'new', ipa: '/njuː/' },
      { word: 'nine', ipa: '/naɪn/' }, { word: 'know', ipa: '/nəʊ/' }, { word: 'sun', ipa: '/sʌn/' },
    ],
    sentences: [
      { sentence: 'Nancy needs nine new notebooks now.', ipa: '/ˈnænsi niːdz naɪn njuː ˈnəʊtbʊks naʊ/' },
    ],
  },
  'ŋ': {
    words: [
      { word: 'ring', ipa: '/rɪŋ/' }, { word: 'sing', ipa: '/sɪŋ/' }, { word: 'long', ipa: '/lɒŋ/' },
      { word: 'thing', ipa: '/θɪŋ/' }, { word: 'young', ipa: '/jʌŋ/' }, { word: 'morning', ipa: '/ˈmɔːrnɪŋ/' },
    ],
    sentences: [
      { sentence: 'The young king likes singing along.', ipa: '/ðə jʌŋ kɪŋ laɪks ˈsɪŋɪŋ əˈlɒŋ/' },
    ],
  },
  'l': {
    words: [
      { word: 'light', ipa: '/laɪt/' }, { word: 'love', ipa: '/lʌv/' }, { word: 'feel', ipa: '/fiːl/' },
      { word: 'listen', ipa: '/ˈlɪsn/' }, { word: 'small', ipa: '/smɔːl/' }, { word: 'little', ipa: '/ˈlɪtl/' },
    ],
    sentences: [
      { sentence: 'Lisa loves to listen to lullabies at night.', ipa: '/ˈliːsə lʌvz tuː ˈlɪsn tuː ˈlʌləbaɪz æt naɪt/' },
    ],
  },
  'r': {
    words: [
      { word: 'right', ipa: '/raɪt/' }, { word: 'red', ipa: '/red/' }, { word: 'room', ipa: '/ruːm/' },
      { word: 'read', ipa: '/riːd/' }, { word: 'really', ipa: '/ˈrɪəli/' }, { word: 'remember', ipa: '/rɪˈmembər/' },
    ],
    sentences: [
      { sentence: 'Robert really remembers the red roses.', ipa: '/ˈrɒbərt ˈrɪəli rɪˈmembərz ðə red ˈrəʊzɪz/' },
    ],
  },
  'j': {
    words: [
      { word: 'yes', ipa: '/jes/' }, { word: 'year', ipa: '/jɪər/' }, { word: 'yellow', ipa: '/ˈjeləʊ/' },
      { word: 'young', ipa: '/jʌŋ/' }, { word: 'use', ipa: '/juːz/' }, { word: 'beautiful', ipa: '/ˈbjuːtɪfəl/' },
    ],
    sentences: [
      { sentence: 'Yesterday the young man used your yellow yacht.', ipa: '/ˈjestərdeɪ ðə jʌŋ mæn juːzd jɔːr ˈjeləʊ jɒt/' },
    ],
  },
  'w': {
    words: [
      { word: 'walk', ipa: '/wɔːk/' }, { word: 'water', ipa: '/ˈwɔːtər/' }, { word: 'want', ipa: '/wɒnt/' },
      { word: 'world', ipa: '/wɜːld/' }, { word: 'woman', ipa: '/ˈwʊmən/' }, { word: 'always', ipa: '/ˈɔːlweɪz/' },
    ],
    sentences: [
      { sentence: 'We will walk with one wild wolf on Wednesday.', ipa: '/wiː wɪl wɔːk wɪð wʌn waɪld wʊlf ɒn ˈwenzdeɪ/' },
    ],
  },
};
