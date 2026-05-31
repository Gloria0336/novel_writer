"""Axial hex geometry helpers for Tower's continuous strategy map."""

from __future__ import annotations

import math

from .models import HexCoord


HEX_DIRECTIONS: tuple[HexCoord, ...] = (
    HexCoord(q=1, r=0),
    HexCoord(q=1, r=-1),
    HexCoord(q=0, r=-1),
    HexCoord(q=-1, r=0),
    HexCoord(q=-1, r=1),
    HexCoord(q=0, r=1),
)


def hex_add(a: HexCoord, b: HexCoord) -> HexCoord:
    return HexCoord(q=a.q + b.q, r=a.r + b.r)


def hex_neighbors(coord: HexCoord) -> list[HexCoord]:
    return [hex_add(coord, direction) for direction in HEX_DIRECTIONS]


def hex_distance(a: HexCoord, b: HexCoord) -> int:
    aq, ar, as_ = a.q, a.r, -a.q - a.r
    bq, br, bs = b.q, b.r, -b.q - b.r
    return int((abs(aq - bq) + abs(ar - br) + abs(as_ - bs)) / 2)


def _cube_round(q: float, r: float, s: float) -> HexCoord:
    rq, rr, rs = round(q), round(r), round(s)
    q_diff, r_diff, s_diff = abs(rq - q), abs(rr - r), abs(rs - s)
    if q_diff > r_diff and q_diff > s_diff:
        rq = -rr - rs
    elif r_diff > s_diff:
        rr = -rq - rs
    return HexCoord(q=int(rq), r=int(rr))


def hex_line(a: HexCoord, b: HexCoord) -> list[HexCoord]:
    distance = hex_distance(a, b)
    if distance == 0:
        return [a]
    out: list[HexCoord] = []
    aq, ar, as_ = a.q, a.r, -a.q - a.r
    bq, br, bs = b.q, b.r, -b.q - b.r
    for step in range(distance + 1):
        t = step / distance
        out.append(
            _cube_round(
                aq + (bq - aq) * t,
                ar + (br - ar) * t,
                as_ + (bs - as_) * t,
            )
        )
    return out


def hex_range(center: HexCoord, radius: int) -> list[HexCoord]:
    coords: list[HexCoord] = []
    for dq in range(-radius, radius + 1):
        for dr in range(max(-radius, -dq - radius), min(radius, -dq + radius) + 1):
            coords.append(HexCoord(q=center.q + dq, r=center.r + dr))
    return coords


def axial_to_pixel(coord: HexCoord, size: float, origin: tuple[float, float] = (0, 0)) -> tuple[float, float]:
    """Pointy-top axial hex to pixel center."""
    x = size * math.sqrt(3) * (coord.q + coord.r / 2) + origin[0]
    y = size * 1.5 * coord.r + origin[1]
    return (x, y)


def pixel_to_axial(x: float, y: float, size: float, origin: tuple[float, float] = (0, 0)) -> HexCoord:
    px = (x - origin[0]) / size
    py = (y - origin[1]) / size
    q = math.sqrt(3) / 3 * px - 1 / 3 * py
    r = 2 / 3 * py
    return _cube_round(q, r, -q - r)
