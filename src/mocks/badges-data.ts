// Mock badges data for testing card template unlocking
const badgesData = [
  {
    id: 1,
    name: 'Early Adopter',
    isSelected: true,
  },
  {
    id: 2,
    name: 'NFT Collector',
    isSelected: true,
  },
  {
    id: 3,
    name: 'DeFi Expert',
    isSelected: true,
  },
  {
    id: 4,
    name: 'Community Leader',
    isSelected: false,
  },
  {
    id: 5,
    name: 'Trading Master',
    isSelected: false,
  },
];

// Mock extended badges for testing template unlock (matches API structure)
export const mockExtendedBadges = {
  userBadges: [
    {
      id: 'ub-1',
      userId: 'test-user',
      name: 'GUUD Badge',
      description: 'Official GUUD community member',
      image: 'https://example.com/guud-badge.png',
      color: '#00B4D8',
    },
    {
      id: 'ub-2',
      userId: 'test-user',
      name: 'Avax Power User',
      description: 'Active on Avalanche ecosystem',
      image: 'https://example.com/avax-badge.png',
      color: '#E84142',
    },
  ],
  poapBadges: [
    {
      id: 'pb-1',
      userId: 'test-user',
      name: 'DeSci Conference 2024',
      description: 'Attended DeSci Summit',
      image: 'https://example.com/desci-poap.png',
      chain: 'xdai',
      eventId: 12345,
      tokenId: '67890',
      owner: '0xtest',
      mintedAt: '2024-01-15T00:00:00Z',
      isVisible: true,
      priority: 1,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      event: {
        id: 'ev-1',
        eventId: 12345,
        fancyId: 'desci-2024',
        name: 'DeSci Summit 2024',
        description: 'Decentralized Science Conference',
        city: 'San Francisco',
        country: 'USA',
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-01-16T00:00:00Z',
        eventUrl: 'https://desci2024.com',
        imageUrl: 'https://example.com/desci-event.png',
        year: 2024,
        createdAt: '2023-12-01T00:00:00Z',
        updatedAt: '2023-12-01T00:00:00Z',
      },
    },
  ],
  nftBadges: [
    {
      id: 'nb-1',
      userId: 'test-user',
      name: 'Nochillio NFT Holder',
      description: 'Nochillio collection owner',
      image: 'https://example.com/nochillio-nft.png',
      contractAddress: '0xnochillio123',
      tokenId: '42',
      collectionName: 'Nochillio Genesis',
      isVisible: true,
      priority: 1,
    },
    {
      id: 'nb-2',
      userId: 'test-user',
      name: 'COQ Inu Holder',
      description: '$COQ token NFT holder',
      image: 'https://example.com/coq-nft.png',
      contractAddress: '0xcoq456',
      tokenId: '99',
      collectionName: 'COQ Inu',
      isVisible: true,
      priority: 2,
    },
    {
      id: 'nb-3',
      userId: 'test-user',
      name: 'GTA NFT',
      description: 'Grand Theft Ape collection',
      image: 'https://example.com/gta-nft.png',
      contractAddress: '0xgta789',
      tokenId: '7',
      collectionName: 'Grand Theft Ape',
      isVisible: true,
      priority: 3,
    },
  ],
};

export default badgesData;
