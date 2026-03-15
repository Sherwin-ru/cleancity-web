// js/classifier.js
// ═══════════════════════════════════════════════
// Google Teachable Machine — AI Waste Classifier
// ═══════════════════════════════════════════════

// Replace with your trained Teachable Machine model URL
// See training instructions in scanner.html comments
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/';

const CLASS_MAP = {
  'Cardboard': { category: 'Bio-waste',    points: 20, badge: 'badge-bio'    },
  'Paper':     { category: 'Bio-waste',    points: 20, badge: 'badge-bio'    },
  'Glass':     { category: 'Solid Waste',  points: 15, badge: 'badge-solid'  },
  'Metal':     { category: 'Solid Waste',  points: 15, badge: 'badge-solid'  },
  'Plastic':   { category: 'Solid Waste',  points: 15, badge: 'badge-solid'  },
  'Trash':     { category: 'E-waste',      points: 25, badge: 'badge-ewaste' }
};

let classifierModel = null;
let isModelLoaded = false;

/**
 * Load Teachable Machine model
 */
async function loadModel() {
  try {
    const modelURL    = MODEL_URL + 'model.json';
    const metadataURL = MODEL_URL + 'metadata.json';
    classifierModel = await tmImage.load(modelURL, metadataURL);
    isModelLoaded = true;
    console.log('Teachable Machine model loaded successfully');
    return classifierModel;
  } catch (e) {
    console.warn('Could not load Teachable Machine model:', e.message);
    console.log('Falling back to demo classification mode');
    isModelLoaded = false;
    return null;
  }
}

/**
 * Classify an image element using the loaded model
 */
async function classifyImage(model, imageElement) {
  // If model is loaded, use real classification
  if (model && isModelLoaded) {
    try {
      const predictions = await model.predict(imageElement);
      const top = predictions.reduce(function(a, b) {
        return a.probability > b.probability ? a : b;
      });
      const mapped = CLASS_MAP[top.className] || { category: 'Unknown', points: 0, badge: 'badge-solid' };
      return {
        rawClass: top.className,
        confidence: Math.round(top.probability * 100),
        category: mapped.category,
        points: mapped.points,
        badge: mapped.badge
      };
    } catch (e) {
      console.error('Classification error:', e);
    }
  }

  // Fallback: demo random classification for testing without a trained model
  var demoClasses = [
    { rawClass: 'Plastic',   category: 'Solid Waste', points: 15, badge: 'badge-solid',  confidence: 87 },
    { rawClass: 'Cardboard', category: 'Bio-waste',   points: 20, badge: 'badge-bio',    confidence: 92 },
    { rawClass: 'Metal',     category: 'Solid Waste', points: 15, badge: 'badge-solid',  confidence: 78 },
    { rawClass: 'Paper',     category: 'Bio-waste',   points: 20, badge: 'badge-bio',    confidence: 85 },
    { rawClass: 'Glass',     category: 'Solid Waste', points: 15, badge: 'badge-solid',  confidence: 81 },
    { rawClass: 'Trash',     category: 'E-waste',     points: 25, badge: 'badge-ewaste', confidence: 74 }
  ];
  var pick = demoClasses[Math.floor(Math.random() * demoClasses.length)];
  return pick;
}
