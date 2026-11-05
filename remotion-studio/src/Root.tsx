import React from 'react';
import { Composition } from 'remotion';
import { ProductAdVideo, type ProductAdProps } from './ProductAdVideo';
import campaigns from './data/campaigns.json';

const defaultAdProps: ProductAdProps =
  campaigns[0]?.remotionProps || {
    productId: 'tray-kabel-jepit',
    productName: 'Under-Desk Cable Management Tray Besi Tanpa Bor',
    category: 'Meja Kerja',
    hookText: 'Kabel di bawah meja berantakan tapi sayang kalau meja harus dibor?',
    headline: 'Merapikan kabel dan stop kontak menjuntai tanpa mengebor meja.',
    pricePromo: 'Rp65.000 – Rp89.000',
    priceOriginal: 'Rp120.000',
    discountTag: 'Hemat 35%',
    rating: 4.9,
    salesCount: 3420,
    imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80',
    badge: 'Gratis Ongkir',
    salesPoints: [
      'Kolong meja langsung bersih bebas kabel',
      'Klem jepit berlapis silikon anti lecet',
      'Rongga besi terbuka menjaga suhu adaptor'
    ],
    ctaUrlText: 'Klik Link di Bio (/?p=tray-kabel-jepit)'
  };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Komposisi Utama Dinamis (Bisa dirender dengan --props file JSON mana pun) */}
      <Composition
        id="ProductAdVideo"
        component={ProductAdVideo as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultAdProps as unknown as Record<string, unknown>}
      />

      {/* Daftar Komposisi per Produk di Sidebar Remotion Studio */}
      {campaigns.map((camp) => (
        <Composition
          key={camp.campaignId}
          id={`Ad-${camp.productId}`}
          component={ProductAdVideo as unknown as React.FC<Record<string, unknown>>}
          durationInFrames={450}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={camp.remotionProps as unknown as Record<string, unknown>}
        />
      ))}
    </>
  );
};

