let stream = null;
let isScanningForChat = false;
// --- State & Variables ---
let currentStream = null;
let currentFacingMode = 'environment';
let flashEnabled = false;
let isMultipleMode = false;
let capturedImages = []; // Array of base64 strings

// Screen Navigation
const screens = {
  home: document.getElementById('screen-home'),
  camera: document.getElementById('screen-camera'),
  result: document.getElementById('screen-result'),
  chat: document.getElementById('screen-chat'),
  articlesList: document.getElementById('screen-articles-list'),
  articleReader: document.getElementById('screen-article-reader'),
  medicineList: document.getElementById('screen-medicine-list'),
  medicineReader: document.getElementById('screen-medicine-reader')
};

function showScreen(screenId) {
  Object.values(screens).forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
  });
  screens[screenId].classList.remove('hidden');
  screens[screenId].classList.add('active');
  document.querySelector('.bottom-nav').classList.toggle('hidden', screenId !== 'home' && screenId !== 'articlesList');
  
  if (screenId !== 'camera') {
    stopCamera();
    document.getElementById('multi-gallery-overlay').style.display = 'none';
    capturedImages = [];
  }
}

let dynamicArticles = [
  {
    title: "How to Build a Medicinal Herb Garden",
    description: "Discover the best herbs to grow at home for natural remedies, including chamomile, mint, and echinacea.",
    urlToImage: "https://images.unsplash.com/photo-1466692476877-396414fdbf60?auto=format&fit=crop&q=80&w=800",
    url: "https://www.almanac.com/content/starting-medicinal-herb-garden",
    publishedAt: new Date().toISOString()
  },
  {
    title: "The Science of Plant Communication",
    description: "Recent studies reveal how plants use complex chemical signals to communicate stress and warn their neighbors.",
    urlToImage: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800",
    url: "https://www.sciencedaily.com/news/plants_animals/botany/",
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    title: "Houseplants that Purify Your Air",
    description: "NASA's clean air study highlights the top indoor plants that help filter toxins and improve air quality.",
    urlToImage: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&q=80&w=800",
    url: "https://ntrs.nasa.gov/citations/19930073077",
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    title: "Understanding Soil Health and Microbiomes",
    description: "A deep dive into the symbiotic relationship between plant roots and soil bacteria for organic gardening.",
    urlToImage: "https://images.unsplash.com/photo-1592424001844-ba365113d5cb?auto=format&fit=crop&q=80&w=800",
    url: "https://www.nature.com/scitable/knowledge/library/the-soil-biome-13204921/",
    publishedAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    title: "The Healing Power of Aloe Vera",
    description: "Everything you need to know about extracting and using aloe vera gel for skin conditions and burns.",
    urlToImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
    url: "https://www.medicalnewstoday.com/articles/318591",
    publishedAt: new Date(Date.now() - 86400000 * 14).toISOString()
  }
];

async function fetchPlantNews() {
  // Using static curated articles to completely avoid third-party API CORS errors on Vercel deployment
  return Promise.resolve();
}

const plantDatabase = [
  { name: 'African Violet', scientific: 'Saintpaulia ionantha', type: 'Houseplant' },
  { name: 'Aloe Vera', scientific: 'Aloe vera', type: 'Houseplant' },
  { name: 'Basil', scientific: 'Ocimum basilicum', type: 'Garden Plant' },
  { name: 'Bird\'s Nest Fern', scientific: 'Asplenium nidus', type: 'Houseplant' },
  { name: 'Chinese Money Plant', scientific: 'Pilea peperomioides', type: 'Houseplant' },
  { name: 'Fiddleleaf Fig', scientific: 'Ficus lyrata', type: 'Houseplant' },
  { name: 'Lavender', scientific: 'Lavandula', type: 'Garden Plant' },
  { name: 'Monstera (Swiss Cheese)', scientific: 'Monstera deliciosa', type: 'Houseplant' },
  { name: 'Peace Lily', scientific: 'Spathiphyllum wallisii', type: 'Houseplant' },
  { name: 'Pothos', scientific: 'Epipremnum aureum', type: 'Houseplant' },
  { name: 'Rose', scientific: 'Rosa', type: 'Garden Plant' },
  { name: 'Snake Plant', scientific: 'Dracaena trifasciata', type: 'Houseplant' },
  { name: 'Spider Plant', scientific: 'Chlorophytum comosum', type: 'Houseplant' },
  { name: 'Sunflower', scientific: 'Helianthus annuus', type: 'Garden Plant' }
];

const medicineDatabase = [
  { name: 'Bacillus thuringiensis (Bt)', category: 'Biological Control', description: 'Targets specific pests like caterpillars.', usedFor: 'A naturally occurring soil bacterium that produces proteins toxic to certain insects, particularly caterpillars.', plantUsedOn: 'Vegetables, fruit trees', image: 'assets/mint.png' },
  { name: 'Blood Meal', category: 'Fertilizer', description: 'High nitrogen fertilizer for leafy growth.', usedFor: 'An excellent source of organic nitrogen, promoting rapid vegetative growth and deep green foliage.', plantUsedOn: 'Leafy greens, brassicas', image: 'assets/ginger.png' },
  { name: 'Bone Meal', category: 'Fertilizer', description: 'Rich source of phosphorus for root development.', usedFor: 'A slow-release organic fertilizer packed with phosphorus, essential for strong root systems and flowering.', plantUsedOn: 'Bulbs, root vegetables, flowering plants', image: 'assets/chamomile.png' },
  { name: 'Copper Sulfate', category: 'Fungicide', description: 'Effective against a variety of fungal and bacterial infections.', usedFor: 'A broad-spectrum fungicide and bactericide used to prevent and treat blights, mildews, and leaf spots.', plantUsedOn: 'Tomatoes, potatoes, fruit trees', image: 'assets/mint.png' },
  { name: 'Diatomaceous Earth', category: 'Insecticide', description: 'Mineral-based powder that dehydrates crawling insects.', usedFor: 'A natural powder made from fossilized algae that physically damages the exoskeleton of crawling pests.', plantUsedOn: 'Indoor plants, garden beds', image: 'assets/ginger.png' },
  { name: 'Kelp Extract', category: 'Fertilizer', description: 'Provides trace minerals and acts as a growth stimulant.', usedFor: 'A liquid tonic rich in micronutrients and natural growth hormones that helps plants withstand stress.', plantUsedOn: 'All plants', image: 'assets/chamomile.png' },
  { name: 'Neem Oil', category: 'Fungicide & Insecticide', description: 'Natural oil disrupting fungal life cycles and repelling insects.', usedFor: 'A powerful organic compound that acts as an insecticide, miticide, and fungicide. It coats the leaves and disrupts pest lifecycles.', plantUsedOn: 'Houseplants, roses, vegetables', image: 'assets/mint.png' },
  { name: 'Potassium Bicarbonate', category: 'Fungicide', description: 'Treats powdery mildew without sodium toxicity.', usedFor: 'A contact fungicide that rapidly changes the pH on the leaf surface, effectively killing powdery mildew spores.', plantUsedOn: 'Squash, cucumbers, roses', image: 'assets/ginger.png' },
  { name: 'Pyrethrins', category: 'Insecticide', description: 'Extracted from chrysanthemum flowers for fast knockdown of insects.', usedFor: 'A botanical insecticide that attacks the nervous systems of insects, causing immediate paralysis.', plantUsedOn: 'Ornamentals, vegetables', image: 'assets/chamomile.png' },
  { name: 'Spinosad', category: 'Insecticide', description: 'Bacteria-derived insecticide highly effective against caterpillars.', usedFor: 'A natural substance made by a soil bacterium that is toxic to insects through ingestion and contact.', plantUsedOn: 'Fruiting vegetables, brassicas', image: 'assets/mint.png' },
  { name: 'Compost Tea', category: 'Fertilizer', description: 'Liquid organic fertilizer full of beneficial microbes.', usedFor: 'Brewed from compost to provide a quick nutrient boost and introduce beneficial microbes to the soil.', plantUsedOn: 'All plants', image: 'assets/ginger.png' },
  { name: 'Sulfur Dust', category: 'Fungicide', description: 'Controls powdery mildew, rust, and mites.', usedFor: 'A natural element applied as a dust or wettable powder to prevent fungal spores from germinating.', plantUsedOn: 'Roses, grapes, fruit trees', image: 'assets/chamomile.png' },
  { name: 'Insecticidal Soap', category: 'Insecticide', description: 'Effective on soft-bodied insects like aphids and whiteflies.', usedFor: 'Potassium salts of fatty acids that penetrate the exoskeleton of soft-bodied insects and cause dehydration.', plantUsedOn: 'Houseplants, vegetables, ornamentals', image: 'assets/mint.png' },
  { name: 'Horticultural Oil', category: 'Insecticide & Fungicide', description: 'Smothers insect eggs and scale insects.', usedFor: 'Highly refined oils sprayed on plants to suffocate overwintering pests, eggs, and occasionally fungal spores.', plantUsedOn: 'Fruit trees, shrubs', image: 'assets/ginger.png' },
  { name: 'Epsom Salt', category: 'Fertilizer', description: 'Provides magnesium and sulfur for deep green foliage.', usedFor: 'A quick way to correct magnesium deficiency, helping plants synthesize chlorophyll for better growth.', plantUsedOn: 'Tomatoes, peppers, roses', image: 'assets/chamomile.png' },
  { name: 'Fish Emulsion', category: 'Fertilizer', description: 'Fast-acting liquid fertilizer rich in nitrogen.', usedFor: 'Made from fish byproducts, offering an immediate dose of nitrogen and trace minerals for rapid leafy growth.', plantUsedOn: 'Leafy greens, lawns, indoor plants', image: 'assets/mint.png' },
  { name: 'Iron Chelate', category: 'Fertilizer', description: 'Treats iron chlorosis (yellowing leaves with green veins).', usedFor: 'A highly soluble form of iron that plants can easily absorb to cure severe iron deficiencies.', plantUsedOn: 'Citrus trees, gardenias, azaleas', image: 'assets/ginger.png' },
  { name: 'Mycorrhizal Fungi', category: 'Soil Amendment', description: 'Beneficial fungi that improve root nutrient uptake.', usedFor: 'Fungi that form a symbiotic relationship with plant roots, expanding their reach for water and phosphorus.', plantUsedOn: 'Trees, shrubs, newly transplanted seedlings', image: 'assets/chamomile.png' },
  { name: 'Trichoderma', category: 'Biological Control', description: 'Beneficial fungi that protect against soil-borne pathogens.', usedFor: 'A natural predatory fungus that outcompetes and destroys harmful root rot and damping-off pathogens.', plantUsedOn: 'Seedlings, greenhouse crops', image: 'assets/mint.png' },
  { name: 'Beneficial Nematodes', category: 'Biological Control', description: 'Microscopic worms that hunt soil-dwelling pests.', usedFor: 'Applied as a soil drench to aggressively hunt down fungus gnat larvae, grubs, and other soil pests.', plantUsedOn: 'Lawns, potted plants, garden beds', image: 'assets/ginger.png' },
  { name: 'Garlic Spray', category: 'Repellent', description: 'Natural repellent that deters a wide variety of insects.', usedFor: 'A homemade or commercial spray utilizing strong sulfur compounds in garlic to confuse and repel pests.', plantUsedOn: 'Vegetables, herbs', image: 'assets/chamomile.png' },
  { name: 'Mancozeb', category: 'Fungicide', description: 'Broad-spectrum preventative contact fungicide.', usedFor: 'Used commercially and residentially to prevent blight, leaf spots, and rusts from taking hold.', plantUsedOn: 'Tomatoes, potatoes, ornamentals', image: 'assets/mint.png' },
  { name: 'Bordeaux Mixture', category: 'Fungicide', description: 'Classic blend of copper sulfate and lime.', usedFor: 'One of the oldest fungicides, highly effective against downy mildew, blights, and bacterial canker.', plantUsedOn: 'Grapevines, fruit trees', image: 'assets/ginger.png' },
  { name: 'Seaweed Extract', category: 'Fertilizer', description: 'Rich in cytokines to stimulate vigorous plant growth.', usedFor: 'A liquid extract that relieves heat and cold stress while boosting overall plant immunity and yields.', plantUsedOn: 'All plants', image: 'assets/chamomile.png' },
  { name: 'Liquid Humate', category: 'Soil Amendment', description: 'Improves soil structure and nutrient retention.', usedFor: 'Derived from humic acids, it improves soil aeration, water retention, and microbial activity.', plantUsedOn: 'Lawns, poor soils', image: 'assets/mint.png' },
  { name: 'Chlorothalonil', category: 'Fungicide', description: 'Multi-site contact fungicide for severe infections.', usedFor: 'A highly effective synthetic fungicide used to halt the spread of aggressive diseases like late blight.', plantUsedOn: 'Cucurbits, tomatoes, turf', image: 'assets/ginger.png' },
  { name: 'Imidacloprid', category: 'Insecticide', description: 'Systemic insecticide for severe, hard-to-kill pests.', usedFor: 'Absorbed by the roots and distributed throughout the plant, offering long-lasting protection against sap-sucking insects.', plantUsedOn: 'Ornamentals, non-fruiting trees', image: 'assets/chamomile.png' },
  { name: 'Perlite', category: 'Soil Amendment', description: 'Volcanic glass expanded by heat to improve drainage.', usedFor: 'Mixed into potting soils to prevent compaction, increase aeration, and provide vital oxygen to roots.', plantUsedOn: 'Potted plants, succulents', image: 'assets/mint.png' },
  { name: 'Worm Castings', category: 'Fertilizer', description: 'Nutrient-rich organic compost produced by earthworms.', usedFor: 'Considered black gold for gardeners; provides a perfect balance of slow-release nutrients and beneficial microbes.', plantUsedOn: 'All plants, especially seedlings', image: 'assets/ginger.png' },
  { name: 'Hydrogen Peroxide', category: 'Fungicide & Bactericide', description: 'Oxygenates soil and kills fungal spores on contact.', usedFor: 'Used in highly diluted forms to treat root rot, sterilize seeds, and quickly kill mold and mildew spores.', plantUsedOn: 'Houseplants, hydroponics', image: 'assets/chamomile.png' }
];

