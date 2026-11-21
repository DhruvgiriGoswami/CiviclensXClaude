// Project Demo Data & Financial Lineage Definition

export const PROJECT_DEMO = {
  fund: {
    id: "FND-2026-0017",
    name: "Urban Infrastructure Grant — FY26 Phase II",
    sanctioningBody: "Sample Urban Affairs Department / Sample State Government",
    sanctionDate: "12 January 2026",
    totalGrant: "₹10.00 Cr",
    headOfAccount: "4217-Capital Outlay on Urban Development",
    treasuryHash: "SAMPLE-HASH-98f4a102c842b109e4401a9"
  },
  project: {
    id: "PRJ-2026-0042",
    title: "Ward 150 Arterial Road Rehabilitation & Smart Utility Ducting",
    location: "Ward 150 (Majiwada & Service Road Corridor, Sample City)",
    implementingAgency: "Sample Municipal Corporation (SMC) — Public Works Dept",
    estimatedCost: "₹10.00 Cr",
    contractAwardedCost: "₹6.20 Cr",
    currentApprovedCost: "₹8.10 Cr",
    totalDisbursed: "₹7.60 Cr",
    status: "UNDER_EXECUTION",
    commencementDate: "01 March 2026",
    completionTarget: "30 November 2026"
  },
  tender: {
    id: "TND-2026-0142",
    title: "Reconstruction of 3.8 km Dual-Carriageway Asphalt Road with 50mm Bituminous Concrete Overlay",
    publishedDate: "20 January 2026",
    closingDate: "10 February 2026",
    estimatedValue: "₹10.00 Cr",
    bids: [
      {
        bidder: "Apex Infrastructure Projects Ltd (VND-001)",
        bidCode: "P1",
        financialBid: "₹6.20 Cr",
        varianceFromEstimate: "-38.0%",
        technicalScore: "88/100",
        status: "ACCEPTED_LOWEST_BIDDER",
        flagged: true,
        flagReason: "Substantially lower (-38%) than estimate and competing bids."
      },
      {
        bidder: "Metropolis Construction Ltd (VND-002)",
        bidCode: "P2",
        financialBid: "₹9.10 Cr",
        varianceFromEstimate: "-9.0%",
        technicalScore: "92/100",
        status: "REJECTED_HIGHER",
        flagged: false
      },
      {
        bidder: "Western Roadways Infra Ltd (VND-003)",
        bidCode: "P3",
        financialBid: "₹9.40 Cr",
        varianceFromEstimate: "-6.0%",
        technicalScore: "85/100",
        status: "REJECTED_HIGHER",
        flagged: false
      }
    ]
  },
  contract: {
    id: "CNT-2026-0088",
    contractor: "Apex Infrastructure Projects Ltd",
    vendorId: "VND-001",
    originalAwardAmount: "₹6.20 Cr",
    signingDate: "25 February 2026",
    variations: [
      {
        variationId: "VAR-01",
        date: "15 April 2026",
        description: "Sub-surface soil stabilization & black-cotton soil replacement",
        amountAdded: "₹1.10 Cr",
        approvedBy: "Standing Committee Resolution #402"
      },
      {
        variationId: "VAR-02",
        date: "10 June 2026",
        description: "Extension of telecom utility ducting across service lanes",
        amountAdded: "₹0.80 Cr",
        approvedBy: "City Engineer Sanction #118"
      }
    ],
    currentApprovedTotal: "₹8.10 Cr"
  },
  bills: [
    {
      billId: "BILL-2026-0101",
      milestone: "Milestone 1: Excavation, sub-base compaction & GSB layer",
      grossClaimed: "₹2.20 Cr",
      deductions: "₹0.10 Cr",
      netPaid: "₹2.10 Cr",
      paymentDate: "30 March 2026",
      cbdcTxHash: "SAMPLE-HASH-8f2a9910c242_cbdc_tx_90101",
      verificationStatus: "VERIFIED_MATCH"
    },
    {
      billId: "BILL-2026-0240",
      milestone: "Milestone 2: Dense Bituminous Macadam (DBM) base layer",
      grossClaimed: "₹2.90 Cr",
      deductions: "₹0.10 Cr",
      netPaid: "₹2.80 Cr",
      paymentDate: "28 May 2026",
      cbdcTxHash: "SAMPLE-HASH-3c99b821f001_cbdc_tx_90240",
      verificationStatus: "VERIFIED_MATCH"
    },
    {
      billId: "BILL-2026-0442",
      milestone: "Milestone 3: 50mm Bituminous Concrete (BC) wearing course & ducting",
      grossClaimed: "₹2.80 Cr",
      deductions: "₹0.10 Cr",
      netPaid: "₹2.70 Cr",
      paymentDate: "15 August 2026",
      cbdcTxHash: "SAMPLE-HASH-770a8291c944_cbdc_tx_90442",
      verificationStatus: "DISCREPANCY_AUDITED",
      auditNote: "MB thickness claimed 75mm, core-drill testing measured 52mm. Payment held for ₹0.10 Cr pending review."
    }
  ],
  citizenBreakdown: {
    totalPaid: "₹7.60 Cr",
    categories: [
      {
        id: "vendor_payments",
        name: "Primary Contractor Share",
        amount: "₹4.10 Cr",
        percentage: 53.9,
        subItems: [
          { name: "Apex Infra Operational Margin & Site Operations", amount: "₹2.80 Cr" },
          { name: "Sub-contracted Drainage & Curbing Works", amount: "₹1.30 Cr" }
        ]
      },
      {
        id: "materials",
        name: "Raw Materials Purchase",
        amount: "₹1.90 Cr",
        percentage: 25.0,
        subItems: [
          { name: "Cement (Ready Mix Grade M40)", amount: "₹0.62 Cr", supplier: "Ultratech Cement Ltd" },
          { name: "Steel Reinforcement Bars (Fe550D)", amount: "₹0.71 Cr", supplier: "JSW Steel Ltd" },
          { name: "Bitumen (VG-30 Grade)", amount: "₹0.29 Cr", supplier: "Indian Oil Corp (IOCL)" },
          { name: "Crushed Stone Aggregates", amount: "₹0.31 Cr", supplier: "Standard Stone Quarry" },
          { name: "Admixtures & Curing Chemicals", amount: "₹0.17 Cr", supplier: "Pidilite Infra" }
        ]
      },
      {
        id: "labour",
        name: "Direct Labour & Salaries",
        amount: "₹0.90 Cr",
        percentage: 11.8,
        subItems: [
          { name: "Skilled Machine Operators (24 workers)", amount: "₹0.38 Cr", paymentRail: "CBDC Direct Wage Credit" },
          { name: "Unskilled Construction Workers (118 workers)", amount: "₹0.52 Cr", paymentRail: "CBDC Direct Wage Credit" }
        ]
      },
      {
        id: "equipment",
        name: "Heavy Machinery & Fleet",
        amount: "₹0.40 Cr",
        percentage: 5.3,
        subItems: [
          { name: "Asphalt Paver & Tandem Roller Lease", amount: "₹0.25 Cr" },
          { name: "Excavator & Tipper Trucks", amount: "₹0.15 Cr" }
        ]
      },
      {
        id: "testing",
        name: "Quality Testing & Surveying",
        amount: "₹0.20 Cr",
        percentage: 2.6,
        subItems: [
          { name: "Core-Drill & Asphalt Density Test (VJTI Lab)", amount: "₹0.12 Cr" },
          { name: "3D Laser Topographical Survey", amount: "₹0.08 Cr" }
        ]
      },
      {
        id: "other",
        name: "Site Safety & Signage",
        amount: "₹0.10 Cr",
        percentage: 1.3,
        subItems: [
          { name: "Reflective Barricades & Traffic Diversions", amount: "₹0.10 Cr" }
        ]
      }
    ]
  }
};
