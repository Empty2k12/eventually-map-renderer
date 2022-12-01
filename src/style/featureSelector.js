const rendered_highways = [
    "secondary",
    "primary",
    "tertiary",
    "residential",
    "pedestrian",
    "primary_link",
    "service",
    "living_street",
    "unclassified",
    "cycleway",
    "tertiary_link",
];

export const shouldRenderFeature = (way) => rendered_highways.includes(way.tags.highway) || way.tags.railway === "rail";