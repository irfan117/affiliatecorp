import React, { useState } from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate
} from 'remotion';

export interface ProductAdProps {
  productId: string;
  productName: string;
  category: string;
  hookText: string;
  headline: string;
  pricePromo: string;
  priceOriginal: string;
  discountTag: string;
  rating: number;
  salesCount: number;
  imageUrl: string;
  badge: string;
  salesPoints: string[];
  ctaUrlText: string;
}

const ProductImage: React.FC<{
  src: string;
  alt: string;
  style?: React.CSSProperties;
}> = ({ src, alt, style }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #312E81 0%, #4F46E5 100%)',
          color: '#FFFFFF',
          padding: 32,
          textAlign: 'center',
          ...style
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
        <span style={{ marginTop: 20, fontSize: 30, fontWeight: 800 }}>{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style
      }}
    />
  );
};

const SceneHook: React.FC<{ props: ProductAdProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleSpring = spring({ frame, fps, config: { damping: 14 } });
  const textY = interpolate(frame, [0, 20], [50, 0], { extrapolateRight: 'clamp' });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(155deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)',
        padding: 72,
        justifyContent: 'space-between',
        color: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Top Category Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          opacity,
          transform: `translateY(${textY}px)`
        }}
      >
        <div
          style={{
            backgroundColor: '#F59E0B',
            color: '#0F172A',
            padding: '14px 28px',
            borderRadius: 999,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: 1
          }}
        >
          MASALAH {props.category.toUpperCase()}
        </div>
      </div>

      {/* Center Problem Hook Text */}
      <div
        style={{
          opacity,
          transform: `scale(${scaleSpring})`,
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: 40,
          padding: 56
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.22,
            color: '#FFFFFF'
          }}
        >
          "{props.hookText}"
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 34,
            color: '#C7D2FE',
            fontWeight: 600
          }}
        >
          Simak solusi praktis tanpa ribet berikut ini →
        </div>
      </div>

      {/* Bottom Preview Image */}
      <div
        style={{
          height: 560,
          borderRadius: 36,
          overflow: 'hidden',
          border: '4px solid rgba(255,255,255,0.25)',
          transform: `scale(${interpolate(frame, [0, 90], [0.95, 1.04])})`
        }}
      >
        <ProductImage
          src={props.imageUrl}
          alt={props.productName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    </AbsoluteFill>
  );
};

const SceneShowcase: React.FC<{ props: ProductAdProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardScale = spring({ frame, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#F8FAFC',
        padding: 68,
        justifyContent: 'space-between',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#0F172A'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            backgroundColor: '#4F46E5',
            color: '#FFFFFF',
            padding: '14px 28px',
            borderRadius: 999,
            fontSize: 28,
            fontWeight: 700
          }}
        >
          SOLUSI PILIHAN
        </div>
        <div
          style={{
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            padding: '14px 28px',
            borderRadius: 999,
            fontSize: 28,
            fontWeight: 800
          }}
        >
          Rating {props.rating}/5.0 • {props.salesCount.toLocaleString('id-ID')}+ Terjual
        </div>
      </div>

      <div
        style={{
          transform: `scale(${cardScale})`,
          backgroundColor: '#FFFFFF',
          borderRadius: 44,
          padding: 48,
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.12)',
          border: '2px solid #E2E8F0'
        }}
      >
        <div style={{ height: 680, borderRadius: 32, overflow: 'hidden', marginBottom: 40 }}>
          <ProductImage
            src={props.imageUrl}
            alt={props.productName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.2, color: '#0F172A' }}>
          {props.productName}
        </div>
        <div style={{ fontSize: 32, color: '#475569', marginTop: 20, lineHeight: 1.4 }}>
          {props.headline}
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#EEF2FF',
          padding: '28px 40px',
          borderRadius: 28,
          fontSize: 32,
          fontWeight: 700,
          color: '#3730A3',
          textAlign: 'center'
        }}
      >
        {props.discountTag} • {props.badge}
      </div>
    </AbsoluteFill>
  );
};

const SceneBenefits: React.FC<{ props: ProductAdProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #1E1B4B 100%)',
        padding: 72,
        justifyContent: 'center',
        gap: 44,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#FFFFFF'
      }}
    >
      <div style={{ fontSize: 48, fontWeight: 900, color: '#A5B4FC' }}>
        3 ALASAN PRODUK INI WAJIB DIMILIKI:
      </div>

      {props.salesPoints.map((point, index) => {
        const delay = index * 18;
        const slideIn = spring({
          frame: Math.max(0, frame - delay),
          fps,
          config: { damping: 14 }
        });
        return (
          <div
            key={index}
            style={{
              opacity: slideIn,
              transform: `translateX(${interpolate(slideIn, [0, 1], [120, 0])}px)`,
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(165, 180, 252, 0.3)',
              borderRadius: 32,
              padding: 44,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 28
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
                fontWeight: 900,
                flexShrink: 0
              }}
            >
              {index + 1}
            </div>
            <div style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.35 }}>
              {point}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const SceneClosingCta: React.FC<{ props: ProductAdProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(155deg, #4F46E5 0%, #6D28D9 100%)',
        padding: 72,
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#FFFFFF'
      }}
    >
      <div
        style={{
          marginTop: 40,
          backgroundColor: '#F59E0B',
          color: '#0F172A',
          padding: '16px 36px',
          borderRadius: 999,
          fontSize: 32,
          fontWeight: 900
        }}
      >
        PROMO TERBATAS • {props.discountTag.toUpperCase()}
      </div>

      <div
        style={{
          transform: `scale(${pop})`,
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          borderRadius: 44,
          padding: 56,
          width: '100%'
        }}
      >
        <div style={{ fontSize: 36, color: '#64748B', textDecoration: 'line-through' }}>
          Harga Normal: {props.priceOriginal}
        </div>
        <div style={{ fontSize: 68, fontWeight: 900, color: '#4F46E5', marginTop: 12 }}>
          {props.pricePromo}
        </div>
        <div style={{ fontSize: 38, fontWeight: 800, marginTop: 28, lineHeight: 1.3 }}>
          {props.productName}
        </div>
        <div
          style={{
            marginTop: 32,
            backgroundColor: '#ECFDF5',
            color: '#047857',
            padding: '18px 28px',
            borderRadius: 20,
            fontSize: 30,
            fontWeight: 700
          }}
        >
          Masih Ragu Ukuran/Kecocokan? Tanya Asisten AI Kami!
        </div>
      </div>

      <div
        style={{
          marginBottom: 40,
          width: '100%',
          backgroundColor: '#F59E0B',
          color: '#0F172A',
          padding: '36px 40px',
          borderRadius: 32,
          fontSize: 40,
          fontWeight: 900,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}
      >
        {props.ctaUrlText}
      </div>
    </AbsoluteFill>
  );
};

export const ProductAdVideo: React.FC<ProductAdProps> = (props) => {
  return (
    <AbsoluteFill>
      {/* Scene 1: 0s - 3s (90 frames) Problem Hook */}
      <Sequence from={0} durationInFrames={90}>
        <SceneHook props={props} />
      </Sequence>

      {/* Scene 2: 3s - 7s (120 frames) Product Showcase */}
      <Sequence from={90} durationInFrames={120}>
        <SceneShowcase props={props} />
      </Sequence>

      {/* Scene 3: 7s - 11.5s (135 frames) 3 Key Benefits */}
      <Sequence from={210} durationInFrames={135}>
        <SceneBenefits props={props} />
      </Sequence>

      {/* Scene 4: 11.5s - 15s (105 frames) Price & Closing CTA */}
      <Sequence from={345} durationInFrames={105}>
        <SceneClosingCta props={props} />
      </Sequence>
    </AbsoluteFill>
  );
};

