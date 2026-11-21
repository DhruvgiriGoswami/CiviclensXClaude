// Financial Control Points, Price Anomaly Data, and Risk Engine Signals

export const CONTROL_POINTS_DEMO = [
  {
    id: "cp_1",
    title: "Artificial Underbidding",
    subtitle: "Low Bid Scrutiny Trigger",
    severity: "HIGH_ATTENTION",
    code: "CTRL-BID-01",
    metrics: {
      estimatedCost: "₹10.00 Cr",
      bids: [
        { code: "P1", bidder: "Apex Infra", amount: "₹6.20 Cr", tag: "Selected (-38%)" },
        { code: "P2", bidder: "Metropolis", amount: "₹9.10 Cr", tag: "Competing (-9%)" },
        { code: "P3", bidder: "Western Rd", amount: "₹9.40 Cr", tag: "Competing (-6%)" }
      ]
    },
    signalText: "P1 is substantially below the estimate (-38%) and competing bids (-32% vs P2). Potential risk of low-balling followed by aggressive variation requests.",
    actionText: "Recommended Action: Review bid assumptions, quantities, market inputs, rate breakdown and historical comparable projects before contract execution.",
    disclaimer: "Signal represents an automated statistical outlier alert. Does not constitute proof of irregularity."
  },
  {
    id: "cp_2",
    title: "Measurement Verification",
    subtitle: "Physical Audit Discrepancy",
    severity: "MEDIUM_ATTENTION",
    code: "CTRL-MEAS-02",
    metrics: {
      workItem: "50mm Bituminous Concrete Wearing Course",
      contractSpecification: "50 mm",
      recordedMunicipalMB: "75 mm (+50% claim)",
      independentAuditMeasurement: "52 mm (+4% variance)"
    },
    signalText: "Verification Discrepancy: Recorded MB reading (75mm) exceeds both contract specification (50mm) and independent 3rd-party core-drill sample (52mm).",
    actionText: "Recommended Action: Hold milestone bill payment #3 approval until joint re-measurement and core density analysis is re-verified by nodal lab.",
    disclaimer: "Discrepancy may stem from field measurement error or localized layer thickness variation."
  },
  {
    id: "cp_3",
    title: "Material Price Anomaly",
    subtitle: "Benchmark Deviation",
    severity: "HIGH_ATTENTION",
    code: "CTRL-MAT-03",
    metrics: {
      material: "Bitumen VG-30 Grade",
      comparableMarketRange: "₹52 – ₹56 / kg",
      projectPurchasePrice: "₹91 / kg (+65% spike)",
      quantityProcured: "31,800 kg"
    },
    signalText: "Unusual price relative to comparable observations (+65% above regional market benchmark).",
    actionText: "Recommended Action: Request manufacturer original tax invoice (IOCL / HPCL gate pass) and batch transport receipt.",
    disclaimer: "Price variance may reflect special additives, rapid-setting polymer modifications, or urgency transport surcharges."
  },
  {
    id: "cp_4",
    title: "Contract Variation Tracking",
    subtitle: "Post-Award Budget Creep",
    severity: "MEDIUM_ATTENTION",
    code: "CTRL-VAR-04",
    metrics: {
      originalAwardValue: "₹6.20 Cr",
      variation01: "+₹1.10 Cr (Soil stabilization)",
      variation02: "+₹0.80 Cr (Duct extension)",
      currentApprovedValue: "₹8.10 Cr (+30.6% increase)"
    },
    signalText: "Contract variations have increased total project cost from ₹6.20 Cr to ₹8.10 Cr (+30.6% over initial bid).",
    actionText: "Recommended Action: Audit technical site necessity for variations to verify if soil conditions were predictable during DPR stage.",
    disclaimer: "Variations are legally sanctioned under Standing Committee Resolution #402."
  },
  {
    id: "cp_5",
    title: "Vendor History Profile",
    subtitle: "Historical Performance Metrics",
    severity: "INFORMATIONAL",
    code: "CTRL-VND-05",
    metrics: {
      vendorName: "Apex Infrastructure Projects Ltd",
      contractsEvaluated: 37,
      avgBidDiscount: "24.2%",
      avgVariationCreep: "+18.4%",
      delayedProjects: "8 / 37",
      qualityFlags: "4 / 37"
    },
    signalText: "Vendor exhibits pattern of winning tenders with steep initial discounts (-24.2% avg) followed by routine post-award contract variations (+18.4% avg).",
    actionText: "Recommended Action: Flag vendor profile for automated variation threshold capping in future municipal procurements.",
    disclaimer: "Demonstration performance dataset compiled from public municipal contract records."
  }
];

export const BITUMEN_PRICE_BENCHMARKS = {
  materialName: "Bitumen VG-30 Grade (Bulk Asphalt)",
  unit: "₹ / kg",
  regionalBenchmarkMin: 52,
  regionalBenchmarkMax: 56,
  anomalyPrice: 91,
  percentageDeviation: "+65.4%",
  observations: [
    { id: 1, label: "SMC Ward 112 Project", price: 52, date: "10 Feb 2026", status: "NORMAL" },
    { id: 2, label: "NMMC Vashi Sector 17", price: 54, date: "15 Feb 2026", status: "NORMAL" },
    { id: 3, label: "PMC Swargate Corridor", price: 53, date: "02 Mar 2026", status: "NORMAL" },
    { id: 4, label: "SMC Colaba Work", price: 55, date: "10 Mar 2026", status: "NORMAL" },
    { id: 5, label: "SMC-2 Kalyan Highway", price: 54, date: "22 Mar 2026", status: "NORMAL" },
    { id: 6, label: "PRJ-2026-0042 (Current)", price: 91, date: "14 Apr 2026", status: "ANOMALY", highlighted: true },
    { id: 7, label: "PCMC Pimpri Grid", price: 53, date: "01 May 2026", status: "NORMAL" },
    { id: 8, label: "SMC Surat Outer Ring", price: 55, date: "18 May 2026", status: "NORMAL" }
  ],
  analysisFactors: [
    "Material Grade & Additive Specifications (VG-30 vs Polymer Modified Bitumen)",
    "Procurement Date & Global Crude Oil Index Correlation",
    "Geographic Distance from Refinery & Freight Surcharges",
    "Procurement Quantity Capping & Bulk Discount Thresholds",
    "Taxes, Excise Duty, and GST Invoice Validation",
    "Contractual Escalation Clauses & Special Urgency Delivery Fees"
  ],
  methodologyNote: "Statistical / clustering-based anomaly analysis (e.g. K-Means outlier detection, Z-score > 2.5 deviation against 90-day regional rolling baseline)."
};

export const RISK_ENGINE_PIPELINE = [
  { step: "1", stage: "DATA INGESTION", desc: "Contract IDs, Bids, Invoices, CBDC Tx References, MB Readings" },
  { step: "2", stage: "RULES & STATISTICAL ANALYSIS", desc: "Outlier detection, price indexing, bid ratio benchmarking, MB variance check" },
  { step: "3", stage: "ANOMALY SIGNAL GENERATION", desc: "Flagged deviation with neutral, factual context score" },
  { step: "4", stage: "EVIDENCE LINKAGE", desc: "Cryptographic hash check, MB core sample photo, invoice cross-check" },
  { step: "5", stage: "HUMAN REVIEW & AUDIT", desc: "NITI Aayog / CAG / Municipal Chief Auditor sign-off" }
];

export const RISK_SIGNAL_TYPES = [
  { type: "Bid Anomaly", label: "Unusually Low Bid (P1 < -35%)", level: "HIGH" },
  { type: "Material Price Anomaly", label: "Price Spike vs Regional Index (> +40%)", level: "HIGH" },
  { type: "Quantity Anomaly", label: "Procurement Quantity > Tender Estimate", level: "MEDIUM" },
  { type: "Contract Variation Creep", label: "Cumulative Variations > 25% Award Value", level: "HIGH" },
  { type: "Vendor Concentration", label: "Single Vendor > 40% Ward CapEx", level: "MEDIUM" },
  { type: "Payment Timing Anomaly", label: "Disbursement within < 24h of MB entry", level: "LOW" },
  { type: "Duplicate Invoice Detection", label: "Matching GSTIN / Amount / Date Hash", level: "CRITICAL" },
  { type: "Measurement Discrepancy", label: "MB claim vs core-drill audit thickness mismatch", level: "HIGH" },
  { type: "Quality Verification Discrepancy", label: "Lab test failure on bitumen compaction", level: "MEDIUM" }
];
