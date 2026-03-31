export const CHIP_CATALOG_GENERATED_AT = "2026-03-31T17:58:07.800Z";
export const CHIP_CATALOG_SOURCE = {"requestedSource":"OpenDataSheet","activeSource":"official-vendor-pages","note":"OpenDataSheet was unavailable during sync, so official product pages were used as the live source.","issues":[]};
export const CHIP_CATALOG_ENTRIES = [
  {
    "id": "lm5060",
    "vendor": "Texas Instruments",
    "partNumber": "LM5060",
    "title": "LM5060 data sheet, product information and support | TI.com",
    "summary": "TI’s LM5060 is a 5.5-V to 65-V high side protection controller. Find parameters, ordering and quality information",
    "status": "ACTIVE",
    "family": "Hot-swap controllers",
    "familyLabel": "Hot-swap controller",
    "topology": "external-mosfet-controller",
    "productUrl": "https://www.ti.com/product/LM5060",
    "datasheetUrl": "https://www.ti.com/lit/gpn/lm5060",
    "thresholds": {
      "vinMin": 5.5,
      "vinMax": 65,
      "currentLimitMax": 30
    },
    "capabilities": {
      "reverseProtection": true,
      "thermalProtection": false,
      "integratedFet": false
    },
    "featureBullets": [
      "External MOSFET hot-swap controller",
      "Programmable UVLO and OVP",
      "Fault timer and latch-off flow"
    ],
    "pins": [
      "VIN",
      "EN",
      "UVLO",
      "OVP",
      "SENSE",
      "TIMER",
      "GATE",
      "PGD"
    ]
  },
  {
    "id": "tps2490",
    "vendor": "Texas Instruments",
    "partNumber": "TPS2490",
    "title": "TPS2490 data sheet, product information and support | TI.com",
    "summary": "TI’s TPS2490 is a 9-V to 80-V hot swap controller with power limiting and latch off. Find parameters, ordering and quality information",
    "status": "ACTIVE",
    "family": "Hot-swap controllers",
    "familyLabel": "Hot-swap controller",
    "topology": "external-mosfet-controller",
    "productUrl": "https://www.ti.com/product/TPS2490",
    "datasheetUrl": "https://www.ti.com/lit/gpn/tps2490",
    "thresholds": {
      "vinMin": 9,
      "vinMax": 80,
      "currentLimitMax": 10
    },
    "capabilities": {
      "reverseProtection": false,
      "thermalProtection": false,
      "integratedFet": false
    },
    "featureBullets": [
      "External N-channel MOSFET control",
      "Programmable power limit and timer",
      "Designed for high-voltage hot-swap rails"
    ],
    "pins": [
      "VIN",
      "EN",
      "SENSE",
      "TIMER",
      "GATE",
      "OUT"
    ]
  },
  {
    "id": "tps2660",
    "vendor": "Texas Instruments",
    "partNumber": "TPS2660",
    "title": "TPS2660 data sheet, product information and support | TI.com",
    "summary": "TI’s TPS2660 is a 4.2-V to 60-V, 150mOhm, 0.1-2.23A eFuse with integrated input reverse polarity protection. Find parameters, ordering and quality information",
    "status": "ACTIVE",
    "family": "eFuses (integrated hot swaps)",
    "familyLabel": "eFuse",
    "topology": "integrated-efuse",
    "productUrl": "https://www.ti.com/product/TPS2660",
    "datasheetUrl": "https://www.ti.com/lit/gpn/tps2660",
    "thresholds": {
      "vinMin": 4.2,
      "vinMax": 60,
      "currentLimitMax": 2.23
    },
    "capabilities": {
      "reverseProtection": true,
      "thermalProtection": true,
      "integratedFet": true
    },
    "featureBullets": [
      "Integrated reverse polarity protection",
      "Adjustable current limiting",
      "Integrated FET eFuse path"
    ],
    "pins": [
      "IN",
      "EN/UVLO",
      "OVP",
      "ILIM",
      "OUT",
      "PGOOD"
    ]
  },
  {
    "id": "tps25940",
    "vendor": "Texas Instruments",
    "partNumber": "TPS25940",
    "title": "TPS25940 data sheet, product information and support | TI.com",
    "summary": "TI’s TPS25940 is a 2.7-V to 18-V, 42mΩ, 0.6-5.2A eFuse with reverse current blocking and DevSleep support. Find parameters, ordering and quality information",
    "status": "ACTIVE",
    "family": "eFuses (integrated hot swaps)",
    "familyLabel": "eFuse",
    "topology": "integrated-efuse",
    "productUrl": "https://www.ti.com/product/TPS25940",
    "datasheetUrl": "https://www.ti.com/lit/gpn/tps25940",
    "thresholds": {
      "vinMin": 2.7,
      "vinMax": 18,
      "currentLimitMax": 5
    },
    "capabilities": {
      "reverseProtection": false,
      "thermalProtection": true,
      "integratedFet": true
    },
    "featureBullets": [
      "Integrated low-RDS(on) FET",
      "Fast short-circuit response",
      "Programmable current limit"
    ],
    "pins": [
      "IN",
      "EN/UVLO",
      "ILIM",
      "PG",
      "OUT"
    ]
  },
  {
    "id": "tps1663",
    "vendor": "Texas Instruments",
    "partNumber": "TPS1663",
    "title": "TPS1663 data sheet, product information and support | TI.com",
    "summary": "TI’s TPS1663 is a 4.5-V to 60-V, 31mΩ, 0.6-6A eFuse with output power limiting. Find parameters, ordering and quality information",
    "status": "ACTIVE",
    "family": "eFuses (integrated hot swaps)",
    "familyLabel": "eFuse",
    "topology": "integrated-efuse",
    "productUrl": "https://www.ti.com/product/TPS1663",
    "datasheetUrl": "https://www.ti.com/lit/gpn/tps1663",
    "thresholds": {
      "vinMin": 4.5,
      "vinMax": 60,
      "currentLimitMax": 6
    },
    "capabilities": {
      "reverseProtection": false,
      "thermalProtection": true,
      "integratedFet": true
    },
    "featureBullets": [
      "Power limiting and inrush control",
      "Integrated FET eFuse path",
      "Designed for industrial rails"
    ],
    "pins": [
      "IN",
      "EN/UVLO",
      "OVP",
      "ILIM",
      "OUT",
      "PGTH"
    ]
  },
  {
    "id": "tps1685",
    "vendor": "Texas Instruments",
    "partNumber": "TPS1685",
    "title": "TPS1685 data sheet, product information and support | TI.com",
    "summary": "TI’s TPS1685 is a 9V to 80V, 3.5mΩ, 20A stackable integrated hot swap (eFuse) with accurate and fast current monitor. Find parameters, ordering and quality information",
    "status": "ACTIVE",
    "family": "eFuses (integrated hot swaps)",
    "familyLabel": "eFuse",
    "topology": "integrated-efuse",
    "productUrl": "https://www.ti.com/product/TPS1685",
    "datasheetUrl": "https://www.ti.com/lit/gpn/tps1685",
    "thresholds": {
      "vinMin": 9,
      "vinMax": 80,
      "currentLimitMax": 20
    },
    "capabilities": {
      "reverseProtection": true,
      "thermalProtection": true,
      "integratedFet": true
    },
    "featureBullets": [
      "High-current industrial eFuse",
      "Fast current monitor and fault response",
      "Reverse current blocking"
    ],
    "pins": [
      "IN",
      "EN",
      "IMON",
      "ILIM",
      "OUT",
      "FAULT"
    ]
  },
  {
    "id": "lm66100",
    "vendor": "Texas Instruments",
    "partNumber": "LM66100",
    "title": "LM66100 data sheet, product information and support | TI.com",
    "summary": "TI’s LM66100 is a 1.5-V to 5.5-V, 1.5-A, 0.5-µA IQ ideal diode with integrated FET. Find parameters, ordering and quality information",
    "status": "ACTIVE",
    "family": "Ideal diode & ORing controllers",
    "familyLabel": "Ideal diode",
    "topology": "ideal-diode",
    "productUrl": "https://www.ti.com/product/LM66100",
    "datasheetUrl": "https://www.ti.com/lit/gpn/lm66100",
    "thresholds": {
      "vinMin": 1.5,
      "vinMax": 5.5,
      "currentLimitMax": 1.5
    },
    "capabilities": {
      "reverseProtection": true,
      "thermalProtection": false,
      "integratedFet": true
    },
    "featureBullets": [
      "Integrated ideal diode FET path",
      "Reverse current blocking",
      "Low quiescent current"
    ],
    "pins": [
      "IN",
      "OUT",
      "GND"
    ]
  }
];
