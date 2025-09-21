// AI Content Moderation and Crisis Detection
export interface ModerationResult {
  isApproved: boolean;
  needsReview: boolean;
  crisisDetected: boolean;
  flags: string[];
  suggestedAction: 'approve' | 'review' | 'escalate' | 'block';
  confidence: number;
}

// Crisis keywords that trigger immediate escalation
const crisisKeywords = [
  'suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead',
  'self harm', 'cut myself', 'hurt myself', 'want to die', 'end my life',
  'hopeless', 'no point', 'give up', 'can\'t go on', 'too much pain',
  'overdose', 'pills', 'jump off', 'hang myself', 'drown myself'
];

// Harmful content keywords
const harmfulKeywords = [
  'hate', 'stupid', 'worthless', 'pathetic', 'loser', 'failure',
  'drugs', 'alcohol', 'substance', 'illegal', 'harmful substances'
];

// Supportive keywords (positive indicators)
const supportiveKeywords = [
  'help', 'support', 'understand', 'care', 'love', 'hope', 'better',
  'therapy', 'counselor', 'professional', 'medication', 'treatment'
];

export async function moderateContent(content: string): Promise<ModerationResult> {
  const lowerContent = content.toLowerCase();
  
  // Check for crisis indicators
  const crisisMatches = crisisKeywords.filter(keyword => 
    lowerContent.includes(keyword.toLowerCase())
  );
  
  // Check for harmful content
  const harmfulMatches = harmfulKeywords.filter(keyword => 
    lowerContent.includes(keyword.toLowerCase())
  );
  
  // Check for supportive content
  const supportiveMatches = supportiveKeywords.filter(keyword => 
    lowerContent.includes(keyword.toLowerCase())
  );

  const flags: string[] = [];
  let crisisDetected = false;
  let needsReview = false;
  let isApproved = false;
  let suggestedAction: 'approve' | 'review' | 'escalate' | 'block' = 'approve';
  let confidence = 0.8;

  // Crisis detection - highest priority
  if (crisisMatches.length > 0) {
    crisisDetected = true;
    flags.push('crisis_detected');
    suggestedAction = 'escalate';
    confidence = 0.95;
    return {
      isApproved: false,
      needsReview: false,
      crisisDetected: true,
      flags,
      suggestedAction,
      confidence
    };
  }

  // Harmful content detection
  if (harmfulMatches.length > 0) {
    flags.push('harmful_content');
    needsReview = true;
    suggestedAction = 'review';
    confidence = 0.7;
  }

  // Length and complexity checks
  if (content.length < 10) {
    flags.push('too_short');
    needsReview = true;
  }

  if (content.length > 2000) {
    flags.push('too_long');
    needsReview = true;
  }

  // Multiple exclamation marks or caps (potential spam/aggression)
  if ((content.match(/!/g) || []).length > 5 || content === content.toUpperCase()) {
    flags.push('aggressive_tone');
    needsReview = true;
  }

  // Determine final decision
  if (crisisDetected) {
    isApproved = false;
    suggestedAction = 'escalate';
  } else if (needsReview) {
    isApproved = false;
    suggestedAction = 'review';
  } else if (supportiveMatches.length > 0) {
    isApproved = true;
    suggestedAction = 'approve';
    confidence = 0.9;
  } else {
    isApproved = true;
    suggestedAction = 'approve';
  }

  return {
    isApproved,
    needsReview,
    crisisDetected,
    flags,
    suggestedAction,
    confidence
  };
}

export function getCrisisResources() {
  return {
    helpline: {
      number: '1800-599-0019',
      name: 'KIRAN Mental Health Helpline',
      available: '24/7'
    },
    emergency: {
      number: '108',
      name: 'Emergency Services',
      available: '24/7'
    },
    campus: {
      service: 'Campus Counseling Center',
      action: 'Book immediate appointment'
    }
  };
}

export function generateCrisisResponse(userName: string) {
  return {
    title: 'We Care About You',
    message: `Hi ${userName}, we noticed you might be going through a difficult time. You're not alone, and there are people who want to help.`,
    resources: getCrisisResources(),
    actions: [
      'Call KIRAN Helpline: 1800-599-0019',
      'Contact campus counseling center',
      'Reach out to a trusted friend or family member',
      'Visit the nearest emergency room if in immediate danger'
    ]
  };
}
