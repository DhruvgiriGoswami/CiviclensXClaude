"""Seed Bhavnagar District (IN-GJ-DIST-BHAVNAGAR) with boundary geometry for Gujarat

Revision ID: 006_seed_bhavnagar_dist
Revises: 005_fix_maharashtra_cm_unit
Create Date: 2026-09-26

"""
import os
from typing import Sequence, Union
from alembic import op
from pathlib import Path
from shapely.wkt import dumps

revision: str = "006_seed_bhavnagar_dist"
down_revision: Union[str, None] = "005_fix_maharashtra_cm_unit"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 0. Ensure required unit types and boundary source exist
    op.execute("""
        INSERT INTO geo_unit_types (unit_type_id, name)
        VALUES 
            ('STATE', 'State'),
            ('DISTRICT', 'District')
        ON CONFLICT (unit_type_id) DO NOTHING;

        INSERT INTO boundary_sources (boundary_source_id, source_name, is_current)
        VALUES ('SRC-BHAVNAGAR-GEOJSON', 'Gujarat District KML Source', True)
        ON CONFLICT (boundary_source_id) DO NOTHING;
    """)

    # 1. Ensure parent state IN-GJ exists and insert Bhavnagar District into geo_units
    op.execute("""
        INSERT INTO geo_units (unit_id, unit_type_id, name, state_code, level, is_active)
        VALUES ('IN-GJ', 'STATE', 'Gujarat', 'GJ', 1, True)
        ON CONFLICT (unit_id) DO NOTHING;

        INSERT INTO geo_units (unit_id, unit_type_id, name, state_code, district_code, parent_unit_id, level, is_active)
        VALUES ('IN-GJ-DIST-BHAVNAGAR', 'DISTRICT', 'Bhavnagar District', 'GJ', 'BHAVNAGAR', 'IN-GJ', 2, True)
        ON CONFLICT (unit_id) DO UPDATE SET name = EXCLUDED.name, parent_unit_id = 'IN-GJ', is_active = True;
    """)

    # 2. Extract Bhavnagar geometry from gujarat.kml if spatial files are accessible
    repo_dir = Path(__file__).resolve().parent.parent.parent
    kml_candidates = [
        repo_dir / "KML_DATA" / "state_Districts_KML_DATA" / "gujarat.kml",
        repo_dir.parent / "KML_DATA" / "state_Districts_KML_DATA" / "gujarat.kml",
    ]

    kml_path = next((p for p in kml_candidates if p.exists()), None)
    if kml_path:
        try:
            import sys
            sys.path.insert(0, str(repo_dir))
            from seed_all_spatial import parse_spatial_file
            placemarks = parse_spatial_file(kml_path)
            for pm in placemarks:
                if pm["name"].strip().upper() == "BHAVNAGAR":
                    wkt_geom = dumps(pm["geometry"])
                    op.execute(f"""
                        DELETE FROM geo_unit_boundaries WHERE unit_id = 'IN-GJ-DIST-BHAVNAGAR';
                        INSERT INTO geo_unit_boundaries (unit_id, boundary_source_id, geometry, geometry_format, is_current)
                        VALUES ('IN-GJ-DIST-BHAVNAGAR', 'SRC-BHAVNAGAR-GEOJSON', ST_SetSRID(ST_GeomFromText('{wkt_geom}'), 4326), 'MULTIPOLYGON', True);
                    """)
                    break
        except Exception as e:
            print(f"[Migration 006 Warning] Could not parse gujarat.kml: {e}")


def downgrade() -> None:
    op.execute("DELETE FROM geo_unit_boundaries WHERE unit_id = 'IN-GJ-DIST-BHAVNAGAR';")
    op.execute("DELETE FROM geo_units WHERE unit_id = 'IN-GJ-DIST-BHAVNAGAR';")

