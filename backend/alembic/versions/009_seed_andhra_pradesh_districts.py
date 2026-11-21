"""Seed Andhra Pradesh Districts (IN-AP) with boundary geometry from KML data

Revision ID: 009_seed_ap_districts
Revises: 008_create_leader_feedbacks
Create Date: 2026-10-12

"""
import json
from pathlib import Path
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "009_seed_ap_districts"
down_revision: Union[str, None] = "008_create_leader_feedbacks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # 0. Ensure column widths match canonical schema
    conn.execute(sa.text("""
        ALTER TABLE geo_units ALTER COLUMN district_code TYPE VARCHAR(100);
        ALTER TABLE geo_units ALTER COLUMN state_code TYPE VARCHAR(50);
    """))

    # 1. Ensure required unit types and boundary source exist
    conn.execute(sa.text("""
        INSERT INTO geo_unit_types (unit_type_id, name)
        VALUES 
            ('COUNTRY', 'Country'),
            ('STATE', 'State'),
            ('DISTRICT', 'District')
        ON CONFLICT (unit_type_id) DO NOTHING;

        INSERT INTO boundary_sources (boundary_source_id, source_name, is_current)
        VALUES ('SRC-SPATIAL-KML-GEOJSON', 'Official KML & GeoJSON Spatial Datasets', True)
        ON CONFLICT (boundary_source_id) DO NOTHING;
    """))

    # 2. Ensure India and Andhra Pradesh state exist in geo_units
    conn.execute(sa.text("""
        INSERT INTO geo_units (unit_id, unit_type_id, name, level, is_active)
        VALUES ('IN', 'COUNTRY', 'India', 0, True)
        ON CONFLICT (unit_id) DO NOTHING;

        INSERT INTO geo_units (unit_id, unit_type_id, name, state_code, parent_unit_id, level, is_active)
        VALUES ('IN-AP', 'STATE', 'Andhra Pradesh', 'AP', 'IN', 1, True)
        ON CONFLICT (unit_id) DO UPDATE SET 
            name = EXCLUDED.name, 
            parent_unit_id = 'IN', 
            state_code = 'AP', 
            is_active = True;
    """))

    # 3. Locate WKT dataset for Andhra Pradesh districts
    cur_dir = Path(__file__).resolve().parent
    data_file = cur_dir.parent.parent / "app" / "data" / "andhra_pradesh_districts_wkt.json"

    if not data_file.exists():
        # Fallback search path
        candidates = [
            cur_dir.parent / "app" / "data" / "andhra_pradesh_districts_wkt.json",
            cur_dir.parent.parent / "data" / "andhra_pradesh_districts_wkt.json",
            Path("app/data/andhra_pradesh_districts_wkt.json"),
            Path("data/andhra_pradesh_districts_wkt.json"),
        ]
        data_file = next((c for c in candidates if c.exists()), None)

    if not data_file or not data_file.exists():
        print("[Migration 009 Warning] andhra_pradesh_districts_wkt.json not found; skipping spatial seed.")
        return

    with open(data_file, "r", encoding="utf-8") as f:
        districts = json.load(f)

    # 4. Check if PostGIS extension is available
    res = conn.execute(sa.text("SELECT 1 FROM pg_extension WHERE extname = 'postgis';")).scalar()
    postgis_available = bool(res)

    print(f"[Migration 009] Seeding {len(districts)} Andhra Pradesh districts (PostGIS={postgis_available})...")

    # 5. Insert each district into geo_units and geo_unit_boundaries
    for d in districts:
        unit_id = d["unit_id"]
        district_name = d["district_name"]
        district_code = d["district_code"]
        wkt = d["wkt"]

        conn.execute(sa.text("""
            INSERT INTO geo_units (unit_id, unit_type_id, name, state_code, district_code, parent_unit_id, level, is_active)
            VALUES (:unit_id, 'DISTRICT', :district_name, 'AP', :district_code, 'IN-AP', 2, True)
            ON CONFLICT (unit_id) DO UPDATE SET 
                name = EXCLUDED.name, 
                parent_unit_id = 'IN-AP', 
                state_code = 'AP',
                district_code = EXCLUDED.district_code,
                is_active = True;
        """), {
            "unit_id": unit_id,
            "district_name": district_name,
            "district_code": district_code,
        })

        conn.execute(sa.text("DELETE FROM geo_unit_boundaries WHERE unit_id = :unit_id;"), {"unit_id": unit_id})

        if postgis_available:
            conn.execute(sa.text("""
                INSERT INTO geo_unit_boundaries (unit_id, boundary_source_id, geometry, geometry_format, is_current)
                VALUES (:unit_id, 'SRC-SPATIAL-KML-GEOJSON', ST_Multi(ST_SetSRID(ST_GeomFromText(:wkt), 4326)), 'MULTIPOLYGON', True);
            """), {"unit_id": unit_id, "wkt": wkt})
        else:
            conn.execute(sa.text("""
                INSERT INTO geo_unit_boundaries (unit_id, boundary_source_id, geometry, geometry_format, is_current)
                VALUES (:unit_id, 'SRC-SPATIAL-KML-GEOJSON', :wkt, 'MULTIPOLYGON', True);
            """), {"unit_id": unit_id, "wkt": wkt})

    print(f"[Migration 009] Successfully seeded {len(districts)} Andhra Pradesh districts!")


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM geo_unit_boundaries WHERE unit_id LIKE 'IN-AP-DIST-%';"))
    conn.execute(sa.text("DELETE FROM geo_units WHERE unit_id LIKE 'IN-AP-DIST-%';"))
