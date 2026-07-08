import { randomUUID } from 'node:crypto';
import { FIXED_ADDRESS } from './constants';

export interface Partner {
  name: string;
  address: string;
  phoneDigits: string;
  contactPerson: string;
  description: string;
}

export function makePartner(overrides: Partial<Partner> = {}): Partner {
  const uniqueId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  return {
    name: `QA-E2E-${uniqueId}`,
    address: FIXED_ADDRESS,
    phoneDigits: `888${Math.floor(100000 + Math.random() * 900000)}`,
    contactPerson: `QA Contact ${uniqueId}`,
    description: `Automated E2E test partner (${uniqueId})`,
    ...overrides,
  };
}
