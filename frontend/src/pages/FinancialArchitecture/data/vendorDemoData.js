// Vendor History & Relationship Graph Data (Demonstration Data Only)

export const VENDOR_HISTORY_DEMO = {
  vendorId: "VND-001",
  vendorName: "Apex Infrastructure Projects Ltd",
  registrationNo: "CIN-U45200MH2012PLC229104",
  incorporationYear: 2012,
  registeredAddress: "Unit 402, Trade Tower, Bandra Kurla Complex, Mumbai",
  panNumber: "AAACA4021K",
  gstin: "27AAACA4021K1Z5",
  directors: ["Rajesh V. Sharma", "Sunil K. Mehta"],
  metrics: {
    totalContractsAwarded: 37,
    completedContracts: 29,
    activeContracts: 8,
    averageBidDiscount: "24.2%",
    averageContractVariation: "+18.4%",
    delayedProjectsCount: 8,
    qualityReviewFlags: 4,
    totalLifetimeContractValue: "₹418.50 Cr"
  },
  relationshipGraph: {
    nodes: [
      { id: "v_apex", label: "Apex Infra Projects Ltd", type: "VENDOR", category: "Primary Contractor", highlight: true },
      { id: "dir_rajesh", label: "Rajesh V. Sharma", type: "DIRECTOR", category: "Director (51% Stake)" },
      { id: "dir_sunil", label: "Sunil K. Mehta", type: "DIRECTOR", category: "Director (49% Stake)" },
      { id: "rel_metal", label: "Apex Mining & Aggregates Ltd", type: "RELATED_COMPANY", category: "Common Director (98% match)" },
      { id: "rel_bitumen", label: "Trident Logistics Pvt Ltd", type: "SUPPLIER", category: "Sub-contractor / Transporter" },
      { id: "past_prj1", label: "TMC Road Rehab Phase I (2024)", type: "PAST_CONTRACT", category: "Awarded ₹14.2 Cr (Variation +22%)" },
      { id: "past_prj2", label: "KDMC Flyover Approach (2025)", type: "PAST_CONTRACT", category: "Awarded ₹28.0 Cr (Delayed 6 mo)" },
      { id: "tnd_current", label: "TND-2026-0142 (Current Ward 150)", type: "TENDER", category: "Lowest Bidder P1 (₹6.20 Cr)" }
    ],
    edges: [
      { from: "dir_rajesh", to: "v_apex", relation: "Director / Shareholder", status: "Public Record" },
      { from: "dir_sunil", to: "v_apex", relation: "Director / Shareholder", status: "Public Record" },
      { from: "dir_rajesh", to: "rel_metal", relation: "Common Directorship", status: "Public Record — Requires Review" },
      { from: "v_apex", to: "rel_bitumen", relation: "Sub-contractor Assignment", status: "Declared Procurement" },
      { from: "v_apex", to: "past_prj1", relation: "Executed Contract", status: "Completed (+22% Var)" },
      { from: "v_apex", to: "past_prj2", relation: "Executed Contract", status: "Completed (Delayed)" },
      { from: "v_apex", to: "tnd_current", relation: "P1 Bid Submission", status: "Under Audit Review" }
    ]
  }
};
