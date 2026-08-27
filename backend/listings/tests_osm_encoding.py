import json

from django.test import SimpleTestCase
from django.utils.text import slugify

from listings.services.osm_city_seeder import repair_mojibake


class OSMEncodingTests(SimpleTestCase):
    def test_repair_handles_single_and_double_utf8_mojibake(self):
        self.assertEqual(repair_mojibake("100 CerimÃ³nias"), "100 Cerimónias")
        self.assertEqual(repair_mojibake("100 CerimÃƒÂ³nias"), "100 Cerimónias")

    def test_accented_names_round_trip_and_slug_cleanly(self):
        names = ["100 Cerimónias", "Café São João", "João & Filhos", "Pastelaria Coração", "Müller Éxport"]
        payload = json.loads(json.dumps(names, ensure_ascii=False))
        self.assertEqual(payload, names)
        self.assertEqual(slugify(f"{payload[0]}-porto-pt"), "100-cerimonias-porto-pt")
        self.assertEqual(slugify(f"{payload[1]}-porto-pt"), "cafe-sao-joao-porto-pt")

    def test_normal_unicode_is_unchanged(self):
        value = "Café São João"
        self.assertEqual(repair_mojibake(value), value)
