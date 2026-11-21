from app.audit.claude import grounded

DATA = '{"wo_id": "WO25-00131", "spend_inr": 8026151, "est_cost_inr": 180000}'


def test_grounded_accepts_numbers_and_work_orders_from_the_data():
    assert grounded("Spent Rs 80,26,151. Cave-in fix Rs 1,80,000 (WO25-00131).", DATA)


def test_grounded_rejects_an_unknown_work_order_or_amount():
    assert not grounded("See WO25-99999.", DATA)
    assert not grounded("About Rs 81,00,000 was spent.", DATA)
