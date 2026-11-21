"""Fix Maharashtra Chief Minister geo_unit_id from IN-MH-NAGPUR to IN-MH

Revision ID: 005_fix_maharashtra_cm_unit
Revises: 004_fix_nmmc_parties
Create Date: 2026-09-25

"""
from typing import Sequence, Union
from alembic import op

revision: str = "005_fix_maharashtra_cm_unit"
down_revision: Union[str, None] = "004_fix_nmmc_parties"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        UPDATE political_assignments
        SET geo_unit_id = 'IN-MH'
        WHERE role_title = 'Chief Minister' AND (geo_unit_id = 'IN-MH-NAGPUR' OR political_assignment_id = 14);
    """)


def downgrade() -> None:
    op.execute("""
        UPDATE political_assignments
        SET geo_unit_id = 'IN-MH-NAGPUR'
        WHERE role_title = 'Chief Minister' AND geo_unit_id = 'IN-MH' AND political_assignment_id = 14;
    """)
