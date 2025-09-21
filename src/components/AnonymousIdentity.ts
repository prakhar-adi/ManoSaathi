// Anonymous identity system for peer support
export interface AnonymousUser {
  id: string;
  displayName: string;
  avatar: {
    emoji: string;
    color: string;
  };
  type: 'campus' | 'anonymous';
  collegeName?: string;
  joinedAt: string;
}

const supportiveNames = [
  'SupportiveListener', 'CaringFriend', 'UnderstandingPeer', 'CompassionateStudent',
  'HelpfulSoul', 'WiseCompanion', 'GentleSupporter', 'KindListener', 'EmpatheticFriend',
  'WarmHeart', 'PatientHelper', 'ThoughtfulPeer', 'EncouragingSoul', 'LovingSupporter'
];

const emojis = ['🌟', '💙', '💚', '💜', '🧡', '💛', '❤️', '🤍', '💖', '💝', '🌈', '🦋', '🌸', '🌺', '🌻'];

const colors = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800', 
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-orange-100 text-orange-800',
  'bg-yellow-100 text-yellow-800',
  'bg-indigo-100 text-indigo-800',
  'bg-teal-100 text-teal-800'
];

export function generateAnonymousIdentity(userData: any): AnonymousUser {
  const randomName = supportiveNames[Math.floor(Math.random() * supportiveNames.length)];
  const randomNumber = Math.floor(Math.random() * 100) + 1;
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    displayName: userData.type === 'campus' 
      ? `Student from ${userData.collegeName}`
      : `${randomName}${randomNumber}`,
    avatar: {
      emoji: randomEmoji,
      color: randomColor
    },
    type: userData.type,
    collegeName: userData.collegeName,
    joinedAt: userData.joinedAt
  };
}

export function getStoredUser(): AnonymousUser | null {
  const stored = sessionStorage.getItem('peerSupportUser');
  if (!stored) return null;
  
  try {
    const userData = JSON.parse(stored);
    return generateAnonymousIdentity(userData);
  } catch {
    return null;
  }
}

export function clearStoredUser(): void {
  sessionStorage.removeItem('peerSupportUser');
}
