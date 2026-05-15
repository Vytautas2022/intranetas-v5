export interface InventoryItem {
  id: string;
  name: string;
  image: string;
  targetQty: number;
  supplierUrl: string;
  altSupplierUrl: string;
}

export interface InventoryCategory {
  category: string;
  items: InventoryItem[];
}

export const inventoryTemplates: InventoryCategory[] = [
  {
    category: "Smulkus inventorius",
    items: [
      {
        id: "pusinis_kamuolys",
        name: "Pusinis kamuolys",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/treniruokliai/balansinis-treniruoklis-bosu-prove.html"
      },
      {
        id: "jogos_kaladeles",
        name: "Jogos kaladėlės",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu//jogos-kaladele-prove.html"
      },
      {
        id: "sokdyne_stora_virve",
        name: "Šokdynė stora virve",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/sokdyne-prove-pro-weighted-steel.html"
      },
      {
        id: "sokdyne_plona_virve",
        name: "Šokdynė plona virve",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/sokdyne-su-guoliais.html"
      },
      {
        id: "sliding_padai",
        name: "Sliding padai",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/slydimo-diskai.html"
      },
      {
        id: "neutralaus_suemimo_traukos_rankenos",
        name: "Neutralaus suėmimo traukos rankenos",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "gimnastikos_ziedai",
        name: "Gimnastikos žiedai",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/crossfit-prekes/smulkus-inventorius/gimnastikos-ziedai-mediniai-prove-28mm.html"
      },
      {
        id: "trx_tipo_dirzai",
        name: "TRX tipo diržai",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/catalog/product/view/id/7604/s/multifunkciniai-dirzai-prove/"
      },
      {
        id: "neoprenine_traukos_rankena_2_vnt",
        name: "Neopreninė traukos rankena (2 vnt)",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://atletas.lt/lt/traukos-rankenos/rankenos-traukimo-pratimams-gymstick"
      },
      {
        id: "trx_tipo_zalia_rankena_2_vnt",
        name: "Trx tipo žalia rankena (2 vnt)",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "tricepso_virve_90_cm",
        name: "Tricepso virvė 90 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/catalog/product/view/id/1387/s/traukos-rankena-tricepsui/category/3/"
      },
      {
        id: "tricepso_virve_120_cm",
        name: "Tricepso virvė 120 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "tricepso_virve_150_cm",
        name: "Tricepso virvė 150 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "tricepso_virve_trumpa",
        name: "Tricepso virvė trumpa",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "traukos_rankena_metaline_1_vnt",
        name: "Traukos rankena metalinė 1 vnt",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/catalog/product/view/id/1393/s/traukos-rankena-nt-0450/category/3/"
      },
      {
        id: "stangos_paminkstinimas",
        name: "Štangos paminkštinimas",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "paminkstinimas_abdominal_mat",
        name: "Paminkštinimas Abdominal mat",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://mega-sport.eu/evolve-aksesuarai/2570-evolve-EV-AC-AP-010-4779055796928.html"
      },
      {
        id: "paminkstinimas_vnt",
        name: "Paminkštinimas vnt",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "medziagines_gumos_komplektas_3_vnt",
        name: "Medžiaginės gumos komplektas (3 vnt)",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "trumpu_30_cm_elastiniu_gumu_komplektas_5vnt",
        name: "Trumpų (30 cm) elastinių gumų komplektas (5vnt)",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "ilga_elastine_guma_raudona",
        name: "Ilga elastinė guma raudona",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/crossfit-prekes/bumper-plate-svoriai/power-band-jegos-guma-prove-13mm.html"
      },
      {
        id: "ilga_elastine_guma_juoda",
        name: "Ilga elastinė guma juoda",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/crossfit-prekes/bumper-plate-svoriai/power-band-jegos-guma-prove-21mm.html"
      },
      {
        id: "ilga_elastine_guma_purpurine",
        name: "Ilga elastinė guma purpurinė",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/crossfit-prekes/bumper-plate-svoriai/power-band-jegos-guma-prove-32mm.html"
      },
      {
        id: "adidas_level_1_guma_su_rankena",
        name: "Adidas LEVEL 1 guma su rankena",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://powersport.lt/lt/pasipriesinimo-gumos/espanderis-adidas-l1/450219"
      },
      {
        id: "adidas_level_2_guma_su_rankena",
        name: "Adidas LEVEL 2 guma su rankena",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "adidas_level_3_guma_su_rankena",
        name: "Adidas LEVEL 3 guma su rankena",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "odiniai_ciurnu_dirzai_su_sagtimi_2_vnt",
        name: "Odiniai čiurnų diržai su sagtimi (2 vnt)",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "odinis_jegos_dirzas_m_dydis",
        name: "Odinis jėgos diržas M dydis",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "odinis_jegos_dirzas_l_dydis",
        name: "Odinis jėgos diržas L dydis",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "odinis_jegos_dirzas_xl_dydis",
        name: "Odinis jėgos diržas XL dydis",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "dirzas_su_grandine",
        name: "Diržas su grandine",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "pilates_mazasis_kamuolys_17_25_cm",
        name: "Pilates mažasis kamuolys (17-25 cm)",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt//pilates-kamuolys-prove.html"
      },
      {
        id: "didysis_kamuolys_75_cm",
        name: "Didysis kamuolys 75 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt//gimnastikos-kamuolys-prove-anti-burst-75cm.html"
      },
      {
        id: "didysis_kamuolys_65_cm",
        name: "Didysis kamuolys 65 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt/sporto-prekes/aerobika/gimnastikos-kamuolys-ufc-65cm.html"
      },
      {
        id: "didysis_kamuolys_55_cm",
        name: "Didysis kamuolys 55 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt//gimnastikos-kamuolys-prove-anti-burst-55cm.html"
      },
      {
        id: "dvigubas_masazinis_kamuoliukas_prove_epp_24x12cm",
        name: "DVIGUBAS MASAŽINIS KAMUOLIUKAS PROVE EPP 24X12CM",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt//dvigubas-masazinis-kamuoliukas-prove-24x12cm.html"
      },
      {
        id: "dvigubas_masazinis_kamuoliukas_prove_epp_16x8cm",
        name: "DVIGUBAS MASAŽINIS KAMUOLIUKAS PROVE EPP 16X8CM",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt//dvigubas-masazinis-kamuoliukas-prove.html"
      },
      {
        id: "masazinis_kamuoliukas_didelis_12_cm_aukscio",
        name: "Masažinis kamuoliukas didelis ~ 12 cm aukščio",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt/sporto-prekes/joga-pilates/masaziniai-kamuoliukai/kamuoliukas-taskiniam-masazui-epp-prove-12-cm.html"
      },
      {
        id: "masazinis_kamuoliukas_mazas_8_cm_aukscio",
        name: "Masažinis kamuoliukas mažas ~ 8 cm aukščio",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/catalog/product/view/id/17607/s/kamuoliukas-taskiniam-masazui-epp-prove-8-cm/"
      },
      {
        id: "kilimeliai_fitline_140_slate_thickness_10_mm_dimensions_600_x_1400_mm_juodi",
        name: "Kilimėliai Fitline 140 Slate thickness 10 mm, dimensions 600 x 1400 mm Juodi",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://fitstore.lt/airex-kilimeliai/mankstos-kilimelis-airex-fitline-140"
      },
      {
        id: "masazinis_volas_kietas_45_cm",
        name: "Masažinis volas Kietas 45 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt//treniruociu-volas-prove-45x15cm.html"
      },
      {
        id: "masazinsi_volas_kietas_90_cm",
        name: "Masažinsi volas kietas 90 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt//treniruociu-volas-prove-90x15cm.html"
      },
      {
        id: "masazinis_volas_minkstas_45_cm",
        name: "Masažinis volas minkštas 45 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt//masazinis-volas-prove-eva-black-45cm.html"
      },
      {
        id: "masazinis_volas_minkstas_90_cm",
        name: "Masažinis volas minkštas 90 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt//masazinis-volas-prove-eva-black-90cm.html"
      },
      {
        id: "ratukas_pilvo_presui",
        name: "Ratukas pilvo presui",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://b2b.multisportas.lt/ltu/catalog/product/view/id/17249/s/preso-ratukas-ufc/category/3/"
      },
      {
        id: "ciurnu_svoris_1_kg_komplektas_2_vnt",
        name: "Čiurnų svoris 1 kg komplektas (2 vnt)",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "ciurnu_svoris_2_kg_komplektas_2_vnt",
        name: "Čiurnų svoris 2 kg komplektas (2 vnt)",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: ""
      },
      {
        id: "bokso_pirstines_14_arna_16_oz",
        name: "Bokso pirštinės 14 arna 16 OZ",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://atletas.lt/lt/bokso-pirstines/bokso-pirstines-benlee-pressure"
      },
      {
        id: "medine_mankstos_lazda_150_cm",
        name: "Medinė mankštos lazda 150 cm",
        image: "",
        targetQty: 0,
        supplierUrl: "",
        altSupplierUrl: "https://multisportas.lt/lt/medine-mankstos-lazda-prove-150cm.html"
      }
    ]
  },
  {
    category: "Vending prekės",
    items: [
      {
        id: "vend_1",
        name: "Proteino batonėlis (Šokoladinis)",
        image: "https://images.unsplash.com/photo-1622330229892-021927793a38?auto=format&fit=crop&q=80&w=200",
        targetQty: 0,
        supplierUrl: "https://gymbeam.lt",
        altSupplierUrl: "https://myprotein.lt"
      }
    ]
  },
  {
    category: "Vaistinėlė",
    items: [
      {
        id: "med_1",
        name: "Pleistrai (rinkinys)",
        image: "https://images.unsplash.com/photo-1585435421671-0c16764628ce?auto=format&fit=crop&q=80&w=200",
        targetQty: 0,
        supplierUrl: "https://gintarine.lt",
        altSupplierUrl: "https://benuskvaistine.lt"
      }
    ]
  }
];
