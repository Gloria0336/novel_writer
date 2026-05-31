from schema.hexgeo import axial_to_pixel, hex_distance, hex_line, hex_neighbors, pixel_to_axial
from schema.models import HexCoord


def test_neighbors_and_distance_are_axial():
    origin = HexCoord(q=0, r=0)
    neighbors = hex_neighbors(origin)
    assert len(neighbors) == 6
    assert HexCoord(q=1, r=-1) in neighbors
    assert all(hex_distance(origin, item) == 1 for item in neighbors)
    assert hex_distance(HexCoord(q=-2, r=4), HexCoord(q=3, r=-1)) == 5


def test_hex_line_includes_endpoints_and_expected_length():
    start = HexCoord(q=0, r=0)
    end = HexCoord(q=4, r=-2)
    line = hex_line(start, end)
    assert line[0] == start
    assert line[-1] == end
    assert len(line) == hex_distance(start, end) + 1


def test_axial_pixel_round_trip():
    coord = HexCoord(q=7, r=5)
    x, y = axial_to_pixel(coord, size=11, origin=(20, 30))
    assert pixel_to_axial(x, y, size=11, origin=(20, 30)) == coord
