"""Fix NMMC politician names and political party assignments

Revision ID: 004_fix_nmmc_parties
Revises: 003_add_data_version_tracking
Create Date: 2026-09-25

"""
from typing import Sequence, Union
from alembic import op

revision: str = "004_fix_nmmc_parties"
down_revision: Union[str, None] = "003_add_data_version_tracking"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# List of updates: (person_id, assignment_id, clean_name, old_name, new_party_id, old_party_id)
UPDATES = [
    (1349, 1019, 'Varsha Dole', 'Varsha Dole BJP', 1, 7),
    (1350, 1020, 'Kganga Patil', 'Kganga Patil BJP', 1, 7),
    (1351, 1021, 'Sudhakar Sonawane', 'Sudhakar Sonawane BJP', 1, 7),
    (1352, 1022, 'Anita Manavatkar', 'Anita Manavatkar Shiv Sena (Shinde)', 13, 7),
    (1353, 1023, 'Mandakini Mhatre', 'Mandakini Mhatre Shiv Sena (Shinde)', 13, 7),
    (1354, 1024, 'Chaitali Patil', 'Chaitali Patil Shiv Sena (Shinde)', 13, 7),
    (1355, 1025, 'Aniket Mhatre', 'Aniket Mhatre Shiv Sena (Shinde)', 13, 7),
    (1356, 1026, 'Ganesh Sapkal', 'Ganesh Sapkal BJP', 1, 7),
    (1357, 1027, 'Harijan Dev', 'Harijan Dev BJP', 1, 7),
    (1358, 1028, 'Lalita Madhavi', 'Lalita Madhavi BJP', 1, 7),
    (1359, 1029, 'Anjana Mhatre', 'Anjana Mhatre BJP', 1, 7),
    (1360, 1030, 'Prashant Patil', 'Prashant Patil Shiv Sena (Shinde)', 13, 7),
    (1361, 1031, 'Deepali Sankpal', 'Deepali Sankpal Shiv Sena (Shinde)', 13, 7),
    (1362, 1032, 'Vaishali Maskar', 'Vaishali Maskar Shiv Sena (Shinde)', 13, 7),
    (1363, 1033, 'Sandeep Mhatre', 'Sandeep Mhatre BJP', 1, 7),
    (1364, 1034, 'Sayali Shinde', 'Sayali ShindeBJP', 1, 7),
    (1365, 1035, 'Chandrabhaga More', 'Chandrabhaga More BJP', 1, 7),
    (1366, 1036, 'Raju Madhavi', 'Raju Madhavi BJP', 1, 7),
    (1367, 1037, 'Meenakshi Patil', 'Meenakshi Patil BJP', 1, 7),
    (1368, 1038, 'Anita Patil', 'Anita Patil Shiv Sena Shinde', 13, 7),
    (1369, 1039, 'Shirish Patil', 'Shirish Patil BJP', 1, 7),
    (1370, 1040, 'Shivram Patil', 'Shivram Patil Shiv Sena (Shinde)', 13, 7),
    (1371, 1041, 'Ravikant Patil', 'Ravikant Patil BJP', 1, 7),
    (1372, 1042, 'Bharati Patil', 'Bharati Patil BJP', 1, 7),
    (1373, 1043, 'Diksha Kachre', 'Diksha Kachre Shiv Sena (Shinde)', 13, 7),
    (1374, 1044, 'Gyandev Patil', 'Gyandev Patil BJP', 1, 7),
    (1375, 1045, 'Sagar Naik', 'Sagar Naik BJP', 1, 7),
    (1376, 1046, 'Aditi Naik', 'Aditi Naik BJP', 1, 7),
    (1377, 1047, 'Vaishnavi Naik', 'Vaishnavi Naik BJP', 1, 7),
    (1378, 1048, 'Munawar Patel', 'Munawar Patel BJP', 1, 7),
    (1379, 1049, 'Pratiksha Jayesh Patil', 'Pratiksha Jayesh Patil BJP', 1, 7),
    (1380, 1050, 'Savita Sangole', 'Savita Sangole Shiv Sena (Shinde)', 13, 7),
    (1381, 1051, 'Kashshikant Bhoir', 'Kashshikant Bhoir BJP', 1, 7),
    (1382, 1052, 'Bharat Bhoir', 'Bharat Bhoir Independent', 12, 7),
    (1383, 1053, 'Shubhangi Patil', 'Shubhangi Patil BJP', 1, 7),
    (1384, 1054, 'Shashikala Patil', 'Shashikala Patil BJP', 1, 7),
    (1385, 1055, 'Kavita Patil', 'Kavita Patil Shiv Sena (Shinde)', 13, 7),
    (1386, 1056, 'Ramchandra Gharat', 'Ramchandra Gharat BJP', 1, 7),
    (1387, 1057, 'Shashikant Raut', 'Shashikant Raut BJP', 1, 7),
    (1388, 1058, 'Anjani Bhoir', 'Anjani Bhoir BJP', 1, 7),
    (1389, 1059, 'Anjali Walunj', 'Anjali Walunj BJP', 1, 7),
    (1390, 1060, 'Dr. Prakash More', 'Dr. Prakash More BJP', 1, 7),
    (1391, 1061, 'Kishore Patkar', 'Kishore Patkar Shiv Sena (Shinde)', 13, 7),
    (1392, 1062, 'Pranali Avinash Lad', 'Pranali Avinash Lad Shiv Sena (Shinde)', 13, 7),
    (1393, 1063, 'Sonavi Avinash Lad', 'Sonavi Avinash Lad Shiv Sena (Shinde)', 13, 7),
    (1394, 1064, 'Divya Gaikwad', 'Divya Gaikwad Shiv Sena (Shinde)', 13, 7),
    (1395, 1065, 'Preeti Bhagat', 'Preeti Bhagat BJP', 1, 7),
    (1396, 1066, 'Damayanti Sampat Shewale', 'Damayanti Sampat Shewale BJP', 1, 7),
    (1397, 1067, 'Dashrath Bhagat', 'Dashrath Bhagat BJP', 1, 7),
    (1398, 1068, 'Nishant Bhagat', 'Nishant Bhagat BJP', 1, 7),
    (1399, 1069, 'Ganpat (Bhau) Bhapkar', 'Ganpat (Bhau) Bhapkar BJP', 1, 7),
    (1400, 1070, 'Shaila Patil', 'Shaila Patil BJP', 1, 7),
    (1401, 1071, 'Shilpa Thakur', 'Shilpa Thakur BJP', 1, 7),
    (1402, 1072, 'Sunil Kurkute', 'Sunil Kurkute BJP', 1, 7),
    (1403, 1073, 'Savita Lagade', 'Savita Lagade Shiv Sena (Shinde)', 13, 7),
    (1404, 1074, 'Aboli Kulkarni', 'Aboli Kulkarni Shiv Sena (Shinde)', 13, 7),
    (1405, 1075, 'Suresh Kulkarni', 'Suresh Kulkarni Shiv Sena (Shinde)', 13, 7),
    (1406, 1076, 'Madhuri Sutar', 'Madhuri Sutar BJP', 1, 7),
    (1407, 1077, 'Meera Patil', 'Meera Patil BJP', 1, 7),
    (1408, 1078, 'Jaywant Sutar', 'Jaywant Sutar BJP', 1, 7),
    (1409, 1079, 'Suresh Shetty', 'Suresh Shetty BJP', 1, 7),
    (1410, 1080, 'Vishal Sasane', 'Vishal Sasane Shiv Sena (Thackeray)', 14, 7),
    (1411, 1081, 'Pranali Patil', 'Pranali Patil BJP', 1, 7),
    (1412, 1082, 'Shashikala Auti', 'Shashikala Auti Shiv Sena (Shinde)', 13, 7),
    (1413, 1083, 'Abhijit Desai', 'Abhijit Desai MNS', 15, 7),
    (1414, 1084, 'Sujata Patil', 'Sujata Patil BJP', 1, 7),
    (1415, 1085, 'Rupali Bhagat', 'Rupali Bhagat BJP', 1, 7),
    (1416, 1086, 'Pradeep Gavas', 'Pradeep Gavas BJP', 1, 7),
    (1417, 1087, 'Suraj Patil', 'Suraj Patil BJP', 1, 7),
    (1418, 1088, 'Preeti Bhopi', 'Preeti Bhopi BJP', 1, 7),
    (1419, 1089, 'Sapna Gawde', 'Sapna Gawde BJP', 1, 7),
    (1420, 1090, 'Sachin Lovete', 'Sachin Lovete BJP', 1, 7),
    (1421, 1091, 'Sunil Patil', 'Sunil Patil BJP', 1, 7),
    (1422, 1092, 'Saluja Sutar', 'Saluja Sutar BJP', 1, 7),
    (1423, 1093, 'Netra Shirke', 'Netra Shirke BJP', 1, 7),
    (1424, 1094, 'Ravindra Ithape', 'Ravindra Ithape BJP', 1, 7),
    (1425, 1095, 'Deepak Pawar', 'Deepak Pawar BJP', 1, 7),
    (1426, 1096, 'Santoshi Mhatre', 'Santoshi Mhatre BJP', 1, 7),
    (1427, 1097, 'Rekha Mhatre', 'Rekha Mhatre BJP', 1, 7),
    (1428, 1098, 'Vishal Vichare', 'Vishal Vichare Shiv Sena (UBT)', 14, 7),
    (1429, 1099, 'Bharti Koli', 'Bharti Koli Shiv Sena (Shinde)', 13, 7),
    (1430, 1100, 'Poonam Patil', 'Poonam Patil Shiv Sena (Shinde)', 13, 7),
    (1431, 1101, 'Saroj Patil', 'Saroj Patil Shiv Sena (Shinde)', 13, 7),
    (1432, 1102, 'Amit Patil', 'Amit PatilShiv Sena (Shinde)', 13, 7),
    (1433, 1103, 'Suresha Narbage', 'Suresha Narbage BJP', 1, 7),
    (1434, 1104, 'Swati Gurkhe', 'Swati Gurkhe BJP', 1, 7),
    (1435, 1105, 'Jayaji Nath', 'Jayaji Nath BJP', 1, 7),
]

def upgrade() -> None:
    for person_id, assignment_id, clean_name, _old_name, new_party_id, _old_party in UPDATES:
        op.execute(f"UPDATE persons SET full_name = '{clean_name}' WHERE person_id = {person_id};")
        op.execute(f"UPDATE political_assignments SET party_id = {new_party_id} WHERE political_assignment_id = {assignment_id};")

def downgrade() -> None:
    for person_id, assignment_id, _clean_name, old_name, _new_party, old_party in UPDATES:
        op.execute(f"UPDATE persons SET full_name = '{old_name}' WHERE person_id = {person_id};")
        op.execute(f"UPDATE political_assignments SET party_id = {old_party} WHERE political_assignment_id = {assignment_id};")
