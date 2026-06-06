import type { Apartment, Kitchen } from '../types';

export const DEFAULT_APARTMENTS: Array<Omit<Apartment, 'id' | 'createdAt'>> = [
  {
    title: 'Beijing Room',
    description: 'An exquisitely styled room featuring a king-sized plush bed, soft ambient lighting, and rich corporate comfort.',
    price: 25000,
    media: [{ type: 'image', url: 'https://i.ibb.co/C5B6dtK8/ROOM-2.png' }],
    features: ['High-speed Wi-Fi', 'Smart TV & AC', '24/7 Power', 'Mini Refrigerator'],
    status: 'available'
  },
  {
    title: 'Las Vegas Room',
    description: 'A majestic executive space with dramatic charcoal oak panels, sleek brass details, and deep relaxation lounges.',
    price: 25000,
    media: [{ type: 'image', url: 'https://i.ibb.co/whXDrrHW/LAS-VEGAS-ROOM.png' }],
    features: ['High-speed Wi-Fi', 'Smart TV & AC', '24/7 Power', 'Mini Refrigerator'],
    status: 'available'
  },
  {
    title: 'London Suite',
    description: 'The pinnacle top-flight master suite containing state-of-the-art studies and private resident pantry entry.',
    price: 35000,
    media: [{ type: 'image', url: 'https://i.ibb.co/0jJJK77h/ok-1-1-1.png' }],
    features: ['High-speed Wi-Fi', 'Smart TV & AC', 'Refrigerator', 'Wide Sitting Space'],
    status: 'available'
  },
  {
    title: 'Toronto Room',
    description: 'A contemporary executive suite beautifully detailed with leather accents and high-contrast brass elements.',
    price: 25000,
    media: [{ type: 'image', url: 'https://i.ibb.co/bg2FDP8C/THIS-1.png' }],
    features: ['High-speed Wi-Fi', 'Smart TV & AC', '24/7 Power', 'Mini Refrigerator'],
    status: 'available'
  },
  {
    title: 'Belize Room',
    description: 'An elegant retreat featuring premium velvet lounge chairs, high-contrast stone floors, and absolute privacy.',
    price: 25000,
    media: [{ type: 'image', url: 'https://i.ibb.co/svGc1zJr/BELIZE-ROOM-1.png' }],
    features: ['High-speed Wi-Fi', 'Smart TV & AC', '24/7 Power', 'Mini Refrigerator'],
    status: 'available'
  },
  {
    title: 'New York Suite',
    description: 'A spectacular double-room penthouse configuration styled with deep forest velvet and walnut detailing.',
    price: 40000,
    media: [{ type: 'image', url: 'https://i.ibb.co/pBpJrGtM/suite-1.png' }],
    features: ['High-speed Wi-Fi', 'Smart TV & AC', 'Refrigerator', 'Wide Sitting Space'],
    status: 'available'
  }
];

export const DEFAULT_KITCHENS: Array<Omit<Kitchen, 'id'>> = [
  {
    name: 'The Primary Chef’s Gourmet Kitchen',
    serviceType: 'State-of-the-Art Culinary Station',
    image: 'https://i.ibb.co/XdXKdfr/THIS-KITCHEN-2.png',
    menuLink: 'https://www.lexmedicinaresidence.com/'
  },
  {
    name: "The Resident's Morning Pantry & Kitchenette",
    serviceType: 'Delicate Mornings & Beverages Bar',
    image: 'https://i.ibb.co/xt9ThjHx/SECOND-KITCHEN-1.png',
    menuLink: 'https://www.lexmedicinaresidence.com/'
  }
];
