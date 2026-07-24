/* ──────────────────────────────────────────────────────────────────
   City data for YatraAI — 14 cities across India's major circuits.
   Each entry contains poster metadata, popular tourist spots,
   hidden-gem local-knowledge spots, and realistic daily budgets.
   ────────────────────────────────────────────────────────────────── */

export interface CitySpot {
  name: string;
  type: "popular" | "hidden";
  note: string;
  /** Approximate cost (₹), if applicable */
  cost?: string;
}

export interface CityBudget {
  /** Per-night stay cost range */
  stay: string;
  /** Per-day food cost range */
  food: string;
  /** Per-day local transport cost range */
  transport: string;
  /** Total budget-friendly per-day estimate */
  perDay: string;
}

export interface CityData {
  slug: string;
  name: string;
  tag: string;
  year: string;
  note: string;
  /** Import key — maps to asset file name (poster-{slug}.jpg) */
  imgKey: string;
  region: string;
  vibe: ("hills" | "beach" | "city" | "spiritual")[];
  spots: CitySpot[];
  budget: CityBudget;
}

export const cities: CityData[] = [
  {
    slug: "kolkata",
    name: "KOLKATA",
    tag: "City of Joy",
    year: "1990 A.D.",
    note: "Trams, taxis & timeless chai.",
    imgKey: "kolkata",
    region: "East India",
    vibe: ["city"],
    spots: [
      { name: "Victoria Memorial", type: "popular", note: "White marble palace, evening light show. ₹30 entry for Indians.", cost: "₹30" },
      { name: "Howrah Bridge at dawn", type: "popular", note: "Walk across before 6am. Flower market underneath is the real show.", cost: "Free" },
      { name: "Kumartuli potter lanes", type: "popular", note: "Watch Durga idols being sculpted year-round. Just walk in and ask.", cost: "Free" },
      { name: "Dada's Dhaba, Gariahat", type: "hidden", note: "Rice plate + fish curry + dal for ₹55. Cash only. No signboard — look for the blue tarp.", cost: "₹55" },
      { name: "Tiretti Bazaar Chinese breakfast", type: "hidden", note: "6–8am only. Momos, fish ball soup, pork siu mai from families who've been here since the 1800s.", cost: "₹80" },
      { name: "South Park Street Cemetery", type: "hidden", note: "18th-century British tombs overtaken by banyan roots. Eerie, beautiful, completely empty on weekday mornings.", cost: "Free" },
    ],
    budget: { stay: "₹300–600", food: "₹150–250", transport: "₹80–150", perDay: "₹550–1,000" },
  },
  {
    slug: "delhi",
    name: "DELHI",
    tag: "The Lost Capital",
    year: "3069 A.D.",
    note: "Auto-rickshaws negotiating history.",
    imgKey: "delhi",
    region: "North India",
    vibe: ["city"],
    spots: [
      { name: "Humayun's Tomb", type: "popular", note: "Mughal grandeur without the Taj crowds. Garden complex, golden hour is magic.", cost: "₹35" },
      { name: "Chandni Chowk walk", type: "popular", note: "Paranthe Wali Gali → Jama Masjid → Kinari Bazaar. Go hungry, come back fed.", cost: "₹100–200" },
      { name: "Qutub Minar", type: "popular", note: "12th-century tower, UNESCO site. The iron pillar that doesn't rust is the real flex.", cost: "₹35" },
      { name: "Majnu ka Tilla", type: "hidden", note: "Tibetan colony near ISBT. Thukpa + momos in a lane that feels like Dharamsala. ₹60 for a full meal.", cost: "₹60" },
      { name: "Agrasen ki Baoli", type: "hidden", note: "106-step stepwell hiding in CP. Looks like a film set. No entry fee, no crowd before 10am.", cost: "Free" },
      { name: "Sanjay Van forest trail", type: "hidden", note: "Dense jungle patch near Qutub. Peacocks, old Mughal ruins, zero tourists. Carry water.", cost: "Free" },
    ],
    budget: { stay: "₹400–800", food: "₹150–300", transport: "₹100–200", perDay: "₹650–1,300" },
  },
  {
    slug: "mumbai",
    name: "MUMBAI",
    tag: "Maximum City",
    year: "1975 A.D.",
    note: "BEST buses, kaali-peeli taxis, the sea.",
    imgKey: "mumbai",
    region: "West India",
    vibe: ["city", "beach"],
    spots: [
      { name: "Marine Drive sunset", type: "popular", note: "The Queen's Necklace. Sit on the tetrapods. Free forever.", cost: "Free" },
      { name: "Elephanta Caves", type: "popular", note: "₹40 ferry from Gateway. 7th-century rock-cut Shiva temple on an island.", cost: "₹40 + ₹40" },
      { name: "Dharavi leather market", type: "popular", note: "Skip the poverty-tourism angle. Go to the leather and pottery workshops. Real artisans, real prices.", cost: "Free" },
      { name: "Café Military, Fort", type: "hidden", note: "Irani café since 1933. Bun maska + chai = ₹50. Sit next to stockbrokers and taxi drivers.", cost: "₹50" },
      { name: "Banganga Tank, Malabar Hill", type: "hidden", note: "Ancient freshwater tank surrounded by temples. Dead quiet. 10 minutes from the chaos of Breach Candy.", cost: "Free" },
      { name: "Versova beach fishing village", type: "hidden", note: "Working Koli fishing village at the edge of the city. Fresh catch sold at dawn, ₹100/kg pomfret.", cost: "Free" },
    ],
    budget: { stay: "₹500–1,000", food: "₹200–350", transport: "₹100–200", perDay: "₹800–1,550" },
  },
  {
    slug: "jaipur",
    name: "JAIPUR",
    tag: "The Pink Dream",
    year: "1799 A.D.",
    note: "Palaces, camels, cycle-rickshaw lanes.",
    imgKey: "jaipur",
    region: "Rajasthan",
    vibe: ["city"],
    spots: [
      { name: "Amber Fort", type: "popular", note: "Massive hilltop fort. Walk up (skip the elephant rides). ₹100 composite ticket.", cost: "₹100" },
      { name: "Hawa Mahal from the street", type: "popular", note: "Best seen from the chai stall across the road, not from inside. Pink sandstone, 953 windows.", cost: "Free" },
      { name: "Nahargarh Fort sunset", type: "popular", note: "Drive or hike up for the best view of the Pink City. Bring your own chai.", cost: "₹50" },
      { name: "LMB (Laxmi Mishthan Bhandar)", type: "hidden", note: "Since 1727. Ghewar, pyaaz kachori, and dal baati in a hall that looks like a wedding venue. ₹80 thali.", cost: "₹80" },
      { name: "Panna Meena ka Kund", type: "hidden", note: "Criss-cross stepwell near Amber. Geometric perfection, almost no tourists before 9am.", cost: "Free" },
      { name: "Elachi chai at Tapri Central", type: "hidden", note: "Rooftop chai spot near C-Scheme. ₹30 for the best cutting chai in Jaipur with a fort view.", cost: "₹30" },
    ],
    budget: { stay: "₹350–700", food: "₹120–250", transport: "₹80–150", perDay: "₹550–1,100" },
  },
  {
    slug: "varanasi",
    name: "VARANASI",
    tag: "The Eternal Ghat",
    year: "1200 B.C.",
    note: "Boats, bells, and diyas on the Ganga.",
    imgKey: "varanasi",
    region: "Uttar Pradesh",
    vibe: ["spiritual", "city"],
    spots: [
      { name: "Ganga Aarti at Dashashwamedh", type: "popular", note: "Every evening at 6:45pm. Arrive 30 min early for a ghat-side seat. Free to watch.", cost: "Free" },
      { name: "Morning boat ride", type: "popular", note: "Shared boats from Assi Ghat, ₹100/person. See 84 ghats from the river at sunrise.", cost: "₹100" },
      { name: "Kashi Vishwanath Temple", type: "popular", note: "New corridor makes it easier. Free entry, long queues. Go at 5am.", cost: "Free" },
      { name: "Blue Lassi Shop", type: "hidden", note: "A hole-in-the-wall near Manikarnika. ₹60 for a clay-cup lassi that'll ruin all other lassis forever.", cost: "₹60" },
      { name: "Ramnagar Fort & Vyasa temple", type: "hidden", note: "Cross the river. Crumbling Maharaja palace + the cave where Vyasa supposedly wrote the Mahabharata. ₹15 entry.", cost: "₹15" },
      { name: "Lanka rooftop chaat walk", type: "hidden", note: "BHU area. Tamatar chaat, tikki, and paan from stalls that students have been hitting since the 1960s.", cost: "₹40" },
    ],
    budget: { stay: "₹250–500", food: "₹100–200", transport: "₹60–120", perDay: "₹410–820" },
  },
  {
    slug: "goa",
    name: "GOA",
    tag: "Susegad Coast",
    year: "1971 A.D.",
    note: "Scooter keys, salt air, sunset shacks.",
    imgKey: "goa",
    region: "West India",
    vibe: ["beach"],
    spots: [
      { name: "Anjuna Flea Market (Wed)", type: "popular", note: "Hippie market on Wednesdays. Bargain hard. Best for jewellery, hammocks, and questionable t-shirts.", cost: "Free entry" },
      { name: "Old Goa churches", type: "popular", note: "Basilica of Bom Jesus + Sé Cathedral. Portuguese-era, UNESCO. No entry fee.", cost: "Free" },
      { name: "Dudhsagar Falls", type: "popular", note: "Book a shared jeep from Mollem (₹400/person). Monsoon season only. Bring dry clothes.", cost: "₹400" },
      { name: "Bhagwan Mahaveer Homestay, Palolem", type: "hidden", note: "₹350/night beachside hut. No AC, no WiFi, no problem. Run by a retired teacher.", cost: "₹350/night" },
      { name: "Vinayak Family Restaurant, Mapusa", type: "hidden", note: "Local fish thali ₹110. Mackerel curry, sol kadhi, rice. Tourist markup doesn't exist here.", cost: "₹110" },
      { name: "Cabo de Rama fort", type: "hidden", note: "Abandoned Portuguese fort with a cliff-edge view of empty beaches. No entry, no crowds, no infrastructure.", cost: "Free" },
    ],
    budget: { stay: "₹350–800", food: "₹150–300", transport: "₹100–200 (scooter rental)", perDay: "₹600–1,300" },
  },
  {
    slug: "rishikesh",
    name: "RISHIKESH",
    tag: "Yoga Capital",
    year: "600 B.C.",
    note: "Rapids, ashrams, and a bridge that swings.",
    imgKey: "rishikesh",
    region: "Uttarakhand",
    vibe: ["spiritual", "hills"],
    spots: [
      { name: "Laxman Jhula & Ram Jhula", type: "popular", note: "Iconic suspension bridges over the Ganga. Walk across, grab a juice on the other side.", cost: "Free" },
      { name: "Triveni Ghat Aarti", type: "popular", note: "Evening ceremony at the confluence. Smaller and more intimate than Varanasi's.", cost: "Free" },
      { name: "Beatles Ashram (Maharishi)", type: "popular", note: "Graffiti-covered ruins where the White Album was written. ₹150 entry for Indians.", cost: "₹150" },
      { name: "Café De Lhasa, Tapovan", type: "hidden", note: "Tibetan-run. Momos + butter tea on a terrace overlooking the rapids. ₹70 meal.", cost: "₹70" },
      { name: "Neer Garh waterfall trek", type: "hidden", note: "45-min walk from Laxman Jhula. Three-tier waterfall, swimming pool at the bottom. ₹35 entry.", cost: "₹35" },
      { name: "Shivpuri beach camping", type: "hidden", note: "₹500/night camp on the riverbank with rapids 50m away. Includes dinner + bonfire. Book at the bus stand.", cost: "₹500" },
    ],
    budget: { stay: "₹250–600", food: "₹100–200", transport: "₹50–100", perDay: "₹400–900" },
  },
  {
    slug: "udaipur",
    name: "UDAIPUR",
    tag: "City of Lakes",
    year: "1559 A.D.",
    note: "White marble, lake mirrors, rooftop chai.",
    imgKey: "udaipur",
    region: "Rajasthan",
    vibe: ["city"],
    spots: [
      { name: "City Palace", type: "popular", note: "Largest palace complex in Rajasthan. ₹100 entry. The glass mosaic rooms are worth the walk alone.", cost: "₹100" },
      { name: "Lake Pichola boat ride", type: "popular", note: "₹400 sunset boat. You'll see the Taj Lake Palace floating on the water.", cost: "₹400" },
      { name: "Jagdish Temple", type: "popular", note: "Indo-Aryan temple in the old city center. Free. The carved elephants are 450 years old.", cost: "Free" },
      { name: "Jheel Guest House rooftop", type: "hidden", note: "₹250/night room with a rooftop view of Lake Pichola. Chai at sunset = unbeatable.", cost: "₹250/night" },
      { name: "Ambrai Ghat", type: "hidden", note: "Free viewpoint across the lake from Amet Haveli side. Same view as the ₹8,000 hotel, zero cost.", cost: "Free" },
      { name: "Hathi Pol street food walk", type: "hidden", note: "Kachori, mirchi vada, rabdi from stalls near the elephant gate. ₹50 fills you up.", cost: "₹50" },
    ],
    budget: { stay: "₹250–600", food: "₹120–220", transport: "₹60–120", perDay: "₹430–940" },
  },
  {
    slug: "amritsar",
    name: "AMRITSAR",
    tag: "Golden City",
    year: "1577 A.D.",
    note: "Langar, lassi, and the golden reflection.",
    imgKey: "amritsar",
    region: "Punjab",
    vibe: ["spiritual", "city"],
    spots: [
      { name: "Golden Temple (Harmandir Sahib)", type: "popular", note: "Open 24/7. Free entry, free langar (meal). Go at 4am for the morning prayers. Life-changing.", cost: "Free" },
      { name: "Wagah Border ceremony", type: "popular", note: "Evening flag-lowering at the India-Pakistan border. Free. Arrive 2 hours early for seats.", cost: "Free" },
      { name: "Jallianwala Bagh", type: "popular", note: "Bullet holes still in the walls. ₹0 entry. 10-minute walk from the Golden Temple.", cost: "Free" },
      { name: "Bharawan Da Dhaba", type: "hidden", note: "Amritsari kulcha + chole + lassi since 1912. ₹90. Skip the fancy Kesar da Dhaba — this is the real deal.", cost: "₹90" },
      { name: "Ram Bagh gardens morning walk", type: "hidden", note: "Maharaja Ranjit Singh's summer palace gardens. Empty at 6am, perfect for a post-langar walk.", cost: "Free" },
      { name: "Partition Museum, Town Hall", type: "hidden", note: "India's first Partition museum. Free entry. Oral histories that don't make it into textbooks.", cost: "Free" },
    ],
    budget: { stay: "₹300–600", food: "₹80–180 (langar is free)", transport: "₹60–120", perDay: "₹440–900" },
  },
  {
    slug: "darjeeling",
    name: "DARJEELING",
    tag: "Queen of Hills",
    year: "1835 A.D.",
    note: "Toy trains, tea gardens, and Kanchenjunga mornings.",
    imgKey: "darjeeling",
    region: "West Bengal",
    vibe: ["hills"],
    spots: [
      { name: "Tiger Hill sunrise", type: "popular", note: "Kanchenjunga at dawn. Shared jeep ₹300 from town (4am start). Clear skies Oct–March.", cost: "₹300" },
      { name: "Darjeeling Himalayan Railway", type: "popular", note: "UNESCO toy train. Joyride to Ghum and back ₹100. Full route to NJP is ₹60 (7 hours, worth every one).", cost: "₹60–100" },
      { name: "Happy Valley Tea Estate", type: "popular", note: "Working tea garden since 1854. Free factory tour (ask at the gate). Buy first flush direct.", cost: "Free" },
      { name: "Keventers (the original)", type: "hidden", note: "Since 1920s. Cheese toast + milk in a glass bottle on a bench overlooking the valley. ₹80.", cost: "₹80" },
      { name: "Aloobari Monastery", type: "hidden", note: "Tiny Drukpa Kagyu monastery near the zoo. Monks chanting at 5pm. No tourists. Peaceful.", cost: "Free" },
      { name: "Rock Garden + Ganga Maya Park", type: "hidden", note: "Terraced garden with waterfalls, 3km below town. ₹20 entry. Locals picnic here, tourists miss it entirely.", cost: "₹20" },
    ],
    budget: { stay: "₹300–700", food: "₹120–220", transport: "₹80–180 (shared jeeps)", perDay: "₹500–1,100" },
  },
  {
    slug: "munnar",
    name: "MUNNAR",
    tag: "Tea Country",
    year: "1790 A.D.",
    note: "Green carpets, mist roads, cardamom air.",
    imgKey: "munnar",
    region: "Kerala",
    vibe: ["hills"],
    spots: [
      { name: "Eravikulam National Park", type: "popular", note: "Home of the Nilgiri tahr. ₹120 entry + shuttle. Neelakurinji blooms every 12 years (next: 2030).", cost: "₹120" },
      { name: "Tea Museum", type: "popular", note: "Run by Tata Tea. ₹75 entry. Watch tea processing + tasting of 5 varieties.", cost: "₹75" },
      { name: "Top Station viewpoint", type: "popular", note: "Highest point in Munnar. Views of Tamil Nadu plains. ₹0. Go early before the mist rolls in.", cost: "Free" },
      { name: "Periyakanal homestay", type: "hidden", note: "₹400/night room in a family cardamom plantation. They cook for you. No menu, just what's growing outside.", cost: "₹400/night" },
      { name: "Letchmi Estate walking trail", type: "hidden", note: "Unmarked trail through working tea estate. Ask at the KDHP office. 2-hour loop through emerald rows.", cost: "Free" },
      { name: "Munnar town thattukada", type: "hidden", note: "Street stall near the bus stand. Parotta + beef fry = ₹50. Open 6pm–midnight. Truckers and locals only.", cost: "₹50" },
    ],
    budget: { stay: "₹350–700", food: "₹120–220", transport: "₹80–180 (bus/auto)", perDay: "₹550–1,100" },
  },
  {
    slug: "hampi",
    name: "HAMPI",
    tag: "Boulder Empire",
    year: "1336 A.D.",
    note: "Ruins, coracles, and sunset boulders.",
    imgKey: "hampi",
    region: "Karnataka",
    vibe: ["spiritual", "city"],
    spots: [
      { name: "Virupaksha Temple", type: "popular", note: "Working temple inside a ruined empire. ₹25 entry. The temple elephant blesses visitors for ₹10.", cost: "₹25" },
      { name: "Vittala Temple stone chariot", type: "popular", note: "The musical pillars and the iconic chariot. ₹40 entry. Hire a local guide (₹300 for 2 hours).", cost: "₹40" },
      { name: "Matanga Hill sunrise", type: "popular", note: "30-minute boulder scramble for a 360° view of the ruins. Go at 5:30am. Bring water, no railing.", cost: "Free" },
      { name: "Mango Tree restaurant", type: "hidden", note: "₹80 thali on banana leaf under an actual mango tree. River view. Cash only, slow service (that's the point).", cost: "₹80" },
      { name: "Hippie Island (Virupapur Gaddi)", type: "hidden", note: "₹20 coracle across the river. ₹200/night guesthouses, bouldering, no cars, no rush. Minimum 2 nights.", cost: "₹200/night" },
      { name: "Anegundi village cycle ride", type: "hidden", note: "Rent a cycle (₹100/day), ride through the village that existed before Hampi. Hanuman birthplace, cave paintings.", cost: "₹100" },
    ],
    budget: { stay: "₹200–500", food: "₹100–180", transport: "₹50–100 (cycle/walk)", perDay: "₹350–780" },
  },
  {
    slug: "pushkar",
    name: "PUSHKAR",
    tag: "Desert Mirror",
    year: "500 B.C.",
    note: "Camels, ghats, and the only Brahma temple.",
    imgKey: "pushkar",
    region: "Rajasthan",
    vibe: ["spiritual"],
    spots: [
      { name: "Pushkar Lake ghats", type: "popular", note: "52 ghats around a sacred lake. Sunset aarti is free. Watch out for 'flower ceremony' scams — politely decline.", cost: "Free" },
      { name: "Brahma Temple", type: "popular", note: "One of very few Brahma temples in the world. Free entry. Remove shoes at the gate.", cost: "Free" },
      { name: "Savitri Temple trek", type: "popular", note: "45-minute uphill walk (or ₹80 ropeway). Panoramic view of the desert and lake at sunset.", cost: "₹80 ropeway" },
      { name: "Honey & Spice café", type: "hidden", note: "Israeli-backpacker café with Indian prices. Hummus + falafel wrap ₹100. Rooftop with a lake view.", cost: "₹100" },
      { name: "Rose garden walk, Ajmer road", type: "hidden", note: "Pushkar produces most of India's rose essence. Walk through the fields at dawn (Oct–Feb). Farmers don't mind.", cost: "Free" },
      { name: "Old Rangji Temple", type: "hidden", note: "South Indian gopuram architecture in the Rajasthan desert. Nobody visits. Seriously, nobody. Beautiful.", cost: "Free" },
    ],
    budget: { stay: "₹200–500", food: "₹100–200", transport: "₹40–80 (walking town)", perDay: "₹340–780" },
  },
  {
    slug: "manali",
    name: "MANALI",
    tag: "Valley of the Gods",
    year: "100 A.D.",
    note: "Pine trails, snow caps, and roadside maggi.",
    imgKey: "manali",
    region: "Himachal Pradesh",
    vibe: ["hills"],
    spots: [
      { name: "Solang Valley", type: "popular", note: "Paragliding (₹1,200), skiing (winter), or just sit in the meadow. Shared cab ₹100 from Mall Road.", cost: "₹100–1,200" },
      { name: "Hadimba Devi Temple", type: "popular", note: "Ancient cave temple in a cedar forest. Free. The 4-storey wooden pagoda is 500 years old.", cost: "Free" },
      { name: "Old Manali walk", type: "popular", note: "Cross the bridge, walk uphill. Cafés, apple orchards, and a vibe that hasn't changed since the 90s.", cost: "Free" },
      { name: "Sethan village stay", type: "hidden", note: "₹300/night homestay at 2,700m. Buddhist hamlet, 12km above Manali. The family serves rajma-chawal and stories.", cost: "₹300/night" },
      { name: "Jogini Falls trek", type: "hidden", note: "Easy 2-hour trek from Vashisht village. Natural pool at the top. Don't go alone after dark.", cost: "Free" },
      { name: "Drifter's Café, Old Manali", type: "hidden", note: "₹90 pasta + river-view terrace. Run by a local who's never left the valley and knows every trail.", cost: "₹90" },
    ],
    budget: { stay: "₹300–700", food: "₹120–250", transport: "₹80–200 (bus/shared cab)", perDay: "₹500–1,150" },
  },
];

/** Quick lookup by slug */
export function getCityBySlug(slug: string): CityData | undefined {
  return cities.find((c) => c.slug === slug);
}

/** All available vibes for filter UI */
export const vibes = ["hills", "beach", "city", "spiritual"] as const;
export type Vibe = (typeof vibes)[number];
