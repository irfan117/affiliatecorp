import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CATALOG_PATH = path.join(ROOT, 'data/approved/catalog.json');

const NEW_CURATED_PRODUCTS = [
  {
    id: 'prd-enmy-acrylic-80',
    source: 'shopee_affiliate_feed',
    source_product_id: '28927384387',
    name: 'ENMY Black Box Spidol Acrylic Marker 80 Warna Multi-Surface',
    slug: 'enmy-black-box-spidol-acrylic-marker-80-warna-prd-enmy-acrylic-80',
    category: 'alat-kreatif',
    problem_tags: [
      'spidol warna tidak pekat',
      'tinta spidol cepat kering dan macet',
      'sulit melukis di kaca kayu dan kanvas',
      'butuh variasi warna lengkap untuk karya seni'
    ],
    solution_summary: 'Spidol akrilik profesional 80 warna berbasis air dengan soft brush tip dan teknologi direct liquid auto-flow yang langsung menutup pekat di kanvas, kayu, kaca, batu, hingga 3D print.',
    tradeoffs: 'Tutup harus dipasang rapat setelah digunakan agar soft tip tidak mengering di udara terbuka. Pada kertas tipis disarankan menggunakan alas sketch book.',
    price_min: 165000,
    price_max: 250000,
    currency: 'IDR',
    rating: 4.9,
    sales_count: 10000,
    image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    destination_url: 'https://shopee.co.id/product/1481149271/28927384387',
    affiliate_url: 'https://s.shopee.co.id/4fxXe5YGmi',
    source_updated_at: '2026-11-05T12:46:48Z',
    published_at: '2026-11-05T13:00:00Z',
    status: 'published',
    quality_score: 96.0,
    created_at: '2026-11-05T12:46:48Z',
    updated_at: new Date().toISOString(),
    headline: 'Set spidol akrilik 80 warna pekat multi-surface untuk melukis di kanvas, kayu, kaca, batu, dan kerajinan DIY.',
    price_promo: 'Rp165.000',
    price_original: 'Rp250.000',
    discount_tag: 'Official Store',
    marketplace_name: 'Shopee Official Store',
    free_shipping_badge: 'Gratis Ongkir & Garansi Resmi',
    specs: {
      material: 'Tinta akrilik water-based non-toxic berdaya tutup tinggi (high opacity)',
      tip: 'Soft brush tip lentur dengan teknologi direct liquid auto-flow anti macet',
      colors: 'Set lengkap 80 pilihan warna gradasi dalam kemasan Black Box eksklusif',
      surfaces: 'Multi-surface: Kanvas, kayu, kaca, keramik, batu lukis, kain, plastik, dan casing HP',
      features: 'Cepat kering, tahan air (waterproof) setelah kering, dan tutup presisi sesuai warna tinta'
    },
    sales_points: [
      'Tinta akrilik pekat berdaya tutup tinggi, langsung menutup sempurna di permukaan gelap',
      'Ujung soft brush tip lembut dan responsif dengan aliran tinta otomatis yang sangat lancar',
      'Pilihan 80 warna super lengkap untuk gradasi bayangan, lettering, dan kreasi ilustrasi profesional'
    ],
    faq: [
      {
        q: 'Apakah tintanya luntur jika terkena air?',
        a: 'Setelah mengering sempurna di atas permukaan, tinta akrilik ENMY bersifat tahan air (waterproof) dan tidak mudah luntur kak.'
      },
      {
        q: 'Bisa dipakai melukis di media apa saja?',
        a: 'Sangat serbaguna kak! Bisa dipakai di kanvas lukis, kayu, kaca, keramik, batu kali, kain/sepatu kanvas, hingga model kit/3D printing.'
      }
    ],
    complementary_ids: ['prd-aimilo-pen-12', 'stand-laptop-aluminium'],
    bundle_reason: 'Padukan dengan Aimilo Gel Pen untuk kebutuhan sketsa garis halus dan stand laptop agar setup meja belajar makin rapi.'
  },
  {
    id: 'prd-aimilo-pen-12',
    source: 'shopee_affiliate_feed',
    source_product_id: '47655225219',
    name: 'Aimilo Gel Pen Isi 12 PCS Pulpen Gel Retractable 0.5mm',
    slug: 'aimilo-gel-pen-isi-12-pcs-pulpen-gel-retractable-05mm-prd-aimilo-pen-12',
    category: 'alat-kreatif',
    problem_tags: [
      'pulpen macet saat dipakai mencatat',
      'tinta pulpen bleber atau bocor di kertas',
      'tangan pegal menulis lama di sekolah atau kantor',
      'stok pulpen di meja cepat hilang atau habis'
    ],
    solution_summary: 'Pulpen gel cetek (retractable) mata 0.5mm bullet tip dengan tinta hitam pekat cepat kering dan bodi warna Morandi estetik yang dilengkapi bantalan soft grip nyaman.',
    tradeoffs: 'Hanya tersedia warna tinta hitam (bodi luar bervariasi warna pastel). Simpan dalam posisi ujung tertutup cetek saat tidak digunakan.',
    price_min: 19100,
    price_max: 32000,
    currency: 'IDR',
    rating: 4.8,
    sales_count: 10000,
    image_url: 'https://images.unsplash.com/photo-1585336261026-778841753177?auto=format&fit=crop&w=800&q=80',
    destination_url: 'https://shopee.co.id/product/1155986960/47655225219',
    affiliate_url: 'https://s.shopee.co.id/1Lh5fxkxYG',
    source_updated_at: '2026-11-05T12:46:48Z',
    published_at: '2026-11-05T13:00:00Z',
    status: 'published',
    quality_score: 95.0,
    created_at: '2026-11-05T12:46:48Z',
    updated_at: new Date().toISOString(),
    headline: 'Set 12 pcs pulpen gel cetek 0.5mm tinta hitam pekat cepat kering dengan bodi warna Morandi estetik.',
    price_promo: 'Rp19.100',
    price_original: 'Rp32.000',
    discount_tag: 'Official Shop',
    marketplace_name: 'Shopee Official Shop',
    free_shipping_badge: 'Gratis Ongkir',
    specs: {
      tip: '0.5 mm Bullet Tip presisi menghasilkan goresan rapi',
      ink: 'Tinta hitam berbasis gel water-based cepat kering anti-smudge',
      mechanism: 'Retractable (sistem cetek tekan tombol pegas awet)',
      grip: 'Soft grip ergonomis nyaman digenggam tidak licin',
      package: '1 Box kemasan isi 12 pcs (1 lusin hemat)'
    },
    sales_points: [
      'Tinta hitam pekat langsung keluar lancar tanpa putus-putus atau macet',
      'Bodi warna pastel Morandi estetik dengan pegangan soft grip anti pegal untuk menulis lama',
      'Harga sangat ekonomis isi 1 lusin (12 batang) untuk kebutuhan sekolah, kuliah, dan kantor'
    ],
    faq: [
      {
        q: 'Apakah tintanya tembus ke belakang kertas buku?',
        a: 'Formula tintanya cepat kering dan tidak mudah tembus pada kertas buku tulis standar (di atas 70 gsm) kak.'
      },
      {
        q: 'Apakah warna tintanya campur atau hitam semua?',
        a: 'Semua tintanya hitam pekat kak, yang berbeda warna warni adalah bodi luarnya yang bergaya pastel Morandi.'
      }
    ],
    complementary_ids: ['prd-enmy-acrylic-80', 'box-kabel-minimalis'],
    bundle_reason: 'Cocok dipadukan dengan set spidol ENMY atau box organizer meja untuk setup ruang belajar yang rapi.'
  },
  {
    id: 'prd-kaloka-raincoat',
    source: 'shopee_affiliate_feed',
    source_product_id: '51411253058',
    name: 'Jas Hujan Hoodie KALOKA PVC Tebal Anti Air Waterproof Unisex',
    slug: 'jas-hujan-hoodie-kaloka-pvc-tebal-anti-air-waterproof-unisex-prd-kaloka-raincoat',
    category: 'kebutuhan-harian',
    problem_tags: [
      'jas hujan plastik tipis mudah sobek',
      'air hujan rembes ke baju saat naik motor',
      'jas hujan kaku dan berat tidak nyaman dipakai',
      'celana jas hujan sering jebol di bagian selangkangan'
    ],
    solution_summary: 'Jas hujan setelan jaket hoodie dan celana berbahan PVC premium 0.25mm lentur anti rembes dengan efek daun talas yang melindungi total pengendara motor saat hujan deras.',
    tradeoffs: 'Disarankan dikeringkan dengan cara diangin-anginkan sebelum dilipat agar bahan PVC tetap awet dan tidak berjamur.',
    price_min: 62700,
    price_max: 95000,
    currency: 'IDR',
    rating: 4.8,
    sales_count: 9000,
    image_url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
    destination_url: 'https://shopee.co.id/product/example/51411253058',
    affiliate_url: 'https://s.shopee.co.id/4LKhFcVyK7',
    source_updated_at: '2026-11-05T12:48:54Z',
    published_at: '2026-11-05T13:00:00Z',
    status: 'published',
    quality_score: 95.5,
    created_at: '2026-11-05T12:48:54Z',
    updated_at: new Date().toISOString(),
    headline: 'Jas hujan setelan hoodie PVC tebal anti bocor dengan efek daun talas untuk perlindungan berkendara motor.',
    price_promo: 'Rp62.700',
    price_original: 'Rp95.000',
    discount_tag: 'Diskon 34%',
    marketplace_name: 'Shopee Star Seller',
    free_shipping_badge: 'Gratis Ongkir',
    specs: {
      material: 'PVC Premium ketebalan 0.25 mm lentur elastis tidak kaku',
      design: 'Setelan Jaket Hoodie berkaret di pergelangan tangan + Celana panjang',
      waterproof: '100% Waterproof efek daun talas tahan terpaan hujan badai',
      fit: 'Model unisex modern nyaman dipakai pria maupun wanita',
      features: 'Jahitan double press kedap air dan resleting depan tertutup lidah pelindung kancing'
    },
    sales_points: [
      'Bahan PVC tebal 0.25mm lentur, tidak mudah robek, dan air hujan langsung meluncur turun',
      'Desain hoodie modern dengan karet rapat di ujung tangan mencegah air masuk dari celah angin',
      'Potongan celana leluasa dan jahitan press rapat, aman dipakai bermanuver di atas motor'
    ],
    faq: [
      {
        q: 'Apakah tembus jika dipakai saat hujan lebat berangin?',
        a: 'Aman kak! Bahan PVC tebal 0.25mm dengan lapisan press anti rembes dirancang khusus untuk menghadapi hujan deras jalanan.'
      },
      {
        q: 'Apakah bahannya kaku dan berat?',
        a: 'Tidak kak, elastisitas PVC-nya lentur mengikuti gerak badan sehingga tidak kaku dan tidak membatasi gerak saat berkendara.'
      }
    ],
    complementary_ids: ['prd-dodostores-travel', 'troli-susun-slim'],
    bundle_reason: 'Lengkapi dengan Tas Travel Lipat Waterproof untuk perlindungan perlengkapan bepergian secara menyeluruh.'
  },
  {
    id: 'prd-hanasui-butter-balm',
    source: 'shopee_affiliate_feed',
    source_product_id: '28776875950',
    name: 'Hanasui Next Level Butter Balm Color Tinted Lip Balm 3.5g',
    slug: 'hanasui-next-level-butter-balm-color-tinted-lip-balm-prd-hanasui-butter-balm',
    category: 'kebutuhan-harian',
    problem_tags: [
      'bibir kering dan pecah-pecah',
      'lipstik bikin bibir hitam dan mengelupas',
      'butuh pelembap bibir yang ada warna alaminya',
      'warna bibir pucat saat keluar rumah santai'
    ],
    solution_summary: 'Lip balm berwarna dengan tekstur meleleh lembut di bibir yang diperkaya 11x Hyaluronic Acid dan UV Protection untuk melembapkan sekaligus memberi warna natural stain yang tahan lama.',
    tradeoffs: 'Karena tekstur butter meleleh lembut, jangan memutar isi produk terlalu panjang (maksimal 0.5 cm) saat aplikasi agar tidak patah.',
    price_min: 30200,
    price_max: 45000,
    currency: 'IDR',
    rating: 4.9,
    sales_count: 10000,
    image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
    destination_url: 'https://shopee.co.id/product/example/28776875950',
    affiliate_url: 'https://s.shopee.co.id/3LSA3mZmLx',
    source_updated_at: '2026-11-05T12:48:54Z',
    published_at: '2026-11-05T13:00:00Z',
    status: 'published',
    quality_score: 97.0,
    created_at: '2026-11-05T12:48:54Z',
    updated_at: new Date().toISOString(),
    headline: 'Tinted butter lip balm melembapkan dengan 11x Hyaluronic Acid dan UV Protection untuk bibir merona plumpy.',
    price_promo: 'Rp30.200',
    price_original: 'Rp45.000',
    discount_tag: 'Official Store',
    marketplace_name: 'Shopee Official Shop',
    free_shipping_badge: 'Gratis Ongkir & BPOM Resmi',
    specs: {
      weight: 'Netto 3.5 gram formula lightweight non-sticky',
      ingredients: '11x Hyaluronic Acid, Vitamin E, UV Filter perlindungan sinar matahari',
      finish: 'Juicy butter glow dengan natural stain yang tahan lama',
      certification: '100% Terdaftar BPOM Resmi dan Halal MUI'
    },
    sales_points: [
      'Kombinasi pelembap intensif dan warna merona alami dalam sekali oles',
      'Diperkaya 11x Hyaluronic Acid untuk memperbaiki bibir kering dan pecah-pecah',
      'Meninggalkan natural stain cantik yang tidak luntur pucat seharian'
    ],
    faq: [
      {
        q: 'Apakah warnanya keluar jelas atau cuma glossy bening?',
        a: 'Warnanya berpigmentasi tinggi kak! Sekali oles langsung memberikan rona warna nyata sekaligus efek plumpy sehat di bibir.'
      },
      {
        q: 'Apakah aman untuk bibir sensitif?',
        a: 'Sangat aman kak karena sudah terdaftar BPOM resmi, diperkaya Vitamin E dan Hyaluronic Acid tanpa rasa lengket.'
      }
    ],
    complementary_ids: ['prd-hasti-bergo', 'prd-aimilo-pen-12'],
    bundle_reason: 'Padukan dengan Bergo Instan HASTI untuk tampilan harian yang fresh, rapi, dan percaya diri.'
  },
  {
    id: 'prd-kipas-turbo-100',
    source: 'shopee_affiliate_feed',
    source_product_id: '41671303438',
    name: 'Mini Kipas Angin Turbo LED 100 Gigi USB-C Genggam & Meja',
    slug: 'mini-kipas-angin-turbo-led-100-gigi-usb-c-genggam-meja-prd-kipas-turbo-100',
    category: 'aksesori-tekno',
    problem_tags: [
      'kegerahan saat di jalan atau ruangan tanpa ac',
      'kipas angin kecil biasa hembusannya lemah',
      'baterai kipas cepat habis tanpa indikator jelas',
      'ribet bawa kipas besar saat bepergian atau kuliah'
    ],
    solution_summary: 'Kipas portabel bertenaga motor turbo dengan 100 tingkat kecepatan angin digital, layar indikator baterai LED akurat, dan port pengisian cepat USB Type-C.',
    tradeoffs: 'Pada kecepatan maksimal (tingkat 80-100), suara putaran motor turbo sedikit terdengar dan konsumsi baterai lebih cepat dibanding kecepatan rendah.',
    price_min: 26900,
    price_max: 49000,
    currency: 'IDR',
    rating: 4.8,
    sales_count: 10000,
    image_url: 'https://images.unsplash.com/photo-1618246471565-d6d7f87a32d1?auto=format&fit=crop&w=800&q=80',
    destination_url: 'https://shopee.co.id/product/example/41671303438',
    affiliate_url: 'https://s.shopee.co.id/3g50SOYVg3',
    source_updated_at: '2026-11-05T12:48:54Z',
    published_at: '2026-11-05T13:00:00Z',
    status: 'published',
    quality_score: 95.0,
    created_at: '2026-11-05T12:48:54Z',
    updated_at: new Date().toISOString(),
    headline: 'Kipas genggam mini motor turbo 100 level hembusan angin dengan display baterai LED dan USB-C.',
    price_promo: 'Rp26.900',
    price_original: 'Rp49.000',
    discount_tag: 'Diskon 45%',
    marketplace_name: 'Shopee Star Seller',
    free_shipping_badge: 'Gratis Ongkir',
    specs: {
      motor: 'High-speed turbo motor hingga 15.000 RPM hembusan kencang',
      speed: '100 Gigi pengatur kecepatan angin digital presisi',
      display: 'Digital LED Screen menampilkan persentase baterai dan level gigi aktif',
      charging: 'Port USB Type-C Fast Charging kompatibel dengan charger HP dan powerbank',
      weight: 'Bobot sangat ringan ±140 gram mudah digenggam atau ditaruh di meja'
    },
    sales_points: [
      'Hembusan angin motor turbo jauh lebih kencang dibanding kipas genggam 3 kecepatan biasa',
      'Layar LED digital memudahkan memantau sisa daya baterai secara akurat',
      'Desain multifungsi: bisa digenggam jalan-jalan atau ditaruh berdiri stabil di meja kerja'
    ],
    faq: [
      {
        q: 'Berapa lama baterai bisa bertahan?',
        a: 'Pada kecepatan sedang (level 20–50), kipas bisa bertahan 3 hingga 5 jam pemakaian kak.'
      },
      {
        q: 'Apakah bisa di-charge menggunakan charger HP biasa?',
        a: 'Bisa banget kak! Portnya sudah standar USB Type-C, jadi bisa pakai kepala charger HP, laptop, maupun powerbank.'
      }
    ],
    complementary_ids: ['gan-charger-65w', 'prd-at-002'],
    bundle_reason: 'Kombinasikan dengan Charger GaN 65W atau Stop Kontak Kubus USB agar pengisian daya baterai selalu siap sedia.'
  },
  {
    id: 'prd-dodostores-travel',
    source: 'shopee_affiliate_feed',
    source_product_id: '51451822096',
    name: 'Dodostores Tas Traveling Jumbo Lipat Koper Waterproof Luggage Sleeve',
    slug: 'dodostores-tas-traveling-jumbo-lipat-koper-waterproof-luggage-sleeve-prd-dodostores-travel',
    category: 'kebutuhan-harian',
    problem_tags: [
      'koper tidak muat menampung baju dan oleh-oleh',
      'tas travel biasa berat dan makan tempat di lemari saat disimpan',
      'repot menenteng banyak tas saat jalan di bandara atau stasiun',
      'butuh tas cadangan yang bisa dilipat kecil saat berangkat liburan'
    ],
    solution_summary: 'Tas travel duffel berkapasitas ekstra besar yang bisa dilipat tipis saat kosong dan dilengkapi selipan khusus koper (luggage sleeve) untuk memudahkan perjalanan mudik dan liburan.',
    tradeoffs: 'Dirancang untuk pakaian dan perlengkapan harian; hindari memuat benda berujung sangat tajam secara langsung agar kain nilon oxford tetap awet.',
    price_min: 13200,
    price_max: 29000,
    currency: 'IDR',
    rating: 4.8,
    sales_count: 3000,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    destination_url: 'https://shopee.co.id/product/example/51451822096',
    affiliate_url: 'https://s.shopee.co.id/4B1H3JWbf2',
    source_updated_at: '2026-11-05T12:48:54Z',
    published_at: '2026-11-05T13:00:00Z',
    status: 'published',
    quality_score: 94.0,
    created_at: '2026-11-05T12:48:54Z',
    updated_at: new Date().toISOString(),
    headline: 'Tas travel lipat jumbo anti cipratan air dengan tali selipan gagang koper untuk mudik dan traveling.',
    price_promo: 'Rp13.200',
    price_original: 'Rp29.000',
    discount_tag: 'Super Hemat',
    marketplace_name: 'Shopee Star Seller',
    free_shipping_badge: 'Gratis Ongkir',
    specs: {
      material: 'Kain Oxford Nilon tebal waterproof tahan cipratan air',
      foldable: 'Bisa dilipat menjadi ukuran kecil ±18 x 16 cm saat tidak digunakan',
      luggage_sleeve: 'Dilengkapi sabuk selipan khusus di belakang untuk dikaitkan ke gagang koper beroda',
      capacity: 'Kapasitas muat luas hingga 35-40 Liter (muat belasan stel pakaian mudik)',
      zipper: 'Resleting ganda kokoh dengan jahitan bar-tack di titik tumpuan beban'
    },
    sales_points: [
      'Bisa dilipat sangat kecil, praktis dibawa sebagai tas cadangan di dalam koper utama',
      'Ada tali selipan khusus ke gagang koper, tidak perlu ditenteng berat di tangan',
      'Kapasitas super jumbo muat banyak baju, perlengkapan mandi, dan oleh-oleh perjalanan'
    ],
    faq: [
      {
        q: 'Apakah bisa diselipkan ke gagang koper ukuran besar?',
        a: 'Bisa kak! Lubang selipan belakangnya standar dan pas untuk semua jenis gagang koper troli roda.'
      },
      {
        q: 'Apakah bahannya anti air?',
        a: 'Ya kak, material kain Oxford-nya memiliki lapisan tahan cipratan air (water-repellent) sehingga isi pakaian aman dari percikan hujan.'
      }
    ],
    complementary_ids: ['prd-kaloka-raincoat', 'troli-susun-slim'],
    bundle_reason: 'Kombinasikan dengan Jas Hujan KALOKA untuk persiapan perjalanan mudik yang aman dalam cuaca apa pun.'
  },
  {
    id: 'prd-hasti-bergo',
    source: 'shopee_affiliate_feed',
    source_product_id: '52518070983',
    name: 'HASTI Bergo Instan Lily Two Tone Bandana Kaos Rayon Airflow',
    slug: 'hasti-bergo-instan-lily-two-tone-bandana-kaos-rayon-airflow-prd-hasti-bergo',
    category: 'kebutuhan-harian',
    problem_tags: [
      'jilbab terasa gerah dan panas untuk aktivitas di rumah',
      'ribet pasang jarum pentul saat butuh keluar rumah cepat',
      'pet jilbab busa kaku bikin bentuk wajah terlihat bulat',
      'kain jilbab mudah kusut setelah dicuci'
    ],
    solution_summary: 'Hijab instan bergo bahan kaos rayon airflow adem menyerap keringat dengan model bandana non-pet yang pas di dahi dan aksen kombinasi dua warna kekinian.',
    tradeoffs: 'Disarankan dicuci dengan putaran lembut atau cuci tangan agar tekstur serat kain rayon airflow tetap terjaga kelembutannya.',
    price_min: 42200,
    price_max: 65000,
    currency: 'IDR',
    rating: 4.8,
    sales_count: 10000,
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    destination_url: 'https://shopee.co.id/product/example/52518070983',
    affiliate_url: 'https://s.shopee.co.id/5AtoF9SndC',
    source_updated_at: '2026-11-05T12:48:54Z',
    published_at: '2026-11-05T13:00:00Z',
    status: 'published',
    quality_score: 95.0,
    created_at: '2026-11-05T12:48:54Z',
    updated_at: new Date().toISOString(),
    headline: 'Bergo instan adem bahan kaos rayon airflow model bandana two-tone menutup dada untuk aktivitas harian.',
    price_promo: 'Rp42.200',
    price_original: 'Rp65.000',
    discount_tag: 'Terlaris 10RB+',
    marketplace_name: 'Shopee Star Seller',
    free_shipping_badge: 'Gratis Ongkir',
    specs: {
      material: 'Kaos Rayon Airflow Viscose Premium (super adem, jatuh, dan stretch)',
      design: 'Bergo instan non-pet model bandana dahi dengan aksen two-tone elegan',
      coverage: 'Potongan oval menutup dada rapi untuk kegiatan santai maupun kasual luar rumah',
      maintenance: 'Kain bertekstur airflow tidak gampang kusut tanpa perlu disetrika berulang kali'
    },
    sales_points: [
      'Bahan kaos rayon airflow sangat dingin di kulit dan menyerap keringat seharian',
      'Model bandana tanpa pet busa menempel pas di dahi memberi efek wajah lebih tirus',
      'Praktis sekali slup langsung rapi tanpa perlu jarum pentul'
    ],
    faq: [
      {
        q: 'Apakah kainnya gerah jika dipakai di cuaca panas?',
        a: 'Sangat adem kak! Serat kain rayon viscose terkenal memiliki sirkulasi udara terbaik dan menyerap keringat dengan sangat baik.'
      },
      {
        q: 'Apakah ukurannya menutup dada?',
        a: 'Ya kak, potongannya didesain syar’i harian menutup bagian dada secara rapi dan anggun.'
      }
    ],
    complementary_ids: ['prd-hanasui-butter-balm', 'prd-aimilo-pen-12'],
    bundle_reason: 'Pasangan serasi dengan Hanasui Butter Balm untuk tampilan natural, segar, dan percaya diri setiap hari.'
  },
  {
    id: 'prd-okira-troli-4s',
    source: 'shopee_affiliate_feed',
    source_product_id: '55667756643',
    name: 'Rak Troli Dapur & Kamar Mandi 4 Susun Serbaguna Beroda Okira',
    slug: 'rak-troli-dapur-kamar-mandi-4-susun-serbaguna-beroda-okira-prd-okira-troli-4s',
    category: 'kamar-kos',
    problem_tags: [
      'botol bumbu dapur dan sabun mandi berantakan',
      'celah sempit samping kulkas tidak termanfaatkan',
      'lantai bawah rak susah dibersihkan karena rak permanen',
      'rak penyimpanan menampung air genangan dan berdebu'
    ],
    solution_summary: 'Rak penyimpanan serbaguna 4 susun dengan 4 roda putar 360 derajat dan dasar keranjang berongga anti-genangan untuk merapikan celah sempit di dapur, kamar mandi, atau samping meja.',
    tradeoffs: 'Terbuat dari plastik PP tebal; ideal untuk barang berbobot ringan hingga menengah seperti bumbu, botol perlengkapan mandi, dan skincare (hindari beban berlebih seperti galon air).',
    price_min: 12900,
    price_max: 25000,
    currency: 'IDR',
    rating: 4.8,
    sales_count: 10000,
    image_url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    destination_url: 'https://shopee.co.id/product/example/55667756643',
    affiliate_url: 'https://s.shopee.co.id/W7ygZkZ6E',
    source_updated_at: '2026-11-05T12:48:54Z',
    published_at: '2026-11-05T13:00:00Z',
    status: 'published',
    quality_score: 95.0,
    created_at: '2026-11-05T12:48:54Z',
    updated_at: new Date().toISOString(),
    headline: 'Rak troli susun 4 tingkat beroda 360 derajat dengan keranjang berongga anti genangan air untuk celah sempit.',
    price_promo: 'Rp12.900',
    price_original: 'Rp25.000',
    discount_tag: 'Promo 10RB+',
    marketplace_name: 'Shopee Star Seller',
    free_shipping_badge: 'Gratis Ongkir',
    specs: {
      material: 'Plastik Polypropylene (PP) tebal tahan lembap dan tiang sambung kokoh',
      levels: '4 Tingkat susun vertikal hemat ruang lantai',
      wheels: '4 Roda putar fleksibel 360 derajat mudah digeser',
      drainage: 'Dasar rak berongga kisi-kisi mencegah air menggenang dan debu menumpuk',
      dimensions: 'Panjang 36 cm x Lebar 14 cm x Tinggi 85 cm (pas untuk celah sempit)'
    },
    sales_points: [
      'Desain ramping 4 susun memanfaatkan celah sempit samping kulkas atau mesin cuci',
      'Dilengkapi 4 roda 360 derajat, sangat mudah digeser saat ingin menyapu atau mengepel lantai',
      'Dasar rak berlubang sirkulasi udara lancar dan tidak menampung tetesan air kamar mandi'
    ],
    faq: [
      {
        q: 'Apakah bisa ditaruh di dalam kamar mandi yang basah?',
        a: 'Sangat cocok kak! Bahannya plastik PP anti karat dan dasarnya berongga sehingga air langsung tiris ke lantai.'
      },
      {
        q: 'Apakah perakitannya memerlukan obeng atau baut?',
        a: 'Tidak perlu alat sama sekali kak. Sistemnya knock-down tinggal colok tekan antar sambungan pipa, selesai dalam 2 menit.'
      }
    ],
    complementary_ids: ['dehumidifier-mini-kos', 'prd-rp-001'],
    bundle_reason: 'Padukan dengan Dehumidifier Mini atau Rak Kolong Wastafel untuk kerapian total area basah rumah.'
  }
];

function main() {
  console.log('=== [OPS: IMPORT AFFILIATE PRODUCTS] Memperbarui Katalog Produk Berdasarkan Kualitas ===');
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const catalogMap = new Map();

  // Load existing catalog into map
  for (const item of catalog) {
    catalogMap.set(item.id, item);
  }

  let updatedCount = 0;
  let addedCount = 0;
  let skippedCount = 0;

  for (const incoming of NEW_CURATED_PRODUCTS) {
    // Check by ID or source_product_id
    let existingKey = null;
    for (const [key, item] of catalogMap.entries()) {
      if (item.id === incoming.id || (item.source_product_id && item.source_product_id === incoming.source_product_id)) {
        existingKey = key;
        break;
      }
    }

    if (existingKey) {
      const existing = catalogMap.get(existingKey);
      // Quality comparison: Compare rating & sales
      const existingScore = (existing.rating || 0) * 10 + Math.log10(existing.sales_count || 1);
      const incomingScore = (incoming.rating || 0) * 10 + Math.log10(incoming.sales_count || 1);

      if (incomingScore >= existingScore) {
        console.log(`[UPDATE UPGRADE] Mengganti produk: ${existing.name} -> ${incoming.name} (Skor Baru: ${incomingScore.toFixed(1)} >= ${existingScore.toFixed(1)})`);
        catalogMap.set(incoming.id, incoming);
        if (existingKey !== incoming.id) {
          catalogMap.delete(existingKey);
        }
        updatedCount++;
      } else {
        console.log(`[KEEP EXISTING] Produk lama lebih bagus: ${existing.name} (Skor: ${existingScore.toFixed(1)} > ${incomingScore.toFixed(1)}), melewati produk baru.`);
        skippedCount++;
      }
    } else {
      console.log(`[ADD NEW] Menambahkan produk baru berkualitas: ${incoming.name} (${incoming.sales_count.toLocaleString('id-ID')} terjual)`);
      catalogMap.set(incoming.id, incoming);
      addedCount++;
    }
  }

  const finalCatalog = Array.from(catalogMap.values());
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(finalCatalog, null, 2) + '\n', 'utf8');

  console.log(`\nSelesai!`);
  console.log(`- Produk Baru Ditambahkan : ${addedCount}`);
  console.log(`- Produk Diperbarui      : ${updatedCount}`);
  console.log(`- Produk Dilewati (Keep) : ${skippedCount}`);
  console.log(`- Total Katalog Akhir    : ${finalCatalog.length} produk pilihan.`);
}

main();

