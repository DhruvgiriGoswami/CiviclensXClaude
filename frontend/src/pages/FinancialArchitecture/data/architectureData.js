// Unified Demo Data & Financial Architecture Definitions
// Generous 480px horizontal spacing (256px card + 224px clear gap for badges & arrows)

export const DEMO_SUMMARY = {
  fundId: "FND-2026-0017",
  projectId: "PRJ-2026-0042",
  projectName: "Ward 150 Arterial Road Rehabilitation & Smart Utility Ducting",
  location: "Ward 150 — Majiwada & Service Corridor, Sample City",
  fundAllocated: "₹10.00 Cr",
  tenderId: "TND-2026-0142",
  tenderEstimate: "₹10.00 Cr",
  contractId: "CNT-2026-0088",
  awardedAmount: "₹6.20 Cr",
  currentApprovedAmount: "₹8.10 Cr",
  totalPaidAmount: "₹7.60 Cr",
  remainingBalance: "₹0.50 Cr",
  winnerVendor: "Apex Infrastructure Projects Ltd (VND-001)",
  cbdcSettlementRail: "Wholesale CBDC / Authorised Sovereign Digital Rail",
};

export const FLOW_MODES = {
  MONEY: "MONEY FLOW",
  CONTROL: "CONTROL FLOW",
  DATA: "DATA FLOW",
};

// Architecture canvas nodes with generous 480px step spacing (224px clear gap between cards)
export const ARCHITECTURE_NODES = [
  {
    id: "gov_treasury",
    group: "GOVERNMENT",
    groupLabel: "1. GOVERNMENT",
    title: "Government / Sample Finance Department",
    subtitle: "Public Treasury Allocation",
    code: "GOV-TRSY-01",
    amount: "₹10.00 Cr",
    type: "treasury",
    x: 40,
    y: 40,
    status: "APPROVED",
    description: "Central & State Capital Expenditure Allocation for Municipal Infrastructure",
    details: {
      fundId: "FND-2026-0017",
      authority: "Department of Expenditure / Sample Finance Department",
      sanctionOrder: "SO/2026/URBAN-INFRA/9042",
      sanctionDate: "12-Jan-2026",
      sourceOfFunds: "Consolidated Fund of India — Urban Infra Grant",
      permittedUse: ["Capital Expenditure", "Civil Works", "Quality Inspection"],
      cbdcAccount: "gov_treasury_wh_cbdc_SAMPLE-HASH-71a"
    }
  },
  {
    id: "cbdc_rail",
    group: "SETTLEMENT",
    groupLabel: "2. SETTLEMENT LAYER",
    title: "Wholesale CBDC Settlement Rail",
    subtitle: "Authorised Sovereign Digital Payment Layer",
    code: "CBDC-WHS-RAIL",
    amount: "₹10.00 Cr",
    type: "settlement",
    x: 480,
    y: 40,
    status: "ACTIVE",
    description: "Programmable digital token ledger for instant, traceable sovereign fund settlement",
    details: {
      railType: "Wholesale CBDC / Authorised Sovereign Digital Rail",
      tokenType: "Programmable Sovereign Token (INR-w)",
      smartContractRules: ["Project-bound", "Milestone-conditioned", "Dual-key approval"],
      settlementSpeed: "Real-time Gross Settlement (RTGS Equivalency)",
      auditorView: "Read-only Immutable Cryptographic Audit Access",
      transactionReference: "CBDC-WHS-2026-BLK-984210"
    }
  },
  {
    id: "muni_corp",
    group: "MUNICIPAL",
    groupLabel: "3. MUNICIPAL AUTHORITY",
    title: "Sample Municipal Corporation",
    subtitle: "Municipal Treasury & Administration",
    code: "SMC-TREASURY",
    amount: "₹10.00 Cr",
    type: "municipal",
    x: 920,
    y: 40,
    status: "RECEIVED",
    description: "Executive Municipal Authority responsible for ward-level infrastructure execution",
    details: {
      corporationId: "IN-MH-SMC",
      commissionerSignoff: "IAS Municipal Commissioner",
      treasuryAccount: "SMC-CBDC-DEPT-INFRA-04",
      allocatedProject: "PRJ-2026-0042",
      sanctionedByCouncil: "Resolution No. SMC/TC/2026/884",
      linkedDept: "Public Works Department (PWD)"
    }
  },
  {
    id: "controlled_fund",
    group: "FUND CONTROL",
    groupLabel: "4. FUND PROGRAMMABILITY",
    title: "Controlled Project Fund",
    subtitle: "Escrow & Rules Engine",
    code: "FND-2026-0017",
    amount: "₹10.00 Cr",
    type: "control",
    x: 920,
    y: 270,
    status: "LOCKED",
    description: "Smart digital escrow enforcing non-divertible spending for road rehab work only",
    details: {
      fundId: "FND-2026-0017",
      projectId: "PRJ-2026-0042",
      rules: [
        "Project-bound: Money cannot leave PRJ-2026-0042 pool",
        "Milestone-controlled: Release only upon verified MB entry",
        "Time-bound: Expires if unutilized past FY2026-27"
      ],
      permittedCategories: ["Materials", "Labour", "Equipment", "Testing"],
      unpermittedCategories: ["Administrative Overhead", "Sub-leasing", "Unapproved Variations"]
    }
  },
  {
    id: "tender_bids",
    group: "PROCUREMENT",
    groupLabel: "5. PROCUREMENT & BIDS",
    title: "Tender & Bid Evaluation",
    subtitle: "E-Procurement Engine",
    code: "TND-2026-0142",
    amount: "Est. ₹10.00 Cr",
    type: "procurement",
    x: 480,
    y: 270,
    status: "EVALUATED",
    description: "Competitive public tender with transparent P1/P2/P3 financial bid comparison",
    details: {
      tenderId: "TND-2026-0142",
      estimatedValue: "₹10.00 Cr",
      bidsReceived: [
        { bidder: "Apex Infrastructure Pvt Ltd (P1)", amount: "₹6.20 Cr", discount: "-38.0%" },
        { bidder: "Metropolis Construction Ltd (P2)", amount: "₹9.10 Cr", discount: "-9.0%" },
        { bidder: "Western Roadways Infra Ltd (P3)", amount: "₹9.40 Cr", discount: "-6.0%" }
      ],
      anomalySignal: "P1 is substantially below estimate (-38%) and competing bids. Triggers underbidding scrutiny rule."
    }
  },
  {
    id: "contract_work",
    group: "EXECUTION",
    groupLabel: "6. CONTRACT & EXECUTION",
    title: "Contract & Work Order",
    subtitle: "Contractor Agreement",
    code: "CNT-2026-0088",
    amount: "₹6.20 Cr → ₹8.10 Cr",
    type: "execution",
    x: 40,
    y: 270,
    status: "IN_PROGRESS",
    description: "Contract awarded to Apex Infra (₹6.20 Cr), later updated via approved variations (+₹1.90 Cr)",
    details: {
      contractId: "CNT-2026-0088",
      workOrderId: "WO-2026-0042",
      vendor: "Apex Infrastructure Projects Ltd (VND-001)",
      originalAward: "₹6.20 Cr",
      variation01: "+₹1.10 Cr (Sub-surface soil stabilization)",
      variation02: "+₹0.80 Cr (Smart utility duct extension)",
      currentApprovedValue: "₹8.10 Cr"
    }
  },
  {
    id: "verification_mb",
    group: "VERIFICATION",
    groupLabel: "7. VERIFICATION & MEASUREMENT",
    title: "Measurement Book (MB) & Quality",
    subtitle: "Independent Verification",
    code: "MB-2026-0199",
    amount: "75mm vs 52mm",
    type: "verification",
    x: 40,
    y: 500,
    status: "DISCREPANCY",
    description: "Field measurement verification comparing municipal engineer readings with 3rd-party audits",
    details: {
      measurementBookNo: "MB-88-PAGE-142",
      workItem: "Bituminous Concrete Surface Layer (BC)",
      contractSpec: "50 mm thickness",
      recordedMunicipalMB: "75 mm thickness",
      independentAuditMeasurement: "52 mm thickness",
      signal: "Verification Discrepancy — municipal MB over-reported thickness by +23mm compared to core-drill testing."
    }
  },
  {
    id: "billing_payment",
    group: "FINANCIAL",
    groupLabel: "8. BILLING & PAYMENT APPROVAL",
    title: "Bill Clearance & Payment Approval",
    subtitle: "Automated Sign-off",
    code: "BILL-2026-0442",
    amount: "₹7.60 Cr Cleared",
    type: "financial",
    x: 480,
    y: 500,
    status: "PARTIAL_PAID",
    description: "Milestone bill submission, tax deductions (TDS/GST), and digital payment execution",
    details: {
      billId: "BILL-2026-0442",
      invoiceNo: "APEX/SMC/2026/INV-09",
      grossClaimed: "₹7.80 Cr",
      deductionsTDSGST: "₹0.20 Cr",
      approvedNetPayment: "₹7.60 Cr",
      approvingAuthority: "Executive Engineer (Civil) & Chief Finance Officer"
    }
  },
  {
    id: "recipients",
    group: "RECIPIENTS",
    groupLabel: "9. RECIPIENTS & SUPPLIERS",
    title: "Final Recipient Settlement",
    subtitle: "Vendors, Suppliers & Workers",
    code: "RCP-SETTLE-001",
    amount: "₹7.60 Cr Disbursed",
    type: "recipients",
    x: 920,
    y: 500,
    status: "SETTLED",
    description: "Direct CBDC credit into primary contractor, raw material suppliers, and worker wage accounts",
    details: {
      primaryVendor: "Apex Infrastructure Projects Ltd — ₹4.10 Cr",
      materialSuppliers: "Ultratech Cement / JSW Steel / IOCL Bitumen — ₹1.90 Cr",
      labourDirectCBDC: "142 Workers Direct Wage Credit — ₹0.90 Cr",
      equipmentLease: "CAT Heavy Machinery — ₹0.40 Cr",
      qualityLabs: "VJTI Testing Lab — ₹0.20 Cr",
      other: "Site Safety & Survey — ₹0.10 Cr"
    }
  }
];

// Connections between nodes with flow direction flags
export const ARCHITECTURE_CONNECTIONS = [
  {
    id: "c1",
    from: "gov_treasury",
    to: "cbdc_rail",
    direction: "right",
    label: "Fund Release",
    moneyLabel: "₹10.00 Cr Release",
    controlLabel: "Sanction Order",
    dataLabel: "FND-2026-0017 → CBDC-BLK"
  },
  {
    id: "c2",
    from: "cbdc_rail",
    to: "muni_corp",
    direction: "right",
    label: "Allocation",
    moneyLabel: "Wholesale CBDC Credit",
    controlLabel: "Delegation Rule",
    dataLabel: "CBDC-WHS → SMC-TRSY"
  },
  {
    id: "c3",
    from: "muni_corp",
    to: "controlled_fund",
    direction: "down",
    label: "Project Allocation",
    moneyLabel: "₹10.00 Cr Escrow Lock",
    controlLabel: "Purpose Binding",
    dataLabel: "SMC-TRSY → PRJ-2026"
  },
  {
    id: "c4",
    from: "controlled_fund",
    to: "tender_bids",
    direction: "left",
    label: "Procurement Notice",
    moneyLabel: "Tender Reserve ₹10 Cr",
    controlLabel: "Eligibility Capping",
    dataLabel: "FND-0017 → TND-0142"
  },
  {
    id: "c5",
    from: "tender_bids",
    to: "contract_work",
    direction: "left",
    label: "Contract Award",
    moneyLabel: "P1 Bid Approval (₹6.20 Cr)",
    controlLabel: "Contract Execution",
    dataLabel: "TND-0142 → CNT-0088"
  },
  {
    id: "c6",
    from: "contract_work",
    to: "verification_mb",
    direction: "down",
    label: "Execution & Inspection",
    moneyLabel: "Milestone Claim",
    controlLabel: "50mm Spec Check",
    dataLabel: "CNT-0088 → MB-0199"
  },
  {
    id: "c7",
    from: "verification_mb",
    to: "billing_payment",
    direction: "right",
    label: "MB Audit Approval",
    moneyLabel: "₹7.60 Cr Cleared",
    controlLabel: "Discrepancy Audit",
    dataLabel: "MB-0199 → BILL-0442"
  },
  {
    id: "c8",
    from: "billing_payment",
    to: "recipients",
    direction: "right",
    label: "CBDC Settlement",
    moneyLabel: "₹7.60 Cr Disbursed",
    controlLabel: "Direct Wage Release",
    dataLabel: "BILL-0442 → RCP-001"
  }
];
