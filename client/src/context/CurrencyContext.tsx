import React, { createContext, useContext } from 'react';

// The store sells in Pakistani Rupees only.
export type CurrencyCode = 'PKR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  rate: number; // product prices are stored in USD base; multiplied by this rate
  symbolFirst: boolean;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  PKR: { code: 'PKR', symbol: 'Rs. ', label: 'PKR (Rs.)', rate: 280.0, symbolFirst: true },
};

interface CurrencyContextType {
  currency: CurrencyConfig;
  setCurrencyCode: (code: CurrencyCode) => void;
  formatPrice: (amountInUSD: number) => string;
  convertPrice: (amountInUSD: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currency = CURRENCIES.PKR;

  const convertPrice = (amountInUSD: number): number => Math.round(amountInUSD * currency.rate);

  const formatPrice = (amountInUSD: number): string =>
    `${currency.symbol}${convertPrice(amountInUSD).toLocaleString('en-PK')}`;

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyCode: () => {}, formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
