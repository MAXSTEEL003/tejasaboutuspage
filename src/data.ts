export type Variety = {
  name: string
  tone: [string, string, string]
  tint: string
  length: number
  len: string
  mm: number
  width: number
  texture: string
  aroma: string
  aged: string
  note: string
  meters: [string, number][]
  pins: string[]
  price: string
  best: string
}

export const VARIETIES: Variety[] = [
  {
    name: 'Keshar Kali', tone: ['#fff7e0', '#efdba8', '#bb9a5c'], tint: '#f1dfb0', length: 0.86, len: '7.4 mm', mm: 7.4, width: 2.1,
    texture: 'Separate, soft & fluffy', aroma: 'Mild floral, delicate', aged: 'Aged 12 months',
    note: 'Premium Wada Kolam special: silky slender grains that cook up fragrant, tender, and distinct ("Khila Khila Dana").',
    meters: [['Length', 84], ['Fragrance', 78], ['Fluffiness', 92], ['Firmness', 60]],
    pins: ['Soft golden blush', 'Delicate natural groove', 'Khila Khila separate grains'],
    price: '₹96', best: 'Daily meals & Festive cooking',
  },
  {
    name: '1121 Basmati', tone: ['#fffdf5', '#f1e6c9', '#c4ad7c'], tint: '#efe4c8', length: 1, len: '8.3 mm', mm: 8.3, width: 1.9,
    texture: 'Dry, separate, fluffy', aroma: 'Floral, nutty', aged: 'Aged 24 months',
    note: 'The long, slender benchmark for biryani and pulao. Elongates up to 2.5x when cooked.',
    meters: [['Length', 98], ['Fragrance', 92], ['Fluffiness', 90], ['Firmness', 62]],
    pins: ['Tapered, needle-fine tip', 'Natural lengthwise groove', 'Pearl-white endosperm'],
    price: '₹128', best: 'Biryani & pulao',
  },
  {
    name: 'JMR Brand', tone: ['#fefbf1', '#ece1c4', '#b3a078'], tint: '#e8dfc6', length: 0.72, len: '6.6 mm', mm: 6.6, width: 2.2,
    texture: 'Firm, non-sticky', aroma: 'Clean, neutral', aged: 'Aged 8 months',
    note: 'Our dependable wholesale staple, consistent lot after lot, built for volume kitchens.',
    meters: [['Length', 64], ['Fragrance', 36], ['Fluffiness', 68], ['Firmness', 84]],
    pins: ['Blunt, sturdy tip', 'Shallow groove', 'Dense white core'],
    price: '₹72', best: 'Volume kitchens',
  },
  {
    name: 'Sona Masoori', tone: ['#ffffff', '#f3ecda', '#cabb98'], tint: '#efe9dc', length: 0.6, len: '5.4 mm', mm: 5.4, width: 2.5,
    texture: 'Light, medium-grain', aroma: 'Subtle, sweet', aged: 'Aged 6 months',
    note: 'Lightweight and easy to digest, a southern kitchen favourite for daily meals.',
    meters: [['Length', 48], ['Fragrance', 44], ['Fluffiness', 58], ['Firmness', 40]],
    pins: ['Rounded, compact tip', 'Soft groove line', 'Translucent, light body'],
    price: '₹58', best: 'Daily meals',
  },
]

export const MAX_MM = 8.3
