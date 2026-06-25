// Fallback branding shown for a split second before business_settings
// loads from the database. THIS IS NOT THE FILE TO EDIT to rebrand the
// app for a salon - that happens live, with no code changes, from
// Admin > Settings (business name, logo, colours, currency, etc. are
// all stored in the business_settings table - see
// src/context/BusinessContext.tsx). Only touch this file if you want
// to change the placeholder shown while the real settings are loading,
// or the default values inserted into a brand-new database.
export const fallbackBranding = {
  businessName: 'Your Salon Name',
  primaryColor: '#7c3aed',
  secondaryColor: '#0f172a',
  logoUrl: '',
  currency: 'GBP',
};
