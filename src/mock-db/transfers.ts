import { ClubInventorySetting } from './admin';

export interface ProductTransfer {
  id: string;
  club_id: string;
  product_id: string;
  quantity: number;
  timestamp: number;
}

// Generate some mock transfers for the last 35 days
const generateTransfers = (): ProductTransfer[] => {
  const transfers: ProductTransfer[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const clubs = ['akropolis', 'panorama', 'kaunas', 'klaipeda'];
  const products = ['p1', 'p2', 'v1', 'v2'];

  products.forEach(pid => {
    clubs.forEach(cid => {
      // Different usage per product/club
      const baseUsage = pid.startsWith('v') ? 5 : 1; // Vending higher usage
      
      for (let i = 0; i < 35; i++) {
        const timestamp = now - (i * dayMs);
        // Random usage around baseUsage
        const qty = Math.max(0, Math.floor(baseUsage + (Math.random() * baseUsage)));
        
        if (qty > 0) {
          transfers.push({
            id: `tr-${cid}-${pid}-${i}`,
            club_id: cid,
            product_id: pid,
            quantity: qty,
            timestamp
          });
        }
      }
    });
  });

  return transfers;
};

export const productTransfers: ProductTransfer[] = generateTransfers();
