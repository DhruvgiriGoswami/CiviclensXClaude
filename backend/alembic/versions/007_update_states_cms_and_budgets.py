"""Update all 28 States and 8 UTs CMs, Executive Heads, and FY Budgets in PostgreSQL DB

Revision ID: 007_update_states_budgets
Revises: 006_seed_bhavnagar_dist
Create Date: 2026-09-26

"""
from typing import Sequence, Union
from alembic import op

revision: str = "007_update_states_budgets"
down_revision: Union[str, None] = "006_seed_bhavnagar_dist"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STATE_AND_UT_UPDATES = [
  ("IN-AP", "Andhra Pradesh", "Capital: Amaravati | Executive Head: N. Chandrababu Naidu (Telugu Desam Party (TDP)) | FY Budget: ₹3,32,205 crore (FY 2026-27)"),
  ("IN-AR", "Arunachal Pradesh", "Capital: Itanagar | Executive Head: Pema Khandu (Bharatiya Janata Party (BJP)) | FY Budget: ₹36,607 crore (FY 2026-27)"),
  ("IN-AS", "Assam", "Capital: Dispur | Executive Head: Himanta Biswa Sarma (Bharatiya Janata Party (BJP)) | FY Budget: ₹1,55,985 crore (FY 2025-26)"),
  ("IN-BR", "Bihar", "Capital: Patna | Executive Head: Samrat Choudhary (Bharatiya Janata Party (BJP)) | FY Budget: ₹3,47,589 crore (FY 2026-27)"),
  ("IN-CT", "Chhattisgarh", "Capital: Raipur | Executive Head: Vishnu Deo Sai (Bharatiya Janata Party (BJP)) | FY Budget: ₹1,72,000 crore (FY 2026-27)"),
  ("IN-GA", "Goa", "Capital: Panaji | Executive Head: Pramod Sawant (Bharatiya Janata Party (BJP)) | FY Budget: ₹30,195 crore (FY 2026-27)"),
  ("IN-GJ", "Gujarat", "Capital: Gandhinagar | Executive Head: Bhupendra Patel (Bharatiya Janata Party (BJP)) | FY Budget: ₹4,08,053 crore (FY 2026-27)"),
  ("IN-HR", "Haryana", "Capital: Chandigarh | Executive Head: Nayab Singh Saini (Bharatiya Janata Party (BJP)) | FY Budget: ₹2,23,658 crore (FY 2026-27)"),
  ("IN-HP", "Himachal Pradesh", "Capital: Shimla | Executive Head: Sukhvinder Singh Sukhu (Indian National Congress (INC)) | FY Budget: ₹54,928 crore (FY 2026-27)"),
  ("IN-JH", "Jharkhand", "Capital: Ranchi | Executive Head: Hemant Soren (Jharkhand Mukti Morcha (JMM)) | FY Budget: ₹1,50,106 crore (FY 2026-27)"),
  ("IN-KA", "Karnataka", "Capital: Bengaluru | Executive Head: D.K. Shivakumar (Indian National Congress (INC)) | FY Budget: ₹4,48,004 crore (FY 2026-27)"),
  ("IN-KL", "Kerala", "Capital: Thiruvananthapuram | Executive Head: V. D. Satheesan (Indian National Congress (INC)) | FY Budget: ₹3,13,543 crore (FY 2025-26)"),
  ("IN-MP", "Madhya Pradesh", "Capital: Bhopal | Executive Head: Mohan Yadav (Bharatiya Janata Party (BJP)) | FY Budget: ₹4,38,317 crore (FY 2026-27)"),
  ("IN-MH", "Maharashtra", "Capital: Mumbai | Executive Head: Devendra Fadnavis (Bharatiya Janata Party (BJP)) | FY Budget: ₹7,69,467 crore (FY 2026-27)"),
  ("IN-MN", "Manipur", "Capital: Imphal | Executive Head: Yumnam Khemchand Singh (Bharatiya Janata Party (BJP)) | FY Budget: ₹32,339 crore (FY 2026-27)"),
  ("IN-ML", "Meghalaya", "Capital: Shillong | Executive Head: Conrad Kongkal Sangma (National People's Party (NPP)) | FY Budget: ₹32,023 crore (FY 2026-27)"),
  ("IN-MZ", "Mizoram", "Capital: Aizawl | Executive Head: Lalduhoma (Zoram People's Movement (ZPM)) | FY Budget: ₹17,469 crore (FY 2026-27)"),
  ("IN-NL", "Nagaland", "Capital: Kohima | Executive Head: Neiphiu Rio (Nationalist Democratic Progressive Party (NDPP)) | FY Budget: ₹24,699 crore (FY 2025-26)"),
  ("IN-OD", "Odisha", "Capital: Bhubaneswar | Executive Head: Mohan Charan Majhi (Bharatiya Janata Party (BJP)) | FY Budget: ₹3,10,000 crore (FY 2026-27)"),
  ("IN-PB", "Punjab", "Capital: Chandigarh | Executive Head: Bhagwant Singh Mann (Aam Aadmi Party (AAP)) | FY Budget: ₹2,60,437 crore (FY 2026-27)"),
  ("IN-RJ", "Rajasthan", "Capital: Jaipur | Executive Head: Bhajan Lal Sharma (Bharatiya Janata Party (BJP)) | FY Budget: ₹6,10,956 crore (FY 2026-27)"),
  ("IN-SK", "Sikkim", "Capital: Gangtok | Executive Head: Prem Singh Tamang (Sikkim Krantikari Morcha (SKM)) | FY Budget: ₹16,196 crore (FY 2025-26)"),
  ("IN-TN", "Tamil Nadu", "Capital: Chennai | Executive Head: C. Joseph Vijay (Tamilaga Vettri Kazhagam (TVK)) | FY Budget: ₹4,86,332 crore (FY 2025-26)"),
  ("IN-TG", "Telangana", "Capital: Hyderabad | Executive Head: A. Revanth Reddy (Indian National Congress (INC)) | FY Budget: ₹3,24,324 crore (FY 2026-27)"),
  ("IN-TR", "Tripura", "Capital: Agartala | Executive Head: Manik Saha (Bharatiya Janata Party (BJP)) | FY Budget: ₹34,212 crore (FY 2026-27)"),
  ("IN-UP", "Uttar Pradesh", "Capital: Lucknow | Executive Head: Yogi Adityanath (Bharatiya Janata Party (BJP)) | FY Budget: ₹9,12,696 crore (FY 2026-27)"),
  ("IN-UK", "Uttarakhand", "Capital: Dehradun | Executive Head: Pushkar Singh Dhami (Bharatiya Janata Party (BJP)) | FY Budget: ₹1,11,703 crore (FY 2026-27)"),
  ("IN-WB", "West Bengal", "Capital: Kolkata | Executive Head: Suvendu Adhikari (Bharatiya Janata Party (BJP)) | FY Budget: ₹4,06,000 crore (FY 2026-27)"),
  ("IN-AN", "Andaman and Nicobar Islands", "Capital: Port Blair | Executive Head: Adm. D. K. Joshi (Independent / Appointed) | FY Budget: UT Central Allocation"),
  ("IN-CH", "Chandigarh", "Capital: Chandigarh | Executive Head: Gulab Chand Kataria (Independent / Appointed) | FY Budget: UT Central Allocation"),
  ("IN-DN", "Dadra and Nagar Haveli and Daman and Diu", "Capital: Daman | Executive Head: Praful Patel (Independent / Appointed) | FY Budget: UT Central Allocation"),
  ("IN-DL", "Delhi", "Capital: New Delhi | Executive Head: Rekha Gupta (Bharatiya Janata Party (BJP)) | FY Budget: ₹1,00,000 crore (FY 2025-26)"),
  ("IN-JK", "Jammu and Kashmir", "Capital: Srinagar / Jammu | Executive Head: Omar Abdullah (Jammu & Kashmir National Conference (JKNC)) | FY Budget: ₹127,767 crore (FY 2026-27)"),
  ("IN-LA", "Ladakh", "Capital: Leh | Executive Head: Brig. (Dr.) B. D. Mishra (Independent / Appointed) | FY Budget: UT Central Allocation"),
  ("IN-LD", "Lakshadweep", "Capital: Kavaratti | Executive Head: Praful Patel (Independent / Appointed) | FY Budget: UT Central Allocation"),
  ("IN-PY", "Puducherry", "Capital: Puducherry | Executive Head: N. Rangaswamy (All India N.R. Congress (AINRC)) | FY Budget: ₹11,600 crore (FY 2025-26)"),
]


def upgrade() -> None:
    for unit_id, name, desc in STATE_AND_UT_UPDATES:
        escaped_desc = desc.replace("'", "''")
        op.execute(f"""
            UPDATE geo_units
            SET description = '{escaped_desc}'
            WHERE unit_id = '{unit_id}';
        """)


def downgrade() -> None:
    pass
